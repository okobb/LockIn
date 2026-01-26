<?php

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
            $table->integer('git_additions')->nullable()->after('git_branch');
            $table->integer('git_deletions')->nullable()->after('git_additions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('context_snapshots', function (Blueprint $table) {
            $table->dropColumn(['git_additions', 'git_deletions']);
        });
    }
};
