<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

if (!defined('RESOURCE_TYPE_ARTICLE')) {
    require_once __DIR__.'/../app/consts.php';
}

abstract class TestCase extends BaseTestCase
{
    //
}
