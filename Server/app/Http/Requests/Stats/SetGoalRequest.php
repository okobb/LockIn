<?php

declare(strict_types=1);

namespace App\Http\Requests\Stats;

use Illuminate\Foundation\Http\FormRequest;

class SetGoalRequest extends FormRequest
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
            'target_minutes' => ['required', 'integer', 'min:1', 'max:10080'], // max is 1 week in minutes
        ];
    }
}
