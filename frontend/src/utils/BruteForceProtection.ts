// Brute Force Protection System for CineBook
// Advanced protection against automated attacks with progressive countermeasures

import { rateLimiter, type SecurityAlert } from './RateLimiter';

export interface BruteForceConfig {
  maxAttempts: number;
  timeWindow: number; // in milliseconds
  lockoutDuration: number; // in milliseconds
  progressiveDelay: boolean;
  captchaThreshold: number;
  alertThreshold: number;
  whitelistedIPs?: string[];
  trustedUserAgents?: string[];
}

export interface BruteForceAttempt {
  identifier: string;
  endpoint: string;
  timestamp: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  fingerprint?: string;
}

export interface BruteForceStatus {
  isBlocked: boolean;
  remainingAttempts: number;
  lockoutExpiry?: number;
  requiresCaptcha: boolean;
  delayMs: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProgressiveDelayConfig {
  baseDelay: number;
  multiplier: number;
  maxDelay: number;
  jitter: boolean;
}

export interface CaptchaChallenge {
  type: 'recaptcha' | 'hcaptcha' | 'image' | 'math';
  token: string;
  expires: number;
  attempts: number;
}

class BruteForceProtection {
  private static instance: BruteForceProtection;
  private attempts: Map<string, BruteForceAttempt[]>;
  private lockouts: Map<string, number>;
  private captchaChallenges: Map<string, CaptchaChallenge>;
  private configs: Map<string, BruteForceConfig>;
  private alertCallbacks: ((alert: SecurityAlert) => void)[];

  private constructor() {
    this.attempts = new Map();
    this.lockouts = new Map();
    this.captchaChallenges = new Map();
    this.configs = new Map();
    this.alertCallbacks = [];
    this.initializeDefaultConfigs();
    this.startCleanupTimer();
  }

  public static getInstance(): BruteForceProtection {
    if (!BruteForceProtection.instance) {
      BruteForceProtection.instance = new BruteForceProtection();
    }
    return BruteForceProtection.instance;
  }

  // Initialize default protection configurations
  private initializeDefaultConfigs(): void {
    // Login protection - highest security
    this.configs.set('login', {
      maxAttempts: 5,
      timeWindow: 15 * 60 * 1000, // 15 minutes
      lockoutDuration: 30 * 60 * 1000, // 30 minutes
      progressiveDelay: true,
      captchaThreshold: 3,
      alertThreshold: 2,
      trustedUserAgents: []
    });

    // Registration protection
    this.configs.set('register', {
      maxAttempts: 3,
      timeWindow: 60 * 60 * 1000, // 1 hour
      lockoutDuration: 60 * 60 * 1000, // 1 hour
      progressiveDelay: true,
      captchaThreshold: 2,
      alertThreshold: 1
    });

    // Password reset protection
    this.configs.set('password_reset', {
      maxAttempts: 3,
      timeWindow: 60 * 60 * 1000, // 1 hour
      lockoutDuration: 120 * 60 * 1000, // 2 hours
      progressiveDelay: true,
      captchaThreshold: 2,
      alertThreshold: 1
    });

    // Payment attempts protection
    this.configs.set('payment', {
      maxAttempts: 3,
      timeWindow: 30 * 60 * 1000, // 30 minutes
      lockoutDuration: 60 * 60 * 1000, // 1 hour
      progressiveDelay: true,
      captchaThreshold: 2,
      alertThreshold: 1
    });

    // Booking attempts protection
    this.configs.set('booking', {
      maxAttempts: 10,
      timeWindow: 10 * 60 * 1000, // 10 minutes
      lockoutDuration: 30 * 60 * 1000, // 30 minutes
      progressiveDelay: false,
      captchaThreshold: 7,
      alertThreshold: 5
    });

    // Admin access protection
    this.configs.set('admin', {
      maxAttempts: 3,
      timeWindow: 30 * 60 * 1000, // 30 minutes
      lockoutDuration: 120 * 60 * 1000, // 2 hours
      progressiveDelay: true,
      captchaThreshold: 1,
      alertThreshold: 1
    });
  }

  // Set custom protection configuration
  public setConfig(endpoint: string, config: BruteForceConfig): void {
    this.configs.set(endpoint, config);
  }

