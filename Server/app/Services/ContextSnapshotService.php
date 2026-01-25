<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ContextSnapshot;
use App\Models\FocusSession;
use App\Models\Task;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * @extends BaseService<ContextSnapshot>
 */
final class ContextSnapshotService extends BaseService
{
    protected function getModelClass(): string
    {
        return ContextSnapshot::class;
    }

    public function __construct(
        protected TranscriptionService $transcriptionService,
        protected AIService $aiService
    ) {
        parent::__construct();
    }

    /**
     * Process a context snapshot request
     */
    public function processSnapshot(FocusSession $session, array $validatedData, ?UploadedFile $voiceFile): ContextSnapshot
    {
        // Normalize JSON fields if they came as strings (multipart/form-data quirks)
        $browserState = $validatedData['browser_state'] ?? null;
        if (is_string($browserState)) {
            $browserState = json_decode($browserState, true);
        }

        $gitState = $validatedData['git_state'] ?? null;
        if (is_string($gitState)) {
            $gitState = json_decode($gitState, true);
        }

        $data = [
            'note' => $validatedData['note'] ?? null,
            'browser_state' => $browserState,
            'git_state' => $gitState,
            'checklist' => $validatedData['checklist'] ?? [],
        ];

        if ($session->contextSnapshot) {
            $snapshot = $this->updateSnapshot(
                $session->contextSnapshot,
                $data,
                $voiceFile
            );
        } else {
            $snapshot = $this->createSnapshot(
                $session,
                $data,
                $voiceFile
            );
        }

        $session->update([
            'status' => 'completed',
            'ended_at' => $session->ended_at ?? now(),
        ]);

        return $snapshot;
    }

    /**
     * Create a snapshot and link it to the session.
     *
     * @param FocusSession $session
     * @param array $data
     * @param UploadedFile|null $voiceFile
     * @return ContextSnapshot
     */
    public function createSnapshot(FocusSession $session, array $data, ?UploadedFile $voiceFile = null): ContextSnapshot
    {
        $snapshot = $this->createInitialSnapshot($session, $data, $voiceFile);
        
        $this->processVoiceTranscription($snapshot, $voiceFile);
        
        $this->saveManualChecklist($snapshot, $data['checklist'] ?? []);
        
        $this->updateQualityScore($snapshot);
        
        return $snapshot;
    }

    public function updateSnapshot(ContextSnapshot $snapshot, array $data, ?UploadedFile $voiceFile = null): ContextSnapshot
    {
        $snapshotData = [
            'browser_state' => $data['browser_state'] ?? $snapshot->browser_state,
            'text_note' => $data['note'] ?? $snapshot->text_note,
            'git_diff_blob' => $data['git_state']['diff'] ?? $snapshot->git_diff_blob,
            'git_branch' => $data['git_state']['branch'] ?? $snapshot->git_branch,
            'repository_source' => $data['git_state']['repo'] ?? $snapshot->repository_source,
        ];

        if ($voiceFile) {
            $snapshotData['voice_memo_path'] = $voiceFile->store('voice_memos');
            $snapshotData['voice_recorded_at'] = now();
        }

        $snapshot->update($snapshotData);

        if ($voiceFile) {
            $this->processVoiceTranscription($snapshot, $voiceFile);
        }

        if (isset($data['checklist'])) {
            $this->saveManualChecklist($snapshot, $data['checklist']);
        }
        
        $this->updateQualityScore($snapshot);
        
        return $snapshot->refresh();
    }

    /**
     * Fork a snapshot for a new session.
     */
    public function forkSnapshot(ContextSnapshot $source, FocusSession $newSession): ContextSnapshot
    {
        return $this->executeInTransaction(function () use ($source, $newSession) {
            $replica = $source->replicate([
                'user_id', 'created_at', 'updated_at', 'id', 'focus_session_id', 'restored_at'
            ]);
            
            $replica->user_id = $newSession->user_id;
            $replica->focus_session_id = $newSession->id;
            $replica->type = 'forked';
            $replica->save();

            $newSession->update(['context_snapshot_id' => $replica->id]);

            return $replica;
        });
    }

    /**
     * Create a snapshot derived from a Task (e.g. from GitHub PR).
     */
    public function createForTask(Task $task, array $gitData): ContextSnapshot
    {
        return $this->executeInTransaction(function () use ($task, $gitData) {
            $snapshot = $this->create([
                'user_id' => $task->user_id,
                'focus_session_id' => null,
                'title' => $task->title,
                'type' => 'manual',
                'git_branch' => $gitData['branch'] ?? null,
                'repository_source' => $gitData['repo'] ?? null,
                'git_files_changed' => $gitData['files'] ?? [],
                'git_diff_blob' => null, 
                'quality_score' => 50,
            ]);

            $task->update(['context_snapshot_id' => $snapshot->id]);

            return $snapshot;
        });
    }

    private function createInitialSnapshot(FocusSession $session, array $data, ?UploadedFile $voiceFile): ContextSnapshot
    {
        return $this->executeInTransaction(function () use ($session, $data, $voiceFile) {
            $snapshotData = [
                'user_id' => $session->user_id,
                'focus_session_id' => $session->id,
                'title' => $session->title, 
                'type' => 'manual',
                'browser_state' => $data['browser_state'] ?? null,
                'text_note' => $data['note'] ?? null,
                'git_diff_blob' => $data['git_state']['diff'] ?? null,
                'git_branch' => $data['git_state']['branch'] ?? null,
                'repository_source' => $data['git_state']['repo'] ?? null,
            ];

            if ($voiceFile) {
                $snapshotData['voice_memo_path'] = $voiceFile->store('voice_memos');
                $snapshotData['voice_recorded_at'] = now();
            }

            /** @var ContextSnapshot $snapshot */
            $snapshot = $this->create($snapshotData);

            $session->update([
                'context_snapshot_id' => $snapshot->id
            ]);

            return $snapshot;
        });
    }

