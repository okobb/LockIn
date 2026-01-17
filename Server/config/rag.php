<?php

return [
    /*
    |--------------------------------------------------------------------------
    | RAG Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the Retrieval-Augmented Generation system, including
    | security settings, performance tuning, and caching options.
    |
    */

    // Maximum number of chunks to retrieve for context
    'max_chunks' => (int) env('RAG_MAX_CHUNKS', 5),

    // Minimum relevance score (0-1) for a chunk to be included
    'min_relevance_score' => (float) env('RAG_MIN_SCORE', 0.5),

    // Enable embedding caching to reduce API calls
    'cache_embeddings' => (bool) env('RAG_CACHE_EMBEDDINGS', true),

    // Cache TTL in seconds (default: 1 hour)
    'cache_ttl_seconds' => (int) env('RAG_CACHE_TTL', 3600),

    /*
    |--------------------------------------------------------------------------
    | Prompt Injection Protection
    |--------------------------------------------------------------------------
    |
    | Patterns used to detect potential prompt injection attacks.
    | These are case-insensitive regex patterns.
    |
    */
    'blocked_patterns' => [
        '/ignore\s*(all\s*)?(previous|prior|above)\s*(instructions?|prompts?|context)/i',
        '/forget\s*(all\s*)?(previous|prior|above)?\s*(instructions?|everything|context)/i',
        '/disregard\s*(all\s*)?(previous|prior|above)?\s*(instructions?|prompts?|context)/i',
        '/override\s*(all\s*)?(previous|prior)?\s*(instructions?|prompts?|rules?)/i',
        '/(reveal|show|display|output|print)\s*(the\s*)?(system\s*prompt|instructions?|context)/i',
        '/you\s*are\s*now\s*(a|an|the)/i',
        '/pretend\s*(you\s*are|to\s*be)/i',
        '/act\s*as\s*(if|a|an|the)/i',
        '/new\s*(instructions?|prompt|role|persona)/i',
        '/repeat\s*(all|the|everything|verbatim)/i',
    ],

    /*
    |--------------------------------------------------------------------------
    | Input Limits
    |--------------------------------------------------------------------------
    */
    'max_question_length' => (int) env('RAG_MAX_QUESTION_LENGTH', 2000),
    'max_context_chunks' => (int) env('RAG_MAX_CONTEXT_CHUNKS', 10),
];
