<?php

declare(strict_types=1);

namespace App\Http\Requests\Resource;

use Illuminate\Foundation\Http\FormRequest;

class UpdateResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'nullable|string|max:512',
            'notes' => 'nullable|string|max:5000',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'difficulty' => 'nullable|in:' . implode(',', [
                RESOURCE_DIFFICULTY_BEGINNER,
                RESOURCE_DIFFICULTY_INTERMEDIATE,
                RESOURCE_DIFFICULTY_ADVANCED
            ]),
            'is_read' => 'boolean',
            'is_favorite' => 'boolean',
        ];
    }
}
