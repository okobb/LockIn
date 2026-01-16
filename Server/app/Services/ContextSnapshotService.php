<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ContextSnapshot;
use App\Models\FocusSession;
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
        protected TranscriptionService $transcriptionService
    ) {
        parent::__construct();
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
        /** @var ContextSnapshot $snapshot */
        $snapshot = $this->executeInTransaction(function () use ($session, $data, $voiceFile) {
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
                $path = $voiceFile->store('voice_memos');
                $snapshotData['voice_memo_path'] = $path;
                $snapshotData['voice_recorded_at'] = now();
            }

            /** @var ContextSnapshot $snapshot */
            $snapshot = $this->create($snapshotData);

            $session->update([
                'context_snapshot_id' => $snapshot->id
            ]);

            return $snapshot;
        });

        // Transcribe audio if present
        if ($voiceFile && $snapshot->voice_memo_path) {
            $transcript = $this->transcriptionService->transcribe($snapshot->voice_memo_path);
            
            if ($transcript) {
                $snapshot->update(['voice_transcript' => $transcript]);
            }
        }

        return $snapshot;
    }
}
