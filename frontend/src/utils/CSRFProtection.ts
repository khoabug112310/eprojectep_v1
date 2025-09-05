// CSRF Protection and Security Headers Implementation for CineBook
// Comprehensive protection against Cross-Site Request Forgery and other security threats

import { useEffect, useState, useCallback } from 'react';

export interface CSRFConfig {
  tokenName: string;
  headerName: string;
  cookieName: string;
  tokenLifetime: number; // in milliseconds
  rotationThreshold: number; // rotate token when this % of lifetime remains
  secureTransport: boolean;
  sameSitePolicy: 'strict' | 'lax' | 'none';
}

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
  'X-XSS-Protection': string;
}

export interface CSRFToken {
  value: string;
  timestamp: number;
  expires: number;
  domain: string;
  path: string;
}

export interface SecurityPolicyConfig {
  contentSecurityPolicy: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
    objectSrc: string[];
    mediaSrc: string[];
    frameSrc: string[];
  };
  permissionsPolicy: {
    camera: string[];
    microphone: string[];
    geolocation: string[];
    gyroscope: string[];
    magnetometer: string[];
    payment: string[];
  };
}

class CSRFProtection {
  private static instance: CSRFProtection;
  private config: CSRFConfig;
  private currentToken: CSRFToken | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  private constructor(config: Partial<CSRFConfig> = {}) {
    this.config = {
      tokenName: '_csrf_token',
      headerName: 'X-CSRF-Token',
      cookieName: 'XSRF-TOKEN',
      tokenLifetime: 30 * 60 * 1000, // 30 minutes
      rotationThreshold: 0.2, // rotate when 20% lifetime remains
      secureTransport: true,
      sameSitePolicy: 'strict',
      ...config
    };
    
    this.initializeToken();
  }

  public static getInstance(config?: Partial<CSRFConfig>): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection(config);
    }
    return CSRFProtection.instance;
  }

  // Initialize CSRF token
  private async initializeToken(): Promise<void> {
    try {
      // Check if we have a valid existing token
      const existingToken = this.getStoredToken();
      
      if (existingToken && this.isTokenValid(existingToken)) {
        this.currentToken = existingToken;
        this.scheduleTokenRotation();
      } else {
        await this.generateNewToken();
      }
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error);
      await this.generateNewToken();
    }
  }

  // Generate new CSRF token
  private async generateNewToken(): Promise<void> {
    try {
      // In a real implementation, this would be a server call
      // For now, we'll generate a client-side token for demo purposes
      const tokenValue = this.generateSecureToken();
      const now = Date.now();
      
      this.currentToken = {
        value: tokenValue,
        timestamp: now,
        expires: now + this.config.tokenLifetime,
        domain: window.location.hostname,
        path: '/'
      };
      
      this.storeToken(this.currentToken);
      this.scheduleTokenRotation();
      
      // Set in cookie for automatic inclusion in requests
      this.setCookie();
      
    } catch (error) {
      console.error('Failed to generate CSRF token:', error);
      throw new Error('CSRF token generation failed');
    }
  }

  // Generate cryptographically secure token
  private generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Store token in localStorage with encryption
  private storeToken(token: CSRFToken): void {
    try {
      const encrypted = this.encryptToken(JSON.stringify(token));
      localStorage.setItem(this.config.tokenName, encrypted);
    } catch (error) {
      console.error('Failed to store CSRF token:', error);
    }
  }

  // Retrieve stored token
  private getStoredToken(): CSRFToken | null {
    try {
      const stored = localStorage.getItem(this.config.tokenName);
      if (!stored) return null;
      
      const decrypted = this.decryptToken(stored);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to retrieve CSRF token:', error);
      return null;
    }
  }

  // Simple encryption for token storage (in production, use stronger encryption)
  private encryptToken(token: string): string {
    return btoa(token); // Base64 encoding for demo - use proper encryption in production
  }

  // Simple decryption for token retrieval
  private decryptToken(encryptedToken: string): string {
    return atob(encryptedToken); // Base64 decoding for demo
  }

  // Check if token is valid and not expired
  private isTokenValid(token: CSRFToken): boolean {
    const now = Date.now();
    return token.expires > now && token.value.length > 0;
  }

  // Check if token needs rotation
  private shouldRotateToken(token: CSRFToken): boolean {
    const now = Date.now();
    const timeRemaining = token.expires - now;
    const rotationTime = this.config.tokenLifetime * this.config.rotationThreshold;
    return timeRemaining <= rotationTime;
  }

  // Schedule token rotation
  private scheduleTokenRotation(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    
    if (!this.currentToken) return;
    
    const now = Date.now();
    const rotationTime = this.config.tokenLifetime * this.config.rotationThreshold;
    const timeUntilRotation = (this.currentToken.expires - now) - rotationTime;
    
    if (timeUntilRotation > 0) {
      this.tokenRefreshTimer = setTimeout(() => {
        this.rotateToken();
      }, timeUntilRotation);
    }
  }

  // Rotate token proactively
  private async rotateToken(): Promise<void> {
    try {
      await this.generateNewToken();
      console.log('CSRF token rotated successfully');
    } catch (error) {
      console.error('Failed to rotate CSRF token:', error);
    }
  }

  // Set CSRF token in cookie
  private setCookie(): void {
    if (!this.currentToken) return;
    
    const cookieAttributes = [
      `${this.config.cookieName}=${this.currentToken.value}`,
      `Path=${this.currentToken.path}`,
      `Domain=${this.currentToken.domain}`,
      `Max-Age=${Math.floor(this.config.tokenLifetime / 1000)}`,
      `SameSite=${this.config.sameSitePolicy}`
    ];
    
    if (this.config.secureTransport) {
      cookieAttributes.push('Secure');
    }
    
    document.cookie = cookieAttributes.join('; ');
  }

  // Get current CSRF token
  public getToken(): string | null {
    if (!this.currentToken || !this.isTokenValid(this.currentToken)) {
      return null;
    }
    
    // Check if token needs rotation
    if (this.shouldRotateToken(this.currentToken)) {
      this.rotateToken();
    }
    
    return this.currentToken.value;
  }

  // Get CSRF token for headers
  public getTokenHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { [this.config.headerName]: token } : {};
  }

  // Validate incoming token (for form submissions)
  public validateToken(submittedToken: string): boolean {
    const currentToken = this.getToken();
    return currentToken === submittedToken;
  }

  // Clean up
  public destroy(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    localStorage.removeItem(this.config.tokenName);
    this.currentToken = null;
  }
}

// Security Headers Manager
class SecurityHeadersManager {
  private static instance: SecurityHeadersManager;
  private policyConfig: SecurityPolicyConfig;

  private constructor() {
    this.policyConfig = this.getDefaultPolicyConfig();
  }

  public static getInstance(): SecurityHeadersManager {
    if (!SecurityHeadersManager.instance) {
      SecurityHeadersManager.instance = new SecurityHeadersManager();
    }
    return SecurityHeadersManager.instance;
  }

  // Get default security policy configuration
  private getDefaultPolicyConfig(): SecurityPolicyConfig {
    return {
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://api.cinebook.com', 'wss:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'https:'],
        frameSrc: ["'none'"]
      },
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: ["'self'"],
        gyroscope: [],
        magnetometer: [],
        payment: ["'self'"]
      }
    };
  }

  // Generate Content Security Policy header
  public generateCSP(): string {
    const policy = this.policyConfig.contentSecurityPolicy;
    
    const directives = Object.entries(policy).map(([directive, sources]) => {
      const directiveName = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${directiveName} ${sources.join(' ')}`;
    });
    
    return directives.join('; ');
  }

  // Generate Permissions Policy header
  public generatePermissionsPolicy(): string {
    const policy = this.policyConfig.permissionsPolicy;
    
    const directives = Object.entries(policy).map(([feature, allowlist]) => {
      if (allowlist.length === 0) {
        return `${feature}=()`;
      }
      return `${feature}=(${allowlist.join(' ')})`;
    });
    
    return directives.join(', ');
  }

  // Get all security headers
  public getSecurityHeaders(): SecurityHeaders {
    return {
      'Content-Security-Policy': this.generateCSP(),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': this.generatePermissionsPolicy(),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-XSS-Protection': '1; mode=block'
    };
  }

  // Apply security headers to meta tags (for client-side enforcement)
  public applyMetaHeaders(): void {
    const headers = this.getSecurityHeaders();
    
    Object.entries(headers).forEach(([name, content]) => {
      let metaTag = document.querySelector(`meta[http-equiv="${name}"]`) as HTMLMetaElement;
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.httpEquiv = name;
        document.head.appendChild(metaTag);
      }
      
      metaTag.content = content;
    });
  }

  // Update CSP configuration
  public updateCSP(updates: Partial<SecurityPolicyConfig['contentSecurityPolicy']>): void {
    this.policyConfig.contentSecurityPolicy = {
      ...this.policyConfig.contentSecurityPolicy,
      ...updates
    };
    this.applyMetaHeaders();
  }

  // Add allowed source to CSP directive
  public addCSPSource(directive: keyof SecurityPolicyConfig['contentSecurityPolicy'], source: string): void {
    if (!this.policyConfig.contentSecurityPolicy[directive].includes(source)) {
      this.policyConfig.contentSecurityPolicy[directive].push(source);
      this.applyMetaHeaders();
    }
  }

  // Remove source from CSP directive
  public removeCSPSource(directive: keyof SecurityPolicyConfig['contentSecurityPolicy'], source: string): void {
    const index = this.policyConfig.contentSecurityPolicy[directive].indexOf(source);
    if (index > -1) {
      this.policyConfig.contentSecurityPolicy[directive].splice(index, 1);
      this.applyMetaHeaders();
    }
  }
}

// React Hook for CSRF protection
export function useCSRFProtection(config?: Partial<CSRFConfig>) {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const csrf = CSRFProtection.getInstance(config);
    
    const initializeCSRF = async () => {
      try {
        const token = csrf.getToken();
        setCSRFToken(token);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize CSRF protection:', error);
        setIsInitialized(true);
      }
    };
    
    initializeCSRF();
    
    // Set up token refresh interval
    const refreshInterval = setInterval(() => {
      const token = csrf.getToken();
      setCSRFToken(token);
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [config]);

  const getTokenHeader = useCallback((): Record<string, string> => {
    const csrf = CSRFProtection.getInstance();
    return csrf.getTokenHeader();
  }, []);

  const validateToken = useCallback((token: string): boolean => {
    const csrf = CSRFProtection.getInstance();
    return csrf.validateToken(token);
  }, []);

  return {
    token: csrfToken,
    isInitialized,
    getTokenHeader,
    validateToken
  };
}

// React Hook for security headers
export function useSecurityHeaders() {
  const [headersApplied, setHeadersApplied] = useState(false);
  
  useEffect(() => {
    const securityManager = SecurityHeadersManager.getInstance();
    
    try {
      securityManager.applyMetaHeaders();
      setHeadersApplied(true);
    } catch (error) {
      console.error('Failed to apply security headers:', error);
    }
  }, []);

  const updateCSP = useCallback((updates: Partial<SecurityPolicyConfig['contentSecurityPolicy']>) => {
    const securityManager = SecurityHeadersManager.getInstance();
    securityManager.updateCSP(updates);
  }, []);

  const addCSPSource = useCallback((directive: keyof SecurityPolicyConfig['contentSecurityPolicy'], source: string) => {
    const securityManager = SecurityHeadersManager.getInstance();
    securityManager.addCSPSource(directive, source);
  }, []);

  const removeCSPSource = useCallback((directive: keyof SecurityPolicyConfig['contentSecurityPolicy'], source: string) => {
    const securityManager = SecurityHeadersManager.getInstance();
    securityManager.removeCSPSource(directive, source);
  }, []);

  return {
    headersApplied,
    updateCSP,
    addCSPSource,
    removeCSPSource
  };
}

// Higher-order component for CSRF protection
export function withCSRFProtection<T extends Record<string, any>>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function CSRFProtectedComponent(props: T) {
    const { token, isInitialized } = useCSRFProtection();
    
    if (!isInitialized) {
      return <div>Initializing security...</div>;
    }
    
    return <Component {...props} csrfToken={token} />;
  };
}

// Enhanced fetch wrapper with CSRF protection
export async function securedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrf = CSRFProtection.getInstance();
  const csrfHeaders = csrf.getTokenHeader();
  
  const securedOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders,
      ...options.headers
    },
    credentials: 'same-origin'
  };
  
  try {
    const response = await fetch(url, securedOptions);
    
    // Check for CSRF token mismatch
    if (response.status === 403) {
      const errorText = await response.text();
      if (errorText.includes('CSRF')) {
        // Force token refresh and retry once
        await csrf.rotateToken();
        const newHeaders = csrf.getTokenHeader();
        
        return fetch(url, {
          ...securedOptions,
          headers: {
            ...securedOptions.headers,
            ...newHeaders
          }
        });
      }
    }
    
    return response;
  } catch (error) {
    console.error('Secured fetch failed:', error);
    throw error;
  }
}

// Export singleton instances
export const csrfProtection = CSRFProtection.getInstance();
export const securityHeaders = SecurityHeadersManager.getInstance();

export default {
  csrfProtection,
  securityHeaders,
  useCSRFProtection,
  useSecurityHeaders,
  withCSRFProtection,
  securedFetch
};