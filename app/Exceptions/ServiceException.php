<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

/**
 * Custom exception for service layer errors.
 * Provides structured error data for consistent API responses.
 */
final class ServiceException extends Exception
{
    /**
     * @param string $message Human-readable error message
     * @param int $code HTTP status code equivalent
     * @param array<string, mixed> $context Additional error context
     * @param Throwable|null $previous Previous exception for chaining
     */
    public function __construct(
        string $message,
        int $code = 400,
        private readonly array $context = [],
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Get additional error context.
     *
     * @return array<string, mixed>
     */
    public function getContext(): array
    {
        return $this->context;
    }

    /**
     * Create a not found exception.
     */
    public static function notFound(string $resource, mixed $identifier): self
    {
        return new self(
            message: sprintf('%s with identifier [%s] not found.', $resource, $identifier),
            code: 404,
            context: ['resource' => $resource, 'identifier' => $identifier]
        );
    }

    /**
     * Create a validation exception.
     *
     * @param array<string, array<string>> $errors
     */
    public static function validation(array $errors): self
    {
        return new self(
            message: 'Validation failed.',
            code: 422,
            context: ['errors' => $errors]
        );
    }

    /**
     * Create an unauthorized exception.
     */
    public static function unauthorized(string $message = 'Unauthorized action.'): self
    {
        return new self(
            message: $message,
            code: 403
        );
    }

    /**
     * Render the exception into an HTTP response.
     */
    public function render(Request $request): ?JsonResponse
    {
        // Only return JSON if it's an API request
        if ($request->wantsJson()) {
            return response()->json([
                'success' => false,
                'message' => $this->getMessage(),
                'errors'  => $this->context,
            ], $this->code);
        }

        // If it's not JSON, return null to let Laravel handle it normally
        return null;
    }
}