    private function processVoiceTranscription(ContextSnapshot $snapshot, ?UploadedFile $voiceFile): void
    {
        if ($voiceFile && $snapshot->voice_memo_path) {
            $transcript = $this->transcriptionService->transcribe($snapshot->voice_memo_path);
            
            if ($transcript) {
                $snapshot->update(['voice_transcript' => $transcript]);
                $snapshot->refresh();
            }
        }
    }

    private function saveManualChecklist(ContextSnapshot $snapshot, array $manualItemsData): void
    {
        $manualItems = [];
        foreach ($manualItemsData as $item) {
            $manualItems[] = ['text' => (string) $item, 'source' => 'user'];
        }

        if (!empty($manualItems)) {
            $snapshot->update(['ai_resume_checklist' => $manualItems]);
            $snapshot->refresh();
        }
    }

    private function updateQualityScore(ContextSnapshot $snapshot): void
    {
        $score = $this->calculateQualityScore($snapshot);
        $snapshot->update(['quality_score' => $score]);
    }

    public function calculateQualityScore(ContextSnapshot $snapshot): int
    {
        $earned = 0;
        $maxPossible = 85; // Base max without code
        
        // Browser Context (25 pts)
        $browserState = $snapshot->browser_state ?? [];
        if (count($browserState) >= 3) {
            $earned += 25;
        } elseif (count($browserState) > 0) {
            $earned += 10; // Partial credit
        }
    
        // User Context - Voice OR Text (35 pts)
        if (!empty($snapshot->voice_memo_path) || !empty($snapshot->text_note)) {
            $earned += 35;
        }
    
        // AI Checklist (15 pts)
        $checklist = $snapshot->ai_resume_checklist ?? [];
        if (count($checklist) > 0) {
            $earned += 15;
        }
    
        // Title (10 pts)
        if (!empty($snapshot->title)) {
            $earned += 10;
        }
    
        // Code Context (Bonus/Adaptive)
        // Check if git state exists
        $hasCode = !empty($snapshot->git_diff_blob) || !empty($snapshot->git_branch);
        
        if ($hasCode) {
            $maxPossible += 15; // Max becomes 100
            $earned += 15;
        }
    
        // Normalize to 0-100
        if ($maxPossible == 0) return 0;
        
        return (int) round(($earned / $maxPossible) * 100);
    }


    public function addToChecklist(ContextSnapshot $snapshot, string $text): ContextSnapshot
    {
        $current = $snapshot->ai_resume_checklist ?? [];
        $current[] = ['text' => $text, 'source' => 'user', 'is_completed' => false];
        $snapshot->update(['ai_resume_checklist' => $current]);
        $this->updateQualityScore($snapshot);
        $snapshot->refresh();
        return $snapshot;
    }

    public function generateAIChecklist(ContextSnapshot $snapshot): ContextSnapshot
    {
        try {
            $generated = $this->aiService->generateChecklistFromContext(
                title: $snapshot->title ?? 'Untitled Task',
                note: $snapshot->text_note,
                transcript: $snapshot->voice_transcript,
                gitSummary: $snapshot->git_diff_blob ? "Diff length: " . strlen($snapshot->git_diff_blob) . " chars. Branch: " . $snapshot->git_branch : null,
                tabs: $snapshot->browser_state ?? []
            );
            
            $aiItems = [];
            foreach ($generated as $item) {
                $aiItems[] = ['text' => $item, 'source' => 'ai', 'is_completed' => false];
            }
            
            $current = $snapshot->ai_resume_checklist ?? [];
            $finalChecklist = array_merge($current, $aiItems);
            
            if (!empty($finalChecklist)) {
                $snapshot->update(['ai_resume_checklist' => $finalChecklist]);
                $this->updateQualityScore($snapshot);
                $snapshot->refresh();
            }
        } catch (Exception $e) {
        }
        
        return $snapshot;
    }

    public function toggleChecklistItem(ContextSnapshot $snapshot, int $index): ContextSnapshot
    {
        $current = $snapshot->ai_resume_checklist ?? [];
        
        if (!isset($current[$index])) {
            throw new Exception("Checklist item index out of bounds");
        }

        // Initialize if missing (backward compatibility)
        if (!isset($current[$index]['is_completed'])) {
            $current[$index]['is_completed'] = false;
        }

        $current[$index]['is_completed'] = !$current[$index]['is_completed'];
        
        $snapshot->update(['ai_resume_checklist' => $current]);
        $snapshot->refresh();
        return $snapshot;
    }

    public function addBrowserTab(ContextSnapshot $snapshot, string $title, string $url): ContextSnapshot
    {
        $current = $snapshot->browser_state ?? [];
        
        // Prevent duplicates
        foreach ($current as $tab) {
            if (($tab['url'] ?? '') === $url) {
                return $snapshot;
            }
        }

        $current[] = ['title' => $title, 'url' => $url];
        
        $snapshot->update(['browser_state' => $current]);
        $this->updateQualityScore($snapshot);
        $snapshot->refresh();
        
        return $snapshot;
    }
}
