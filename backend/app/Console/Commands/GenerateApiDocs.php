<?php

namespace App\Console\Commands;

use App\Services\ApiDocumentationService;
use Illuminate\Console\Command;

class GenerateApiDocs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api:generate-docs 
                            {--format=json : Output format (json, yaml, both)}
                            {--output=storage/api-docs : Output directory}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate OpenAPI documentation for CineBook API';

    protected ApiDocumentationService $apiDocService;

    /**
     * Create a new command instance.
     */
    public function __construct(ApiDocumentationService $apiDocService)
    {
        parent::__construct();
        $this->apiDocService = $apiDocService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $format = $this->option('format');
        $outputDir = $this->option('output');

        $this->info('🚀 Generating CineBook API documentation...');
        
        try {
            $spec = $this->apiDocService->generateOpenApiSpec();
            $endpointCount = count($spec['paths']);
            
            $this->info("📊 Found {$endpointCount} API endpoints");
            
            if (in_array($format, ['json', 'both'])) {
                $jsonFile = $this->apiDocService->saveSpecification('json');
                $this->info("✅ JSON specification saved: {$jsonFile}");
            }
            
            if (in_array($format, ['yaml', 'both'])) {
                $yamlFile = $this->apiDocService->saveSpecification('yaml');
                $this->info("✅ YAML specification saved: {$yamlFile}");
            }
            
            $this->newLine();
            $this->info('📝 API Documentation Summary:');
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Total Endpoints', $endpointCount],
                    ['API Version', $spec['info']['version']],
                    ['Supported Versions', implode(', ', ['v1', 'v2'])],
                    ['Tags', count($spec['tags'])],
                    ['Schemas', count($spec['components']['schemas'])],
                ]
            );
            
            $this->newLine();
            $this->info('🌐 Access your API documentation at:');
            $this->line('• JSON: ' . url('/api/docs/openapi.json'));
            $this->line('• YAML: ' . url('/api/docs/openapi.yaml'));
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error('❌ Failed to generate API documentation:');
            $this->error($e->getMessage());
            
            if ($this->option('verbose')) {
                $this->error($e->getTraceAsString());
            }
            
            return Command::FAILURE;
        }
    }
}