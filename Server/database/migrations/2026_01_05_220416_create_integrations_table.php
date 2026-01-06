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
        Schema::create('integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider'); 
            $table->string('provider_id');
            $table->text('access_token');
            $table->text('refresh_token')->nullable();
            $table->jsonb('scopes')->nullable();
            $table->timestampTz('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
            
            $table->index(['user_id', 'provider']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integrations');
    }
};