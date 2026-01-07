<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncomingMessage extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'provider',
        'external_id',
        'sender_info',
        'channel_info',
        'content_raw',
        'status',
        'extracted_task_id',
        'focus_session_id',
        'was_allowed',
        'decision_reason',
        'urgency_score',
        'extracted_action',
        'received_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'received_at' => 'datetime',
            'was_allowed' => 'boolean',
            'urgency_score' => 'decimal:1',
        ];
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function extractedTask(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'extracted_task_id');
    }

    public function focusSession(): BelongsTo
    {
        return $this->belongsTo(FocusSession::class);
    }
}
