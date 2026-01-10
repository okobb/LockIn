<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FocusSession extends Model
{
    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'task_id',
        'context_snapshot_id',
        'title',
        'planned_duration_min',
        'actual_duration_min',
        'started_at',
        'ended_at',
        'paused_duration_sec',
        'status',
        'checklist_completed',
        'checklist_total',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'planned_duration_min' => 'integer',
            'actual_duration_min' => 'integer',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'paused_duration_sec' => 'integer',
            'checklist_completed' => 'integer',
            'checklist_total' => 'integer',
            'created_at' => 'datetime',
        ];
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function contextSnapshot(): BelongsTo
    {
        return $this->belongsTo(ContextSnapshot::class);
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(ChecklistItem::class);
    }

    public function incomingMessages(): HasMany
    {
        return $this->hasMany(IncomingMessage::class);
    }

    public function contextSnapshots(): HasMany
    {
        return $this->hasMany(ContextSnapshot::class);
    }
}
