<?php

declare(strict_types=1);

namespace App\Http\Requests\Calendar;

use Illuminate\Foundation\Http\FormRequest;

class StoreCalendarEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'max:255'],
            'start_time'  => ['required', 'date'],
            'end_time'    => ['required', 'date', 'after:start_time'],
            'type'        => ['nullable', 'string', 'in:deep_work,meeting,external'],
            'description' => ['nullable', 'string'],
            'priority'    => ['nullable', 'string', 'in:high,medium,low,urgent'],
            'tags'        => ['nullable', 'array'],
            'tags.*'      => ['string'],
        ];
    }
}
