// Enhanced Validation Rules Engine for CineBook
// Complex validation patterns, custom validators, and async validation system

export interface ValidationRule {
  id: string;
  name: string;
  type: 'sync' | 'async' | 'conditional';
  validator: (value: any, context?: ValidationContext) => boolean | Promise<boolean>;
  message: string | ((value: any, context?: ValidationContext) => string);
  priority: number;
  dependencies?: string[];
  conditions?: ValidationCondition[];
  metadata?: Record<string, any>;
}

export interface ValidationContext {
  fieldName: string;
  formData: Record<string, any>;
  formType: string;
  userRole?: string;
  environment: 'development' | 'production' | 'testing';
  locale: string;
  timestamp: number;
  sessionData?: Record<string, any>;
}

export interface ValidationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'matches' | 'exists' | 'is_empty';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  metadata: ValidationMetadata;
}

export interface ValidationError {
  ruleId: string;
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'format' | 'length' | 'pattern' | 'business' | 'security' | 'dependency';
  suggestions?: string[];
}

export interface ValidationWarning {
  ruleId: string;
  field: string;
  message: string;
  type: 'usability' | 'performance' | 'accessibility' | 'best_practice';
}

export interface ValidationSuggestion {
  field: string;
  message: string;
  action: 'replace' | 'append' | 'format' | 'improve';
  suggestedValue?: any;
}

export interface ValidationMetadata {
  executionTime: number;
  rulesExecuted: number;
  asyncRulesCount: number;
  cacheHits: number;
  performanceScore: number;
}

export interface FieldSchema {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'phone' | 'url' | 'file' | 'custom';
  rules: string[];
  dependencies?: string[];
  conditions?: ValidationCondition[];
  metadata?: Record<string, any>;
}

export interface FormSchema {
  id: string;
  name: string;
  version: string;
  fields: FieldSchema[];
  globalRules?: string[];
  metadata?: Record<string, any>;
}

class ValidationRulesEngine {
  private static instance: ValidationRulesEngine;
  private rules: Map<string, ValidationRule> = new Map();
  private schemas: Map<string, FormSchema> = new Map();
  private cache: Map<string, any> = new Map();
  private asyncValidators: Map<string, Function> = new Map();
  private validationStats: Record<string, any> = {};

  private constructor() {
    this.initializeBuiltInRules();
    this.initializeAsyncValidators();
  }

  public static getInstance(): ValidationRulesEngine {
    if (!ValidationRulesEngine.instance) {
      ValidationRulesEngine.instance = new ValidationRulesEngine();
    }
    return ValidationRulesEngine.instance;
  }

  // Initialize built-in validation rules
  private initializeBuiltInRules(): void {
    // Basic validation rules
    this.addRule({
      id: 'required',
      name: 'Required Field',
      type: 'sync',
      validator: (value) => {
        return value !== null && value !== undefined && 
               (typeof value === 'string' ? value.trim() !== '' : Boolean(value));
      },
      message: 'This field is required',
      priority: 1
    });

    // Email validation with enhanced patterns
    this.addRule({
      id: 'email',
      name: 'Email Format',
      type: 'sync',
      validator: (value) => {
        if (!value) return true;
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(value);
      },
      message: 'Please enter a valid email address',
      priority: 2
    });

    // Vietnamese phone number validation
    this.addRule({
      id: 'phone_vn',
      name: 'Vietnamese Phone Number',
      type: 'sync',
      validator: (value) => {
        if (!value) return true;
        const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
        return phoneRegex.test(value.replace(/\s/g, ''));
      },
      message: 'Please enter a valid Vietnamese phone number',
      priority: 2
    });

    // Strong password validation
    this.addRule({
      id: 'strong_password',
      name: 'Strong Password',
      type: 'sync',
      validator: (value) => {
        if (!value) return true;
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongPasswordRegex.test(value);
      },
      message: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character',
      priority: 3
    });

    // Credit card validation (Luhn algorithm)
    this.addRule({
      id: 'credit_card',
      name: 'Credit Card Number',
      type: 'sync',
      validator: (value) => {
        if (!value) return true;
        const cleaned = value.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(cleaned)) return false;
        
        // Luhn algorithm
        let sum = 0;
        let isEven = false;
        for (let i = cleaned.length - 1; i >= 0; i--) {
          let digit = parseInt(cleaned[i]);
          if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          sum += digit;
          isEven = !isEven;
        }
        return sum % 10 === 0;
      },
      message: 'Please enter a valid credit card number',
      priority: 4
    });

