// Security Monitoring and Threat Detection System for CineBook
// Comprehensive security monitoring with real-time threat analysis

import { rateLimiter, type SecurityAlert } from './RateLimiter';
import { bruteForceProtection } from './BruteForceProtection';
import { inputSanitizer } from './SecurityUtils';

export interface ThreatLevel {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: string[];
  recommendations: string[];
}

export interface SecurityMetrics {
  alertsCount: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    last24h: number;
  };
  rateLimiting: {
    totalBlocked: number;
    activeBlocks: number;
    topEndpoints: Array<{ endpoint: string; attempts: number }>;
  };
  bruteForce: {
    activeLockouts: number;
    captchaChallenges: number;
    topTargets: Array<{ identifier: string; attempts: number }>;
  };
  inputSanitization: {
    threatsDetected: number;
    topThreatTypes: Array<{ type: string; count: number }>;
    sanitizationRate: number;
  };
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastIncident?: number;
  };
}

export interface SecurityIncident {
  id: string;
  type: 'attack' | 'breach_attempt' | 'anomaly' | 'policy_violation';
  severity: SecurityAlert['severity'];
  title: string;
  description: string;
  timestamp: number;
  source: string;
  identifier: string;
  metadata: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  actions: SecurityAction[];
}

export interface SecurityAction {
  type: 'block' | 'alert' | 'log' | 'escalate' | 'captcha';
  timestamp: number;
  description: string;
  automated: boolean;
  result?: 'success' | 'failed' | 'pending';
}

export interface AnomalyPattern {
  name: string;
  description: string;
  threshold: number;
  timeWindow: number;
  detector: (events: SecurityEvent[]) => boolean;
}

export interface SecurityEvent {
  timestamp: number;
  type: string;
  identifier: string;
  endpoint: string;
  severity: SecurityAlert['severity'];
  metadata: Record<string, any>;
}

export interface SecurityPolicy {
  name: string;
  enabled: boolean;
  rules: SecurityRule[];
  actions: SecurityAction[];
}

export interface SecurityRule {
  condition: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
  value: any;
  negated?: boolean;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private alerts: SecurityAlert[];
  private incidents: Map<string, SecurityIncident>;
  private events: SecurityEvent[];
  private policies: Map<string, SecurityPolicy>;
  private anomalyPatterns: AnomalyPattern[];
  private metrics: SecurityMetrics;
  private isMonitoring: boolean;
  private monitoringInterval: NodeJS.Timeout | null;

  private constructor() {
    this.alerts = [];
    this.incidents = new Map();
    this.events = [];
    this.policies = new Map();
    this.anomalyPatterns = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.metrics = this.initializeMetrics();
    
    this.initializeAnomalyPatterns();
    this.initializeSecurityPolicies();
    this.setupSecurityIntegrations();
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  // Initialize security metrics
  private initializeMetrics(): SecurityMetrics {
    return {
      alertsCount: {
        total: 0,
        byType: {},
        bySeverity: {},
        last24h: 0
      },
      rateLimiting: {
        totalBlocked: 0,
        activeBlocks: 0,
        topEndpoints: []
      },
      bruteForce: {
        activeLockouts: 0,
        captchaChallenges: 0,
        topTargets: []
      },
      inputSanitization: {
        threatsDetected: 0,
        topThreatTypes: [],
        sanitizationRate: 0
      },
      systemHealth: {
        status: 'healthy',
        uptime: Date.now()
      }
    };
  }

  // Initialize anomaly detection patterns
  private initializeAnomalyPatterns(): void {
    this.anomalyPatterns = [
      {
        name: 'rapid_fire_requests',
        description: 'Unusually high request rate from single source',
        threshold: 100,
        timeWindow: 60 * 1000, // 1 minute
        detector: (events) => {
          const now = Date.now();
          const recentEvents = events.filter(e => now - e.timestamp < 60000);
          const sourceGroups = this.groupEventsBySource(recentEvents);
          return Object.values(sourceGroups).some(count => count > 100);
        }
      },
      {
        name: 'credential_stuffing',
        description: 'Multiple failed login attempts across different accounts',
        threshold: 50,
        timeWindow: 5 * 60 * 1000, // 5 minutes
        detector: (events) => {
          const loginEvents = events.filter(e => 
            e.endpoint.includes('login') && e.severity !== 'low'
          );
          const uniqueIdentifiers = new Set(loginEvents.map(e => e.identifier));
          return uniqueIdentifiers.size > 50;
        }
      },
      {
        name: 'data_exfiltration',
        description: 'Suspicious data access patterns',
        threshold: 20,
        timeWindow: 10 * 60 * 1000, // 10 minutes
        detector: (events) => {
          const dataEvents = events.filter(e => 
            e.endpoint.includes('api') && e.type === 'data_access'
          );
          return dataEvents.length > 20;
        }
      },
      {
        name: 'privilege_escalation',
        description: 'Attempts to access unauthorized resources',
        threshold: 5,
        timeWindow: 5 * 60 * 1000, // 5 minutes
        detector: (events) => {
          const escalationEvents = events.filter(e => 
            e.endpoint.includes('admin') && e.severity === 'high'
          );
          return escalationEvents.length > 5;
        }
      }
    ];
  }

  // Initialize security policies
  private initializeSecurityPolicies(): void {
    // Failed login policy
    this.policies.set('failed_login_policy', {
      name: 'Failed Login Monitoring',
      enabled: true,
      rules: [
        {
          condition: 'endpoint',
          operator: 'contains',
          value: 'login'
        },
        {
          condition: 'severity',
          operator: 'greater_than',
          value: 'low'
        }
      ],
      actions: [
        {
          type: 'log',
          timestamp: Date.now(),
          description: 'Log failed login attempt',
          automated: true
        },
        {
          type: 'alert',
          timestamp: Date.now(),
          description: 'Generate security alert',
          automated: true
        }
      ]
    });

    // Brute force policy
    this.policies.set('brute_force_policy', {
      name: 'Brute Force Attack Detection',
      enabled: true,
      rules: [
        {
          condition: 'type',
          operator: 'equals',
          value: 'attack_detected'
        }
      ],
      actions: [
        {
          type: 'block',
          timestamp: Date.now(),
          description: 'Block attacking source',
          automated: true
        },
        {
          type: 'escalate',
          timestamp: Date.now(),
          description: 'Escalate to security team',
          automated: true
        }
      ]
    });

    // Data breach policy
    this.policies.set('data_breach_policy', {
      name: 'Data Breach Prevention',
      enabled: true,
      rules: [
        {
          condition: 'severity',
          operator: 'equals',
          value: 'critical'
        }
      ],
      actions: [
        {
          type: 'alert',
          timestamp: Date.now(),
          description: 'Immediate security alert',
          automated: true
        },
        {
          type: 'escalate',
          timestamp: Date.now(),
          description: 'Emergency escalation',
          automated: true
        }
      ]
    });
  }

  // Setup integrations with other security systems
  private setupSecurityIntegrations(): void {
    // Integrate with rate limiter
    rateLimiter.onAlert((alert) => {
      this.handleSecurityAlert(alert);
    });

    // Integrate with brute force protection
    bruteForceProtection.onAlert((alert) => {
      this.handleSecurityAlert(alert);
    });
  }

  // Start security monitoring
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performSecurityAnalysis();
      this.updateMetrics();
      this.detectAnomalies();
      this.cleanupOldData();
    }, 30 * 1000); // Run every 30 seconds

    console.log('Security monitoring started');
  }

  // Stop security monitoring
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Security monitoring stopped');
  }

  // Handle security alert from integrated systems
  private handleSecurityAlert(alert: SecurityAlert): void {
    this.alerts.push(alert);
    
    // Convert alert to security event
    const event: SecurityEvent = {
      timestamp: alert.timestamp,
      type: alert.type,
      identifier: alert.identifier,
      endpoint: alert.endpoint,
      severity: alert.severity,
      metadata: alert.metadata
    };
    
    this.events.push(event);

    // Check if incident should be created
    if (this.shouldCreateIncident(alert)) {
      this.createSecurityIncident(alert);
    }

    // Apply security policies
    this.applySecurityPolicies(event);

    // Update metrics
    this.updateAlertsMetrics(alert);

    console.log('Security alert handled:', alert);
  }

  // Check if incident should be created
  private shouldCreateIncident(alert: SecurityAlert): boolean {
    return alert.severity === 'high' || alert.severity === 'critical' ||
           alert.type === 'attack_detected';
  }

  // Create security incident
  private createSecurityIncident(alert: SecurityAlert): SecurityIncident {
    const incident: SecurityIncident = {
      id: this.generateIncidentId(),
      type: this.mapAlertToIncidentType(alert),
      severity: alert.severity,
      title: this.generateIncidentTitle(alert),
      description: alert.description,
      timestamp: alert.timestamp,
      source: 'security_monitor',
      identifier: alert.identifier,
      metadata: alert.metadata,
      status: 'open',
      actions: []
    };

    this.incidents.set(incident.id, incident);
    
    // Auto-execute incident response actions
    this.executeIncidentResponse(incident);

    console.log('Security incident created:', incident);
    return incident;
  }

  // Generate unique incident ID
  private generateIncidentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `SEC-${timestamp}-${random}`.toUpperCase();
  }

  // Map alert type to incident type
  private mapAlertToIncidentType(alert: SecurityAlert): SecurityIncident['type'] {
    switch (alert.type) {
      case 'attack_detected':
        return 'attack';
      case 'rate_limit_exceeded':
        return 'policy_violation';
      case 'suspicious_activity':
        return 'anomaly';
      default:
        return 'anomaly';
    }
  }

  // Generate incident title
  private generateIncidentTitle(alert: SecurityAlert): string {
    const severityText = alert.severity.toUpperCase();
    const typeText = alert.type.replace('_', ' ').toUpperCase();
    return `${severityText} ${typeText} - ${alert.identifier}`;
  }

  // Execute incident response actions
  private executeIncidentResponse(incident: SecurityIncident): void {
    // Determine response actions based on incident type and severity
    const actions: SecurityAction[] = [];

    if (incident.type === 'attack') {
      actions.push({
        type: 'block',
        timestamp: Date.now(),
        description: `Block source ${incident.identifier}`,
        automated: true,
        result: 'pending'
      });
    }

    if (incident.severity === 'critical') {
      actions.push({
        type: 'escalate',
        timestamp: Date.now(),
        description: 'Emergency escalation to security team',
        automated: true,
        result: 'pending'
      });
    }

    // Execute actions
    for (const action of actions) {
      this.executeSecurityAction(incident, action);
      incident.actions.push(action);
    }
  }

  // Execute security action
  private executeSecurityAction(incident: SecurityIncident, action: SecurityAction): void {
    try {
      switch (action.type) {
        case 'block':
          this.blockSource(incident.identifier);
          action.result = 'success';
          break;
        case 'alert':
          this.sendSecurityAlert(incident);
          action.result = 'success';
          break;
        case 'captcha':
          this.requireCaptcha(incident.identifier);
          action.result = 'success';
          break;
        case 'escalate':
          this.escalateIncident(incident);
          action.result = 'success';
          break;
        case 'log':
          console.log('Security action logged:', action);
          action.result = 'success';
          break;
        default:
          action.result = 'failed';
      }
    } catch (error) {
      console.error('Failed to execute security action:', error);
      action.result = 'failed';
    }
  }

  // Block source
  private blockSource(identifier: string): void {
    // Block using brute force protection
    bruteForceProtection.lockoutIdentifier(identifier, 'all', 60 * 60 * 1000); // 1 hour
    
    // Block using rate limiter
    rateLimiter.blockIdentifier(identifier, 60 * 60 * 1000); // 1 hour
    
    console.log(`Source blocked: ${identifier}`);
  }

  // Send security alert
  private sendSecurityAlert(incident: SecurityIncident): void {
    // In a real implementation, this would send alerts via email, SMS, Slack, etc.
    console.warn('SECURITY ALERT:', {
      id: incident.id,
      severity: incident.severity,
      title: incident.title,
      timestamp: new Date(incident.timestamp).toISOString()
    });
  }

  // Require CAPTCHA for source
  private requireCaptcha(identifier: string): void {
    bruteForceProtection.generateCaptchaChallenge(identifier);
    console.log(`CAPTCHA required for: ${identifier}`);
  }

  // Escalate incident
  private escalateIncident(incident: SecurityIncident): void {
    // In a real implementation, this would notify security team
    console.error('INCIDENT ESCALATED:', {
      id: incident.id,
      severity: incident.severity,
      title: incident.title
    });
  }

  // Apply security policies to events
  private applySecurityPolicies(event: SecurityEvent): void {
    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;

      if (this.evaluateSecurityRules(event, policy.rules)) {
        this.executePolicyActions(event, policy.actions);
      }
    }
  }

  // Evaluate security rules
  private evaluateSecurityRules(event: SecurityEvent, rules: SecurityRule[]): boolean {
    return rules.every(rule => this.evaluateSecurityRule(event, rule));
  }

  // Evaluate single security rule
  private evaluateSecurityRule(event: SecurityEvent, rule: SecurityRule): boolean {
    const eventValue = this.getEventValue(event, rule.condition);
    let result = false;

    switch (rule.operator) {
      case 'equals':
        result = eventValue === rule.value;
        break;
      case 'contains':
        result = String(eventValue).includes(String(rule.value));
        break;
      case 'greater_than':
        result = eventValue > rule.value;
        break;
      case 'less_than':
        result = eventValue < rule.value;
        break;
      case 'regex':
        result = new RegExp(rule.value).test(String(eventValue));
        break;
    }

    return rule.negated ? !result : result;
  }

  // Get event value for rule condition
  private getEventValue(event: SecurityEvent, condition: string): any {
    switch (condition) {
      case 'endpoint':
        return event.endpoint;
      case 'severity':
        return event.severity;
      case 'type':
        return event.type;
      case 'identifier':
        return event.identifier;
      default:
        return event.metadata[condition];
    }
  }

  // Execute policy actions
  private executePolicyActions(event: SecurityEvent, actions: SecurityAction[]): void {
    for (const action of actions) {
      // Create incident for policy violations
      const incident: SecurityIncident = {
        id: this.generateIncidentId(),
        type: 'policy_violation',
        severity: event.severity,
        title: `Policy Violation: ${action.description}`,
        description: `Security policy triggered for ${event.identifier}`,
        timestamp: Date.now(),
        source: 'policy_engine',
        identifier: event.identifier,
        metadata: event.metadata,
        status: 'open',
        actions: [action]
      };

      this.executeSecurityAction(incident, action);
    }
  }

  // Perform security analysis
  private performSecurityAnalysis(): void {
    // Analyze recent events for patterns
    const recentEvents = this.getRecentEvents(60 * 60 * 1000); // Last hour
    
    // Check for suspicious patterns
    this.analyzeEventPatterns(recentEvents);
    
    // Update threat level
    this.updateThreatLevel(recentEvents);
  }

  // Analyze event patterns
  private analyzeEventPatterns(events: SecurityEvent[]): void {
    // Group events by identifier
    const eventsByIdentifier = this.groupEventsByIdentifier(events);
    
    // Look for suspicious patterns
    for (const [identifier, identifierEvents] of Object.entries(eventsByIdentifier)) {
      if (identifierEvents.length > 20) {
        this.generateSuspiciousActivityAlert(identifier, identifierEvents);
      }
    }
  }

  // Group events by identifier
  private groupEventsByIdentifier(events: SecurityEvent[]): Record<string, SecurityEvent[]> {
    return events.reduce((groups, event) => {
      if (!groups[event.identifier]) {
        groups[event.identifier] = [];
      }
      groups[event.identifier].push(event);
      return groups;
    }, {} as Record<string, SecurityEvent[]>);
  }

  // Group events by source for anomaly detection
  private groupEventsBySource(events: SecurityEvent[]): Record<string, number> {
    return events.reduce((groups, event) => {
      const source = event.metadata.ipAddress || event.identifier;
      groups[source] = (groups[source] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  // Generate suspicious activity alert
  private generateSuspiciousActivityAlert(identifier: string, events: SecurityEvent[]): void {
    const alert: SecurityAlert = {
      type: 'suspicious_activity',
      severity: 'medium',
      identifier,
      endpoint: 'multiple',
      description: `Suspicious activity pattern detected for ${identifier}`,
      timestamp: Date.now(),
      metadata: {
        eventCount: events.length,
        timeSpan: events[events.length - 1].timestamp - events[0].timestamp,
        endpoints: [...new Set(events.map(e => e.endpoint))]
      }
    };

    this.handleSecurityAlert(alert);
  }

  // Update threat level
  private updateThreatLevel(events: SecurityEvent[]): void {
    const threatLevel = this.calculateThreatLevel(events);
    this.metrics.systemHealth.status = this.mapThreatLevelToStatus(threatLevel.level);
  }

  // Calculate threat level
  private calculateThreatLevel(events: SecurityEvent[]): ThreatLevel {
    let score = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Count events by severity
    const severityCounts = this.countEventsBySeverity(events);
    
    // Calculate score based on severity
    score += (severityCounts.critical || 0) * 10;
    score += (severityCounts.high || 0) * 5;
    score += (severityCounts.medium || 0) * 2;
    score += (severityCounts.low || 0) * 1;

    // Add factors based on events
    if (severityCounts.critical > 0) {
      factors.push(`${severityCounts.critical} critical alerts`);
      recommendations.push('Immediate investigation required');
    }
    
    if (severityCounts.high > 5) {
      factors.push(`${severityCounts.high} high severity alerts`);
      recommendations.push('Enhanced monitoring recommended');
    }

    // Determine threat level
    let level: ThreatLevel['level'];
    if (score >= 50) level = 'critical';
    else if (score >= 20) level = 'high';
    else if (score >= 10) level = 'medium';
    else if (score >= 5) level = 'low';
    else level = 'none';

    return { level, score, factors, recommendations };
  }

  // Count events by severity
  private countEventsBySeverity(events: SecurityEvent[]): Record<string, number> {
    return events.reduce((counts, event) => {
      counts[event.severity] = (counts[event.severity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  // Map threat level to system status
  private mapThreatLevelToStatus(level: ThreatLevel['level']): SecurityMetrics['systemHealth']['status'] {
    switch (level) {
      case 'critical':
      case 'high':
        return 'critical';
      case 'medium':
        return 'warning';
      default:
        return 'healthy';
    }
  }

  // Detect anomalies using defined patterns
  private detectAnomalies(): void {
    const recentEvents = this.getRecentEvents(30 * 60 * 1000); // Last 30 minutes
    
    for (const pattern of this.anomalyPatterns) {
      if (pattern.detector(recentEvents)) {
        this.handleAnomalyDetection(pattern, recentEvents);
      }
    }
  }

  // Handle anomaly detection
  private handleAnomalyDetection(pattern: AnomalyPattern, events: SecurityEvent[]): void {
    const alert: SecurityAlert = {
      type: 'suspicious_activity',
      severity: 'high',
      identifier: 'system',
      endpoint: 'multiple',
      description: `Anomaly detected: ${pattern.description}`,
      timestamp: Date.now(),
      metadata: {
        pattern: pattern.name,
        eventCount: events.length,
        threshold: pattern.threshold,
        timeWindow: pattern.timeWindow
      }
    };

    this.handleSecurityAlert(alert);
  }

  // Get recent events within time window
  private getRecentEvents(timeWindow: number): SecurityEvent[] {
    const cutoff = Date.now() - timeWindow;
    return this.events.filter(event => event.timestamp > cutoff);
  }

  // Update security metrics
  private updateMetrics(): void {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    // Update alerts metrics
    this.metrics.alertsCount.total = this.alerts.length;
    this.metrics.alertsCount.last24h = this.alerts.filter(a => a.timestamp > last24h).length;

    // Update rate limiting metrics
    const rateLimitStats = rateLimiter.getStatistics();
    this.metrics.rateLimiting.totalBlocked = rateLimitStats.blockedIdentifiers || 0;

    // Update brute force metrics
    const bruteForceStats = bruteForceProtection.getStatistics();
    this.metrics.bruteForce.activeLockouts = bruteForceStats.activeLockouts || 0;
    this.metrics.bruteForce.captchaChallenges = bruteForceStats.activeCaptchas || 0;

    // Update system health
    this.metrics.systemHealth.uptime = now - this.metrics.systemHealth.uptime;
  }

  // Update alerts metrics
  private updateAlertsMetrics(alert: SecurityAlert): void {
    // Update by type
    this.metrics.alertsCount.byType[alert.type] = 
      (this.metrics.alertsCount.byType[alert.type] || 0) + 1;

    // Update by severity
    this.metrics.alertsCount.bySeverity[alert.severity] = 
      (this.metrics.alertsCount.bySeverity[alert.severity] || 0) + 1;
  }

  // Clean up old data
  private cleanupOldData(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    // Remove old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);

    // Remove old events
    this.events = this.events.filter(event => event.timestamp > cutoff);

    // Close old incidents
    for (const incident of this.incidents.values()) {
      if (incident.timestamp < cutoff && incident.status === 'open') {
        incident.status = 'resolved';
      }
    }
  }

  // Get security metrics
  public getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  // Get security incidents
  public getIncidents(status?: SecurityIncident['status']): SecurityIncident[] {
    const incidents = Array.from(this.incidents.values());
    return status ? incidents.filter(i => i.status === status) : incidents;
  }

  // Get security alerts
  public getAlerts(timeWindow?: number): SecurityAlert[] {
    if (!timeWindow) return [...this.alerts];
    
    const cutoff = Date.now() - timeWindow;
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  // Resolve incident
  public resolveIncident(incidentId: string, resolution: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;

    incident.status = 'resolved';
    incident.metadata.resolution = resolution;
    incident.metadata.resolvedAt = Date.now();

    return true;
  }

  // Add custom anomaly pattern
  public addAnomalyPattern(pattern: AnomalyPattern): void {
    this.anomalyPatterns.push(pattern);
  }

  // Destroy monitor and cleanup
  public destroy(): void {
    this.stopMonitoring();
    this.alerts.length = 0;
    this.incidents.clear();
    this.events.length = 0;
    this.policies.clear();
    this.anomalyPatterns.length = 0;
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

// React Hook for security monitoring
export function useSecurityMonitor() {
  const getMetrics = (): SecurityMetrics => {
    return securityMonitor.getMetrics();
  };

  const getIncidents = (status?: SecurityIncident['status']): SecurityIncident[] => {
    return securityMonitor.getIncidents(status);
  };

  const getAlerts = (timeWindow?: number): SecurityAlert[] => {
    return securityMonitor.getAlerts(timeWindow);
  };

  const resolveIncident = (incidentId: string, resolution: string): boolean => {
    return securityMonitor.resolveIncident(incidentId, resolution);
  };

  const startMonitoring = (): void => {
    securityMonitor.startMonitoring();
  };

  const stopMonitoring = (): void => {
    securityMonitor.stopMonitoring();
  };

  return {
    getMetrics,
    getIncidents,
    getAlerts,
    resolveIncident,
    startMonitoring,
    stopMonitoring
  };
}

export default securityMonitor;