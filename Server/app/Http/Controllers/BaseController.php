<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Traits\ApiResponses;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller;

/**
 * Abstract base controller.
 * Uses ApiResponses trait for standardized JSON responses.
 * Extend this for shared controller-specific behavior only.
 */
abstract class BaseController extends Controller
{
    use AuthorizesRequests;
    use ValidatesRequests;
    use ApiResponses;
}