    // Age validation for movie booking
    this.addRule({
      id: 'min_age',
      name: 'Minimum Age',
      type: 'conditional',
      validator: (value, context) => {
        if (!value || !context?.formData.movieRating) return true;
        
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
          ? age - 1 : age;

        const ratingRequirements: Record<string, number> = {
          'G': 0,
          'PG': 0,
          'PG-13': 13,
          'R': 17,
          'NC-17': 18
        };

        const requiredAge = ratingRequirements[context.formData.movieRating] || 0;
        return actualAge >= requiredAge;
      },
      message: (value, context) => {
        const rating = context?.formData.movieRating;
        const ratingRequirements: Record<string, number> = {
          'G': 0, 'PG': 0, 'PG-13': 13, 'R': 17, 'NC-17': 18
        };
        const requiredAge = ratingRequirements[rating || ''] || 0;
        return `You must be at least ${requiredAge} years old to watch this movie (${rating} rating)`;
      },
      priority: 5,
      conditions: [{ field: 'movieRating', operator: 'exists', value: true }]
    });

    // Seat selection validation
    this.addRule({
      id: 'seat_availability',
      name: 'Seat Availability',
      type: 'async',
      validator: async (value, context) => {
        if (!value || !Array.isArray(value)) return true;
        
        // Simulate API call to check seat availability
        const showtimeId = context?.formData.showtimeId;
        if (!showtimeId) return true;

        try {
          // In real implementation, this would be an API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Simulate some seats being unavailable
          const unavailableSeats = ['A1', 'B5', 'C3'];
          const selectedSeats = value as string[];
          
          return !selectedSeats.some(seat => unavailableSeats.includes(seat));
        } catch {
          return false;
        }
      },
      message: 'One or more selected seats are no longer available',
      priority: 6
    });