  // Check brute force protection status
  public checkProtection(
    identifier: string,
    endpoint: string,
    success: boolean = false,
    metadata: Record<string, any> = {}
  ): BruteForceStatus {
    const config = this.configs.get(endpoint);
    if (!config) {
      return {
        isBlocked: false,
        remainingAttempts: Infinity,
        requiresCaptcha: false,
        delayMs: 0,
        severity: 'low'
      };
    }

    // Check if IP is whitelisted
    if (this.isWhitelisted(metadata.ipAddress, config)) {
      return {
        isBlocked: false,
        remainingAttempts: config.maxAttempts,
        requiresCaptcha: false,
        delayMs: 0,
        severity: 'low'
      };
    }

    const now = Date.now();
    const key = this.generateKey(identifier, endpoint);

    // Check if currently locked out
    const lockoutExpiry = this.lockouts.get(key);
    if (lockoutExpiry && lockoutExpiry > now) {
      return {
        isBlocked: true,
        remainingAttempts: 0,
        lockoutExpiry,
        requiresCaptcha: true,
        delayMs: 0,
        severity: 'high'
      };
    }

    // Record the attempt
    this.recordAttempt({
      identifier,
      endpoint,
      timestamp: now,
      success,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      fingerprint: metadata.fingerprint
    });

    // Get recent attempts
    const recentAttempts = this.getRecentAttempts(key, config.timeWindow);
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);

    // Calculate remaining attempts
    const remainingAttempts = Math.max(0, config.maxAttempts - failedAttempts.length);

    // Check if protection should be triggered
    if (failedAttempts.length >= config.maxAttempts) {
      this.triggerLockout(key, config, failedAttempts);
      return {
        isBlocked: true,
        remainingAttempts: 0,
        lockoutExpiry: now + config.lockoutDuration,
        requiresCaptcha: true,
        delayMs: 0,
        severity: this.calculateSeverity(failedAttempts, config)
      };
    }

    // Check if captcha is required
    const requiresCaptcha = failedAttempts.length >= config.captchaThreshold;

    // Calculate progressive delay
    const delayMs = this.calculateProgressiveDelay(failedAttempts, config);

    // Generate alerts if threshold reached
    if (failedAttempts.length >= config.alertThreshold) {
      this.generateAlert(identifier, endpoint, failedAttempts, config);
    }

    return {
      isBlocked: false,
      remainingAttempts,
      requiresCaptcha,
      delayMs,
      severity: this.calculateSeverity(failedAttempts, config)
    };
  }

  // Check if IP is whitelisted
  private isWhitelisted(ipAddress: string | undefined, config: BruteForceConfig): boolean {
    if (!ipAddress || !config.whitelistedIPs) return false;
    return config.whitelistedIPs.includes(ipAddress);
  }

  // Generate unique key for tracking
  private generateKey(identifier: string, endpoint: string): string {
    return `${identifier}:${endpoint}`;
  }

  // Record brute force attempt
  private recordAttempt(attempt: BruteForceAttempt): void {
    const key = this.generateKey(attempt.identifier, attempt.endpoint);
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const attempts = this.attempts.get(key)!;
    attempts.push(attempt);
    
    // Keep only last 100 attempts to prevent memory leaks
    if (attempts.length > 100) {
      attempts.splice(0, attempts.length - 100);
    }
  }

  // Get recent attempts within time window
  private getRecentAttempts(key: string, timeWindow: number): BruteForceAttempt[] {
    const attempts = this.attempts.get(key) || [];
    const cutoff = Date.now() - timeWindow;
    return attempts.filter(attempt => attempt.timestamp > cutoff);
  }

  // Trigger lockout for identifier
  private triggerLockout(key: string, config: BruteForceConfig, failedAttempts: BruteForceAttempt[]): void {
    const now = Date.now();
    const lockoutDuration = this.calculateLockoutDuration(failedAttempts, config);
    this.lockouts.set(key, now + lockoutDuration);

    // Generate security alert
    const [identifier, endpoint] = key.split(':');
    this.generateAlert(identifier, endpoint, failedAttempts, config, true);
  }

  // Calculate lockout duration with progressive scaling
  private calculateLockoutDuration(failedAttempts: BruteForceAttempt[], config: BruteForceConfig): number {
    const excessAttempts = failedAttempts.length - config.maxAttempts;
    let multiplier = 1 + (excessAttempts * 0.5); // Increase duration by 50% for each excess attempt
    
    // Cap the multiplier to prevent excessive lockouts
    multiplier = Math.min(multiplier, 5);
    
    return config.lockoutDuration * multiplier;
  }

