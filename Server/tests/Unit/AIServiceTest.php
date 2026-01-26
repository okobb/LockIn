<?php

namespace Tests\Unit;

use App\Services\AIService;
use App\AI\PromptService;
use OpenAI\Contracts\ClientContract;
use OpenAI\Contracts\Resources\ChatContract;
use OpenAI\Responses\Chat\CreateResponse;
use PHPUnit\Framework\TestCase;
use Mockery;

class AIServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_chat_returns_content(): void
    {
        $mockResponse = CreateResponse::fake([
            'model' => 'gpt-4o-mini',
            'choices' => [
                [
                    'index' => 0,
                    'message' => [
                        'role' => 'assistant',
                        'content' => 'Hello world',
                    ],
                    'finish_reason' => 'stop',
                ],
            ],
        ]);

        $mockChat = Mockery::mock(ChatContract::class);
        $mockChat->shouldReceive('create')
            ->once()
            ->withArgs(function ($args) {
                return $args['model'] === 'gpt-4o-mini'
                    && $args['messages'][0]['content'] === 'Hi';
            })
            ->andReturn($mockResponse);

        $mockClient = Mockery::mock(ClientContract::class);
        $mockClient->shouldReceive('chat')->andReturn($mockChat);

        $mockPromptService = Mockery::mock(PromptService::class);

        $aiService = new AIService($mockPromptService, $mockClient);

        $result = $aiService->chat([
            ['role' => 'user', 'content' => 'Hi']
        ]);

        $this->assertEquals('Hello world', $result);
    }

    public function test_chat_uses_custom_model_and_temperature(): void
    {
        $mockResponse = CreateResponse::fake([
            'model' => 'gpt-4',
            'choices' => [
                [
                    'index' => 0,
                    'message' => [
                        'role' => 'assistant',
                        'content' => 'Custom model response',
                    ],
                    'finish_reason' => 'stop',
                ],
            ],
        ]);

        $mockChat = Mockery::mock(ChatContract::class);
        $mockChat->shouldReceive('create')
            ->once()
            ->withArgs(function ($args) {
                return $args['model'] === 'gpt-4'
                    && $args['temperature'] === 0.5;
            })
            ->andReturn($mockResponse);

        $mockClient = Mockery::mock(ClientContract::class);
        $mockClient->shouldReceive('chat')->andReturn($mockChat);

        $mockPromptService = Mockery::mock(PromptService::class);
        $aiService = new AIService($mockPromptService, $mockClient);

        $result = $aiService->chat(
            [['role' => 'user', 'content' => 'Test']],
            ['model' => 'gpt-4', 'temperature' => 0.5]
        );

        $this->assertEquals('Custom model response', $result);
    }

    public function test_chat_returns_empty_string_when_no_content(): void
    {
        $mockResponse = CreateResponse::fake([
            'choices' => [
                [
                    'index' => 0,
                    'message' => [
                        'role' => 'assistant',
                        'content' => null,
                    ],
                    'finish_reason' => 'stop',
                ],
            ],
        ]);

        $mockChat = Mockery::mock(ChatContract::class);
        $mockChat->shouldReceive('create')
            ->once()
            ->andReturn($mockResponse);

        $mockClient = Mockery::mock(ClientContract::class);
        $mockClient->shouldReceive('chat')->andReturn($mockChat);

        $mockPromptService = Mockery::mock(PromptService::class);
        $aiService = new AIService($mockPromptService, $mockClient);

        $result = $aiService->chat([
            ['role' => 'user', 'content' => 'Test']
        ]);

        $this->assertEquals('', $result);
    }
}
