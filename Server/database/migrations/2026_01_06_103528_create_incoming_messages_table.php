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
        Schema::create('incoming_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('provider'); // 'slack', 'email', 'discord'
            $table->string('external_id')->index();
            $table->string('sender_info');
            $table->string('channel_info')->nullable();
            $table->text('content_raw');

            $table->timestampTz('processed_at')->nullable();

            // Relationships (Nullable as a message might not link to a task/session yet)
            $table->foreignId('extracted_task_id')
                  ->nullable()
                  ->constrained('tasks')
                  ->nullOnDelete();

            $table->foreignId('focus_session_id')
                  ->nullable()
                  ->constrained('focus_sessions')
                  ->nullOnDelete();

            $table->boolean('was_allowed')->default(false);
            $table->text('decision_reason')->nullable();
            
            // Using decimal for precise urgency scoring (e.g., 8.5)
            $table->decimal('urgency_score', 4, 1)->nullable(); 
            $table->text('extracted_action')->nullable();

            $table->timestampTz('received_at');
            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incoming_messages');
    }
};