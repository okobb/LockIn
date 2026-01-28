<?php

declare(strict_types=1);

namespace App\Services;

class ChunkingService
{


    /**
     * Main entry point to chunk content.
     *
     * @return array<int, array{content: string, type: string, token_count: int, metadata: array}>
     */
    public function chunkContent(string $content): array
    {
        $initialChunks = $this->splitByParagraphs($content);
        
        $mergedChunks = $this->mergeShortChunks($initialChunks);

        $finalChunks = $this->splitLongChunks($mergedChunks);

        return $finalChunks;
    }

    private function splitByParagraphs(string $content): array
    {
        // Clean up multiple newlines
        $content = preg_replace('/\n{3,}/', "\n\n", $content);
        $parts = explode("\n\n", $content);

        $chunks = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if (empty($part)) {
                continue;
            }

            $chunks[] = [
                'content' => $part,
                'token_count' => $this->countTokens($part),
            ];
        }

        return $chunks;
    }

    private function mergeShortChunks(array $chunks): array
    {
        $merged = [];
        $currentChunk = '';
        $currentTokens = 0;

        foreach ($chunks as $chunk) {
            // If adding this chunk keeps us under target + margin, merge it
            if ($currentTokens + $chunk['token_count'] < CHUNKING_TARGET_SIZE) {
                $currentChunk .= ($currentChunk ? "\n\n" : '') . $chunk['content'];
                $currentTokens += $chunk['token_count'];
            } else {
                // Determine if we should overlap
                if (!empty($currentChunk)) {
                    $merged[] = [
                        'content' => $currentChunk,
                        'token_count' => $currentTokens,
                    ];
                }
                
                $currentChunk = $chunk['content'];
                $currentTokens = $chunk['token_count'];
            }
        }

        if (!empty($currentChunk)) {
            $merged[] = [
                'content' => $currentChunk,
                'token_count' => $currentTokens,
            ];
        }

        return $merged;
    }

    private function splitLongChunks(array $chunks): array
    {
        $final = [];

        foreach ($chunks as $chunk) {
            if ($chunk['token_count'] <= CHUNKING_TARGET_SIZE + 100) {
                // Acceptable size
                $final[] = [
                    'content' => $chunk['content'],
                    'type' => 'text',
                    'token_count' => $chunk['token_count'],
                    'metadata' => [],
                ];
                continue;
            }

            // Simple split for very large chunks 
            $words = explode(' ', $chunk['content']);
            $currentSegment = [];
            $currentCount = 0;

            foreach ($words as $word) {
                $wordTokenCount = $this->countTokens($word . ' '); // Approximation
                
                if ($currentCount + $wordTokenCount > CHUNKING_TARGET_SIZE) {
                    $text = implode(' ', $currentSegment);
                    $final[] = [
                        'content' => $text,
                        'type' => 'text',
                        'token_count' => $this->countTokens($text),
                        'metadata' => ['split' => true],
                    ];
                    // Overlap logic: keep last 50 tokens (approx 40 words)
                    $overlap = array_slice($currentSegment, -40);
                    $currentSegment = $overlap; 
                    $currentCount = $this->countTokens(implode(' ', $overlap));
                }

                $currentSegment[] = $word;
                $currentCount += $wordTokenCount;
            }

            if (!empty($currentSegment)) {
                $text = implode(' ', $currentSegment);
                $final[] = [
                    'content' => $text,
                    'type' => 'text',
                    'token_count' => $this->countTokens($text),
                    'metadata' => ['split' => true],
                ];
            }
        }

        return $final;
    }

    /**
     * Approximate token count for OpenAI models (cl100k_base).
     * 1 token ~= 4 chars in English.
     */
    public function countTokens(string $text): int
    {
        return (int) ceil(strlen($text) / 4);
    }
}
