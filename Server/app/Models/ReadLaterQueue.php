<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadLaterQueue extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'read_later_queue';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'resource_id',
        'estimated_minutes',
        'context_match',
        'scheduled_for',
        'gap_type',
        'is_completed',
        'started_at',
        'completed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'estimated_minutes' => 'integer',
            'scheduled_for' => 'datetime',
            'is_completed' => 'boolean',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(KnowledgeResource::class, 'resource_id');
    }
}
