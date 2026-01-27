<?php

declare(strict_types=1);

namespace App\AI;

use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * PromptService - Handles prompt building and security for AI interactions.
 *
 * Combines prompt template building with injection detection/prevention.
 */
class PromptService
{
    private const RAG_SYSTEM_INSTRUCTIONS = <<<'EOT'
        You are Lock In — a friendly, helpful personal assistant. You're warm, conversational, and to the point.

        PERSONALITY:
        - Speak naturally, like texting a helpful friend.
        - Be concise but not curt — add brief context when useful.
        - Use contractions (you're, I'll, don't) and casual language.
        - Avoid jargon unless the user uses it first.
        - When you don't know something, just say so honestly.

        TOOL USAGE RULES:
        1. "projects", "tasks", "todos", "what should I work on" → use `list_tasks`.
        2. "saved resources", "documents", "articles", "knowledge base" → use `list_resources`.
        3. Only use RAG context for answering content questions, NOT for listing items.
        4. When unsure which tool to use, prefer `list_tasks` for action-oriented queries.
        5. When displaying lists from tools, show items EXACTLY as provided — just the title/name. Do NOT add markdown links, URLs, bold (**), or any other formatting.

        GUIDELINES:
        - Answer questions using the reference material when available.
        - Mention the source title when referencing specific information from the knowledge base.
        - Format code blocks using markdown.
        - When summarizing content, focus on the key points.
    EOT;

    private const CHECKLIST_SYSTEM_INSTRUCTIONS = <<<'EOT'
        You are a senior engineer's assistant helping a user resume a task.
        Based on the provided context (notes, voice transcript, code changes, tabs), generate a strict JSON array of 3-5 concrete, actionable next steps.
        Do not include any explanation, markdown formatting, or code blocks. Just the raw JSON array of strings.
        Example: ["Review AuthController.php changes", "Fix the failing test in UserTest.php", "Deploy to staging"]
    EOT;

    private const TITLE_GENERATION_INSTRUCTIONS = <<<'EOT'
        Generate a concise, descriptive title (max 10 words) for a learning resource.
        Based on the URL and content snippet provided, create a title that:
        - Is clear and informative
        - Indicates the topic/technology
        - Is professional (no clickbait)
        Return ONLY the title, no quotes or extra text.
    EOT;

    private const METADATA_GENERATION_INSTRUCTIONS = <<<'EOT'
        Analyze the provided learning resource content and generate metadata in JSON forma
        t.
        Return ONLY the raw JSON object with the following keys (All tags and difficulties must be capitalized):
        - title: A clear, descriptive title (string)
        - summary: A 2-3 sentence summary of the main points (string)
        - difficulty: One of "Beginner", "Intermediate", "Advanced" (string)
        - tags: Array of 3-5 relevant topic keywords (array of strings)
        - estimated_minutes: Estimated time to read/watch in minutes (integer)
    EOT;

    /** @var array<string> */
    private array $blockedPatterns;
    private int $maxLength;

    public function __construct()
    {
        $this->blockedPatterns = config('rag.blocked_patterns', []);
        $this->maxLength = config('rag.max_question_length', 2000);
    }

    /**
     * Build a message array for the OpenAI Chat API.
     *
     * @param string $key The prompt template key (e.g., 'rag_qa')
     * @param array<string, string> $variables Variables to substitute
     * @return array<int, array{role: string, content: string}>
     */
    public function build(string $key, array $variables = []): array
    {
        return match ($key) {
            'rag_qa' => $this->buildRagQa($variables),
            'chat_with_tools' => $this->buildRagQa($variables),
            'checklist' => $this->buildChecklist($variables),
            'title_gen' => $this->buildTitleGeneration($variables),
            'metadata_gen' => $this->buildMetadataGeneration($variables),
            default => throw new InvalidArgumentException("Prompt template [{$key}] not found."),
        };
    }

    /**
     * Build the metadata generation prompt.
     */
    private function buildMetadataGeneration(array $variables): array
    {
        return [
            ['role' => 'system', 'content' => self::METADATA_GENERATION_INSTRUCTIONS],
            ['role' => 'user', 'content' => "Type: " . ($variables['type'] ?? 'document') . "\n\nContent:\n" . ($variables['content'] ?? '')],
        ];
    }

    /**
     * Build the context checklist prompt.
     */
    private function buildChecklist(array $variables): array
    {
        $context = "Task: " . ($variables['title'] ?? 'Untitled') . "\n";
        if (!empty($variables['note'])) {
            $context .= "User Note: " . $variables['note'] . "\n";
        }
        if (!empty($variables['transcript'])) {
            $context .= "Voice Transcript: " . $variables['transcript'] . "\n";
        }
        if (!empty($variables['git_summary'])) {
            $context .= "Code Changes: " . $variables['git_summary'] . "\n";
        }
        if (!empty($variables['tabs'])) {
            $context .= "Open Tabs: " . $variables['tabs'] . "\n";
        }

        return [
            ['role' => 'system', 'content' => self::CHECKLIST_SYSTEM_INSTRUCTIONS],
            ['role' => 'user', 'content' => $context],
        ];
    }

    /**
     * RAG Q&A prompt with defensive multi-message structure.
     */
    private function buildRagQa(array $variables): array
    {
        $context = $variables['context'] ?? '';
        $question = $variables['question'] ?? '';
        $history = $variables['history'] ?? [];

        $messages = [
            ['role' => 'system', 'content' => self::RAG_SYSTEM_INSTRUCTIONS],
        ];

        if (!empty($context)) {
            $messages[] = [
                'role' => 'user',
                'content' => "Here is the reference material to use for answering:\n\n---\n{$context}\n---",
            ];
            $messages[] = [
                'role' => 'assistant',
                'content' => "I've reviewed the reference material and I'm ready to answer questions based on it.",
            ];
        }

        // Append conversation history
        if (!empty($history) && is_array($history)) {
            $messages = array_merge($messages, $history);
        }

        $messages[] = ['role' => 'user', 'content' => "Question: {$question}"];

        return $messages;
    }

    /**
     * Sanitize user input by removing control characters and normalizing whitespace.
     */
    public function sanitize(string $input): string
    {
        $sanitized = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $input);
        $sanitized = preg_replace('/\s+/', ' ', $sanitized);
        $sanitized = trim($sanitized);

        if (strlen($sanitized) > $this->maxLength) {
            $sanitized = substr($sanitized, 0, $this->maxLength);
        }

        return $sanitized;
    }

