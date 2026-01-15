<?php

declare(strict_types=1);

namespace App\Http\Requests\FocusSession;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFocusSessionRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'task_id' => ['nullable', 'integer', Rule::exists('tasks', 'id')->where('user_id', $this->user()->id)],
            'duration_min' => ['nullable', 'integer', 'min:1', 'max:180'], // Added duration flexible for future
        ];
    }
}
