<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChecklistItem extends Model
{
    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'focus_session_id',
        'context_snapshot_id',
        'text',
        'meta',
        'is_completed',
        'completed_at',
        'sort_order',
        'source',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
            'sort_order' => 'integer',
            'created_at' => 'datetime',
        ];
    }
    public function focusSession(): BelongsTo
    {
        return $this->belongsTo(FocusSession::class);
    }

    public function contextSnapshot(): BelongsTo
    {
        return $this->belongsTo(ContextSnapshot::class);
    }
}
