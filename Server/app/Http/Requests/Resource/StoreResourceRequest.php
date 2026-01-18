<?php

declare(strict_types=1);

namespace App\Http\Requests\Resource;

use Illuminate\Foundation\Http\FormRequest;

class StoreResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'url' => 'required_without:file|nullable|url|max:2048',
            'file' => 'required_without:url|nullable|file|mimes:pdf,doc,docx,txt,md,png,jpg,jpeg,gif,webp|max:10240',
            'title' => 'nullable|string|max:512',
            'notes' => 'nullable|string|max:5000',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'difficulty' => 'nullable|in:' . implode(',', [
                RESOURCE_DIFFICULTY_BEGINNER,
                RESOURCE_DIFFICULTY_INTERMEDIATE,
                RESOURCE_DIFFICULTY_ADVANCED
            ]),
            'type' => 'nullable|string|in:' . implode(',', [
                RESOURCE_TYPE_ARTICLE,
                RESOURCE_TYPE_VIDEO,
                RESOURCE_TYPE_DOCUMENT,
                RESOURCE_TYPE_IMAGE,
                RESOURCE_TYPE_WEBSITE,
                RESOURCE_TYPE_DOCUMENTATION
            ]),
            'focus_session_id' => 'nullable|exists:focus_sessions,id',
        ];
    }
}
