<?php

namespace App\Providers;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Fix PostgreSQL boolean binding issue
        Builder::macro('whereBoolean', function (string $column, bool $value) {
            /** @var Builder $this */
            return $this->whereRaw("{$column} = " . ($value ? 'TRUE' : 'FALSE'));
        });
    }
}
