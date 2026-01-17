<?php

namespace App\Http\Requests;

use App\AI\PromptService;
use Illuminate\Foundation\Http\FormRequest;

class AskKnowledgeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'question' => [
                'required',
                'string',
                'max:' . config('rag.max_question_length', 2000),
                function (string $attribute, mixed $value, \Closure $fail) {
                    $prompts = app(PromptService::class);
                    if ($prompts->isBlocked($value)) {
                        $fail('Your question contains content that cannot be processed. Please rephrase.');
                    }
                },
            ],
            'history' => ['sometimes', 'array'],
            'history.*.role' => ['string', 'in:user,assistant'],
            'history.*.content' => ['string'],
        ];
    }

    public function messages(): array
    {
        return [
            'question.max' => 'Your question is too long. Please keep it under :max characters.',
        ];
    }
}
