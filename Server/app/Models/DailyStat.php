<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyStat extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'date',
        'flow_time_min',
        'deep_work_blocks',
        'contexts_saved',
        'contexts_restored',
        'tasks_completed',
        'checklist_items_completed',
        'notifications_blocked',
        'notifications_allowed',
        'estimated_time_saved_min',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'flow_time_min' => 'integer',
            'deep_work_blocks' => 'integer',
            'contexts_saved' => 'integer',
            'contexts_restored' => 'integer',
            'tasks_completed' => 'integer',
            'checklist_items_completed' => 'integer',
            'notifications_blocked' => 'integer',
            'notifications_allowed' => 'integer',
            'estimated_time_saved_min' => 'integer',
        ];
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
