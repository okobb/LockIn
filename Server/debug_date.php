<?php

use App\Models\Task;
use Illuminate\Support\Facades\Log;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$task = Task::whereNotNull('due_date')->first();

if ($task) {
    echo "Task ID: " . $task->id . "\n";
    echo "Due Date Type: " . gettype($task->due_date) . "\n";
    if (is_object($task->due_date)) {
        echo "Due Date Class: " . get_class($task->due_date) . "\n";
    }
} else {
    echo "No task with due_date found.\n";
}
