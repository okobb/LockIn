<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    protected $guarded = [];

    protected $casts = [
        'tool_calls' => 'array',
        'sources' => 'array',
    ];

    public function thread(): BelongsTo
    {
        return $this->belongsTo(ChatThread::class, 'chat_thread_id');
    }
}
