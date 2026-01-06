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
        Schema::create('knowledge_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('url');
            $table->string('title', 512)->nullable();
            $table->text('summary')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->text('content_text')->nullable(); // Raw scraped text
            $table->boolean('is_read')->default(false);
            $table->boolean('is_archived')->default(false);
            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_resources');
    }
};