// Interactive User Guide for CineBook
// Provides step-by-step tutorials and help documentation

import React, { useState, useEffect, useCallback, useMemo } from 'react';

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  image?: string;
  video?: string;
  targetElement?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
  actions?: GuideAction[];
  prerequisites?: string[];
  estimatedTime?: number; // in minutes
}

export interface GuideAction {
  type: 'click' | 'input' | 'navigate' | 'wait';
  target?: string;
  value?: string;
  description: string;
}

export interface GuideSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  steps: GuideStep[];
  category: 'getting-started' | 'booking' | 'account' | 'admin' | 'troubleshooting';
}

export interface UserProgress {
  sectionId: string;
  stepId: string;
  completed: boolean;
  startedAt: number;
  completedAt?: number;
}

interface UserGuideProps {
  sections?: GuideSection[];
  theme?: 'light' | 'dark';
  showProgress?: boolean;
  enableHighlighting?: boolean;
  onStepComplete?: (sectionId: string, stepId: string) => void;
  onSectionComplete?: (sectionId: string) => void;
  className?: string;
}

const DEFAULT_SECTIONS: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with CineBook',
    description: 'Learn the basics of using CineBook to book movie tickets',
    icon: '🎬',
    difficulty: 'beginner',
    estimatedTime: 10,
    category: 'getting-started',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to CineBook',
        description: 'Get familiar with the CineBook interface and main features',
        content: (
          <div>
            <h3>Welcome to CineBook! 🎬</h3>
            <p>CineBook is your one-stop platform for booking movie tickets online. Here's what you can do:</p>
            <ul>
              <li>Browse current and upcoming movies</li>
              <li>Check showtimes at various theaters</li>
              <li>Select your preferred seats</li>
              <li>Make secure payments online</li>
              <li>Download or print your e-tickets</li>
            </ul>
            <p>Let's get started with your first booking!</p>
          </div>
        ),
        estimatedTime: 2
      },
      {
        id: 'navigation',
        title: 'Navigating the Website',
        description: 'Learn how to navigate through different sections',
        content: (
          <div>
            <h3>Website Navigation</h3>
            <p>The CineBook website is organized into several main sections:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h4>🏠 Home</h4>
                <p>Featured movies and quick booking</p>
              </div>
              <div style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h4>🎬 Movies</h4>
                <p>Browse all available movies</p>
              </div>
              <div style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h4>🏢 Theaters</h4>
                <p>Find theater locations and info</p>
              </div>
              <div style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h4>👤 Profile</h4>
                <p>Manage your account and bookings</p>
              </div>
            </div>
          </div>
        ),
        targetElement: '.main-navigation',
        position: 'bottom',
        estimatedTime: 3
      }
    ]
  },
  {
    id: 'booking-process',
    title: 'How to Book Movie Tickets',
    description: 'Step-by-step guide to booking your first movie ticket',
    icon: '🎫',
    difficulty: 'beginner',
    estimatedTime: 15,
    category: 'booking',
    steps: [
      {
        id: 'select-movie',
        title: 'Select a Movie',
        description: 'Choose the movie you want to watch',
        content: (
          <div>
            <h3>Step 1: Choose Your Movie</h3>
            <p>Start by browsing through our collection of movies:</p>
            <ol>
              <li>Go to the <strong>Movies</strong> section from the main menu</li>
              <li>Use filters to narrow down your choices:
                <ul>
                  <li>Genre (Action, Comedy, Drama, etc.)</li>
                  <li>Language (English, Vietnamese, etc.)</li>
                  <li>Rating (suitable for your age group)</li>
                </ul>
              </li>
              <li>Click on any movie poster to see detailed information</li>
              <li>Read the synopsis, cast info, and user reviews</li>
              <li>Watch the trailer if available</li>
              <li>Click <strong>"Book Tickets"</strong> when you've made your choice</li>
            </ol>
          </div>
        ),
        targetElement: '.movie-card',
        position: 'right',
        estimatedTime: 5,
        actions: [
          { type: 'navigate', target: '/movies', description: 'Go to Movies page' },
          { type: 'click', target: '.movie-card', description: 'Click on a movie' }
        ]
      },
      {
        id: 'select-showtime',
        title: 'Choose Showtime and Theater',
        description: 'Pick your preferred showtime and theater location',
        content: (
          <div>
            <h3>Step 2: Select Showtime & Theater</h3>
            <p>After selecting a movie, you'll see available showtimes:</p>
            <ol>
              <li><strong>Choose Date:</strong> Select the date you want to watch the movie</li>
              <li><strong>Select Theater:</strong> Pick a theater location convenient for you</li>
              <li><strong>Pick Time:</strong> Choose from available showtime slots</li>
              <li><strong>Check Pricing:</strong> Different seat types have different prices:
                <ul>
                  <li>🟨 <strong>Gold Seats:</strong> Standard seating</li>
                  <li>🟦 <strong>Platinum Seats:</strong> Premium seating with extra legroom</li>
                  <li>🟫 <strong>Box Seats:</strong> VIP experience with luxury amenities</li>
                </ul>
              </li>
              <li>Click <strong>"Continue"</strong> to proceed to seat selection</li>
            </ol>
          </div>
        ),
        targetElement: '.showtime-selector',
        position: 'bottom',
        estimatedTime: 3
      },
      {
        id: 'select-seats',
        title: 'Choose Your Seats',
        description: 'Pick your preferred seats from the theater layout',
        content: (
          <div>
            <h3>Step 3: Select Your Seats</h3>
            <p>Now choose your seats from the interactive theater map:</p>
            <ol>
              <li><strong>Understand the Layout:</strong>
                <ul>
                  <li>🟩 Available seats (click to select)</li>
                  <li>🟥 Occupied seats (cannot be selected)</li>
                  <li>🟪 Your selected seats</li>
                  <li>The screen is at the front of the theater</li>
                </ul>
              </li>
              <li><strong>Select Seats:</strong> Click on available seats to select them</li>
              <li><strong>Deselect:</strong> Click selected seats again to deselect</li>
              <li><strong>Best Seats:</strong> Middle rows with center seats offer the best viewing experience</li>
              <li><strong>Check Total:</strong> Your total price updates automatically</li>
              <li>Click <strong>"Continue to Payment"</strong> when satisfied with your selection</li>
            </ol>
          </div>
        ),
        targetElement: '.seat-map',
        position: 'top',
        estimatedTime: 4
      },
      {
        id: 'payment',
        title: 'Complete Payment',
        description: 'Finalize your booking with secure payment',
        content: (
          <div>
            <h3>Step 4: Complete Payment</h3>
            <p>Review your booking details and make payment:</p>
            <ol>
              <li><strong>Review Booking:</strong> Double-check all details:
                <ul>
                  <li>Movie title and showtime</li>
                  <li>Theater location</li>
                  <li>Selected seats</li>
                  <li>Total amount</li>
                </ul>
              </li>
              <li><strong>Contact Information:</strong> Ensure your details are correct</li>
              <li><strong>Payment Method:</strong> Choose your preferred payment option</li>
              <li><strong>Apply Discounts:</strong> Enter promo codes if you have any</li>
              <li><strong>Terms & Conditions:</strong> Read and accept the booking terms</li>
              <li>Click <strong>"Pay Now"</strong> to complete your booking</li>
            </ol>
          </div>
        ),
        targetElement: '.payment-form',
        position: 'left',
        estimatedTime: 3
      }
    ]
  },
  {
    id: 'account-management',
    title: 'Managing Your Account',
    description: 'Learn how to manage your profile and view booking history',
    icon: '👤',
    difficulty: 'beginner',
    estimatedTime: 8,
    category: 'account',
    steps: [
      {
        id: 'profile-setup',
        title: 'Setting Up Your Profile',
        description: 'Complete your profile information for a better experience',
        content: (
          <div>
            <h3>Profile Setup</h3>
            <p>Having a complete profile enhances your CineBook experience:</p>
            <ul>
              <li><strong>Personal Information:</strong> Name, email, phone number</li>
              <li><strong>Preferences:</strong> Favorite genres, preferred language</li>
              <li><strong>Location:</strong> Default city for movie listings</li>
              <li><strong>Notifications:</strong> Choose how you want to be notified</li>
            </ul>
          </div>
        ),
        estimatedTime: 4
      },
      {
        id: 'booking-history',
        title: 'Viewing Booking History',
        description: 'Access your past and upcoming bookings',
        content: (
          <div>
            <h3>Booking History</h3>
            <p>Keep track of all your movie bookings:</p>
            <ul>
              <li><strong>Upcoming Bookings:</strong> Shows not yet watched</li>
              <li><strong>Past Bookings:</strong> Your movie history</li>
              <li><strong>Download Tickets:</strong> Get your e-tickets anytime</li>
              <li><strong>Cancel Bookings:</strong> Cancel if plans change (terms apply)</li>
            </ul>
          </div>
        ),
        estimatedTime: 4
      }
    ]
  }
];

export function UserGuide({
  sections = DEFAULT_SECTIONS,
  theme = 'light',
  showProgress = true,
  enableHighlighting = true,
  onStepComplete,
  onSectionComplete,
  className = ''
}: UserGuideProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cinebook-guide-progress');
    if (saved) {
      try {
        setUserProgress(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load guide progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = useCallback((progress: UserProgress[]) => {
    try {
      localStorage.setItem('cinebook-guide-progress', JSON.stringify(progress));
      setUserProgress(progress);
    } catch (error) {
      console.warn('Failed to save guide progress:', error);
    }
  }, []);

  // Mark step as complete
  const completeStep = useCallback((sectionId: string, stepId: string) => {
    const newProgress = [...userProgress];
    const existingIndex = newProgress.findIndex(
      p => p.sectionId === sectionId && p.stepId === stepId
    );

    const progressItem: UserProgress = {
      sectionId,
      stepId,
      completed: true,
      startedAt: existingIndex >= 0 ? newProgress[existingIndex].startedAt : Date.now(),
      completedAt: Date.now()
    };

    if (existingIndex >= 0) {
      newProgress[existingIndex] = progressItem;
    } else {
      newProgress.push(progressItem);
    }

    saveProgress(newProgress);
    onStepComplete?.(sectionId, stepId);

    // Check if section is complete
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const sectionSteps = section.steps.map(s => s.id);
      const completedSteps = newProgress
        .filter(p => p.sectionId === sectionId && p.completed)
        .map(p => p.stepId);

      if (sectionSteps.every(stepId => completedSteps.includes(stepId))) {
        onSectionComplete?.(sectionId);
      }
    }
  }, [userProgress, sections, saveProgress, onStepComplete, onSectionComplete]);

  // Get step progress
  const getStepProgress = useCallback((sectionId: string, stepId: string): UserProgress | null => {
    return userProgress.find(p => p.sectionId === sectionId && p.stepId === stepId) || null;
  }, [userProgress]);

  // Get section progress percentage
  const getSectionProgress = useCallback((sectionId: string): number => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return 0;

    const totalSteps = section.steps.length;
    const completedSteps = userProgress.filter(
      p => p.sectionId === sectionId && p.completed
    ).length;

    return Math.round((completedSteps / totalSteps) * 100);
  }, [sections, userProgress]);

  // Filter sections
  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           section.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [sections, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(sections.map(s => s.category)));
    return ['all', ...cats];
  }, [sections]);

  // Get current section and step
  const currentSection = selectedSection ? sections.find(s => s.id === selectedSection) : null;
  const currentStepData = currentStep && currentSection ? 
    currentSection.steps.find(s => s.id === currentStep) : null;

  return (
    <div className={`user-guide user-guide--${theme} ${className}`}>
      {!selectedSection ? (
        // Section List View
        <div className="user-guide__overview">
          <div className="user-guide__header">
            <h1 className="user-guide__title">
              📚 CineBook User Guide
            </h1>
            <p className="user-guide__subtitle">
              Learn how to make the most of your movie booking experience
            </p>
          </div>

          {/* Search and Filter */}
          <div className="user-guide__controls">
            <div className="user-guide__search">
              <input
                type="text"
                placeholder="Search guides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="user-guide__search-input"
              />
              <span className="user-guide__search-icon">🔍</span>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="user-guide__category-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : 
                   category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Section Grid */}
          <div className="user-guide__sections">
            {filteredSections.map(section => (
              <GuideCard
                key={section.id}
                section={section}
                progress={getSectionProgress(section.id)}
                onSelect={() => setSelectedSection(section.id)}
                showProgress={showProgress}
              />
            ))}
          </div>

          {filteredSections.length === 0 && (
            <div className="user-guide__empty">
              <div className="user-guide__empty-icon">📖</div>
              <h3>No guides found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      ) : (
        // Step-by-Step View
        <StepByStepGuide
          section={currentSection!}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onComplete={completeStep}
          onBack={() => {
            setSelectedSection(null);
            setCurrentStep(null);
          }}
          getStepProgress={getStepProgress}
          enableHighlighting={enableHighlighting}
          theme={theme}
        />
      )}
    </div>
  );
}

// Guide Card Component
interface GuideCardProps {
  section: GuideSection;
  progress: number;
  onSelect: () => void;
  showProgress: boolean;
}

function GuideCard({ section, progress, onSelect, showProgress }: GuideCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    return colors[difficulty as keyof typeof colors] || '#6b7280';
  };

  return (
    <div className="guide-card" onClick={onSelect}>
      <div className="guide-card__header">
        <div className="guide-card__icon">{section.icon}</div>
        <div className="guide-card__meta">
          <span 
            className="guide-card__difficulty"
            style={{ backgroundColor: getDifficultyColor(section.difficulty) }}
          >
            {section.difficulty}
          </span>
          <span className="guide-card__time">
            ⏱️ {section.estimatedTime} min
          </span>
        </div>
      </div>

      <div className="guide-card__content">
        <h3 className="guide-card__title">{section.title}</h3>
        <p className="guide-card__description">{section.description}</p>
        
        <div className="guide-card__stats">
          <span className="guide-card__steps">
            {section.steps.length} steps
          </span>
        </div>
      </div>

      {showProgress && (
        <div className="guide-card__progress">
          <div className="guide-card__progress-bar">
            <div 
              className="guide-card__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="guide-card__progress-text">{progress}% complete</span>
        </div>
      )}
    </div>
  );
}

