<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;


class Task extends Model
{
    use SoftDeletes, HasFactory;


    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'priority',
        'status',
        'source_type',
        'source_link',
        'source_metadata',
        'ai_reasoning',
        'due_date',
        'estimated_minutes',
        'scheduled_start',
        'scheduled_end',
        'progress_percent',
        'completed_at',
        'received_at',
        'external_id'
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'source_metadata' => 'array',
            'priority' => 'integer',
            'due_date' => 'date',
            'scheduled_start' => 'datetime',
            'scheduled_end' => 'datetime',
            'progress_percent' => 'integer',
            'estimated_minutes' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function focusSessions(): HasMany
    {
        return $this->hasMany(FocusSession::class);
    }

    public function incomingMessages(): HasMany
    {
        return $this->hasMany(IncomingMessage::class, 'extracted_task_id');
    }

}
