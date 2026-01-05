<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceException;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

/**
 * Service class handling User-related business logic.
 *
 * @extends BaseService<User>
 */
final class UserService extends BaseService
{
    /**
     * {@inheritDoc}
     */
    protected function getModelClass(): string
    {
        return User::class;
    }

    /**
     * Get paginated users.
     * * @return LengthAwarePaginator
     */
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->newQuery();
        $query = $this->applyFilters($query, $filters);
        return $query->paginate($perPage);
    }

    /**
     * Find a user by email address.
     */
    public function findByEmail(string $email): ?User
    {
        /** @var User|null $user */
        $user = $this->model->newQuery()
            ->where('email', $email)
            ->first();

        return $user;
    }

    /**
     * Update a user's password.
     *
     * @throws ServiceException
     */
    public function updatePassword(
        int|string $id,
        string $currentPassword,
        string $newPassword
    ): bool {
        return $this->executeInTransaction(function () use ($id, $currentPassword, $newPassword): bool {
            $user = $this->model->newQuery()->findOrFail($id);

            if (!Hash::check($currentPassword, $user->password)) {
                throw new ServiceException(
                    message: 'Current password is incorrect.',
                    code: 400,
                    context: ['field' => 'current_password']
                );
            }

            $user->update([
                'password' => $newPassword,
            ]);

            return true;
        });
    }

    /**
     * Apply filters to the query builder.
     */
    protected function applyFilters($query, array $filters)
    {
        if (!empty($filters['email'])) {
            $query->where('email', 'like', '%' . $filters['email'] . '%');
        }

        if (!empty($filters['name'])) {
            $query->where('name', 'like', '%' . $filters['name'] . '%');
        }

        if (!empty($filters['created_after'])) {
            $query->where('created_at', '>=', $filters['created_after']);
        }

        if (!empty($filters['created_before'])) {
            $query->where('created_at', '<=', $filters['created_before']);
        }

        return $query;
    }
}