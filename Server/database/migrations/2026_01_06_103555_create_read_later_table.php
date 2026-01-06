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
        Schema::create('read_later_queue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('resource_id')->constrained('knowledge_resources')->cascadeOnDelete();

            $table->integer('estimated_minutes')->nullable();
            $table->text('context_match')->nullable(); // Explanation of why this fits the gap
            $table->timestampTz('scheduled_for')->nullable();
            $table->string('gap_type')->nullable(); // e.g., '15min_break', 'commute'

            $table->boolean('is_completed')->default(false);
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('completed_at')->nullable();

            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('read_later_queue');
    }
};