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
        Schema::table('incoming_messages', function (Blueprint $table) {
            $table->dropColumn('processed_at');
            $table->string('status', 20)->default('pending')->after('content_raw');
        });
    }

     /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incoming_messages', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->timestamp('processed_at')->nullable();
        });
    }
};