    /**
     * Quick check if input should be blocked.
     */
    public function isBlocked(string $input): bool
    {
        return $this->detectInjection($input)['is_blocked'];
    }

    /**
     * Detect potential injection attempts.
     *
     * @return array{is_blocked: bool, risk_score: int, patterns: array}
     */
    public function detectInjection(string $input): array
    {
        $matchedPatterns = [];
        $riskScore = 0;

        foreach ($this->blockedPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                $matchedPatterns[] = $pattern;
                $riskScore += 25;
            }
        }

        $riskScore += $this->checkHeuristics($input);
        $riskScore = min(100, $riskScore);

        return [
            'is_blocked' => $riskScore >= 25,
            'risk_score' => $riskScore,
            'patterns' => $matchedPatterns,
        ];
    }

    /**
     * Process input through the full security pipeline.
     *
     * @return array{sanitized: string, blocked: bool}
     */
    public function process(string $input): array
    {
        $sanitized = $this->sanitize($input);
        $result = $this->detectInjection($sanitized);

        if ($result['risk_score'] > 0) {
            Log::warning('PromptService: Potential injection detected', [
                'risk_score' => $result['risk_score'],
                'patterns' => $result['patterns'],
                'input_preview' => substr($sanitized, 0, 100),
            ]);
        }

        return [
            'sanitized' => $sanitized,
            'blocked' => $result['is_blocked'],
        ];
    }

    /**
     * Build the title generation prompt.
     */
    private function buildTitleGeneration(array $variables): array
    {
        return [
            ['role' => 'system', 'content' => self::TITLE_GENERATION_INSTRUCTIONS],
            ['role' => 'user', 'content' => "URL: " . ($variables['url'] ?? '') . "\n\nContent Preview:\n" . ($variables['content'] ?? '')],
        ];
    }

    /**
     * Additional heuristic checks beyond regex patterns.
     */
    private function checkHeuristics(string $input): int
    {
        $score = 0;
        $lowerInput = strtolower($input);

        if (preg_match('/[<>{}|\[\]\\\\]{3,}/', $input)) {
            $score += 15;
        }

        if (preg_match('/```(system|admin|root|sudo)/i', $input)) {
            $score += 20;
        }

        $roleKeywords = ['system', 'admin', 'assistant', 'instruction', 'prompt'];
        $keywordCount = 0;
        foreach ($roleKeywords as $keyword) {
            $keywordCount += substr_count($lowerInput, $keyword);
        }
        if ($keywordCount >= 3) {
            $score += 15;
        }

        $specialChars = preg_match_all('/[!@#$%^&*()_+=\[\]{}|;:\'",.<>?\/\\\\~`]/', $input);
        if ($specialChars > strlen($input) * 0.3) {
            $score += 10;
        }

        return $score;
    }
}
