// Component Documentation System for CineBook
// Automatically extracts and displays component documentation

import React, { useState, useEffect, useMemo } from 'react';
import { ComponentDocumentation, PropDocumentation, CodeExample } from './DocumentationGenerator';

export interface ComponentDocsProps {
  components?: ComponentDocumentation[];
  autoGenerate?: boolean;
  showPlayground?: boolean;
  theme?: 'light' | 'dark';
  onComponentSelect?: (component: ComponentDocumentation) => void;
}

// Sample component data for CineBook
const CINEBOOK_COMPONENTS: ComponentDocumentation[] = [
  {
    name: 'MovieCard',
    description: 'Displays movie information in a card format with poster, title, rating, and action buttons',
    category: 'ui',
    version: '1.2.0',
    lastUpdated: '2024-01-15',
    tags: ['movie', 'card', 'ui', 'responsive'],
    props: [
      {
        name: 'movie',
        type: 'Movie',
        required: true,
        description: 'Movie object containing title, poster, rating, and other details',
        examples: ['{ id: 1, title: "Avengers", poster: "url", rating: 4.5 }']
      },
      {
        name: 'onBookClick',
        type: '(movieId: number) => void',
        required: false,
        description: 'Callback function when book ticket button is clicked',
        examples: ['(id) => navigate(`/booking/${id}`)']
      },
      {
        name: 'showRating',
        type: 'boolean',
        required: false,
        defaultValue: true,
        description: 'Whether to display movie rating',
        examples: ['true', 'false']
      },
      {
        name: 'size',
        type: '"small" | "medium" | "large"',
        required: false,
        defaultValue: 'medium',
        description: 'Size variant of the movie card',
        examples: ['"small"', '"medium"', '"large"']
      }
    ],
    examples: [
      {
        title: 'Basic Movie Card',
        description: 'Standard movie card with all default properties',
        language: 'tsx',
        code: `<MovieCard 
  movie={{
    id: 1,
    title: "Spider-Man: No Way Home",
    poster: "/posters/spiderman.jpg",
    rating: 4.8,
    duration: 148,
    genre: ["Action", "Adventure", "Sci-Fi"]
  }}
  onBookClick={(id) => navigate(\`/booking/\${id}\`)}
/>`
      },
      {
        title: 'Small Movie Card without Rating',
        description: 'Compact version for movie lists without rating display',
        language: 'tsx',
        code: `<MovieCard 
  movie={movie}
  size="small"
  showRating={false}
  onBookClick={handleBooking}
/>`
      }
    ]
  },
  {
    name: 'SeatMap',
    description: 'Interactive theater seat selection component with real-time availability',
    category: 'business',
    version: '2.1.0',
    lastUpdated: '2024-01-20',
    tags: ['booking', 'seats', 'interactive', 'theater'],
    props: [
      {
        name: 'theater',
        type: 'Theater',
        required: true,
        description: 'Theater configuration including layout and seat types',
        examples: ['{ id: 1, name: "Theater A", rows: 10, seatsPerRow: 15 }']
      },
      {
        name: 'showtimeId',
        type: 'number',
        required: true,
        description: 'Showtime ID to fetch seat availability',
        examples: ['123', '456']
      },
      {
        name: 'selectedSeats',
        type: 'string[]',
        required: false,
        defaultValue: [],
        description: 'Array of currently selected seat IDs',
        examples: ['["A1", "A2"]', '[]']
      },
      {
        name: 'onSeatSelect',
        type: '(seatId: string) => void',
        required: true,
        description: 'Callback when a seat is selected or deselected',
        examples: ['(seatId) => setSelectedSeats(prev => [...prev, seatId])']
      },
      {
        name: 'maxSeats',
        type: 'number',
        required: false,
        defaultValue: 8,
        description: 'Maximum number of seats that can be selected',
        examples: ['4', '8', '12']
      }
    ],
    examples: [
      {
        title: 'Basic Seat Map',
        description: 'Interactive seat selection for movie booking',
        language: 'tsx',
        code: `const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

<SeatMap
  theater={theater}
  showtimeId={showtimeId}
  selectedSeats={selectedSeats}
  onSeatSelect={(seatId) => {
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(s => s !== seatId)
        : [...prev, seatId]
    );
  }}
  maxSeats={6}
/>`
      }
    ]
  },
  {
    name: 'FormValidator',
    description: 'Advanced form validation component with real-time feedback and custom rules',
    category: 'form',
    version: '1.0.0',
    lastUpdated: '2024-01-25',
    tags: ['form', 'validation', 'realtime', 'rules'],
    props: [
      {
        name: 'rules',
        type: 'ValidationRule[]',
        required: true,
        description: 'Array of validation rules to apply',
        examples: ['[{ name: "required", validator: (value) => !!value }]']
      },
      {
        name: 'value',
        type: 'any',
        required: true,
        description: 'Current value to validate',
        examples: ['"user@example.com"', '""', 'null']
      },
      {
        name: 'onValidationChange',
        type: '(isValid: boolean, errors: string[]) => void',
        required: true,
        description: 'Callback when validation state changes',
        examples: ['(valid, errors) => setFormErrors({ email: errors })']
      },
      {
        name: 'debounceMs',
        type: 'number',
        required: false,
        defaultValue: 300,
        description: 'Debounce delay for validation in milliseconds',
        examples: ['300', '500', '1000']
      }
    ],
    examples: [
      {
        title: 'Email Validation',
        description: 'Real-time email validation with multiple rules',
        language: 'tsx',
        code: `const emailRules: ValidationRule[] = [
  {
    name: 'required',
    message: 'Email is required',
    validator: (value) => !!value
  },
  {
    name: 'email',
    message: 'Please enter a valid email address',
    validator: (value) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)
  }
];

<FormValidator
  rules={emailRules}
  value={email}
  onValidationChange={(isValid, errors) => {
    setEmailValid(isValid);
    setEmailErrors(errors);
  }}
  debounceMs={300}
/>`
      }
    ]
  },
  {
    name: 'SearchSuggestions',
    description: 'Real-time search suggestions with fuzzy matching and categorized results',
    category: 'ui',
    version: '1.0.0',
    lastUpdated: '2024-01-25',
    tags: ['search', 'autocomplete', 'suggestions', 'fuzzy'],
    props: [
      {
        name: 'query',
        type: 'string',
        required: true,
        description: 'Current search query',
        examples: ['"spider"', '"avengers"', '""']
      },
      {
        name: 'suggestions',
        type: 'SearchSuggestion[]',
        required: true,
        description: 'Array of search suggestions to display',
        examples: ['[{ id: "1", text: "Spider-Man", type: "movie" }]']
      },
      {
        name: 'onSuggestionSelect',
        type: '(suggestion: SearchSuggestion) => void',
        required: false,
        description: 'Callback when a suggestion is selected',
        examples: ['(suggestion) => navigate(`/movies/${suggestion.id}`)']
      },
      {
        name: 'placeholder',
        type: 'string',
        required: false,
        defaultValue: 'Search movies, actors, genres...',
        description: 'Placeholder text for search input',
        examples: ['"Search movies..."', '"Find your favorite movie"']
      }
    ],
    examples: [
      {
        title: 'Movie Search with Suggestions',
        description: 'Search component with categorized suggestions',
        language: 'tsx',
        code: `const [query, setQuery] = useState('');
const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

<SearchSuggestions
  query={query}
  suggestions={suggestions}
  onSuggestionSelect={(suggestion) => {
    if (suggestion.type === 'movie') {
      navigate(\`/movies/\${suggestion.id}\`);
    } else if (suggestion.type === 'actor') {
      navigate(\`/actors/\${suggestion.id}\`);
    }
  }}
  placeholder="Search for movies, actors, or genres..."
/>`
      }
    ]
  }
];

