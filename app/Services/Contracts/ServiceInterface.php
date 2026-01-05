<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Base contract for all service classes.
 */
interface ServiceInterface
{
    /**
     * Find a resource by its primary identifier.
     *
     * @param int|string $id
     * @return Model|null
     */
    public function find(int|string $id): ?Model;

    /**
     * Get all resources with optional filters.
     *
     * @param array<string, mixed> $filters
     * @return Collection<int, Model>
     */
    public function all(array $filters = []): Collection;

    /**
     * Create a new resource.
     *
     * @param array<string, mixed> $data
     * @return Model
     */
    public function create(array $data): Model;

    /**
     * Update an existing resource.
     *
     * @param int|string $id
     * @param array<string, mixed> $data
     * @return Model
     */
    public function update(int|string $id, array $data): Model;

    /**
     * Delete a resource by its identifier.
     *
     * @param int|string $id
     * @return bool
     */
    public function delete(int|string $id): bool;
}
