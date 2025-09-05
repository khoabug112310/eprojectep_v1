// Form Security Middleware Demo Component for CineBook
// Demonstrates usage of FormSecurityMiddleware with various form types

import React, { useState, useEffect } from 'react';
import { useFormSecurity, FormSecurityResult } from '../services/FormSecurityMiddleware';

interface FormSecurityDemoProps {
  className?: string;
}

interface FormData {
  [key: string]: any;
}

export const FormSecurityDemo: React.FC<FormSecurityDemoProps> = ({
  className = ''
}) => {
  const [selectedFormType, setSelectedFormType] = useState('login');
  const [formData, setFormData] = useState<FormData>({});
  const [validationResult, setValidationResult] = useState<FormSecurityResult | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Use the form security hook
  const {
    csrfToken,
    isLoading,
    securityResult,
    validateFormSubmission,
    getSecurityStats,
    resetFormSecurity,
    formConfig
  } = useFormSecurity(selectedFormType);

  // Sample form configurations for different types
  const formTypes = [
    { id: 'login', name: 'Login Form', icon: '🔑' },
    { id: 'registration', name: 'Registration Form', icon: '📝' },
    { id: 'booking', name: 'Booking Form', icon: '🎫' },
    { id: 'payment', name: 'Payment Form', icon: '💳' },
    { id: 'review', name: 'Review Form', icon: '⭐' },
    { id: 'adminAction', name: 'Admin Form', icon: '⚙️' }
  ];

  // Sample form fields for each type
  const formFieldsConfig: Record<string, { field: string; label: string; type: string; required: boolean }[]> = {
    login: [
      { field: 'email', label: 'Email', type: 'email', required: true },
      { field: 'password', label: 'Password', type: 'password', required: true },
      { field: 'rememberMe', label: 'Remember Me', type: 'checkbox', required: false }
    ],
    registration: [
      { field: 'name', label: 'Full Name', type: 'text', required: true },
      { field: 'email', label: 'Email', type: 'email', required: true },
      { field: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { field: 'password', label: 'Password', type: 'password', required: true },
      { field: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true },
      { field: 'agreeToTerms', label: 'Agree to Terms', type: 'checkbox', required: true }
    ],
    booking: [
      { field: 'showtimeId', label: 'Showtime ID', type: 'text', required: true },
      { field: 'seats', label: 'Selected Seats', type: 'text', required: true },
      { field: 'specialRequests', label: 'Special Requests', type: 'textarea', required: false }
    ],
    payment: [
      { field: 'cardNumber', label: 'Card Number', type: 'text', required: true },
      { field: 'expiryDate', label: 'Expiry Date', type: 'text', required: true },
      { field: 'cvv', label: 'CVV', type: 'password', required: true },
      { field: 'cardHolderName', label: 'Card Holder Name', type: 'text', required: true }
    ],
    review: [
      { field: 'movieId', label: 'Movie ID', type: 'text', required: true },
      { field: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
      { field: 'comment', label: 'Review Comment', type: 'textarea', required: true }
    ],
    adminAction: [
      { field: 'action', label: 'Admin Action', type: 'text', required: true },
      { field: 'targetId', label: 'Target ID', type: 'text', required: true },
      { field: 'reason', label: 'Reason', type: 'textarea', required: false }
    ]
  };

  // Reset form when type changes
  useEffect(() => {
    setFormData({});
    setValidationResult(null);
    resetFormSecurity();
  }, [selectedFormType, resetFormSecurity]);

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await validateFormSubmission(formData);
    setValidationResult(result);
    
    if (result.isAllowed) {
      console.log('Form submission allowed:', formData);
      // In a real app, you would proceed with the actual form submission
      alert('Form validation passed! Check console for details.');
    } else {
      console.log('Form submission blocked:', result.reason);
    }
  };

  // Get security statistics
  const securityStats = getSecurityStats();

  // Format time remaining for blocked users
  const formatTimeRemaining = (blockExpiry?: number): string => {
    if (!blockExpiry) return '';
    
    const remaining = blockExpiry - Date.now();
    if (remaining <= 0) return '';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  // Get current form fields
  const currentFields = formFieldsConfig[selectedFormType] || [];

  // Check if form is blocked
  const isBlocked = validationResult && !validationResult.isAllowed && validationResult.blockExpiry;

  return (
    <div className={`form-security-demo ${className}`}>
      <div className="demo-header">
        <h2>🛡️ Form Security Middleware Demo</h2>
        <p>Demonstrates comprehensive form security with CSRF protection, rate limiting, and session validation.</p>
      </div>

      {/* Form Type Selection */}
      <div className="form-type-selector">
        <h3>Select Form Type</h3>
        <div className="form-type-grid">
          {formTypes.map(type => (
            <button
              key={type.id}
              className={`form-type-btn ${selectedFormType === type.id ? 'active' : ''}`}
              onClick={() => setSelectedFormType(type.id)}
            >
              <span className="form-type-icon">{type.icon}</span>
              <span className="form-type-name">{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Security Configuration Display */}
      <div className="security-config-display">
        <h4>🔧 Security Configuration</h4>
        <div className="config-grid">
          <div className="config-item">
            <span className="config-label">CSRF Protection:</span>
            <span className={`config-value ${formConfig.enableCSRF ? 'enabled' : 'disabled'}`}>
              {formConfig.enableCSRF ? '✅ Enabled' : '❌ Disabled'}
            </span>
          </div>
          <div className="config-item">
            <span className="config-label">Rate Limiting:</span>
            <span className={`config-value ${formConfig.enableRateLimit ? 'enabled' : 'disabled'}`}>
              {formConfig.enableRateLimit ? '✅ Enabled' : '❌ Disabled'}
            </span>
          </div>
          <div className="config-item">
            <span className="config-label">Session Validation:</span>
            <span className={`config-value ${formConfig.enableSessionValidation ? 'enabled' : 'disabled'}`}>
              {formConfig.enableSessionValidation ? '✅ Enabled' : '❌ Disabled'}
            </span>
          </div>
          <div className="config-item">
            <span className="config-label">Max Attempts:</span>
            <span className="config-value">{formConfig.rateLimit.maxAttempts}</span>
          </div>
          <div className="config-item">
            <span className="config-label">Window:</span>
            <span className="config-value">{Math.floor(formConfig.rateLimit.windowMs / 60000)}m</span>
          </div>
          <div className="config-item">
            <span className="config-label">Block Duration:</span>
            <span className="config-value">{Math.floor(formConfig.rateLimit.blockDurationMs / 60000)}m</span>
          </div>
        </div>
      </div>

      {/* Security Status */}
      <div className="security-status-section">
        <h4>🔍 Security Status</h4>
        
        {/* CSRF Token Display */}
        {formConfig.enableCSRF && (
          <div className="csrf-token-display">
            <div className="csrf-token-label">CSRF Token</div>
            <div className="csrf-token-value">{csrfToken}</div>
          </div>
        )}

        {/* Rate Limit Info */}
        {formConfig.enableRateLimit && validationResult && (
          <div className="rate-limit-display">
            <div className="rate-limit-label">Rate Limit Status</div>
            <div className="rate-limit-info">
              <span>Remaining Attempts: </span>
              <span className={`remaining-count ${
                (validationResult.remainingAttempts || 0) <= 2 ? 'danger' : 
                (validationResult.remainingAttempts || 0) <= 4 ? 'warning' : 'safe'
              }`}>
                {validationResult.remainingAttempts ?? 'N/A'}
              </span>
            </div>
            {isBlocked && (
              <div className="block-info">
                <span>🚫 Blocked for: </span>
                <span className="block-timer">{formatTimeRemaining(validationResult.blockExpiry)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Container */}
      <div className={`form-container ${isBlocked ? 'blocked' : ''}`}>
        <h4>📝 {formTypes.find(t => t.id === selectedFormType)?.name}</h4>
        
        {/* Block Overlay */}
        {isBlocked && (
          <div className="form-blocked-overlay">
            <div className="blocked-message">🚫 Form Blocked</div>
            <div className="blocked-reason">{validationResult.reason}</div>
            <div className="blocked-timer">{formatTimeRemaining(validationResult.blockExpiry)}</div>
            <div className="blocked-explanation">
              Too many attempts detected. Please wait for the timer to expire.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="security-demo-form">
          {currentFields.map(field => (
            <div key={field.field} className="form-field">
              <label htmlFor={field.field} className="field-label">
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  id={field.field}
                  value={formData[field.field] || ''}
                  onChange={(e) => handleInputChange(field.field, e.target.value)}
                  required={field.required}
                  className="field-input"
                  rows={3}
                />
              ) : field.type === 'checkbox' ? (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData[field.field] || false}
                    onChange={(e) => handleInputChange(field.field, e.target.checked)}
                    required={field.required}
                    className="field-checkbox"
                  />
                  <span className="checkbox-text">{field.label}</span>
                </label>
              ) : (
                <input
                  type={field.type}
                  id={field.field}
                  value={formData[field.field] || ''}
                  onChange={(e) => handleInputChange(field.field, e.target.value)}
                  required={field.required}
                  className="field-input"
                  min={field.type === 'number' ? 1 : undefined}
                  max={field.type === 'number' ? 5 : undefined}
                />
              )}
            </div>
          ))}

          {/* Hidden CSRF Token */}
          {formConfig.enableCSRF && (
            <input type="hidden" name="csrf_token" value={csrfToken} />
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={isLoading || isBlocked}
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? '🔄 Validating...' : '✅ Submit Form'}
            </button>
            
            <button
              type="button"
              onClick={resetFormSecurity}
              className="reset-btn"
            >
              🔄 Reset Security
            </button>
          </div>
        </form>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <div className={`validation-result ${validationResult.isAllowed ? 'success' : 'error'}`}>
          <h4>📊 Validation Result</h4>
          <div className="result-status">
            Status: <span className={validationResult.isAllowed ? 'success' : 'error'}>
              {validationResult.isAllowed ? '✅ Allowed' : '❌ Blocked'}
            </span>
          </div>
          {validationResult.reason && (
            <div className="result-reason">
              Reason: <span>{validationResult.reason}</span>
            </div>
          )}
          {validationResult.remainingAttempts !== undefined && (
            <div className="result-attempts">
              Remaining Attempts: <span>{validationResult.remainingAttempts}</span>
            </div>
          )}
        </div>
      )}

      {/* Security Statistics */}
      <div className="security-stats-section">
        <div className="stats-header">
          <h4>📈 Security Statistics</h4>
          <button
            onClick={() => setShowStats(!showStats)}
            className="toggle-stats-btn"
          >
            {showStats ? '🔽 Hide' : '🔼 Show'} Stats
          </button>
        </div>
        
        {showStats && (
          <div className="stats-content">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{securityStats.totalEvents}</span>
                <span className="stat-label">Total Events</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{securityStats.activeBlocks}</span>
                <span className="stat-label">Active Blocks</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{securityStats.activeSessions}</span>
                <span className="stat-label">Active Sessions</span>
              </div>
            </div>

            <div className="events-by-type">
              <h5>Events by Type</h5>
              <div className="events-list">
                {Object.entries(securityStats.eventsByType).map(([type, count]) => (
                  <div key={type} className="event-type-stat">
                    <span className="event-type">{type.replace(/_/g, ' ')}</span>
                    <span className="event-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="recent-events">
              <h5>Recent Events</h5>
              <div className="events-timeline">
                {securityStats.recentEvents.slice(-5).map((event, index) => (
                  <div key={index} className="timeline-event">
                    <div className={`event-severity ${event.severity.toLowerCase()}`}>
                      {event.severity}
                    </div>
                    <div className="event-details">
                      <div className="event-type">{event.type.replace(/_/g, ' ')}</div>
                      <div className="event-time">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormSecurityDemo;