<?php

declare(strict_types=1);

/**
 * Application constants.
 */

// OAuth Providers
const PROVIDER_GOOGLE = 'google';
const PROVIDER_GITHUB = 'github';
const PROVIDER_SLACK = 'slack';

// Service Types
const SERVICE_GMAIL = 'gmail';
const SERVICE_CALENDAR = 'calendar';
const SERVICE_REPOS = 'repos';
const SERVICE_NOTIFICATIONS = 'notifications';

// API Endpoints
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const GITHUB_API_BASE = 'https://api.github.com';

// Resource Types
const RESOURCE_TYPE_ARTICLE = 'article';
const RESOURCE_TYPE_VIDEO = 'video';
const RESOURCE_TYPE_DOCUMENT = 'document';
const RESOURCE_TYPE_IMAGE = 'image';
const RESOURCE_TYPE_WEBSITE = 'website';
const RESOURCE_TYPE_DOCUMENTATION = 'documentation';

// Resource Difficulty
const RESOURCE_DIFFICULTY_BEGINNER = 'beginner';
const RESOURCE_DIFFICULTY_INTERMEDIATE = 'intermediate';
const RESOURCE_DIFFICULTY_ADVANCED = 'advanced';

// Task Priorities
const PRIORITY_CRITICAL = 1;
const PRIORITY_HIGH = 2;
const PRIORITY_NORMAL = 3;
const PRIORITY_LOW = 4;

// Dashboard Mappings
const DASHBOARD_SOURCE_TAGS = [
    'gmail' => 'Email',
    'slack' => 'Slack',
    'github' => 'GitHub',
    'n8n' => 'Automation',
];

const DASHBOARD_PRIORITY_COLORS = [
    PRIORITY_CRITICAL => 'red',
    PRIORITY_HIGH => 'yellow',
    PRIORITY_NORMAL => 'blue',
    PRIORITY_LOW => 'green',
];

const DASHBOARD_EVENT_TYPES = [
    'deep_work' => 'focus',
    'meeting' => 'meeting',
    'external' => 'external',
];

const DASHBOARD_PROVIDER_SOURCES = [
    'gmail' => 'email',
    'slack' => 'slack',
    'github' => 'pr',
];

// Chunking Configuration
const CHUNKING_TARGET_SIZE = 500; // Tokens
const CHUNKING_MIN_SIZE = 100; // Tokens
const CHUNKING_OVERLAP_SIZE = 50; // Tokens