export function ComponentDocs({
  components = CINEBOOK_COMPONENTS,
  autoGenerate = false,
  showPlayground = true,
  theme = 'light',
  onComponentSelect
}: ComponentDocsProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['props']));

  // Filter components
  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           component.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [components, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(components.map(c => c.category)));
    return ['all', ...cats];
  }, [components]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const currentComponent = selectedComponent ? 
    components.find(c => c.name === selectedComponent) : null;

  return (
    <div className={`component-docs component-docs--${theme}`}>
      <div className="component-docs__header">
        <h1 className="component-docs__title">
          🧩 Component Documentation
        </h1>
        <p className="component-docs__subtitle">
          Explore CineBook's React component library with interactive examples
        </p>
      </div>

      <div className="component-docs__layout">
        {/* Sidebar */}
        <div className="component-docs__sidebar">
          <div className="component-docs__search">
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="component-docs__search-input"
            />
          </div>

          <div className="component-docs__filter">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="component-docs__category-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : 
                   category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="component-docs__list">
            {filteredComponents.map(component => (
              <div
                key={component.name}
                className={`component-docs__item ${
                  selectedComponent === component.name ? 'component-docs__item--active' : ''
                }`}
                onClick={() => {
                  setSelectedComponent(component.name);
                  onComponentSelect?.(component);
                }}
              >
                <div className="component-docs__item-header">
                  <h3 className="component-docs__item-name">{component.name}</h3>
                  <span className="component-docs__item-category">
                    {component.category}
                  </span>
                </div>
                <p className="component-docs__item-description">
                  {component.description}
                </p>
                <div className="component-docs__item-meta">
                  <span className="component-docs__item-version">
                    v{component.version}
                  </span>
                  <span className="component-docs__item-props">
                    {component.props.length} props
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="component-docs__main">
          {currentComponent ? (
            <ComponentDetail
              component={currentComponent}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
              showPlayground={showPlayground}
            />
          ) : (
            <div className="component-docs__welcome">
              <div className="component-docs__welcome-icon">🧩</div>
              <h2>Welcome to Component Documentation</h2>
              <p>
                Select a component from the sidebar to view its documentation,
                props, and interactive examples.
              </p>
              <div className="component-docs__stats">
                <div className="component-docs__stat">
                  <strong>{components.length}</strong>
                  <span>Components</span>
                </div>
                <div className="component-docs__stat">
                  <strong>{components.reduce((acc, c) => acc + c.props.length, 0)}</strong>
                  <span>Props</span>
                </div>
                <div className="component-docs__stat">
                  <strong>{components.reduce((acc, c) => acc + c.examples.length, 0)}</strong>
                  <span>Examples</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component Detail View
interface ComponentDetailProps {
  component: ComponentDocumentation;
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
  showPlayground: boolean;
}

function ComponentDetail({
  component,
  expandedSections,
  onToggleSection,
  showPlayground
}: ComponentDetailProps) {
  const [playgroundCode, setPlaygroundCode] = useState('');

  // Initialize playground with first example
  useEffect(() => {
    if (component.examples.length > 0) {
      setPlaygroundCode(component.examples[0].code);
    }
  }, [component]);

  return (
    <div className="component-detail">
      {/* Header */}
      <div className="component-detail__header">
        <h1 className="component-detail__name">{component.name}</h1>
        <div className="component-detail__meta">
          <span className="component-detail__category">{component.category}</span>
          <span className="component-detail__version">v{component.version}</span>
          <span className="component-detail__updated">
            Updated: {component.lastUpdated}
          </span>
        </div>
      </div>

      <p className="component-detail__description">{component.description}</p>

      {/* Tags */}
      {component.tags.length > 0 && (
        <div className="component-detail__tags">
          {component.tags.map(tag => (
            <span key={tag} className="component-detail__tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="component-detail__stats">
        <div className="component-detail__stat">
          <span className="component-detail__stat-value">{component.props.length}</span>
          <span className="component-detail__stat-label">Props</span>
        </div>
        <div className="component-detail__stat">
          <span className="component-detail__stat-value">{component.examples.length}</span>
          <span className="component-detail__stat-label">Examples</span>
        </div>
        <div className="component-detail__stat">
          <span className="component-detail__stat-value">
            {component.props.filter(p => p.required).length}
          </span>
          <span className="component-detail__stat-label">Required Props</span>
        </div>
      </div>

      {/* Sections */}
      <div className="component-detail__sections">
        {/* Props Section */}
        <ComponentSection
          id="props"
          title="Props"
          isExpanded={expandedSections.has('props')}
          onToggle={() => onToggleSection('props')}
        >
          <PropsTable props={component.props} />
        </ComponentSection>

        {/* Examples Section */}
        {component.examples.length > 0 && (
          <ComponentSection
            id="examples"
            title="Examples"
            isExpanded={expandedSections.has('examples')}
            onToggle={() => onToggleSection('examples')}
          >
            <ExamplesList 
              examples={component.examples}
              onExampleSelect={(code) => setPlaygroundCode(code)}
            />
          </ComponentSection>
        )}

        {/* Playground Section */}
        {showPlayground && (
          <ComponentSection
            id="playground"
            title="Playground"
            isExpanded={expandedSections.has('playground')}
            onToggle={() => onToggleSection('playground')}
          >
            <CodePlayground
              code={playgroundCode}
              onChange={setPlaygroundCode}
              component={component}
            />
          </ComponentSection>
        )}
      </div>
    </div>
  );
}

// Component Section
interface ComponentSectionProps {
  id: string;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ComponentSection({ id, title, isExpanded, onToggle, children }: ComponentSectionProps) {
  return (
    <div className="component-section">
      <div className="component-section__header" onClick={onToggle}>
        <h2 className="component-section__title">{title}</h2>
        <span className="component-section__toggle">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>
      {isExpanded && (
        <div className="component-section__content">
          {children}
        </div>
      )}
    </div>
  );
}

// Props Table
interface PropsTableProps {
  props: PropDocumentation[];
}

function PropsTable({ props }: PropsTableProps) {
  return (
    <div className="props-table">
      <div className="props-table__header">
        <span>Name</span>
        <span>Type</span>
        <span>Required</span>
        <span>Default</span>
        <span>Description</span>
      </div>
      {props.map(prop => (
        <div key={prop.name} className="props-table__row">
          <span className="props-table__name">{prop.name}</span>
          <span className="props-table__type">{prop.type}</span>
          <span className="props-table__required">
            {prop.required ? '✓' : ''}
          </span>
          <span className="props-table__default">
            {prop.defaultValue !== undefined ? String(prop.defaultValue) : '-'}
          </span>
          <span className="props-table__description">{prop.description}</span>
        </div>
      ))}
    </div>
  );
}

// Examples List
interface ExamplesListProps {
  examples: CodeExample[];
  onExampleSelect: (code: string) => void;
}

function ExamplesList({ examples, onExampleSelect }: ExamplesListProps) {
  return (
    <div className="examples-list">
      {examples.map((example, index) => (
        <div key={index} className="example-item">
          <div className="example-item__header">
            <h3 className="example-item__title">{example.title}</h3>
            <button
              className="example-item__try-button"
              onClick={() => onExampleSelect(example.code)}
            >
              Try in Playground
            </button>
          </div>
          <p className="example-item__description">{example.description}</p>
          <CodeBlock code={example.code} language={example.language} />
        </div>
      ))}
    </div>
  );
}

// Code Playground
interface CodePlaygroundProps {
  code: string;
  onChange: (code: string) => void;
  component: ComponentDocumentation;
}

function CodePlayground({ code, onChange, component }: CodePlaygroundProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="code-playground">
      <div className="code-playground__editor">
        <h3>Code Editor</h3>
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className="code-playground__textarea"
          rows={10}
          placeholder={`// Try editing the ${component.name} component code here...`}
        />
      </div>
      
      <div className="code-playground__preview">
        <h3>Preview</h3>
        <div className="code-playground__preview-content">
          <div className="code-playground__note">
            Interactive preview coming soon! For now, copy the code to your project to test.
          </div>
          {error && (
            <div className="code-playground__error">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Code Block
interface CodeBlockProps {
  code: string;
  language: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block">
      <div className="code-block__header">
        <span className="code-block__language">{language}</span>
        <button
          onClick={copyToClipboard}
          className="code-block__copy"
          title="Copy to clipboard"
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>
      <pre className="code-block__content">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default ComponentDocs;