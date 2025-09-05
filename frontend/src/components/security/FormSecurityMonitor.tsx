// Form Security Monitor Component for CineBook
// Real-time monitoring and analytics for form security events

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSecurity } from './SecurityProvider';

interface SecurityMonitorProps {
  showFullDashboard?: boolean;
  showRecentEvents?: boolean;
  maxEventsToShow?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

interface SecurityMetrics {
  totalEvents: number;
  xssAttempts: number;
  sqlInjectionAttempts: number;
  csrfViolations: number;
  suspiciousInputs: number;
  blockedEvents: number;
  criticalEvents: number;
  lastEventTime?: number;
}

interface EventFilter {
  type: 'all' | 'XSS_ATTEMPT' | 'SQL_INJECTION' | 'CSRF_VIOLATION' | 'SUSPICIOUS_INPUT';
  severity: 'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timeRange: 'all' | 'last_hour' | 'last_day' | 'last_week';
}

export const FormSecurityMonitor: React.FC<SecurityMonitorProps> = ({
  showFullDashboard = true,
  showRecentEvents = true,
  maxEventsToShow = 10,
  autoRefresh = true,
  refreshInterval = 5000,
  className = ''
}) => {
  const security = useSecurity();
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState<EventFilter>({
    type: 'all',
    severity: 'all',
    timeRange: 'last_day'
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock security events for demonstration
  useEffect(() => {
    const mockEvents = [
      {
        type: 'XSS_ATTEMPT',
        timestamp: Date.now() - 300000,
        input: '<script>alert("xss")</script>',
        field: 'movieReview',
        severity: 'HIGH',
        blocked: true,
        userAgent: 'Mozilla/5.0...',
        ip: '192.168.1.100'
      },
      {
        type: 'SQL_INJECTION',
        timestamp: Date.now() - 600000,
        input: "'; DROP TABLE users; --",
        field: 'searchQuery',
        severity: 'CRITICAL',
        blocked: true,
        userAgent: 'Mozilla/5.0...',
        ip: '192.168.1.101'
      },
      {
        type: 'SUSPICIOUS_INPUT',
        timestamp: Date.now() - 900000,
        input: 'eval(document.cookie)',
        field: 'userComment',
        severity: 'MEDIUM',
        blocked: true,
        userAgent: 'Mozilla/5.0...',
        ip: '192.168.1.102'
      },
      {
        type: 'CSRF_VIOLATION',
        timestamp: Date.now() - 1200000,
        input: 'Invalid CSRF token',
        field: 'bookingForm',
        severity: 'HIGH',
        blocked: true,
        userAgent: 'Mozilla/5.0...',
        ip: '192.168.1.103'
      }
    ];

    setSecurityEvents(mockEvents);
  }, []);

  // Calculate security metrics
  const securityMetrics = useMemo<SecurityMetrics>(() => {
    const now = Date.now();
    const timeRanges = {
      last_hour: now - 3600000,
      last_day: now - 86400000,
      last_week: now - 604800000
    };

    let filteredEvents = securityEvents;

    // Apply time filter
    if (filter.timeRange !== 'all') {
      const cutoff = timeRanges[filter.timeRange];
      filteredEvents = filteredEvents.filter(event => event.timestamp > cutoff);
    }

    // Apply type filter
    if (filter.type !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.type === filter.type);
    }

    // Apply severity filter
    if (filter.severity !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.severity === filter.severity);
    }

    return {
      totalEvents: filteredEvents.length,
      xssAttempts: filteredEvents.filter(e => e.type === 'XSS_ATTEMPT').length,
      sqlInjectionAttempts: filteredEvents.filter(e => e.type === 'SQL_INJECTION').length,
      csrfViolations: filteredEvents.filter(e => e.type === 'CSRF_VIOLATION').length,
      suspiciousInputs: filteredEvents.filter(e => e.type === 'SUSPICIOUS_INPUT').length,
      blockedEvents: filteredEvents.filter(e => e.blocked).length,
      criticalEvents: filteredEvents.filter(e => e.severity === 'CRITICAL').length,
      lastEventTime: filteredEvents.length > 0 ? Math.max(...filteredEvents.map(e => e.timestamp)) : undefined
    };
  }, [securityEvents, filter]);

  // Get filtered events for display
  const displayEvents = useMemo(() => {
    let events = [...securityEvents];

    // Apply filters
    const now = Date.now();
    const timeRanges = {
      last_hour: now - 3600000,
      last_day: now - 86400000,
      last_week: now - 604800000
    };

    if (filter.timeRange !== 'all') {
      const cutoff = timeRanges[filter.timeRange];
      events = events.filter(event => event.timestamp > cutoff);
    }

    if (filter.type !== 'all') {
      events = events.filter(event => event.type === filter.type);
    }

    if (filter.severity !== 'all') {
      events = events.filter(event => event.severity === filter.severity);
    }

    // Sort by timestamp (newest first) and limit
    return events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxEventsToShow);
  }, [securityEvents, filter, maxEventsToShow]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  }, []);

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'LOW': return '#46d369';
      case 'MEDIUM': return '#ff9500';
      case 'HIGH': return '#ff3b30';
      case 'CRITICAL': return '#ff0000';
      default: return '#8c8c8c';
    }
  };

  // Get threat level
  const getThreatLevel = (): { level: string; color: string; description: string } => {
    const criticalCount = securityMetrics.criticalEvents;
    const highCount = securityEvents.filter(e => e.severity === 'HIGH').length;
    
    if (criticalCount > 0) {
      return {
        level: 'CRITICAL',
        color: '#ff0000',
        description: 'Immediate attention required'
      };
    } else if (highCount > 2) {
      return {
        level: 'HIGH',
        color: '#ff3b30',
        description: 'Multiple high-severity threats detected'
      };
    } else if (securityMetrics.totalEvents > 10) {
      return {
        level: 'ELEVATED',
        color: '#ff9500',
        description: 'Increased security activity'
      };
    } else {
      return {
        level: 'NORMAL',
        color: '#46d369',
        description: 'Security status normal'
      };
    }
  };

  const threatLevel = getThreatLevel();

  if (!showFullDashboard && !showRecentEvents) {
    return null;
  }

  return (
    <div className={`form-security-monitor ${className}`}>
      {/* Security Status Header */}
      <div className="security-monitor-header">
        <div className="security-status-overview">
          <div className="threat-level" style={{ color: threatLevel.color }}>
            <span className="threat-icon">🛡️</span>
            <div>
              <div className="threat-level-text">{threatLevel.level}</div>
              <div className="threat-description">{threatLevel.description}</div>
            </div>
          </div>
          
          <div className="security-summary">
            <span className="events-count">{securityMetrics.totalEvents} events</span>
            {securityMetrics.lastEventTime && (
              <span className="last-event">
                Last: {formatTimestamp(securityMetrics.lastEventTime)}
              </span>
            )}
          </div>
        </div>

        {showFullDashboard && (
          <button
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '🔼 Collapse' : '🔽 Expand Dashboard'}
          </button>
        )}
      </div>

      {/* Full Dashboard */}
      {showFullDashboard && isExpanded && (
        <div className="security-dashboard">
          {/* Security Metrics */}
          <div className="security-metrics">
            <div className="metric-card">
              <div className="metric-value" style={{ color: getSeverityColor('HIGH') }}>
                {securityMetrics.xssAttempts}
              </div>
              <div className="metric-label">XSS Attempts</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value" style={{ color: getSeverityColor('CRITICAL') }}>
                {securityMetrics.sqlInjectionAttempts}
              </div>
              <div className="metric-label">SQL Injection</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value" style={{ color: getSeverityColor('HIGH') }}>
                {securityMetrics.csrfViolations}
              </div>
              <div className="metric-label">CSRF Violations</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value" style={{ color: getSeverityColor('MEDIUM') }}>
                {securityMetrics.suspiciousInputs}
              </div>
              <div className="metric-label">Suspicious Inputs</div>
            </div>
            
            <div className="metric-card">
              <div className="metric-value" style={{ color: getSeverityColor('LOW') }}>
                {securityMetrics.blockedEvents}
              </div>
              <div className="metric-label">Blocked</div>
            </div>
          </div>

          {/* Filters */}
          <div className="security-filters">
            <div className="filter-group">
              <label>Event Type:</label>
              <select 
                value={filter.type} 
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <option value="all">All Events</option>
                <option value="XSS_ATTEMPT">XSS Attempts</option>
                <option value="SQL_INJECTION">SQL Injection</option>
                <option value="CSRF_VIOLATION">CSRF Violations</option>
                <option value="SUSPICIOUS_INPUT">Suspicious Input</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Severity:</label>
              <select 
                value={filter.severity} 
                onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value as any }))}
              >
                <option value="all">All Severities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Time Range:</label>
              <select 
                value={filter.timeRange} 
                onChange={(e) => setFilter(prev => ({ ...prev, timeRange: e.target.value as any }))}
              >
                <option value="all">All Time</option>
                <option value="last_hour">Last Hour</option>
                <option value="last_day">Last Day</option>
                <option value="last_week">Last Week</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Recent Events */}
      {showRecentEvents && displayEvents.length > 0 && (
        <div className="recent-events">
          <h4>🚨 Recent Security Events</h4>
          <div className="events-list">
            {displayEvents.map((event, index) => (
              <div key={index} className="security-event">
                <div className="event-info">
                  <div className="event-header">
                    <span className={`event-type event-type--${event.type}`}>
                      {event.type.replace('_', ' ')}
                    </span>
                    <span 
                      className="event-severity"
                      style={{ background: getSeverityColor(event.severity) }}
                    >
                      {event.severity}
                    </span>
                  </div>
                  
                  <div className="event-details">
                    <div className="event-field">Field: {event.field}</div>
                    <div className="event-input">
                      Input: <code>{event.input.substring(0, 50)}...</code>
                    </div>
                    <div className="event-ip">IP: {event.ip}</div>
                  </div>
                </div>
                
                <div className="event-meta">
                  <div className="event-time">{formatTimestamp(event.timestamp)}</div>
                  <div className={`event-status ${event.blocked ? 'blocked' : 'allowed'}`}>
                    {event.blocked ? '🛑 Blocked' : '⚠️ Allowed'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {displayEvents.length === 0 && (
            <div className="no-events">
              <span className="no-events-icon">✅</span>
              <span>No security events in selected time range</span>
            </div>
          )}
        </div>
      )}

      {/* Security Features Info */}
      <div className="security-features-info">
        <div className="features-list">
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>XSS Protection Active</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🛡️</span>
            <span>SQL Injection Prevention</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔐</span>
            <span>CSRF Protection</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Real-time Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSecurityMonitor;