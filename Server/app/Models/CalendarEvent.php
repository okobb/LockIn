<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarEvent extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'external_id',
        'title',
        'start_time',
        'end_time',
        'status',
        'type',
        'auto_save_enabled',
        'metadata',
        'is_dismissed',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'auto_save_enabled' => 'boolean',
            'metadata' => 'array',
            'is_dismissed' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
