<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceException;
use App\Services\Contracts\ServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Abstract base service providing common CRUD operations.
 *
 * @template TModel of Model
 */
abstract class BaseService implements ServiceInterface
{
    protected Model $model;

    abstract protected function getModelClass(): string;

    public function __construct()
    {
        $modelClass = $this->getModelClass();
        $this->model = new $modelClass();
    }

    /**
     * Find a record by ID. Returns the Model instance or null.
     */
    public function find(int|string $id): ?Model
    {
        return $this->model->newQuery()->find($id);
    }

    /**
     * Find a resource or throw an exception.
     *
     * @throws ServiceException
     */
    public function findOrFail(int|string $id): ?Model
    {
        $record = $this->find($id);

        if ($record === null) {
            throw ServiceException::notFound(
                resource: class_basename($this->getModelClass()),
                identifier: $id
            );
        }

        return $record;
    }

    /**
     * Get all records as an Eloquent Collection.
     *
     * @return Collection<int, TModel>
     */
    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        $query = $this->applyFilters($query, $filters);

        return $query->get();
    }

    /**
     * Create a new resource.
     *
     * @throws ServiceException
     */
    public function create(array $data): Model
    {
        return $this->executeInTransaction(function () use ($data): Model {
            return $this->model->newQuery()->create($data);
        });
    }

    /**
     * Update an existing resource.
     *
     * @throws ServiceException
     */
    public function update(int|string $id, array $data): Model
    {
        return $this->executeInTransaction(function () use ($id, $data): Model {
            $record = $this->model->newQuery()->findOrFail($id);
            
            $record->update($data);

            return $record;
        });
    }

    /**
     * Delete a resource.
     *
     * @throws ServiceException
     */
    public function delete(int|string $id): bool
    {
        return $this->executeInTransaction(function () use ($id): bool {
            $record = $this->model->newQuery()->findOrFail($id);
            
            return (bool) $record->delete();
        });
    }

    /**
     * Apply filters to the query builder.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function applyFilters($query, array $filters)
    {
        return $query;
    }

    /**
     * Execute a callback within a database transaction.
     *
     * @template TReturn
     * @param callable(): TReturn $callback
     * @return TReturn
     * @throws ServiceException
     */
    protected function executeInTransaction(callable $callback): mixed
    {
        try {
            return DB::transaction($callback);
        } catch (ServiceException $e) {
            throw $e;
        } catch (Throwable $e) {
            Log::error('Service operation failed', [
                'service' => static::class,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            throw new ServiceException(
                message: 'An unexpected error occurred while processing your request.',
                code: 500,
                context: ['original_message' => $e->getMessage()],
                previous: $e
            );
        }
    }
}