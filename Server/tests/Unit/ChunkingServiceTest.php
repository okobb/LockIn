<?php

namespace Tests\Unit;

use App\Services\ChunkingService;
use PHPUnit\Framework\TestCase;

class ChunkingServiceTest extends TestCase
{
    private ChunkingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ChunkingService();
    }

    public function test_splits_text_by_paragraphs(): void
    {
        $text = "Paragraph one.\n\nParagraph two.\n\nParagraph three.";
        $chunks = $this->service->chunkContent($text);

        $this->assertCount(1, $chunks, 'Should merge small paragraphs into one chunk if under limit');
        $this->assertStringContainsString('Paragraph one.', $chunks[0]['content']);
        $this->assertStringContainsString('Paragraph three.', $chunks[0]['content']);
    }

    public function test_merges_short_chunks(): void
    {
        // 50 words * 4 chars = 200 tokens roughly. 
        // 3 paragraphs of 50 words should stay in one chunk (approx 150-200 tokens is < 500)
        $p1 = str_repeat('word ', 50);
        $p2 = str_repeat('word ', 50);
        $p3 = str_repeat('word ', 50);
        
        $text = "$p1\n\n$p2\n\n$p3";
        $chunks = $this->service->chunkContent($text);

        $expected = trim($p1) . "\n\n" . trim($p2) . "\n\n" . trim($p3);

        $this->assertCount(1, $chunks);
        $this->assertEquals($expected, $chunks[0]['content']);
    }

    public function test_splits_long_chunks(): void
    {
        // 500 tokens * 4 chars = 2000 chars. 
        // Create 3000 chars text
        $longText = str_repeat('longword ', 400); // 8 chars * 400 = 3200 chars ~ 800 tokens
        
        $chunks = $this->service->chunkContent($longText);

        $this->assertGreaterThan(1, count($chunks));
        $this->assertEquals('text', $chunks[0]['type']);
        $this->assertTrue($chunks[0]['metadata']['split'] ?? false);
    }

    public function test_token_counting_approximation(): void
    {
        $text = "Hello world"; // 11 chars
        $start = (int) ceil(11/4); // 3
        
        $this->assertEquals($start, $this->service->countTokens($text));
    }
}
