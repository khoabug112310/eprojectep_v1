// Advanced Input Sanitization and XSS Protection Utilities for CineBook
// Comprehensive security layer for all user inputs and data handling

import DOMPurify from 'dompurify';

export interface SanitizationConfig {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowedProtocols?: string[];
  stripIgnoreTag?: boolean;
  stripIgnoreTagBody?: string[];
  forbiddenTags?: string[];
  forbiddenAttributes?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  originalValue: string;
  threats: SecurityThreat[];
  confidence: number;
}

export interface SecurityThreat {
  type: 'xss' | 'injection' | 'malformed' | 'suspicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  pattern: string;
  recommendation: string;
}

export interface SecurityContext {
  userRole: 'guest' | 'user' | 'admin';
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  previousViolations?: number;
}

class InputSanitizer {
  private static instance: InputSanitizer;
  private threatPatterns: Map<string, RegExp>;
  private allowedProtocols: Set<string>;
  private dangerousPatterns: RegExp[];

  private constructor() {
    this.initializeThreatPatterns();
    this.initializeAllowedProtocols();
    this.initializeDangerousPatterns();
    this.configureDOMPurify();
  }

  public static getInstance(): InputSanitizer {
    if (!InputSanitizer.instance) {
      InputSanitizer.instance = new InputSanitizer();
    }
    return InputSanitizer.instance;
  }

