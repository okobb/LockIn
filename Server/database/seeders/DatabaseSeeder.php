<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $user = User::query()->where('email', 'okobrosli2@gmail.com')->first();
        if (!$user) {
            User::factory()->create([
                'name' => 'Omar Kobrosli',
                'email' => 'okobrosli2@gmail.com',
            ]);
        }

        $this->call([
            TaskSeeder::class,
            DailyStatsSeeder::class,
            ContextSeeder::class,
        ]);
    }
}
