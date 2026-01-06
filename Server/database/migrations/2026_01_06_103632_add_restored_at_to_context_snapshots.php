<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('context_snapshots', function (Blueprint $table) {
            if (!Schema::hasColumn('context_snapshots', 'restored_at')) {
                 $table->timestampTz('restored_at')->nullable()->after('created_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('context_snapshots', function (Blueprint $table) {
            $table->dropColumn('restored_at');
        });
    }
};