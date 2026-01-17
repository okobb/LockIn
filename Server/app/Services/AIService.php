<?php

declare(strict_types=1);

namespace App\Services;

use OpenAI;
use OpenAI\Contracts\ClientContract;

use App\AI\PromptService;

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
}
