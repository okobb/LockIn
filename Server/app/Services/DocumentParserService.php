<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use ZipArchive;

class DocumentParserService
{
    public function __construct(
        private AIService $aiService
    ) {}

    public function parse(string $path): ?string
    {
        if (!Storage::disk('public')->exists($path)) {
            return null;
        }

        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $fullPath = Storage::disk('public')->path($path);

        return match ($extension) {
            'txt', 'md', 'json', 'csv' => $this->parseText($path),
            'docx' => $this->parseDocx($fullPath),
            'png', 'jpg', 'jpeg', 'webp' => $this->aiService->ocr($fullPath),
            default => null,
        };
    }

    private function parseText(string $path): string
    {
        return Storage::disk('public')->get($path);
    }

    private function parseDocx(string $filePath): ?string
    {
        $content = '';
        $zip = new ZipArchive;

        if ($zip->open($filePath) === true) {
            $index = $zip->locateName('word/document.xml');
            if ($index !== false) {
                $xmlData = $zip->getFromIndex($index);
                $dom = new \DOMDocument;
                $dom->loadXML($xmlData, LIBXML_NOENT | LIBXML_XINCLUDE | LIBXML_NOERROR | LIBXML_NOWARNING);
                
                $content = strip_tags($dom->saveXML());
            }
            $zip->close();
        }

        return trim($content) ?: null;
    }
}
