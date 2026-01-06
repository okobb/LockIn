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
        Schema::create('context_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); 
            $table->unsignedBigInteger('focus_session_id')->nullable(); 
            $table->string('title')->nullable();
            $table->string('type')->nullable(); // e.g., 'manual', 'interruption'
            
            // Git & App State
            $table->text('git_diff_blob')->nullable();
            $table->string('git_branch')->nullable();
            $table->string('git_last_commit')->nullable();
            $table->string('repository_source')->nullable();
            $table->jsonb('git_files_changed')->nullable();
            $table->jsonb('browser_state')->nullable();
            $table->jsonb('ide_state')->nullable();
            
            // Voice & AI
            $table->string('voice_memo_path', 512)->nullable();
            $table->integer('voice_duration_sec')->nullable();
            $table->timestampTz('voice_recorded_at')->nullable();
            $table->text('voice_transcript')->nullable();
            $table->text('text_note')->nullable();
            $table->jsonb('ai_resume_checklist')->nullable();
            
            // Scoring 
            $table->integer('quality_score')->default(0); 
            
            $table->timestampsTz();

            // Indexes
            // 1. Timeline View: "Show history descending"
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('context_snapshots');
    }
};