  // Calculate progressive delay for failed attempts
  private calculateProgressiveDelay(failedAttempts: BruteForceAttempt[], config: BruteForceConfig): number {
    if (!config.progressiveDelay || failedAttempts.length === 0) {
      return 0;
    }

    const delayConfig: ProgressiveDelayConfig = {
      baseDelay: 1000, // 1 second
      multiplier: 2,
      maxDelay: 30000, // 30 seconds
      jitter: true
    };

    let delay = delayConfig.baseDelay * Math.pow(delayConfig.multiplier, failedAttempts.length - 1);
    delay = Math.min(delay, delayConfig.maxDelay);

    // Add jitter to prevent thundering herd
    if (delayConfig.jitter) {
      delay += Math.random() * 1000;
    }

    return Math.floor(delay);
  }

  // Calculate severity based on attempt patterns
  private calculateSeverity(attempts: BruteForceAttempt[], config: BruteForceConfig): BruteForceStatus['severity'] {
    const failedAttempts = attempts.filter(a => !a.success).length;
    const ratio = failedAttempts / config.maxAttempts;

    if (ratio >= 2) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1) return 'medium';
    return 'low';
  }

  // Generate CAPTCHA challenge
  public generateCaptchaChallenge(identifier: string, type: CaptchaChallenge['type'] = 'recaptcha'): CaptchaChallenge {
    const challenge: CaptchaChallenge = {
      type,
      token: this.generateCaptchaToken(),
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0
    };

    this.captchaChallenges.set(identifier, challenge);
    return challenge;
  }

  // Verify CAPTCHA challenge
  public verifyCaptcha(identifier: string, response: string): boolean {
    const challenge = this.captchaChallenges.get(identifier);
    if (!challenge) return false;

    challenge.attempts++;

    // Check if challenge expired
    if (challenge.expires < Date.now()) {
      this.captchaChallenges.delete(identifier);
      return false;
    }

    // Check if too many attempts
    if (challenge.attempts > 3) {
      this.captchaChallenges.delete(identifier);
      return false;
    }

    // Verify response (simplified for demo)
    const isValid = this.validateCaptchaResponse(challenge, response);
    
    if (isValid) {
      this.captchaChallenges.delete(identifier);
    }

    return isValid;
  }

  // Generate CAPTCHA token
  private generateCaptchaToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Validate CAPTCHA response (mock implementation)
  private validateCaptchaResponse(challenge: CaptchaChallenge, response: string): boolean {
    // In a real implementation, this would validate against the CAPTCHA service
    // For demo purposes, we'll accept any non-empty response
    return Boolean(response && response.length > 0);
  }

  // Generate security alert
  private generateAlert(
    identifier: string,
    endpoint: string,
    attempts: BruteForceAttempt[],
    config: BruteForceConfig,
    isLockout: boolean = false
  ): void {
    const alert: SecurityAlert = {
      type: isLockout ? 'attack_detected' : 'suspicious_activity',
      severity: this.calculateSeverity(attempts, config),
      identifier,
      endpoint,
      description: isLockout 
        ? `Brute force attack detected and blocked for ${endpoint}`
        : `Suspicious activity detected for ${endpoint}`,
      timestamp: Date.now(),
      metadata: {
        failedAttempts: attempts.filter(a => !a.success).length,
        totalAttempts: attempts.length,
        timeWindow: config.timeWindow,
        lockoutDuration: config.lockoutDuration,
        isLockout,
        ipAddresses: [...new Set(attempts.map(a => a.ipAddress).filter(Boolean))],
        userAgents: [...new Set(attempts.map(a => a.userAgent).filter(Boolean))]
      }
    };

    console.warn('Brute Force Protection Alert:', alert);
    
    // Notify rate limiter and other alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  // Register alert callback
  public onAlert(callback: (alert: SecurityAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  // Remove alert callback
  public removeAlertCallback(callback: (alert: SecurityAlert) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  // Manually lockout identifier
  public lockoutIdentifier(identifier: string, endpoint: string, duration?: number): void {
    const config = this.configs.get(endpoint);
    const lockoutDuration = duration || (config?.lockoutDuration ?? 60 * 60 * 1000);
    const key = this.generateKey(identifier, endpoint);
    
    this.lockouts.set(key, Date.now() + lockoutDuration);
  }

  // Remove lockout for identifier
  public removeLockout(identifier: string, endpoint: string): void {
    const key = this.generateKey(identifier, endpoint);
    this.lockouts.delete(key);
  }

  // Check if identifier is locked out
  public isLockedOut(identifier: string, endpoint: string): boolean {
    const key = this.generateKey(identifier, endpoint);
    const lockoutExpiry = this.lockouts.get(key);
    
    if (!lockoutExpiry) return false;
    
    if (lockoutExpiry <= Date.now()) {
      this.lockouts.delete(key);
      return false;
    }
    
    return true;
  }

  // Reset protection for identifier
  public resetProtection(identifier: string, endpoint?: string): void {
    if (endpoint) {
      const key = this.generateKey(identifier, endpoint);
      this.attempts.delete(key);
      this.lockouts.delete(key);
    } else {
      // Reset all endpoints for identifier
      const keysToDelete = [];
      
      for (const key of this.attempts.keys()) {
        if (key.startsWith(identifier + ':')) {
          keysToDelete.push(key);
        }
      }
      
      for (const key of this.lockouts.keys()) {
        if (key.startsWith(identifier + ':')) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => {
        this.attempts.delete(key);
        this.lockouts.delete(key);
      });
    }
    
    this.captchaChallenges.delete(identifier);
  }

  // Get protection statistics
  public getStatistics(): Record<string, any> {
    const now = Date.now();
    
    return {
      totalAttempts: Array.from(this.attempts.values()).reduce((sum, attempts) => sum + attempts.length, 0),
      activeLockouts: Array.from(this.lockouts.values()).filter(expiry => expiry > now).length,
      activeCaptchas: this.captchaChallenges.size,
      configuredEndpoints: this.configs.size,
      protectionConfigs: Object.fromEntries(this.configs)
    };
  }

  // Cleanup expired data
  private cleanup(): void {
    const now = Date.now();

    // Remove expired lockouts
    for (const [key, expiry] of this.lockouts.entries()) {
      if (expiry <= now) {
        this.lockouts.delete(key);
      }
    }

    // Remove expired CAPTCHA challenges
    for (const [identifier, challenge] of this.captchaChallenges.entries()) {
      if (challenge.expires <= now) {
        this.captchaChallenges.delete(identifier);
      }
    }

    // Remove old attempts (older than 24 hours)
    const cutoff = now - 24 * 60 * 60 * 1000;
    for (const [key, attempts] of this.attempts.entries()) {
      const filteredAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
      if (filteredAttempts.length === 0) {
        this.attempts.delete(key);
      } else if (filteredAttempts.length !== attempts.length) {
        this.attempts.set(key, filteredAttempts);
      }
    }
  }

  // Start cleanup timer
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  // Destroy instance and cleanup
  public destroy(): void {
    this.attempts.clear();
    this.lockouts.clear();
    this.captchaChallenges.clear();
    this.configs.clear();
    this.alertCallbacks.length = 0;
  }
}

// Export singleton instance
export const bruteForceProtection = BruteForceProtection.getInstance();

// React Hook for brute force protection
export function useBruteForceProtection(endpoint: string) {
  const checkProtection = (
    identifier: string,
    success: boolean = false,
    metadata: Record<string, any> = {}
  ): BruteForceStatus => {
    return bruteForceProtection.checkProtection(identifier, endpoint, success, metadata);
  };

  const isLockedOut = (identifier: string): boolean => {
    return bruteForceProtection.isLockedOut(identifier, endpoint);
  };

  const generateCaptcha = (identifier: string): CaptchaChallenge => {
    return bruteForceProtection.generateCaptchaChallenge(identifier);
  };

  const verifyCaptcha = (identifier: string, response: string): boolean => {
    return bruteForceProtection.verifyCaptcha(identifier, response);
  };

  const resetProtection = (identifier: string): void => {
    bruteForceProtection.resetProtection(identifier, endpoint);
  };

  return {
    checkProtection,
    isLockedOut,
    generateCaptcha,
    verifyCaptcha,
    resetProtection
  };
}

export default bruteForceProtection;