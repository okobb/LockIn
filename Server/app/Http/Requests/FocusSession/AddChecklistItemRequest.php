<?php

declare(strict_types=1);

namespace App\Http\Requests\FocusSession;

use Illuminate\Foundation\Http\FormRequest;

class AddChecklistItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $session = $this->route('session');
        return $session && $session->user_id === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'text' => ['required', 'string', 'max:255'],
        ];
    }
}
