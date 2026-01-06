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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            
            $table->string('title', 512);
            $table->text('description')->nullable();
            
            // 0 = Low, 1 = Medium, 2 = High, 3 = Urgent
            $table->integer('priority')->default(0);
            
            // 'pending', 'in_progress', 'done', 'archived'
            $table->string('status')->default('pending');
            
            // 'slack', 'github_pr', 'manual'
            $table->string('source_type')->nullable(); 
            $table->text('source_link')->nullable();
            
            // Structure: { "channel_id": "C123", "message_ts": "1234.56", "pr_number": 42 }
            $table->jsonb('source_metadata')->nullable();
            $table->text('ai_reasoning')->nullable();
            
            $table->date('due_date')->nullable();
            $table->integer('estimated_minutes')->nullable();
            
            // Calendar/Timeline
            $table->timestampTz('scheduled_start')->nullable();
            $table->timestampTz('scheduled_end')->nullable();
            
            $table->integer('progress_percent')->default(0);
            $table->timestampTz('completed_at')->nullable();
            
            $table->timestampsTz();
            $table->softDeletesTz(); // Allows "Undo Delete"

            // Indexes
            // 1. Dashboard Main View: "My pending tasks, sorted by priority"
            $table->index(['user_id', 'status', 'priority']); 
            
            // 2. Calendar View: "My tasks in this date range"
            $table->index(['user_id', 'scheduled_start', 'scheduled_end']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};