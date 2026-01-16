<?php

declare(strict_types=1);

namespace App\AI\Prompts;

use InvalidArgumentException;

class PromptRegistry
{
    /**
     * Build a message array for the OpenAI Chat API.
     *
     * @param string $key The prompt template key (e.g., 'rag_qa')
     * @param array<string, string> $variables map of variables to substitute (e.g., ['context' => '...', 'question' => '...'])
     * @return array<int, array{role: string, content: string}>
     */
    public function build(string $key, array $variables = []): array
    {
        return match ($key) {
            'rag_qa' => $this->buildRagQa($variables),
            default => throw new InvalidArgumentException("Prompt template [{$key}] not found."),
        };
    }

    /**
     * RAG Q&A Prompt
     * Variables: {context}, {question}
     */
    private function buildRagQa(array $variables): array
    {
        $context = $variables['context'] ?? '';
        $question = $variables['question'] ?? '';

        $systemPrompt = <<<EOT
            You are an intelligent knowledge assistant for a developer. 
            Your goal is to answer the user's question accurately using ONLY the provided context below.

            Context:
            {$context}

            Instructions:
            1. Answer directly and concisely.
            2. If the answer is not in the context, say "I don't have enough information in your knowledge base to answer that."
            3. Format code blocks using markdown.
            4. If the user asks for code, provide a robust implementation.
            EOT;

        return [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $question],
        ];
    }
}
