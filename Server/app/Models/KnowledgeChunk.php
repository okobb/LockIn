<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeChunk extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'resource_id',
        'chunk_index',
        'content_chunk',
        'qdrant_point_id',
        'chunk_type',
        'token_count',
        'chunk_metadata',
        'is_embedded',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'chunk_index' => 'integer',
            'token_count' => 'integer',
            'chunk_metadata' => 'array',
            'is_embedded' => 'boolean',
        ];
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(KnowledgeResource::class, 'resource_id');
    }
}
