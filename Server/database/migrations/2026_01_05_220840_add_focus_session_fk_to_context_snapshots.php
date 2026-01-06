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
            $table->foreign('focus_session_id')
                  ->references('id')
                  ->on('focus_sessions')
                  ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('context_snapshots', function (Blueprint $table) {
            $table->dropForeign(['focus_session_id']);
        });
    }
};