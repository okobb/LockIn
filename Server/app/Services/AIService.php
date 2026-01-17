<?php

declare(strict_types=1);

namespace App\Services;

use OpenAI;
use OpenAI\Client;

class AIService
{
    private Client $client;

    public function __construct()
    {
        $apiKey = config('services.openai.key');
        $this->client = OpenAI::client($apiKey);
    }

    /**
     * Send a chat request to the LLM.
     *
     * @param array<int, array{role: string, content: string}> $messages
     * @param array{model?: string, temperature?: float, max_tokens?: int} $config
     * @return string The generated response
     */
    public function chat(array $messages, array $config = []): string
    {
        $model = $config['model'] ?? 'gpt-4o-mini';
        $temperature = $config['temperature'] ?? 0.7;
        
        $response = $this->client->chat()->create([
            'model' => $model,
            'messages' => $messages,
            'temperature' => $temperature,
        ]);

        return $response->choices[0]->message->content ?? '';
    }
}
