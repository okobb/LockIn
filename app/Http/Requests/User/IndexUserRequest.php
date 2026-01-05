<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class IndexUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'per_page'       => ['sometimes', 'integer', 'min:1', 'max:100'],
            'email'          => ['sometimes', 'string', 'max:255'],
            'name'           => ['sometimes', 'string', 'max:255'],
            'created_after'  => ['sometimes', 'date'],
            'created_before' => ['sometimes', 'date', 'after_or_equal:created_after'],
        ];
    }
}