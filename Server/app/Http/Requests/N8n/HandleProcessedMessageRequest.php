<?php

declare(strict_types=1);

namespace App\Http\Requests\N8n;

use Illuminate\Foundation\Http\FormRequest;

class HandleProcessedMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message_id' => ['required', 'integer', 'exists:incoming_messages,id'],
            'action' => ['nullable', 'string', 'in:create_task,ignore'],
            'title' => ['required_unless:action,ignore', 'string', 'max:255'],
            'priority' => ['nullable', 'string', 'in:low,normal,medium,high,urgent,critical'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'estimated_minutes' => ['nullable', 'integer'],
            'reasoning' => ['nullable', 'string'],
        ];
    }
}
