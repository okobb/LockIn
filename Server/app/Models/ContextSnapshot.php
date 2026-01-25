<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class ContextSnapshot extends Model
{
    use HasFactory;
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'focus_session_id',
        'title',
        'type',
        'git_diff_blob',
        'git_branch',
        'git_last_commit',
        'git_additions',
        'git_deletions',
        'repository_source',
        'git_files_changed',
        'browser_state',
        'ide_state',
        'voice_memo_path',
        'voice_duration_sec',
        'voice_recorded_at',
        'voice_transcript',
        'text_note',
        'ai_resume_checklist',
        'quality_score',
        'searchable_text',
        'restored_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'git_files_changed' => 'array',
            'git_additions' => 'integer',
            'git_deletions' => 'integer',
            'browser_state' => 'array',
            'ide_state' => 'array',
            'ai_resume_checklist' => 'array',
            'voice_recorded_at' => 'datetime',
            'voice_duration_sec' => 'integer',
            'quality_score' => 'integer',
            'restored_at' => 'datetime',
        ];
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function focusSession(): BelongsTo
    {
        return $this->belongsTo(FocusSession::class);
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(ChecklistItem::class);
    }
}
