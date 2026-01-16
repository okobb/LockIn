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
        Schema::table('knowledge_chunks', function (Blueprint $table) {
            $table->string('qdrant_point_id', 36)->nullable()->index();
            $table->string('chunk_type', 20)->default('text');
            $table->integer('token_count')->nullable();
            $table->jsonb('chunk_metadata')->nullable();
            $table->boolean('is_embedded')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('knowledge_chunks', function (Blueprint $table) {
            $table->dropColumn([
                'qdrant_point_id',
                'chunk_type',
                'token_count',
                'chunk_metadata',
                'is_embedded',
            ]);
        });
    }
};
