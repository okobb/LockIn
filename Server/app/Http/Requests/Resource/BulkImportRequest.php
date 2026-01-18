<?php

namespace App\Http\Requests\Resource;

use Illuminate\Foundation\Http\FormRequest;

class BulkImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'urls' => ['required', 'array', 'min:1', 'max:50'],
            'urls.*' => ['required', 'url', 'max:2048'],
        ];
    }
}
