<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeResource extends Model
{
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
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_read' => 'boolean',
            'is_archived' => 'boolean',
        ];
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chunks(): HasMany
    {
        return $this->hasMany(KnowledgeChunk::class, 'resource_id');
    }

    public function readLaterItems(): HasMany
    {
        return $this->hasMany(ReadLaterQueue::class, 'resource_id');
    }
}