  // Initialize known threat patterns
  private initializeThreatPatterns(): void {
    this.threatPatterns = new Map([
      // XSS Patterns
      ['script_injection', /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi],
      ['javascript_protocol', /javascript\s*:/gi],
      ['vbscript_protocol', /vbscript\s*:/gi],
      ['data_protocol', /data\s*:/gi],
      ['on_event_handlers', /\bon\w+\s*=/gi],
      ['style_expression', /expression\s*\(/gi],
      ['iframe_injection', /<iframe\b[^>]*>/gi],
      ['object_embed', /<(object|embed)\b[^>]*>/gi],
      
      // SQL Injection Patterns
      ['sql_union', /(\bunion\b.*\bselect\b)|(\bselect\b.*\bunion\b)/gi],
      ['sql_injection', /('\s*(or|and)\s*'?\d+|'\s*(or|and)\s*'?\w+\s*=\s*'?\w*'?)/gi],
      ['sql_comments', /(--|\#|\/\*|\*\/)/g],
      
      // Path Traversal
      ['path_traversal', /\.\.[\/\\]/g],
      ['absolute_path', /^[\/\\]/g],
      
      // HTML/XML Injection
      ['html_injection', /<[^>]*>/g],
      ['xml_injection', /<\?xml\b[^>]*>/gi],
      ['cdata_injection', /<!\[CDATA\[.*?\]\]>/gi],
      
      // Command Injection
      ['command_injection', /[;&|`$(){}[\]]/g],
      ['shell_metacharacters', /[<>|&;`]/g],
      
      // LDAP Injection
      ['ldap_injection', /[()=*!&|]/g],
      
      // Email Header Injection
      ['email_injection', /[\r\n]+(to|cc|bcc|subject):/gi],
      
      // Suspicious Patterns
      ['base64_suspicious', /(?:data:.*base64|base64.*data:)/gi],
      ['encoded_script', /%3c%73%63%72%69%70%74|%3cscript/gi],
      ['unicode_bypass', /[\u0000-\u001f\u007f-\u009f]/g]
    ]);
  }

  // Initialize allowed protocols for URLs
  private initializeAllowedProtocols(): void {
    this.allowedProtocols = new Set([
      'http',
      'https',
      'mailto',
      'tel',
      'ftp',
      'ftps'
    ]);
  }

  // Initialize dangerous patterns for additional checks
  private initializeDangerousPatterns(): void {
    this.dangerousPatterns = [
      // Polyglot payloads
      /jaVasCript:|data:|vbscript:/gi,
      
      // Filter bypass attempts
      /j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi,
      
      // HTML entity bypass
      /&#[x]?[0-9a-f]+;?/gi,
      
      // CSS injection
      /expression\s*\(|@import|javascript\s*:/gi,
      
      // SVG injection
      /<svg[^>]*>.*?<\/svg>/gi,
      
      // Template injection
      /\{\{.*?\}\}|\$\{.*?\}/g,
      
      // Server-side includes
      /<!--#(exec|include|echo|config)/gi
    ];
  }

  // Configure DOMPurify with strict settings
  private configureDOMPurify(): void {
    // Configure DOMPurify for maximum security
    DOMPurify.setConfig({
      WHOLE_DOCUMENT: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
      SANITIZE_DOM: true,
      KEEP_CONTENT: false,
      IN_PLACE: false,
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):)/i,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
      USE_PROFILES: { html: true }
    });
  }

  // Main sanitization method
  public sanitize(
    input: string, 
    context: SecurityContext = { userRole: 'guest' },
    config: SanitizationConfig = {}
  ): ValidationResult {
    if (!input || typeof input !== 'string') {
      return {
        isValid: true,
        sanitizedValue: '',
        originalValue: input || '',
        threats: [],
        confidence: 1.0
      };
    }

    const originalValue = input;
    const threats: SecurityThreat[] = [];
    
    // Step 1: Detect threats
    const detectedThreats = this.detectThreats(input);
    threats.push(...detectedThreats);
    
    // Step 2: Apply base sanitization
    let sanitizedValue = this.baseSanitize(input);
    
    // Step 3: Apply DOMPurify for HTML content
    if (this.containsHTML(sanitizedValue)) {
      sanitizedValue = DOMPurify.sanitize(sanitizedValue, this.getDOMPurifyConfig(config));
    }
    
    // Step 4: Apply context-specific sanitization
    sanitizedValue = this.contextSpecificSanitization(sanitizedValue, context);
    
    // Step 5: Final validation
    const finalThreats = this.detectThreats(sanitizedValue);
    
    // Calculate confidence based on threat reduction
    const confidence = this.calculateConfidence(threats.length, finalThreats.length);
    
    return {
      isValid: finalThreats.length === 0,
      sanitizedValue,
      originalValue,
      threats: [...threats, ...finalThreats],
      confidence
    };
  }

  // Detect security threats in input
  private detectThreats(input: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    
    // Check against known threat patterns
    this.threatPatterns.forEach((pattern, type) => {
      const matches = input.match(pattern);
      if (matches) {
        threats.push({
          type: this.categorizeThreat(type),
          severity: this.determineSeverity(type),
          description: `Detected ${type.replace('_', ' ')} pattern`,
          pattern: matches[0],
          recommendation: this.getRecommendation(type)
        });
      }
    });
    
    // Check against dangerous patterns
    this.dangerousPatterns.forEach((pattern, index) => {
      const matches = input.match(pattern);
      if (matches) {
        threats.push({
          type: 'suspicious',
          severity: 'medium',
          description: `Detected suspicious pattern #${index + 1}`,
          pattern: matches[0],
          recommendation: 'Remove or escape suspicious content'
        });
      }
    });
    
    return threats;
  }

  // Base sanitization without HTML parsing
  private baseSanitize(input: string): string {
    let sanitized = input;
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Remove control characters except tab, newline, carriage return
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Decode HTML entities to prevent bypass
    sanitized = this.decodeHTMLEntities(sanitized);
    
    // Remove dangerous protocols
    sanitized = this.sanitizeProtocols(sanitized);
    
    return sanitized;
  }

  // Check if input contains HTML
  private containsHTML(input: string): boolean {
    return /<[^>]*>/g.test(input);
  }

  // Get DOMPurify configuration based on context
  private getDOMPurifyConfig(config: SanitizationConfig): any {
    return {
      ALLOWED_TAGS: config.allowedTags || ['b', 'i', 'em', 'strong'],
      ALLOWED_ATTR: config.allowedAttributes || [],
      FORBID_TAGS: config.forbiddenTags || ['script', 'style', 'iframe'],
      FORBID_ATTR: config.forbiddenAttributes || ['onerror', 'onload', 'onclick']
    };
  }

  // Context-specific sanitization
  private contextSpecificSanitization(input: string, context: SecurityContext): string {
    let sanitized = input;
    
    switch (context.userRole) {
      case 'guest':
        // Strictest sanitization for guests
        sanitized = sanitized.replace(/[<>"'&]/g, '');
        break;
        
      case 'user':
        // Moderate sanitization for authenticated users
        sanitized = this.escapeHTML(sanitized);
        break;
        
      case 'admin':
        // Less strict but still secure for admin users
        sanitized = DOMPurify.sanitize(sanitized);
        break;
    }
    
    return sanitized;
  }

  // Decode HTML entities
  private decodeHTMLEntities(input: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = input;
    return textarea.value;
  }

  // Sanitize protocols in URLs
  private sanitizeProtocols(input: string): string {
    const urlPattern = /(?:href|src|action)\s*=\s*["']?([^"'\s>]+)/gi;
    
    return input.replace(urlPattern, (match, url) => {
      try {
        const parsedUrl = new URL(url);
        if (this.allowedProtocols.has(parsedUrl.protocol.slice(0, -1))) {
          return match;
        }
      } catch {
        // Invalid URL, remove it
      }
      return '';
    });
  }

  // Escape HTML characters
  private escapeHTML(input: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return input.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
  }

  // Categorize threat type
  private categorizeThreat(patternType: string): SecurityThreat['type'] {
    if (patternType.includes('script') || patternType.includes('javascript')) {
      return 'xss';
    }
    if (patternType.includes('sql') || patternType.includes('injection')) {
      return 'injection';
    }
    if (patternType.includes('malformed') || patternType.includes('invalid')) {
      return 'malformed';
    }
    return 'suspicious';
  }

  // Determine threat severity
  private determineSeverity(patternType: string): SecurityThreat['severity'] {
    const criticalPatterns = ['script_injection', 'sql_injection', 'command_injection'];
    const highPatterns = ['javascript_protocol', 'iframe_injection', 'path_traversal'];
    const mediumPatterns = ['html_injection', 'on_event_handlers'];
    
    if (criticalPatterns.includes(patternType)) return 'critical';
    if (highPatterns.includes(patternType)) return 'high';
    if (mediumPatterns.includes(patternType)) return 'medium';
    return 'low';
  }

  // Get security recommendation
  private getRecommendation(patternType: string): string {
    const recommendations: Record<string, string> = {
      'script_injection': 'Remove all script tags and validate input server-side',
      'javascript_protocol': 'Use only allowed protocols (http, https, mailto, tel)',
      'sql_injection': 'Use parameterized queries and validate input',
      'path_traversal': 'Validate file paths and use allowlists',
      'html_injection': 'Escape HTML entities or use allowlisted tags only',
      'command_injection': 'Validate input and use safe APIs instead of shell commands'
    };
    
    return recommendations[patternType] || 'Validate and sanitize input according to expected format';
  }

  // Calculate confidence score
  private calculateConfidence(originalThreats: number, remainingThreats: number): number {
    if (originalThreats === 0) return 1.0;
    const threatsRemoved = originalThreats - remainingThreats;
    return Math.max(0, threatsRemoved / originalThreats);
  }

  // Specialized sanitizers for different input types
  public sanitizeEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = this.baseSanitize(email);
    
    return {
      isValid: emailRegex.test(sanitized),
      sanitizedValue: sanitized,
      originalValue: email,
      threats: emailRegex.test(sanitized) ? [] : [{
        type: 'malformed',
        severity: 'medium',
        description: 'Invalid email format',
        pattern: email,
        recommendation: 'Use valid email format: user@domain.com'
      }],
      confidence: emailRegex.test(sanitized) ? 1.0 : 0.0
    };
  }

  public sanitizePhoneNumber(phone: string): ValidationResult {
    // Vietnamese phone number pattern
    const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
    const sanitized = phone.replace(/[^\d+]/g, '');
    
    return {
      isValid: phoneRegex.test(sanitized),
      sanitizedValue: sanitized,
      originalValue: phone,
      threats: phoneRegex.test(sanitized) ? [] : [{
        type: 'malformed',
        severity: 'low',
        description: 'Invalid phone number format',
        pattern: phone,
        recommendation: 'Use Vietnamese phone number format: +84xxxxxxxxx'
      }],
      confidence: phoneRegex.test(sanitized) ? 1.0 : 0.0
    };
  }

  public sanitizeURL(url: string, context: SecurityContext = { userRole: 'guest' }): ValidationResult {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol.slice(0, -1);
      
      if (!this.allowedProtocols.has(protocol)) {
        return {
          isValid: false,
          sanitizedValue: '',
          originalValue: url,
          threats: [{
            type: 'suspicious',
            severity: 'high',
            description: `Dangerous protocol: ${protocol}`,
            pattern: protocol,
            recommendation: 'Use only allowed protocols: http, https, mailto, tel'
          }],
          confidence: 0.0
        };
      }
      
      // Additional checks for admin context
      if (context.userRole === 'admin') {
        // Allow more flexibility for admin users
        return {
          isValid: true,
          sanitizedValue: url,
          originalValue: url,
          threats: [],
          confidence: 1.0
        };
      }
      
      return {
        isValid: true,
        sanitizedValue: url,
        originalValue: url,
        threats: [],
        confidence: 1.0
      };
      
    } catch (error) {
      return {
        isValid: false,
        sanitizedValue: '',
        originalValue: url,
        threats: [{
          type: 'malformed',
          severity: 'medium',
          description: 'Invalid URL format',
          pattern: url,
          recommendation: 'Provide a valid URL with protocol'
        }],
        confidence: 0.0
      };
    }
  }

  public sanitizeFilename(filename: string): ValidationResult {
    // Remove dangerous characters from filename
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/g;
    const sanitized = filename.replace(dangerousChars, '_');
    
    // Check for reserved names
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    const isReserved = reservedNames.test(sanitized);
    
    return {
      isValid: !isReserved && sanitized.length > 0 && sanitized.length <= 255,
      sanitizedValue: sanitized,
      originalValue: filename,
      threats: isReserved ? [{
        type: 'suspicious',
        severity: 'medium',
        description: 'Reserved filename detected',
        pattern: filename,
        recommendation: 'Use a different filename'
      }] : [],
      confidence: (!isReserved && sanitized === filename) ? 1.0 : 0.8
    };
  }
}

// Export singleton instance
export const inputSanitizer = InputSanitizer.getInstance();

// React Hook for input sanitization
export function useSanitizer() {
  const sanitize = (
    input: string,
    context?: SecurityContext,
    config?: SanitizationConfig
  ): ValidationResult => {
    return inputSanitizer.sanitize(input, context, config);
  };

  const sanitizeEmail = (email: string): ValidationResult => {
    return inputSanitizer.sanitizeEmail(email);
  };

  const sanitizePhone = (phone: string): ValidationResult => {
    return inputSanitizer.sanitizePhoneNumber(phone);
  };

  const sanitizeURL = (url: string, context?: SecurityContext): ValidationResult => {
    return inputSanitizer.sanitizeURL(url, context);
  };

  const sanitizeFilename = (filename: string): ValidationResult => {
    return inputSanitizer.sanitizeFilename(filename);
  };

  return {
    sanitize,
    sanitizeEmail,
    sanitizePhone,
    sanitizeURL,
    sanitizeFilename
  };
}

export default inputSanitizer;