<?php

declare(strict_types=1);

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'             => ['required', 'string', 'max:512'],
            'description'       => ['nullable', 'string'],
            'priority_label'    => ['nullable', 'string', 'in:critical,high,normal,low'],
            'status'            => ['nullable', 'string', 'in:open,in_progress,done,archived'],
            'due_date'          => ['nullable', 'date'],
            'estimated_minutes' => ['nullable', 'integer', 'min:0'],
            'scheduled_start'   => ['nullable', 'date'],
            'scheduled_end'     => ['nullable', 'date'],
        ];
    }
}
