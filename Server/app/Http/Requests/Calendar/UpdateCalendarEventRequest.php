<?php

declare(strict_types=1);

namespace App\Http\Requests\Calendar;

use App\Models\CalendarEvent;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCalendarEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        $event = $this->route('event');
        
        return $event instanceof CalendarEvent && $event->user_id === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'title'       => ['sometimes', 'string', 'max:255'],
            'start_time'  => ['sometimes', 'date'],
            'end_time'    => ['sometimes', 'date', 'after:start_time'],
            'type'        => ['sometimes', 'string', 'in:deep_work,meeting,external'],
            'description' => ['nullable', 'string'],
            'priority'    => ['nullable', 'string', 'in:high,medium,low,urgent'],
            'tags'        => ['nullable', 'array'],
            'tags.*'      => ['string'],
        ];
    }
}
