<?php

declare(strict_types=1);

namespace App\Services;

use OpenAI;
use OpenAI\Contracts\ClientContract;

use App\AI\PromptService;
use Illuminate\Support\Str;

class AIService
{
    private ClientContract $client;

    public function __construct(
        protected PromptService $promptService,
        ?ClientContract $client = null
    ) {
        if ($client) {
            $this->client = $client;
        } else {
            $apiKey = config('services.openai.key');
            $this->client = OpenAI::client($apiKey);
        }
    }

    /**
     * Send a structured chat request to the LLM with tool support.
     *
     * @param array<int, array> $messages
     * @param array<int, array> $tools
     * @param array $config
     * @return array{content: ?string, tool_calls: array}
     */
    public function chatWithTools(array $messages, array $tools = [], array $config = []): array
    {
        $model = $config['model'] ?? 'gpt-4o-mini';
        $temperature = $config['temperature'] ?? 0.7;

        $payload = [
            'model' => $model,
            'messages' => $messages,
            'temperature' => $temperature,
        ];

        if (!empty($tools)) {
            $payload['tools'] = $tools;
            $payload['tool_choice'] = 'auto';
        }

        try {
            $response = $this->client->chat()->create($payload);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('OpenAI API Error', [
                'error' => $e->getMessage(),
                'payload' => $payload
            ]);
            throw $e;
        }

        if (empty($response->choices)) {
             \Illuminate\Support\Facades\Log::error('OpenAI Invalid Response', [
                'response' => json_encode($response),
                'payload' => $payload
            ]);
            throw new \Exception('OpenAI returned no choices in response.');
        }

        $message = $response->choices[0]->message;

        return [
            'content' => $message->content,
            'tool_calls' => isset($message->toolCalls) ? array_map(fn($toolCall) => $toolCall->toArray(), $message->toolCalls) : [],
        ];
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
        $response = $this->chatWithTools($messages, [], $config);
        return $response['content'] ?? '';
    }

    /**
     * Generate a checklist of next steps based on the context.
     *
     * @param string $title
     * @param string|null $note
     * @param string|null $transcript
     * @param string|null $gitSummary
     * @param array $tabs
     * @return array<string>
     */
    public function generateChecklistFromContext(string $title, ?string $note, ?string $transcript, ?string $gitSummary, array $tabs): array
    {
        $tabsString = !empty($tabs) ? implode(', ', array_column($tabs, 'title')) : '';
        
        $messages = $this->promptService->build('checklist', [
            'title' => $title,
            'note' => $note,
            'transcript' => $transcript,
            'git_summary' => $gitSummary,
            'tabs' => $tabsString
        ]);

        return $this->getJson($messages, ['temperature' => 0.3]);
    }

    /**
     * Send a chat request and parse the response as JSON.
     *
     * @param array<int, array{role: string, content: string}> $messages
     * @param array{model?: string, temperature?: float} $config
     * @return array
     */
    public function getJson(array $messages, array $config = []): array
    {
    
        $response = $this->chat($messages, $config);

        // Clean up response if it contains markdown code blocks
        $cleaned = preg_replace('/^```json\s*|\s*```$/', '', trim($response));
        $cleaned = preg_replace('/^```\s*|\s*```$/', '', $cleaned); // Catch generic blocks
        
        $decoded = json_decode($cleaned, true);

        return is_array($decoded) ? $decoded : [];
    }
    /**
     * Generate a concise title for a resource using AI.
     */
    public function generateResourceTitle(string $url, ?string $contentSnippet): string
    {
        $messages = $this->promptService->build('title_gen', [
            'url' => $url,
            'content' => Str::limit($contentSnippet ?? '', 500),
        ]);

        return trim($this->chat($messages, ['temperature' => 0.5]));
    }

    /**
     * Generate metadata for a resource.
     *
     * @return array{title: string, summary: string, difficulty: string, tags: string[], estimated_minutes: int}
     */
    public function generateResourceMetadata(string $content, string $type = 'document'): array
    {
        $messages = $this->promptService->build('metadata_gen', [
            'type' => $type,
            'content' => Str::limit($content, 8000), // Limit context window
        ]);

        return $this->getJson($messages, ['temperature' => 0.3]);
    }

    /**
     * Pick the best resource for a time gap.
     */
    public function getLiquidSuggestion(int $minutes, string $nextEvent, string $resourcesJson): array
    {
        $messages = $this->promptService->build('liquid_suggestion', [
            'gap_minutes' => $minutes,
            'next_event' => $nextEvent,
            'resources' => $resourcesJson
        ]);

        return $this->getJson($messages, ['temperature' => 0.3]);
    }

    /**
     * Perform OCR on an image using GPT-4o.
     */
    public function ocr(string $path): string
    {
        $imageUrl = $path;
        
        // If local file, encode to base64
        if (file_exists($path)) {
            $data = file_get_contents($path);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $base64 = base64_encode($data);
            $imageUrl = "data:image/{$type};base64,{$base64}";
        }

        $messages = [
            [
                'role' => 'user',
                'content' => [
                    ['type' => 'text', 'text' => 'Transcribe all text from this image exactly as it appears. If there is no text, return empty string.'],
                    ['type' => 'image_url', 'image_url' => ['url' => $imageUrl]],
                ],
            ],
        ];

        return trim($this->chat($messages, ['model' => 'gpt-4o', 'max_tokens' => 4000]));
    }
}
