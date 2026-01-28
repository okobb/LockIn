<?php

declare(strict_types=1);

namespace App\Http\Requests\FocusSession;

use App\Models\FocusSession;
use Illuminate\Foundation\Http\FormRequest;

class AddResourceToSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $session = $this->route('session');
        
        return $session instanceof FocusSession && $session->user_id === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url'],
        ];
    }
}
