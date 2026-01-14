<?php

declare(strict_types=1);

namespace App\Http\Requests\Task;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $task = $this->route('task');
        
        return $task instanceof Task && $task->user_id === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'title'             => ['sometimes', 'string', 'max:512'],
            'description'       => ['sometimes', 'nullable', 'string'],
            'priority'          => ['sometimes', 'integer', 'min:0', 'max:4'],
            'status'            => ['sometimes', 'string', 'in:open,in_progress,done,archived'],
            'due_date'          => ['sometimes', 'nullable', 'date'],
            'estimated_minutes' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'scheduled_start'   => ['sometimes', 'nullable', 'date'],
            'scheduled_end'     => ['sometimes', 'nullable', 'date'],
        ];
    }
}
