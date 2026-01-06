<?php

declare(strict_types=1);

namespace App\Traits;

use App\Exceptions\ServiceException;
use Illuminate\Http\JsonResponse;

/**
 * Trait providing standardized API response methods.
 * Use in any controller that needs consistent JSON responses.
 */
trait ApiResponses
{
    /**
     * Return a successful response with data.
     *
     * @param mixed $data Response payload
     * @param string $message Success message
     * @param int $statusCode HTTP status code
     * @return JsonResponse
     */
    protected function successResponse(
        mixed $data = null,
        string $message = 'Success',
        int $statusCode = 200
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * Return a created response (201).
     *
     * @param mixed $data Created resource data
     * @param string $message Success message
     * @return JsonResponse
     */
    protected function createdResponse(
        mixed $data = null,
        string $message = 'Resource created successfully'
    ): JsonResponse {
        return $this->successResponse($data, $message, 201);
    }

    /**
     * Return a no content response (204).
     *
     * @return JsonResponse
     */
    protected function noContentResponse(): JsonResponse
    {
        return response()->json(null, 204);
    }

    /**
     * Return an error response.
     *
     * @param string $message Error message
     * @param int $statusCode HTTP status code
     * @param array<string, mixed> $errors Additional error details
     * @return JsonResponse
     */
    protected function errorResponse(
        string $message = 'An error occurred',
        int $statusCode = 400,
        array $errors = []
    ): JsonResponse {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Handle a ServiceException and return an appropriate error response.
     *
     * @param ServiceException $exception
     * @return JsonResponse
     */
    protected function handleServiceException(ServiceException $exception): JsonResponse
    {
        return $this->errorResponse(
            message: $exception->getMessage(),
            statusCode: $exception->getCode(),
            errors: $exception->getContext()
        );
    }

    /**
     * Return a not found response.
     *
     * @param string $message Error message
     * @return JsonResponse
     */
    protected function notFoundResponse(string $message = 'Resource not found'): JsonResponse
    {
        return $this->errorResponse($message, 404);
    }

    /**
     * Return an unauthorized response.
     *
     * @param string $message Error message
     * @return JsonResponse
     */
    protected function unauthorizedResponse(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->errorResponse($message, 401);
    }

    /**
     * Return a forbidden response.
     *
     * @param string $message Error message
     * @return JsonResponse
     */
    protected function forbiddenResponse(string $message = 'Forbidden'): JsonResponse
    {
        return $this->errorResponse($message, 403);
    }

    /**
     * Return a validation error response.
     *
     * @param array<string, array<string>> $errors Validation errors
     * @param string $message Error message
     * @return JsonResponse
     */
    protected function validationErrorResponse(
        array $errors,
        string $message = 'Validation failed'
    ): JsonResponse {
        return $this->errorResponse($message, 422, $errors);
    }
}
