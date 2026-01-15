<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE context_snapshots ADD COLUMN searchable_text tsvector');
        DB::statement('CREATE INDEX snapshots_search_gin ON context_snapshots USING gin(searchable_text)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS snapshots_search_gin');
        DB::statement('ALTER TABLE context_snapshots DROP COLUMN IF EXISTS searchable_text');
    }
};
