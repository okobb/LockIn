<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("
                DELETE FROM calendar_events a USING calendar_events b
                WHERE a.id < b.id
                AND a.user_id = b.user_id
                AND a.external_id = b.external_id
                AND a.external_id IS NOT NULL
            ");
        }

        Schema::table('calendar_events', function (Blueprint $table) {
            $table->unique(['user_id', 'external_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'external_id']);
        });
    }
};
