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
        Schema::table('knowledge_resources', function (Blueprint $table) {
            $table->string('type', 50)->default('article'); // article, video, document, image, website
            $table->string('file_path')->nullable();        // For uploaded files
            $table->string('thumbnail_url')->nullable();    // OG image or generated
            $table->text('notes')->nullable();              // User-provided notes
            $table->jsonb('tags')->nullable();              // ['React', 'OAuth']
            $table->string('difficulty', 20)->nullable();   // beginner, intermediate, advanced
            $table->integer('estimated_time_minutes')->nullable();
            $table->boolean('is_favorite')->default(false);
            $table->foreignId('focus_session_id')->nullable()->constrained()->nullOnDelete();
            $table->string('source_domain')->nullable();    // Extracted domain for display
            $table->string('url')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('knowledge_resources', function (Blueprint $table) {
            $table->dropForeign(['focus_session_id']);
            $table->dropColumn([
                'type',
                'file_path',
                'thumbnail_url',
                'notes',
                'tags',
                'difficulty',
                'estimated_time_minutes',
                'is_favorite',
                'focus_session_id',
                'source_domain',
            ]);
        });
    }
};
