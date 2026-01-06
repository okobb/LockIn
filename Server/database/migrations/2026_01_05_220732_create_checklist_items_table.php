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
        Schema::create('checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('focus_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('context_snapshot_id')->nullable()->constrained()->cascadeOnDelete();
            $table->text('text');
            $table->text('meta')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->timestampTz('completed_at')->nullable();
            $table->integer('sort_order')->default(0);
            $table->string('source')->default('manual');
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('checklist_items');
    }
};