    // Payment amount validation
    this.addRule({
      id: 'payment_amount',
      name: 'Payment Amount',
      type: 'sync',
      validator: (value, context) => {
        if (!value) return false;
        
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) return false;
        
        // Check against calculated total
        const calculatedTotal = context?.formData.calculatedTotal;
        if (calculatedTotal && Math.abs(amount - calculatedTotal) > 0.01) {
          return false;
        }
        
        return true;
      },
      message: 'Payment amount is invalid or does not match the booking total',
      priority: 7
    });

    // File upload validation
    this.addRule({
      id: 'file_upload',
      name: 'File Upload',
      type: 'sync',
      validator: (value, context) => {
        if (!value) return true;
        
        const file = value as File;
        const maxSize = context?.metadata?.maxSize || 5 * 1024 * 1024; // 5MB default
        const allowedTypes = context?.metadata?.allowedTypes || ['image/jpeg', 'image/png', 'image/gif'];
        
        if (file.size > maxSize) return false;
        if (!allowedTypes.includes(file.type)) return false;
        
        return true;
      },
      message: (value, context) => {
        const file = value as File;
        const maxSize = context?.metadata?.maxSize || 5 * 1024 * 1024;
        const allowedTypes = context?.metadata?.allowedTypes || ['image/jpeg', 'image/png', 'image/gif'];
        
        if (file.size > maxSize) {
          return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
        }
        if (!allowedTypes.includes(file.type)) {
          return `File type must be one of: ${allowedTypes.join(', ')}`;
        }
        return 'Invalid file';
      },
      priority: 8
    });

    // Business hours validation
    this.addRule({
      id: 'business_hours',
      name: 'Business Hours',
      type: 'sync',
      validator: (value, context) => {
        if (!value) return true;
        
        const time = new Date(value);
        const hours = time.getHours();
        const day = time.getDay();
        
        // Cinema business hours: 9 AM to 11 PM, every day
        if (hours < 9 || hours > 23) return false;
        
        return true;
      },
      message: 'Please select a time during business hours (9 AM - 11 PM)',
      priority: 9
    });

    // Duplicate email check (async)
    this.addRule({
      id: 'unique_email',
      name: 'Unique Email',
      type: 'async',
      validator: async (value, context) => {
        if (!value) return true;
        
        // Simulate API call to check email uniqueness
        try {
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Simulate some emails being taken
          const takenEmails = ['admin@cinebook.com', 'test@example.com', 'user@test.com'];
          return !takenEmails.includes(value.toLowerCase());
        } catch {
          return true; // Assume valid if check fails
        }
      },
      message: 'This email address is already registered',
      priority: 10
    });
  }

  // Initialize async validators
  private initializeAsyncValidators(): void {
    this.asyncValidators.set('emailAvailability', async (email: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const taken = ['admin@example.com', 'test@test.com'];
      return !taken.includes(email.toLowerCase());
    });

    this.asyncValidators.set('seatAvailability', async (seats: string[], showtimeId: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const unavailable = ['A1', 'B5', 'C3'];
      return !seats.some(seat => unavailable.includes(seat));
    });

    this.asyncValidators.set('promotionCode', async (code: string) => {
      await new Promise(resolve => setTimeout(resolve, 400));
      const validCodes = ['STUDENT10', 'SENIOR20', 'FAMILY15'];
      return validCodes.includes(code.toUpperCase());
    });
  }

  // Add new validation rule
  public addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  // Remove validation rule
  public removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  // Get validation rule
  public getRule(ruleId: string): ValidationRule | undefined {
    return this.rules.get(ruleId);
  }

  // Get all rules
  public getAllRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  // Register form schema
  public registerSchema(schema: FormSchema): void {
    this.schemas.set(schema.id, schema);
  }

  // Validate single field
  public async validateField(
    fieldName: string,
    value: any,
    ruleIds: string[],
    context?: Partial<ValidationContext>
  ): Promise<ValidationResult> {
    const startTime = performance.now();
    const fullContext: ValidationContext = {
      fieldName,
      formData: {},
      formType: 'generic',
      environment: 'production',
      locale: 'en',
      timestamp: Date.now(),
      ...context
    };

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      metadata: {
        executionTime: 0,
        rulesExecuted: 0,
        asyncRulesCount: 0,
        cacheHits: 0,
        performanceScore: 100
      }
    };

    // Get applicable rules
    const applicableRules = ruleIds
      .map(id => this.rules.get(id))
      .filter(Boolean) as ValidationRule[];

    // Sort by priority
    applicableRules.sort((a, b) => a.priority - b.priority);

    // Execute validation rules
    for (const rule of applicableRules) {
      try {
        // Check conditions
        if (rule.conditions && !this.evaluateConditions(rule.conditions, fullContext)) {
          continue;
        }

        // Check cache
        const cacheKey = `${rule.id}_${JSON.stringify(value)}_${JSON.stringify(fullContext)}`;
        if (this.cache.has(cacheKey)) {
          result.metadata.cacheHits++;
          const cachedResult = this.cache.get(cacheKey);
          if (!cachedResult) {
            this.addError(result, rule, fieldName, value, fullContext);
          }
          continue;
        }

        // Execute validator
        let isValid: boolean;
        if (rule.type === 'async') {
          result.metadata.asyncRulesCount++;
          isValid = await rule.validator(value, fullContext);
        } else {
          isValid = rule.validator(value, fullContext) as boolean;
        }

        // Cache result
        this.cache.set(cacheKey, isValid);

        if (!isValid) {
          this.addError(result, rule, fieldName, value, fullContext);
          result.isValid = false;
        }

        result.metadata.rulesExecuted++;
      } catch (error) {
        console.error(`Validation rule ${rule.id} failed:`, error);
        this.addError(result, rule, fieldName, value, fullContext, 'Validation rule execution failed');
        result.isValid = false;
      }
    }

    // Calculate execution time and performance score
    const endTime = performance.now();
    result.metadata.executionTime = endTime - startTime;
    result.metadata.performanceScore = this.calculatePerformanceScore(result.metadata);

    // Generate suggestions
    this.generateSuggestions(result, value, fieldName);

    return result;
  }

  // Validate entire form using schema
  public async validateForm(formData: Record<string, any>, schemaId: string): Promise<ValidationResult> {
    const schema = this.schemas.get(schemaId);
    if (!schema) {
      throw new Error(`Schema ${schemaId} not found`);
    }

    const results: ValidationResult[] = [];
    
    // Validate each field
    for (const field of schema.fields) {
      const fieldResult = await this.validateField(
        field.name,
        formData[field.name],
        field.rules,
        {
          formData,
          formType: schema.id,
          fieldName: field.name
        }
      );
      results.push(fieldResult);
    }

    // Aggregate results
    return this.aggregateResults(results);
  }

  // Add custom validator
  public addCustomValidator(
    id: string,
    validator: (value: any, context?: ValidationContext) => boolean | Promise<boolean>,
    options: Partial<ValidationRule> = {}
  ): void {
    const rule: ValidationRule = {
      id,
      name: options.name || id,
      type: options.type || 'sync',
      validator,
      message: options.message || 'Validation failed',
      priority: options.priority || 100,
      ...options
    };
    
    this.addRule(rule);
  }

  // Evaluate conditions
  private evaluateConditions(conditions: ValidationCondition[], context: ValidationContext): boolean {
    if (!conditions.length) return true;

    let result = true;
    let logicOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const fieldValue = context.formData[condition.field];
      let conditionResult = false;

      switch (condition.operator) {
        case 'equals':
          conditionResult = fieldValue === condition.value;
          break;
        case 'not_equals':
          conditionResult = fieldValue !== condition.value;
          break;
        case 'greater_than':
          conditionResult = Number(fieldValue) > Number(condition.value);
          break;
        case 'less_than':
          conditionResult = Number(fieldValue) < Number(condition.value);
          break;
        case 'contains':
          conditionResult = String(fieldValue).includes(String(condition.value));
          break;
        case 'matches':
          conditionResult = new RegExp(condition.value).test(String(fieldValue));
          break;
        case 'exists':
          conditionResult = fieldValue !== null && fieldValue !== undefined;
          break;
        case 'is_empty':
          conditionResult = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
          break;
      }

      if (logicOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      logicOperator = condition.logic || 'AND';
    }

    return result;
  }

  // Add error to result
  private addError(
    result: ValidationResult,
    rule: ValidationRule,
    fieldName: string,
    value: any,
    context: ValidationContext,
    customMessage?: string
  ): void {
    const message = customMessage || 
      (typeof rule.message === 'function' ? rule.message(value, context) : rule.message);

    result.errors.push({
      ruleId: rule.id,
      field: fieldName,
      message,
      severity: this.determineSeverity(rule.id),
      type: this.determineErrorType(rule.id),
      suggestions: this.getErrorSuggestions(rule.id, value)
    });
  }

  // Determine error severity
  private determineSeverity(ruleId: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalRules = ['required', 'credit_card', 'payment_amount'];
    const highRules = ['email', 'strong_password', 'unique_email'];
    const mediumRules = ['phone_vn', 'min_age', 'seat_availability'];

    if (criticalRules.includes(ruleId)) return 'critical';
    if (highRules.includes(ruleId)) return 'high';
    if (mediumRules.includes(ruleId)) return 'medium';
    return 'low';
  }

  // Determine error type
  private determineErrorType(ruleId: string): ValidationError['type'] {
    const typeMap: Record<string, ValidationError['type']> = {
      'required': 'format',
      'email': 'format',
      'phone_vn': 'format',
      'strong_password': 'format',
      'credit_card': 'format',
      'min_age': 'business',
      'seat_availability': 'business',
      'payment_amount': 'business',
      'unique_email': 'business',
      'file_upload': 'format'
    };

    return typeMap[ruleId] || 'format';
  }

  // Get error suggestions
  private getErrorSuggestions(ruleId: string, value: any): string[] {
    const suggestionMap: Record<string, string[]> = {
      'email': ['Check for typos', 'Ensure @ symbol is present', 'Verify domain name'],
      'phone_vn': ['Use format: 0123456789', 'Include country code: +84123456789'],
      'strong_password': ['Use at least 8 characters', 'Include uppercase and lowercase', 'Add numbers and symbols'],
      'credit_card': ['Check for typos', 'Ensure all digits are correct', 'Try removing spaces'],
      'unique_email': ['Try a different email address', 'Contact support if this is your email']
    };

    return suggestionMap[ruleId] || [];
  }

  // Generate suggestions
  private generateSuggestions(result: ValidationResult, value: any, fieldName: string): void {
    // Email suggestions
    if (typeof value === 'string' && value.includes('@') && !result.errors.some(e => e.ruleId === 'email')) {
      const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      const domain = value.split('@')[1];
      
      if (domain && !commonDomains.includes(domain)) {
        const suggestion = this.findClosestMatch(domain, commonDomains);
        if (suggestion) {
          result.suggestions.push({
            field: fieldName,
            message: `Did you mean ${value.split('@')[0]}@${suggestion}?`,
            action: 'replace',
            suggestedValue: `${value.split('@')[0]}@${suggestion}`
          });
        }
      }
    }

    // Phone number formatting
    if (fieldName.includes('phone') && typeof value === 'string' && /^\d{10}$/.test(value)) {
      result.suggestions.push({
        field: fieldName,
        message: 'Format as: 0123 456 789',
        action: 'format',
        suggestedValue: value.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
      });
    }
  }

  // Find closest string match
  private findClosestMatch(input: string, options: string[]): string | null {
    let closestMatch = null;
    let minDistance = Infinity;

    for (const option of options) {
      const distance = this.levenshteinDistance(input, option);
      if (distance < minDistance && distance <= 2) {
        minDistance = distance;
        closestMatch = option;
      }
    }

    return closestMatch;
  }

  // Calculate Levenshtein distance
  private levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // Calculate performance score
  private calculatePerformanceScore(metadata: ValidationMetadata): number {
    let score = 100;

    // Penalty for slow execution
    if (metadata.executionTime > 1000) score -= 30;
    else if (metadata.executionTime > 500) score -= 15;
    else if (metadata.executionTime > 200) score -= 5;

    // Bonus for cache hits
    const cacheHitRatio = metadata.cacheHits / metadata.rulesExecuted;
    score += cacheHitRatio * 10;

    // Penalty for too many async rules
    if (metadata.asyncRulesCount > 3) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  // Aggregate multiple validation results
  private aggregateResults(results: ValidationResult[]): ValidationResult {
    const aggregated: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      metadata: {
        executionTime: 0,
        rulesExecuted: 0,
        asyncRulesCount: 0,
        cacheHits: 0,
        performanceScore: 100
      }
    };

    for (const result of results) {
      if (!result.isValid) aggregated.isValid = false;
      aggregated.errors.push(...result.errors);
      aggregated.warnings.push(...result.warnings);
      aggregated.suggestions.push(...result.suggestions);
      
      aggregated.metadata.executionTime += result.metadata.executionTime;
      aggregated.metadata.rulesExecuted += result.metadata.rulesExecuted;
      aggregated.metadata.asyncRulesCount += result.metadata.asyncRulesCount;
      aggregated.metadata.cacheHits += result.metadata.cacheHits;
    }

    // Calculate average performance score
    aggregated.metadata.performanceScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.metadata.performanceScore, 0) / results.length
      : 100;

    return aggregated;
  }

  // Clear validation cache
  public clearCache(): void {
    this.cache.clear();
  }

  // Get validation statistics
  public getValidationStats(): Record<string, any> {
    return {
      totalRules: this.rules.size,
      totalSchemas: this.schemas.size,
      cacheSize: this.cache.size,
      ...this.validationStats
    };
  }
}

// Export singleton instance
export const validationEngine = ValidationRulesEngine.getInstance();

// React Hook for validation
export function useValidationRules() {
  const validateField = async (
    fieldName: string,
    value: any,
    ruleIds: string[],
    context?: Partial<ValidationContext>
  ) => {
    return validationEngine.validateField(fieldName, value, ruleIds, context);
  };

  const validateForm = async (formData: Record<string, any>, schemaId: string) => {
    return validationEngine.validateForm(formData, schemaId);
  };

  const addCustomValidator = (
    id: string,
    validator: (value: any, context?: ValidationContext) => boolean | Promise<boolean>,
    options?: Partial<ValidationRule>
  ) => {
    validationEngine.addCustomValidator(id, validator, options);
  };

  const registerSchema = (schema: FormSchema) => {
    validationEngine.registerSchema(schema);
  };

  const getAllRules = () => {
    return validationEngine.getAllRules();
  };

  const getValidationStats = () => {
    return validationEngine.getValidationStats();
  };

  return {
    validateField,
    validateForm,
    addCustomValidator,
    registerSchema,
    getAllRules,
    getValidationStats
  };
}

export default validationEngine;