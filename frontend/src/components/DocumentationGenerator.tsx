// Documentation Generator for CineBook
// Automatically generates component documentation and API guides

import React, { useState, useEffect, useCallback, useMemo } from 'react';

export interface ComponentDocumentation {
  name: string;
  description: string;
  props: PropDocumentation[];
  examples: CodeExample[];
  category: 'ui' | 'form' | 'layout' | 'business' | 'utility';
  tags: string[];
  lastUpdated: string;
  version: string;
}

export interface PropDocumentation {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description: string;
  examples?: string[];
}

export interface CodeExample {
  title: string;
  description: string;
  code: string;
  preview?: boolean;
  language: 'typescript' | 'javascript' | 'jsx' | 'tsx';
}

export interface ApiDocumentation {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: ApiParameter[];
  responses: ApiResponse[];
  examples: ApiExample[];
  authentication: boolean;
  deprecated?: boolean;
}

export interface ApiParameter {
  name: string;
  type: string;
  location: 'query' | 'body' | 'path' | 'header';
  required: boolean;
  description: string;
  schema?: any;
}

export interface ApiResponse {
  statusCode: number;
  description: string;
  schema?: any;
  example?: any;
}

export interface ApiExample {
  title: string;
  description: string;
  request: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response: {
    statusCode: number;
    body: any;
  };
}

interface DocumentationGeneratorProps {
  components?: ComponentDocumentation[];
  apis?: ApiDocumentation[];
  theme?: 'light' | 'dark';
  showSearch?: boolean;
  showCategories?: boolean;
  showExamples?: boolean;
  onExport?: (format: 'json' | 'markdown' | 'html') => void;
}

