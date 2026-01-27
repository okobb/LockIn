<?php

declare(strict_types=1);

namespace App\Http\Requests\ReadLater;

use Illuminate\Foundation\Http\FormRequest;

class StoreReadLaterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'resource_id' => ['required', 'exists:knowledge_resources,id'],
            'scheduled_for' => ['nullable', 'date', 'after:now'],
            'estimated_minutes' => ['nullable', 'integer', 'min:1'],
            'gap_type' => ['nullable', 'string', 'in:15min_break,commute,lunch,evening'],
        ];
    }
}
