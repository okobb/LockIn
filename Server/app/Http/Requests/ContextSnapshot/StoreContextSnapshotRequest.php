<?php

declare(strict_types=1);

namespace App\Http\Requests\ContextSnapshot;

use Illuminate\Foundation\Http\FormRequest;

class StoreContextSnapshotRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'focus_session_id' => ['required', 'integer', 'exists:focus_sessions,id'],
            'note' => ['nullable', 'string'],
            'browser_state' => ['nullable'],
            'git_state' => ['nullable'],
            'voice_file' => ['nullable', 'file', 'mimes:mp3,mpga,wav,m4a,webm,weba', 'max:10240'],
            'checklist' => ['nullable', 'array'],
            'checklist.*' => ['string'],
            'should_complete' => ['nullable', 'boolean'],
        ];
    }
}
