// Security Dashboard Component for CineBook Admin
// Comprehensive security monitoring and management interface

import React, { useState, useEffect, useCallback } from 'react';
import { useSecurityMonitor } from '../../utils/SecurityMonitor';
import type { SecurityMetrics, SecurityIncident } from '../../utils/SecurityMonitor';
import type { SecurityAlert } from '../../utils/RateLimiter';

interface SecurityDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function SecurityDashboard({ 
  className = '',
  autoRefresh = true,
  refreshInterval = 30000
}: SecurityDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const securityMonitor = useSecurityMonitor();

  const refreshData = useCallback(() => {
    try {
      setMetrics(securityMonitor.getMetrics());
      setIncidents(securityMonitor.getIncidents());
      setAlerts(securityMonitor.getAlerts(24 * 60 * 60 * 1000));
    } catch (error) {
      console.error('Failed to refresh security data:', error);
    }
  }, [securityMonitor]);

  useEffect(() => {
    refreshData();
    
    if (autoRefresh) {
      securityMonitor.startMonitoring();
      setIsMonitoring(true);
      
      const interval = setInterval(refreshData, refreshInterval);
      return () => {
        clearInterval(interval);
        securityMonitor.stopMonitoring();
        setIsMonitoring(false);
      };
    }
  }, [refreshData, autoRefresh, refreshInterval, securityMonitor]);

  const handleResolveIncident = (incidentId: string, resolution: string) => {
    const success = securityMonitor.resolveIncident(incidentId, resolution);
    if (success) refreshData();
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      securityMonitor.stopMonitoring();
      setIsMonitoring(false);
    } else {
      securityMonitor.startMonitoring();
      setIsMonitoring(true);
    }
  };

  if (!metrics) {
    return (
      <div className="security-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading security dashboard...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'incidents', name: 'Incidents', icon: '🚨' },
    { id: 'alerts', name: 'Alerts', icon: '⚠️' },
    { id: 'reports', name: 'Reports', icon: '📈' }
  ];

  return (
    <div className={`security-dashboard ${className}`}>
      {/* Dashboard Header */}
      <div className="security-dashboard__header">
        <div className="security-dashboard__title-section">
          <h1 className="security-dashboard__title">🛡️ Security Center</h1>
          <p className="security-dashboard__subtitle">
            Real-time security monitoring and threat management
          </p>
        </div>

        <div className="security-dashboard__controls">
          <div className="security-dashboard__status">
            <span className={`status-indicator status-indicator--${metrics.systemHealth.status}`}>
              {metrics.systemHealth.status === 'healthy' ? '✅' : 
               metrics.systemHealth.status === 'warning' ? '⚠️' : '🚨'}
            </span>
            <span>System: {metrics.systemHealth.status}</span>
          </div>

          <button 
            className={`monitoring-toggle ${isMonitoring ? 'monitoring-toggle--active' : ''}`}
            onClick={toggleMonitoring}
          >
            {isMonitoring ? '⏸️ Stop' : '▶️ Start'} Monitoring
          </button>

          <button className="refresh-btn" onClick={refreshData}>🔄 Refresh</button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="security-dashboard__nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`security-dashboard__nav-item ${
              selectedTab === tab.id ? 'security-dashboard__nav-item--active' : ''
            }`}
            onClick={() => setSelectedTab(tab.id)}
          >
            <span className="security-dashboard__nav-icon">{tab.icon}</span>
            {tab.name}
            {tab.id === 'incidents' && incidents.filter(i => i.status === 'open').length > 0 && (
              <span className="security-dashboard__nav-badge">
                {incidents.filter(i => i.status === 'open').length}
              </span>
            )}
            {tab.id === 'alerts' && alerts.length > 0 && (
              <span className="security-dashboard__nav-badge">{alerts.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Dashboard Content */}
      <div className="security-dashboard__content">
        {selectedTab === 'overview' && (
          <SecurityOverview
            metrics={metrics}
            incidents={incidents}
            alerts={alerts}
          />
        )}

        {selectedTab === 'incidents' && (
          <SecurityIncidents
            incidents={incidents}
            onResolve={handleResolveIncident}
          />
        )}

        {selectedTab === 'alerts' && (
          <SecurityAlerts alerts={alerts} />
        )}

        {selectedTab === 'reports' && (
          <SecurityReports metrics={metrics} />
        )}
      </div>
    </div>
  );
}

// Security Overview Component
interface SecurityOverviewProps {
  metrics: SecurityMetrics;
  incidents: SecurityIncident[];
  alerts: SecurityAlert[];
}

function SecurityOverview({ metrics, incidents, alerts }: SecurityOverviewProps) {
  const threatLevel = calculateThreatLevel(metrics, incidents, alerts);
  const openIncidents = incidents.filter(i => i.status === 'open');

  return (
    <div className="security-overview">
      {/* Threat Level Indicator */}
      <div className="threat-level-section">
        <h2>Current Threat Level</h2>
        <div className="threat-level-indicator">
          <div 
            className={`threat-level-gauge threat-level-gauge--${threatLevel.level}`}
          >
            <span className="threat-level-icon">
              {threatLevel.level === 'critical' ? '🚨' : 
               threatLevel.level === 'high' ? '🔴' : 
               threatLevel.level === 'medium' ? '🟡' : 
               threatLevel.level === 'low' ? '🟢' : '🔵'}
            </span>
            <div className="threat-level-score">Score: {threatLevel.score}</div>
          </div>
          <div className="threat-level-details">
            <h3>{threatLevel.level.toUpperCase()} THREAT LEVEL</h3>
            <div className="threat-factors">
              {threatLevel.factors.map((factor, index) => (
                <div key={index} className="threat-factor">⚠️ {factor}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security Metrics Cards */}
      <div className="security-metrics">
        <div className="security-card security-card--orange">
          <div className="security-card__header">
            <span className="security-card__icon">⚠️</span>
            <span className="security-card__title">Total Alerts</span>
          </div>
          <div className="security-card__value">{metrics.alertsCount.total}</div>
          <div className="security-card__change">+{metrics.alertsCount.last24h} (24h)</div>
        </div>
        
        <div className="security-card security-card--red">
          <div className="security-card__header">
            <span className="security-card__icon">🚫</span>
            <span className="security-card__title">Active Blocks</span>
          </div>
          <div className="security-card__value">{metrics.rateLimiting.activeBlocks}</div>
        </div>
        
        <div className="security-card security-card--purple">
          <div className="security-card__header">
            <span className="security-card__icon">🔒</span>
            <span className="security-card__title">Lockouts</span>
          </div>
          <div className="security-card__value">{metrics.bruteForce.activeLockouts}</div>
        </div>
        
        <div className="security-card security-card--blue">
          <div className="security-card__header">
            <span className="security-card__icon">🛡️</span>
            <span className="security-card__title">Threats Detected</span>
          </div>
          <div className="security-card__value">{metrics.inputSanitization.threatsDetected}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-section">
          <h3>Open Incidents ({openIncidents.length})</h3>
          <div className="incident-list">
            {openIncidents.slice(0, 5).map(incident => (
              <div key={incident.id} className="incident-item">
                <span className={`severity-badge severity-badge--${incident.severity}`}>
                  {incident.severity}
                </span>
                <span className="incident-title">{incident.title}</span>
                <span className="incident-time">
                  {new Date(incident.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-section">
          <h3>Recent Alerts ({alerts.slice(-5).length})</h3>
          <div className="alert-timeline">
            {alerts.slice(-5).reverse().map((alert, index) => (
              <div key={`${alert.timestamp}-${index}`} className="alert-item">
                <span className={`severity-badge severity-badge--${alert.severity}`}>
                  {alert.severity}
                </span>
                <span className="alert-description">{alert.description}</span>
                <span className="alert-time">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Security Incidents Component
interface SecurityIncidentsProps {
  incidents: SecurityIncident[];
  onResolve: (incidentId: string, resolution: string) => void;
}

function SecurityIncidents({ incidents, onResolve }: SecurityIncidentsProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const filteredIncidents = incidents.filter(incident => {
    if (filter === 'all') return true;
    return incident.status === filter;
  });

  return (
    <div className="security-incidents">
      <div className="incidents-header">
        <h2>Security Incidents</h2>
        <div className="incidents-filters">
          {(['all', 'open', 'resolved'] as const).map(status => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status} ({incidents.filter(i => status === 'all' || i.status === status).length})
            </button>
          ))}
        </div>
      </div>

      <div className="incidents-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Title</th>
              <th>Status</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.map(incident => (
              <tr key={incident.id}>
                <td>{incident.id}</td>
                <td>{incident.type}</td>
                <td>
                  <span className={`severity-badge severity-badge--${incident.severity}`}>
                    {incident.severity}
                  </span>
                </td>
                <td>{incident.title}</td>
                <td>
                  <span className={`status-badge status-badge--${incident.status}`}>
                    {incident.status}
                  </span>
                </td>
                <td>{new Date(incident.timestamp).toLocaleString()}</td>
                <td>
                  {incident.status === 'open' && (
                    <button 
                      className="resolve-btn"
                      onClick={() => onResolve(incident.id, 'Manually resolved')}
                    >
                      ✅ Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Security Alerts Component
interface SecurityAlertsProps {
  alerts: SecurityAlert[];
}

function SecurityAlerts({ alerts }: SecurityAlertsProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const filteredAlerts = alerts.filter(alert => {
    return filter === 'all' || alert.severity === filter;
  });

  return (
    <div className="security-alerts">
      <div className="alerts-header">
        <h2>Security Alerts</h2>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as any)}
          className="filter-select"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="alerts-stats">
        <div className="alert-stat">
          <span>Total: {filteredAlerts.length}</span>
        </div>
        <div className="alert-stat alert-stat--critical">
          <span>Critical: {filteredAlerts.filter(a => a.severity === 'critical').length}</span>
        </div>
        <div className="alert-stat alert-stat--high">
          <span>High: {filteredAlerts.filter(a => a.severity === 'high').length}</span>
        </div>
      </div>

      <div className="alerts-list">
        {filteredAlerts.map((alert, index) => (
          <div key={`${alert.timestamp}-${index}`} className="alert-item">
            <span className={`severity-badge severity-badge--${alert.severity}`}>
              {alert.severity}
            </span>
            <div className="alert-content">
              <div className="alert-description">{alert.description}</div>
              <div className="alert-meta">
                <span>Source: {alert.identifier}</span>
                <span>Time: {new Date(alert.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Security Reports Component
interface SecurityReportsProps {
  metrics: SecurityMetrics;
}

function SecurityReports({ metrics }: SecurityReportsProps) {
  return (
    <div className="security-reports">
      <h2>Security Reports</h2>
      
      <div className="report-cards">
        <div className="report-card">
          <h3>📊 Threat Analysis</h3>
          <p>Comprehensive analysis of security threats and patterns</p>
          <button className="report-btn">Generate Report</button>
        </div>
        
        <div className="report-card">
          <h3>📈 Performance Impact</h3>
          <p>Security measures impact on system performance</p>
          <button className="report-btn">Generate Report</button>
        </div>
        
        <div className="report-card">
          <h3>🔍 Compliance Audit</h3>
          <p>Security compliance and regulatory requirements</p>
          <button className="report-btn">Generate Report</button>
        </div>
      </div>

      <div className="metrics-summary">
        <h3>Current Metrics Summary</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <label>Total Alerts:</label>
            <span>{metrics.alertsCount.total}</span>
          </div>
          <div className="metric-item">
            <label>Active Blocks:</label>
            <span>{metrics.rateLimiting.activeBlocks}</span>
          </div>
          <div className="metric-item">
            <label>Lockouts:</label>
            <span>{metrics.bruteForce.activeLockouts}</span>
          </div>
          <div className="metric-item">
            <label>System Status:</label>
            <span className={`status-${metrics.systemHealth.status}`}>
              {metrics.systemHealth.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate threat level
function calculateThreatLevel(
  metrics: SecurityMetrics,
  incidents: SecurityIncident[],
  alerts: SecurityAlert[]
): { level: 'none' | 'low' | 'medium' | 'high' | 'critical'; score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status === 'open');
  if (criticalIncidents.length > 0) {
    score += criticalIncidents.length * 20;
    factors.push(`${criticalIncidents.length} critical incidents`);
  }

  const highAlerts = alerts.filter(a => a.severity === 'high');
  if (highAlerts.length > 5) {
    score += highAlerts.length * 2;
    factors.push(`${highAlerts.length} high severity alerts`);
  }

  if (metrics.bruteForce.activeLockouts > 10) {
    score += 15;
    factors.push(`${metrics.bruteForce.activeLockouts} active lockouts`);
  }

  if (metrics.systemHealth.status === 'critical') {
    score += 25;
    factors.push('System health critical');
  } else if (metrics.systemHealth.status === 'warning') {
    score += 10;
    factors.push('System health warning');
  }

  let level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  if (score >= 50) level = 'critical';
  else if (score >= 30) level = 'high';
  else if (score >= 15) level = 'medium';
  else if (score >= 5) level = 'low';
  else level = 'none';

  return { level, score, factors };
}

export default SecurityDashboard;