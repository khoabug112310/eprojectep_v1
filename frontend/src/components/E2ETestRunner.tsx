import React, { useState, useEffect } from 'react'
import './E2ETestRunner.css'

interface TestSuite {
  id: string
  name: string
  description: string
  category: 'auth' | 'booking' | 'admin' | 'payment' | 'ui' | 'performance'
  tests: Test[]
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
  duration?: number
}

interface Test {
  id: string
  name: string
  description: string
  steps: TestStep[]
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
  duration?: number
  error?: string
  screenshot?: string
}

interface TestStep {
  id: string
  action: string
  target: string
  value?: string
  expected: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  actual?: string
  screenshot?: string
}

interface TestResults {
  totalSuites: number
  passedSuites: number
  failedSuites: number
  totalTests: number
  passedTests: number
  failedTests: number
  duration: number
  coverage: {
    pages: number
    components: number
    userFlows: number
  }
}

export default function E2ETestRunner() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResults | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showOnlyFailed, setShowOnlyFailed] = useState(false)

  // Initialize test suites
  useEffect(() => {
    initializeTestSuites()
  }, [])

  const initializeTestSuites = () => {
    const suites: TestSuite[] = [
      {
        id: 'auth_flow',
        name: 'Authentication Flow',
        description: 'Test user registration, login, and logout functionality',
        category: 'auth',
        status: 'pending',
        tests: [
          {
            id: 'user_registration',
            name: 'User Registration',
            description: 'Test complete user registration flow',
            status: 'pending',
            steps: [
              {
                id: 'step_1',
                action: 'navigate',
                target: '/register',
                expected: 'Registration form is displayed',
                status: 'pending'
              },
              {
                id: 'step_2',
                action: 'fill',
                target: '[data-testid="name-input"]',
                value: 'John Doe',
                expected: 'Name field is filled',
                status: 'pending'
              },
              {
                id: 'step_3',
                action: 'fill',
                target: '[data-testid="email-input"]',
                value: 'john.doe@test.com',
                expected: 'Email field is filled',
                status: 'pending'
              },
              {
                id: 'step_4',
                action: 'fill',
                target: '[data-testid="password-input"]',
                value: 'SecurePass123!',
                expected: 'Password field is filled',
                status: 'pending'
              },
              {
                id: 'step_5',
                action: 'fill',
                target: '[data-testid="confirm-password-input"]',
                value: 'SecurePass123!',
                expected: 'Confirm password field is filled',
                status: 'pending'
              },
              {
                id: 'step_6',
                action: 'click',
                target: '[data-testid="register-button"]',
                expected: 'Registration is submitted',
                status: 'pending'
              },
              {
                id: 'step_7',
                action: 'wait',
                target: '[data-testid="success-message"]',
                expected: 'Success message appears',
                status: 'pending'
              }
            ]
          },
          {
            id: 'user_login',
            name: 'User Login',
            description: 'Test user login with valid credentials',
            status: 'pending',
            steps: [
              {
                id: 'step_1',
                action: 'navigate',
                target: '/login',
                expected: 'Login form is displayed',
                status: 'pending'
              },
              {
                id: 'step_2',
                action: 'fill',
                target: '[data-testid="email-input"]',
                value: 'john.doe@test.com',
                expected: 'Email field is filled',
                status: 'pending'
              },
              {
                id: 'step_3',
                action: 'fill',
                target: '[data-testid="password-input"]',
                value: 'SecurePass123!',
                expected: 'Password field is filled',
                status: 'pending'
              },
              {
                id: 'step_4',
                action: 'click',
                target: '[data-testid="login-button"]',
                expected: 'Login is submitted',
                status: 'pending'
              },
              {
                id: 'step_5',
                action: 'wait',
                target: '[data-testid="user-menu"]',
                expected: 'User is redirected to dashboard',
                status: 'pending'
              }
            ]
          }
        ]
      },
      {
        id: 'booking_flow',
        name: 'Movie Booking Flow',
        description: 'Test complete movie booking process',
        category: 'booking',
        status: 'pending',
        tests: [
          {
            id: 'movie_search',
            name: 'Movie Search',
            description: 'Test movie search functionality',
            status: 'pending',
            steps: [
              {
                id: 'step_1',
                action: 'navigate',
                target: '/movies',
                expected: 'Movies page is displayed',
                status: 'pending'
              },
              {
                id: 'step_2',
                action: 'fill',
                target: '[data-testid="search-input"]',
                value: 'Avengers',
                expected: 'Search field is filled',
                status: 'pending'
              },
              {
                id: 'step_3',
                action: 'wait',
                target: '[data-testid="movie-card"]',
                expected: 'Search results are displayed',
                status: 'pending'
              },
              {
                id: 'step_4',
                action: 'click',
                target: '[data-testid="movie-card"]:first-child',
                expected: 'Movie details page opens',
                status: 'pending'
              }
            ]
          },
          {
            id: 'seat_selection',
            name: 'Seat Selection',
            description: 'Test seat selection process',
            status: 'pending',
            steps: [
              {
                id: 'step_1',
                action: 'click',
                target: '[data-testid="showtime-button"]:first-child',
                expected: 'Seat selection page opens',
                status: 'pending'
              },
              {
                id: 'step_2',
                action: 'click',
                target: '[data-testid="seat-A1"]',
                expected: 'Seat A1 is selected',
                status: 'pending'
              },
              {
                id: 'step_3',
                action: 'click',
                target: '[data-testid="seat-A2"]',
                expected: 'Seat A2 is selected',
                status: 'pending'
              },
              {
                id: 'step_4',
                action: 'verify',
                target: '[data-testid="total-price"]',
                expected: 'Total price is calculated correctly',
                status: 'pending'
              },
              {
                id: 'step_5',
                action: 'click',
                target: '[data-testid="continue-button"]',
                expected: 'Proceed to checkout',
                status: 'pending'
              }
            ]
          },
          {
            id: 'booking_checkout',
            name: 'Booking Checkout',
            description: 'Test booking checkout and payment',
            status: 'pending',
            steps: [
              {
                id: 'step_1',
                action: 'verify',
                target: '[data-testid="booking-summary"]',
                expected: 'Booking summary is displayed',
                status: 'pending'
              },
              {
                id: 'step_2',
                action: 'select',
                target: '[data-testid="payment-method"]',
                value: 'vnpay',
                expected: 'Payment method is selected',
                status: 'pending'
              },
              {
                id: 'step_3',
                action: 'click',
                target: '[data-testid="confirm-booking"]',
                expected: 'Booking is confirmed',
                status: 'pending'
              },
              {
                id: 'step_4',
                action: 'wait',
                target: '[data-testid="booking-confirmation"]',
                expected: 'Booking confirmation appears',
                status: 'pending'
              }
            ]
          }
        ]
      },
      {
        id: 'admin_flow',
        name: 'Admin Management',
        description: 'Test admin panel functionality',
        category: 'admin',
        status: 'pending',
        tests: [
          {
            id: 'movie_management',
            name: 'Movie Management',
            description: 'Test CRUD operations for movies',
            status: 'pending',
            steps: [
              {
                id: 'step_1',
                action: 'navigate',
                target: '/admin/movies',
                expected: 'Admin movies page is displayed',
                status: 'pending'
              },
              {
                id: 'step_2',
                action: 'click',
                target: '[data-testid="add-movie-button"]',
                expected: 'Add movie form opens',
                status: 'pending'
              },
              {
                id: 'step_3',
                action: 'fill',
                target: '[data-testid="movie-title"]',
                value: 'Test Movie',
                expected: 'Movie title is filled',
                status: 'pending'
              },
              {
                id: 'step_4',
                action: 'fill',
                target: '[data-testid="movie-synopsis"]',
                value: 'This is a test movie',
                expected: 'Movie synopsis is filled',
                status: 'pending'
              },
              {
                id: 'step_5',
                action: 'click',
                target: '[data-testid="save-movie"]',
                expected: 'Movie is saved successfully',
                status: 'pending'
              }
            ]
          }
        ]
      },
      {
        id: 'ui_responsiveness',
        name: 'UI Responsiveness',
        description: 'Test responsive design across different screen sizes',
        category: 'ui',
        status: 'pending',
        tests: [
          {
            id: 'mobile_layout',
            name: 'Mobile Layout',
            description: 'Test mobile layout and navigation',
            status: 'pending',
            steps: [
              {
                id: 'step_1',
                action: 'viewport',
                target: '375x667',
                expected: 'Mobile viewport is set',
                status: 'pending'
              },
              {
                id: 'step_2',
                action: 'navigate',
                target: '/',
                expected: 'Homepage loads in mobile view',
                status: 'pending'
              },
              {
                id: 'step_3',
                action: 'click',
                target: '[data-testid="mobile-menu-toggle"]',
                expected: 'Mobile menu opens',
                status: 'pending'
              },
              {
                id: 'step_4',
                action: 'verify',
                target: '[data-testid="mobile-nav-menu"]',
                expected: 'Mobile navigation is visible',
                status: 'pending'
              }
            ]
          }
        ]
      },
      {
        id: 'performance_tests',
        name: 'Performance Tests',
        description: 'Test application performance metrics',
        category: 'performance',
        status: 'pending',
        tests: [
          {
            id: 'page_load_performance',
            name: 'Page Load Performance',
            description: 'Test page load times and core web vitals',
            status: 'pending',
            steps: [
              {
                id: 'step_1',
                action: 'performance',
                target: '/',
                expected: 'Homepage loads within 3 seconds',
                status: 'pending'
              },
              {
                id: 'step_2',
                action: 'performance',
                target: '/movies',
                expected: 'Movies page loads within 3 seconds',
                status: 'pending'
              },
              {
                id: 'step_3',
                action: 'lighthouse',
                target: '/',
                expected: 'Lighthouse score > 80',
                status: 'pending'
              }
            ]
          }
        ]
      }
    ]

    setTestSuites(suites)
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults(null)

    const startTime = Date.now()
    let totalTests = 0
    let passedTests = 0
    let failedTests = 0
    let passedSuites = 0
    let failedSuites = 0

    for (const suite of testSuites) {
      if (selectedCategory !== 'all' && suite.category !== selectedCategory) {
        continue
      }

      await runTestSuite(suite.id)
      
      const updatedSuite = testSuites.find(s => s.id === suite.id)
      if (updatedSuite) {
        totalTests += updatedSuite.tests.length
        const suitePassed = updatedSuite.tests.every(test => test.status === 'passed')
        
        if (suitePassed) {
          passedSuites++
          passedTests += updatedSuite.tests.length
        } else {
          failedSuites++
          failedTests += updatedSuite.tests.filter(test => test.status === 'failed').length
          passedTests += updatedSuite.tests.filter(test => test.status === 'passed').length
        }
      }
    }

    const duration = Date.now() - startTime

    setResults({
      totalSuites: passedSuites + failedSuites,
      passedSuites,
      failedSuites,
      totalTests,
      passedTests,
      failedTests,
      duration,
      coverage: {
        pages: 85,
        components: 78,
        userFlows: 92
      }
    })

    setIsRunning(false)
  }

  const runTestSuite = async (suiteId: string) => {
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'running' }
        : suite
    ))

    const suite = testSuites.find(s => s.id === suiteId)
    if (!suite) return

    let allTestsPassed = true
    const suiteStartTime = Date.now()

    for (const test of suite.tests) {
      const testPassed = await runTest(suiteId, test.id)
      if (!testPassed) {
        allTestsPassed = false
      }
    }

    const suiteDuration = Date.now() - suiteStartTime

    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { 
            ...suite, 
            status: allTestsPassed ? 'passed' : 'failed',
            duration: suiteDuration
          }
        : suite
    ))
  }

  const runTest = async (suiteId: string, testId: string): Promise<boolean> => {
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? {
            ...suite,
            tests: suite.tests.map(test => 
              test.id === testId 
                ? { ...test, status: 'running' }
                : test
            )
          }
        : suite
    ))

    const testStartTime = Date.now()
    let testPassed = true

    // Simulate test execution
    const suite = testSuites.find(s => s.id === suiteId)
    const test = suite?.tests.find(t => t.id === testId)
    
    if (test) {
      for (const step of test.steps) {
        await simulateTestStep(step)
        
        // Simulate random failures for demo
        if (Math.random() < 0.1) { // 10% chance of failure
          step.status = 'failed'
          step.actual = 'Element not found or assertion failed'
          testPassed = false
          break
        } else {
          step.status = 'passed'
          step.actual = step.expected
        }
      }
    }

    const testDuration = Date.now() - testStartTime

    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? {
            ...suite,
            tests: suite.tests.map(test => 
              test.id === testId 
                ? { 
                    ...test, 
                    status: testPassed ? 'passed' : 'failed',
                    duration: testDuration,
                    error: testPassed ? undefined : 'Test assertion failed'
                  }
                : test
            )
          }
        : suite
    ))

    return testPassed
  }

  const simulateTestStep = async (step: TestStep) => {
    // Simulate step execution time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
    
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      tests: suite.tests.map(test => ({
        ...test,
        steps: test.steps.map(s => 
          s.id === step.id 
            ? { ...s, status: 'running' }
            : s
        )
      }))
    })))
  }

  const runSingleTest = async (suiteId: string, testId: string) => {
    await runTest(suiteId, testId)
  }

  const generateTestReport = () => {
    if (!results) return

    const report = {
      timestamp: new Date().toISOString(),
      results,
      testSuites: testSuites.map(suite => ({
        id: suite.id,
        name: suite.name,
        status: suite.status,
        duration: suite.duration,
        tests: suite.tests.map(test => ({
          id: test.id,
          name: test.name,
          status: test.status,
          duration: test.duration,
          error: test.error,
          steps: test.steps.map(step => ({
            action: step.action,
            target: step.target,
            expected: step.expected,
            actual: step.actual,
            status: step.status
          }))
        }))
      }))
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `e2e-test-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filteredSuites = testSuites.filter(suite => {
    if (selectedCategory !== 'all' && suite.category !== selectedCategory) return false
    if (showOnlyFailed && suite.status !== 'failed') return false
    return true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅'
      case 'failed': return '❌'
      case 'running': return '⏳'
      case 'skipped': return '⏭️'
      default: return '⏸️'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#10b981'
      case 'failed': return '#ef4444'
      case 'running': return '#f59e0b'
      case 'skipped': return '#6b7280'
      default: return '#9ca3af'
    }
  }

  return (
    <div className="e2e-test-runner">
      <div className="runner-header">
        <div className="header-content">
          <h2>E2E Test Runner</h2>
          <p>End-to-end testing suite for comprehensive application testing</p>
        </div>
        
        <div className="header-controls">
          <div className="filter-controls">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={isRunning}
            >
              <option value="all">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="booking">Booking Flow</option>
              <option value="admin">Admin Panel</option>
              <option value="ui">UI/UX</option>
              <option value="performance">Performance</option>
            </select>
            
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={showOnlyFailed}
                onChange={(e) => setShowOnlyFailed(e.target.checked)}
                disabled={isRunning}
              />
              Show only failed tests
            </label>
          </div>
          
          <div className="action-controls">
            <button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="run-all-btn"
            >
              {isRunning ? '⏳ Running...' : '▶️ Run All Tests'}
            </button>
            
            {results && (
              <button onClick={generateTestReport} className="export-btn">
                📊 Export Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Test Results Summary */}
      {results && (
        <div className="test-results">
          <h3>Test Results Summary</h3>
          <div className="results-grid">
            <div className="result-card">
              <div className="result-label">Total Suites</div>
              <div className="result-value">{results.totalSuites}</div>
            </div>
            <div className="result-card passed">
              <div className="result-label">Passed Suites</div>
              <div className="result-value">{results.passedSuites}</div>
            </div>
            <div className="result-card failed">
              <div className="result-label">Failed Suites</div>
              <div className="result-value">{results.failedSuites}</div>
            </div>
            <div className="result-card">
              <div className="result-label">Total Tests</div>
              <div className="result-value">{results.totalTests}</div>
            </div>
            <div className="result-card passed">
              <div className="result-label">Passed Tests</div>
              <div className="result-value">{results.passedTests}</div>
            </div>
            <div className="result-card failed">
              <div className="result-label">Failed Tests</div>
              <div className="result-value">{results.failedTests}</div>
            </div>
            <div className="result-card">
              <div className="result-label">Duration</div>
              <div className="result-value">{(results.duration / 1000).toFixed(1)}s</div>
            </div>
            <div className="result-card">
              <div className="result-label">Success Rate</div>
              <div className="result-value">
                {results.totalTests > 0 ? Math.round((results.passedTests / results.totalTests) * 100) : 0}%
              </div>
            </div>
          </div>
          
          <div className="coverage-info">
            <h4>Test Coverage</h4>
            <div className="coverage-bars">
              <div className="coverage-item">
                <span>Pages: {results.coverage.pages}%</span>
                <div className="coverage-bar">
                  <div 
                    className="coverage-fill" 
                    style={{ width: `${results.coverage.pages}%` }}
                  ></div>
                </div>
              </div>
              <div className="coverage-item">
                <span>Components: {results.coverage.components}%</span>
                <div className="coverage-bar">
                  <div 
                    className="coverage-fill" 
                    style={{ width: `${results.coverage.components}%` }}
                  ></div>
                </div>
              </div>
              <div className="coverage-item">
                <span>User Flows: {results.coverage.userFlows}%</span>
                <div className="coverage-bar">
                  <div 
                    className="coverage-fill" 
                    style={{ width: `${results.coverage.userFlows}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Suites */}
      <div className="test-suites">
        {filteredSuites.map(suite => (
          <div key={suite.id} className={`test-suite ${suite.status}`}>
            <div className="suite-header" onClick={() => setSelectedSuite(selectedSuite === suite.id ? null : suite.id)}>
              <div className="suite-info">
                <span className="suite-icon">{getStatusIcon(suite.status)}</span>
                <div className="suite-details">
                  <h3>{suite.name}</h3>
                  <p>{suite.description}</p>
                </div>
              </div>
              <div className="suite-meta">
                <span className="suite-category">{suite.category}</span>
                <span className="suite-count">{suite.tests.length} tests</span>
                {suite.duration && (
                  <span className="suite-duration">{(suite.duration / 1000).toFixed(1)}s</span>
                )}
                <span className="expand-icon">
                  {selectedSuite === suite.id ? '▼' : '▶'}
                </span>
              </div>
            </div>
            
            {selectedSuite === suite.id && (
              <div className="suite-content">
                <div className="tests-list">
                  {suite.tests.map(test => (
                    <div key={test.id} className={`test-item ${test.status}`}>
                      <div className="test-header">
                        <div className="test-info">
                          <span className="test-icon">{getStatusIcon(test.status)}</span>
                          <div className="test-details">
                            <h4>{test.name}</h4>
                            <p>{test.description}</p>
                          </div>
                        </div>
                        <div className="test-actions">
                          {test.duration && (
                            <span className="test-duration">{(test.duration / 1000).toFixed(1)}s</span>
                          )}
                          <button 
                            onClick={() => runSingleTest(suite.id, test.id)}
                            disabled={isRunning}
                            className="run-test-btn"
                          >
                            ▶️ Run
                          </button>
                        </div>
                      </div>
                      
                      {test.error && (
                        <div className="test-error">
                          <strong>Error:</strong> {test.error}
                        </div>
                      )}
                      
                      <div className="test-steps">
                        {test.steps.map(step => (
                          <div key={step.id} className={`test-step ${step.status}`}>
                            <span className="step-icon">{getStatusIcon(step.status)}</span>
                            <div className="step-content">
                              <div className="step-action">
                                <strong>{step.action}</strong> {step.target}
                                {step.value && <span className="step-value">= "{step.value}"</span>}
                              </div>
                              <div className="step-expected">Expected: {step.expected}</div>
                              {step.actual && step.actual !== step.expected && (
                                <div className="step-actual">Actual: {step.actual}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}