// Step-by-Step Guide Component
interface StepByStepGuideProps {
  section: GuideSection;
  currentStep: string | null;
  onStepChange: (stepId: string | null) => void;
  onComplete: (sectionId: string, stepId: string) => void;
  onBack: () => void;
  getStepProgress: (sectionId: string, stepId: string) => UserProgress | null;
  enableHighlighting: boolean;
  theme: string;
}

function StepByStepGuide({
  section,
  currentStep,
  onStepChange,
  onComplete,
  onBack,
  getStepProgress,
  enableHighlighting,
  theme
}: StepByStepGuideProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentStepIndex = currentStep ? 
    section.steps.findIndex(s => s.id === currentStep) : -1;
  
  const currentStepData = currentStep ? 
    section.steps.find(s => s.id === currentStep) : null;

  // Auto-select first step if none selected
  useEffect(() => {
    if (!currentStep && section.steps.length > 0) {
      onStepChange(section.steps[0].id);
    }
  }, [currentStep, section.steps, onStepChange]);

  const nextStep = () => {
    if (currentStepIndex < section.steps.length - 1) {
      onStepChange(section.steps[currentStepIndex + 1].id);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      onStepChange(section.steps[currentStepIndex - 1].id);
    }
  };

  const markAsComplete = () => {
    if (currentStep) {
      onComplete(section.id, currentStep);
    }
  };

  return (
    <div className="step-guide">
      {/* Header */}
      <div className="step-guide__header">
        <button className="step-guide__back" onClick={onBack}>
          ← Back to Guides
        </button>
        <div className="step-guide__title">
          <span className="step-guide__icon">{section.icon}</span>
          <h1>{section.title}</h1>
        </div>
        <button 
          className="step-guide__sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      <div className="step-guide__content">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="step-guide__sidebar">
            <div className="step-guide__progress">
              <h3>Progress</h3>
              <div className="step-guide__progress-bar">
                <div 
                  className="step-guide__progress-fill"
                  style={{ 
                    width: `${((currentStepIndex + 1) / section.steps.length) * 100}%` 
                  }}
                />
              </div>
              <span>
                Step {currentStepIndex + 1} of {section.steps.length}
              </span>
            </div>

            <div className="step-guide__steps">
              <h3>Steps</h3>
              {section.steps.map((step, index) => {
                const progress = getStepProgress(section.id, step.id);
                const isActive = step.id === currentStep;
                const isCompleted = progress?.completed || false;

                return (
                  <div
                    key={step.id}
                    className={`step-guide__step-item ${
                      isActive ? 'step-guide__step-item--active' : ''
                    } ${isCompleted ? 'step-guide__step-item--completed' : ''}`}
                    onClick={() => onStepChange(step.id)}
                  >
                    <div className="step-guide__step-number">
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <div className="step-guide__step-info">
                      <h4>{step.title}</h4>
                      {step.estimatedTime && (
                        <span className="step-guide__step-time">
                          {step.estimatedTime} min
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="step-guide__main">
          {currentStepData && (
            <StepContent
              step={currentStepData}
              section={section}
              isCompleted={!!getStepProgress(section.id, currentStepData.id)?.completed}
              onMarkComplete={markAsComplete}
              onNext={nextStep}
              onPrev={prevStep}
              hasPrev={currentStepIndex > 0}
              hasNext={currentStepIndex < section.steps.length - 1}
              enableHighlighting={enableHighlighting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Step Content Component
interface StepContentProps {
  step: GuideStep;
  section: GuideSection;
  isCompleted: boolean;
  onMarkComplete: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  enableHighlighting: boolean;
}

function StepContent({
  step,
  section,
  isCompleted,
  onMarkComplete,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
  enableHighlighting
}: StepContentProps) {
  // Highlight target element if specified
  useEffect(() => {
    if (enableHighlighting && step.targetElement) {
      const element = document.querySelector(step.targetElement);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('guide-highlight');
        
        return () => {
          element.classList.remove('guide-highlight');
        };
      }
    }
  }, [step.targetElement, enableHighlighting]);

  return (
    <div className="step-content">
      <div className="step-content__header">
        <h2>{step.title}</h2>
        <p className="step-content__description">{step.description}</p>
        {step.estimatedTime && (
          <div className="step-content__time">
            ⏱️ Estimated time: {step.estimatedTime} minutes
          </div>
        )}
      </div>

      <div className="step-content__body">
        {step.content}
        
        {step.image && (
          <div className="step-content__media">
            <img src={step.image} alt={step.title} />
          </div>
        )}
        
        {step.video && (
          <div className="step-content__media">
            <video controls>
              <source src={step.video} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {step.actions && step.actions.length > 0 && (
          <div className="step-content__actions">
            <h4>Try It Yourself:</h4>
            <ol>
              {step.actions.map((action, index) => (
                <li key={index} className="step-content__action">
                  <span className="step-content__action-type">
                    {action.type.toUpperCase()}
                  </span>
                  {action.description}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="step-content__footer">
        <div className="step-content__navigation">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="step-content__nav-btn step-content__nav-btn--prev"
          >
            ← Previous
          </button>

          <button
            onClick={onMarkComplete}
            className={`step-content__complete-btn ${
              isCompleted ? 'step-content__complete-btn--completed' : ''
            }`}
          >
            {isCompleted ? '✓ Completed' : 'Mark as Complete'}
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="step-content__nav-btn step-content__nav-btn--next"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserGuide;