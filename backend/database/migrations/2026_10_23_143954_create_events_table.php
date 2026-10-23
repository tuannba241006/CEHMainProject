<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organizer_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('location')->nullable();

            $table->dateTime('starts_at');
            $table->dateTime('ends_at');

            $table->unsignedInteger('capacity');

            $table->string('status', 20)->default('draft');

            $table->timestamps();

            $table->index(['status', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
