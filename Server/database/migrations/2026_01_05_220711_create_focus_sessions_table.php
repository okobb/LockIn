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
        Schema::create('focus_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_id')->nullable()->constrained('tasks')->nullOnDelete();
            
            $table->foreignId('context_snapshot_id')
                  ->nullable()
                  ->constrained('context_snapshots')
                  ->nullOnDelete();
            
            $table->string('title');
            $table->integer('planned_duration_min');
            $table->integer('actual_duration_min')->nullable();
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('ended_at')->nullable();
            $table->integer('paused_duration_sec')->default(0);
            $table->string('status')->default('planned');
            $table->integer('checklist_completed')->default(0);
            $table->integer('checklist_total')->default(0);
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('focus_sessions');
    }
};