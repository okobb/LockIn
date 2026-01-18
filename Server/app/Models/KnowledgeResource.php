<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeResource extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'url',
        'title',
        'summary',
        'metadata',
        'content_text',
        'is_read',
        'is_archived',
        'type',
        'file_path',
        'thumbnail_url',
        'notes',
        'tags',
        'difficulty',
        'estimated_time_minutes',
        'is_favorite',
        'focus_session_id',
        'source_domain',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'tags' => 'array',
            'is_read' => 'boolean',
            'is_archived' => 'boolean',
            'is_favorite' => 'boolean',
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

    public function chunks(): HasMany
    {
        return $this->hasMany(KnowledgeChunk::class, 'resource_id');
    }

    public function readLaterItems(): HasMany
    {
        return $this->hasMany(ReadLaterQueue::class, 'resource_id');
    }

    public function getFormattedTimeAttribute(): ?string
    {
        if (!$this->estimated_time_minutes) {
            return null;
        }

        if ($this->type === RESOURCE_TYPE_VIDEO) {
            return "{$this->estimated_time_minutes} min video";
        }

        return "{$this->estimated_time_minutes} min read";
    }
}