export function DocumentationGenerator({
  components = [],
  apis = [],
  theme = 'light',
  showSearch = true,
  showCategories = true,
  showExamples = true,
  onExport
}: DocumentationGeneratorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'components' | 'apis'>('components');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Filter components based on search and category
  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           component.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [components, searchTerm, selectedCategory]);

  // Filter APIs based on search
  const filteredApis = useMemo(() => {
    return apis.filter(api => {
      return api.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
             api.description.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [apis, searchTerm]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(components.map(c => c.category)));
    return ['all', ...cats];
  }, [components]);

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Export documentation
  const handleExport = useCallback((format: 'json' | 'markdown' | 'html') => {
    const data = {
      components: filteredComponents,
      apis: filteredApis,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    switch (format) {
      case 'json':
        exportAsJson(data);
        break;
      case 'markdown':
        exportAsMarkdown(data);
        break;
      case 'html':
        exportAsHtml(data);
        break;
    }

    onExport?.(format);
  }, [filteredComponents, filteredApis, onExport]);

  return (
    <div className={`documentation-generator documentation-generator--${theme}`}>
      {/* Header */}
      <div className="documentation-header">
        <h1 className="documentation-title">
          🎬 CineBook Documentation
        </h1>
        <p className="documentation-subtitle">
          Component library and API reference for the CineBook movie booking platform
        </p>
      </div>

      {/* Controls */}
      <div className="documentation-controls">
        {/* Search */}
        {showSearch && (
          <div className="search-container">
            <input
              type="text"
              placeholder="Search components, APIs, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${selectedTab === 'components' ? 'tab--active' : ''}`}
            onClick={() => setSelectedTab('components')}
          >
            Components ({filteredComponents.length})
          </button>
          <button
            className={`tab ${selectedTab === 'apis' ? 'tab--active' : ''}`}
            onClick={() => setSelectedTab('apis')}
          >
            APIs ({filteredApis.length})
          </button>
        </div>

        {/* Category Filter (for components) */}
        {showCategories && selectedTab === 'components' && (
          <div className="category-filter">
            <label htmlFor="category-select">Category:</label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Export Options */}
        <div className="export-options">
          <button onClick={() => handleExport('json')} className="export-btn">
            📄 JSON
          </button>
          <button onClick={() => handleExport('markdown')} className="export-btn">
            📝 Markdown
          </button>
          <button onClick={() => handleExport('html')} className="export-btn">
            🌐 HTML
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="documentation-content">
        {selectedTab === 'components' ? (
          <ComponentDocumentationList
            components={filteredComponents}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            showExamples={showExamples}
          />
        ) : (
          <ApiDocumentationList
            apis={filteredApis}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            showExamples={showExamples}
          />
        )}
      </div>

      {/* Empty State */}
      {((selectedTab === 'components' && filteredComponents.length === 0) ||
        (selectedTab === 'apis' && filteredApis.length === 0)) && (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No {selectedTab} found</h3>
          <p>
            {searchTerm
              ? `No ${selectedTab} match your search criteria.`
              : `No ${selectedTab} available in this category.`}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-search-btn"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Component Documentation List
interface ComponentDocumentationListProps {
  components: ComponentDocumentation[];
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
  showExamples: boolean;
}

function ComponentDocumentationList({
  components,
  expandedSections,
  onToggleSection,
  showExamples
}: ComponentDocumentationListProps) {
  return (
    <div className="component-docs">
      {components.map(component => (
        <ComponentDocumentationCard
          key={component.name}
          component={component}
          isExpanded={expandedSections.has(component.name)}
          onToggle={() => onToggleSection(component.name)}
          showExamples={showExamples}
        />
      ))}
    </div>
  );
}

// Component Documentation Card
interface ComponentDocumentationCardProps {
  component: ComponentDocumentation;
  isExpanded: boolean;
  onToggle: () => void;
  showExamples: boolean;
}

function ComponentDocumentationCard({
  component,
  isExpanded,
  onToggle,
  showExamples
}: ComponentDocumentationCardProps) {
  return (
    <div className="component-card">
      <div className="component-header" onClick={onToggle}>
        <div className="component-info">
          <h3 className="component-name">
            {component.name}
            <span className="component-category">{component.category}</span>
          </h3>
          <p className="component-description">{component.description}</p>
          <div className="component-meta">
            <span className="component-version">v{component.version}</span>
            <span className="component-updated">Updated: {component.lastUpdated}</span>
          </div>
        </div>
        <div className="component-toggle">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {isExpanded && (
        <div className="component-details">
          {/* Tags */}
          {component.tags.length > 0 && (
            <div className="component-tags">
              <h4>Tags</h4>
              <div className="tags">
                {component.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Props */}
          {component.props.length > 0 && (
            <div className="component-props">
              <h4>Props</h4>
              <div className="props-table">
                <div className="props-header">
                  <span>Name</span>
                  <span>Type</span>
                  <span>Required</span>
                  <span>Default</span>
                  <span>Description</span>
                </div>
                {component.props.map(prop => (
                  <div key={prop.name} className="props-row">
                    <span className="prop-name">{prop.name}</span>
                    <span className="prop-type">{prop.type}</span>
                    <span className="prop-required">
                      {prop.required ? '✓' : ''}
                    </span>
                    <span className="prop-default">
                      {prop.defaultValue !== undefined ? String(prop.defaultValue) : '-'}
                    </span>
                    <span className="prop-description">{prop.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          {showExamples && component.examples.length > 0 && (
            <div className="component-examples">
              <h4>Examples</h4>
              {component.examples.map((example, index) => (
                <CodeExampleCard key={index} example={example} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// API Documentation List
interface ApiDocumentationListProps {
  apis: ApiDocumentation[];
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
  showExamples: boolean;
}

function ApiDocumentationList({
  apis,
  expandedSections,
  onToggleSection,
  showExamples
}: ApiDocumentationListProps) {
  return (
    <div className="api-docs">
      {apis.map(api => (
        <ApiDocumentationCard
          key={`${api.method}-${api.endpoint}`}
          api={api}
          isExpanded={expandedSections.has(`${api.method}-${api.endpoint}`)}
          onToggle={() => onToggleSection(`${api.method}-${api.endpoint}`)}
          showExamples={showExamples}
        />
      ))}
    </div>
  );
}

// API Documentation Card
interface ApiDocumentationCardProps {
  api: ApiDocumentation;
  isExpanded: boolean;
  onToggle: () => void;
  showExamples: boolean;
}

function ApiDocumentationCard({
  api,
  isExpanded,
  onToggle,
  showExamples
}: ApiDocumentationCardProps) {
  const getMethodColor = (method: string) => {
    const colors = {
      GET: '#10b981',
      POST: '#3b82f6',
      PUT: '#f59e0b',
      DELETE: '#ef4444',
      PATCH: '#8b5cf6'
    };
    return colors[method as keyof typeof colors] || '#6b7280';
  };

  return (
    <div className="api-card">
      <div className="api-header" onClick={onToggle}>
        <div className="api-info">
          <div className="api-method-endpoint">
            <span 
              className="api-method"
              style={{ backgroundColor: getMethodColor(api.method) }}
            >
              {api.method}
            </span>
            <span className="api-endpoint">{api.endpoint}</span>
            {api.deprecated && <span className="api-deprecated">DEPRECATED</span>}
          </div>
          <p className="api-description">{api.description}</p>
          <div className="api-meta">
            <span className="api-auth">
              {api.authentication ? '🔒 Auth Required' : '🔓 Public'}
            </span>
          </div>
        </div>
        <div className="api-toggle">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {isExpanded && (
        <div className="api-details">
          {/* Parameters */}
          {api.parameters.length > 0 && (
            <div className="api-parameters">
              <h4>Parameters</h4>
              <div className="parameters-table">
                <div className="parameters-header">
                  <span>Name</span>
                  <span>Type</span>
                  <span>Location</span>
                  <span>Required</span>
                  <span>Description</span>
                </div>
                {api.parameters.map(param => (
                  <div key={param.name} className="parameters-row">
                    <span className="param-name">{param.name}</span>
                    <span className="param-type">{param.type}</span>
                    <span className="param-location">{param.location}</span>
                    <span className="param-required">
                      {param.required ? '✓' : ''}
                    </span>
                    <span className="param-description">{param.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Responses */}
          {api.responses.length > 0 && (
            <div className="api-responses">
              <h4>Responses</h4>
              {api.responses.map(response => (
                <div key={response.statusCode} className="response-item">
                  <div className="response-header">
                    <span className="response-status">{response.statusCode}</span>
                    <span className="response-description">{response.description}</span>
                  </div>
                  {response.example && (
                    <CodeBlock 
                      code={JSON.stringify(response.example, null, 2)}
                      language="json"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Examples */}
          {showExamples && api.examples.length > 0 && (
            <div className="api-examples">
              <h4>Examples</h4>
              {api.examples.map((example, index) => (
                <ApiExampleCard key={index} example={example} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Code Example Card
interface CodeExampleCardProps {
  example: CodeExample;
}

function CodeExampleCard({ example }: CodeExampleCardProps) {
  return (
    <div className="code-example">
      <div className="example-header">
        <h5>{example.title}</h5>
        <p>{example.description}</p>
      </div>
      <CodeBlock code={example.code} language={example.language} />
    </div>
  );
}

// API Example Card
interface ApiExampleCardProps {
  example: ApiExample;
}

function ApiExampleCard({ example }: ApiExampleCardProps) {
  return (
    <div className="api-example">
      <div className="example-header">
        <h5>{example.title}</h5>
        <p>{example.description}</p>
      </div>
      
      <div className="example-content">
        <div className="example-request">
          <h6>Request</h6>
          <CodeBlock
            code={`${example.request.method} ${example.request.url}
${example.request.headers ? Object.entries(example.request.headers).map(([k, v]) => `${k}: ${v}`).join('\n') : ''}

${example.request.body ? JSON.stringify(example.request.body, null, 2) : ''}`}
            language="http"
          />
        </div>
        
        <div className="example-response">
          <h6>Response ({example.response.statusCode})</h6>
          <CodeBlock
            code={JSON.stringify(example.response.body, null, 2)}
            language="json"
          />
        </div>
      </div>
    </div>
  );
}

// Code Block Component
interface CodeBlockProps {
  code: string;
  language: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-language">{language}</span>
        <button
          onClick={copyToClipboard}
          className="copy-button"
          title="Copy to clipboard"
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>
      <pre className="code-content">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Export functions
function exportAsJson(data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadFile(blob, 'cinebook-documentation.json');
}

function exportAsMarkdown(data: any) {
  let markdown = '# CineBook Documentation\n\n';
  
  // Components section
  if (data.components.length > 0) {
    markdown += '## Components\n\n';
    data.components.forEach((component: ComponentDocumentation) => {
      markdown += `### ${component.name}\n\n`;
      markdown += `${component.description}\n\n`;
      
      if (component.props.length > 0) {
        markdown += '#### Props\n\n';
        markdown += '| Name | Type | Required | Default | Description |\n';
        markdown += '|------|------|----------|---------|-------------|\n';
        component.props.forEach((prop: PropDocumentation) => {
          markdown += `| ${prop.name} | ${prop.type} | ${prop.required ? 'Yes' : 'No'} | ${prop.defaultValue || '-'} | ${prop.description} |\n`;
        });
        markdown += '\n';
      }
    });
  }
  
  // APIs section
  if (data.apis.length > 0) {
    markdown += '## APIs\n\n';
    data.apis.forEach((api: ApiDocumentation) => {
      markdown += `### ${api.method} ${api.endpoint}\n\n`;
      markdown += `${api.description}\n\n`;
    });
  }
  
  const blob = new Blob([markdown], { type: 'text/markdown' });
  downloadFile(blob, 'cinebook-documentation.md');
}

function exportAsHtml(data: any) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CineBook Documentation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; }
    .component { margin-bottom: 40px; border: 1px solid #eee; padding: 20px; border-radius: 8px; }
    .component-name { color: #333; margin: 0 0 10px 0; }
    .props-table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    .props-table th, .props-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .props-table th { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <h1>CineBook Documentation</h1>
  ${JSON.stringify(data, null, 2)}
</body>
</html>`;
  
  const blob = new Blob([html], { type: 'text/html' });
  downloadFile(blob, 'cinebook-documentation.html');
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default DocumentationGenerator;