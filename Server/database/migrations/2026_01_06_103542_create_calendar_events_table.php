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
        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            
            $table->string('external_id')->nullable()->index(); // ID from Google/Outlook
            $table->string('title');
            
            $table->timestampTz('start_time');
            $table->timestampTz('end_time');
            
            $table->string('status')->default('confirmed');
            $table->boolean('auto_save_enabled')->default(false);
            $table->jsonb('metadata')->nullable(); // Store raw provider data here
            
            $table->timestampsTz();
            
            // Index for querying "My events for this week"
            $table->index(['user_id', 'start_time', 'end_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
    }
};