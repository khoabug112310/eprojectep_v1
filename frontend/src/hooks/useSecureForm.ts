// Enhanced Form Hook with Security Middleware Integration for CineBook
// Combines form state management with comprehensive security validation

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFormSecurity, FormSecurityResult } from '../services/FormSecurityMiddleware';
import { useSecurity } from '../components/security/SecurityProvider';

// Form Field Configuration
interface FormFieldConfig {
  name: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | null;
  };
  options?: { value: string; label: string }[]; // For select/radio
  sensitiveField?: boolean; // Mark as sensitive for security
}

// Form Configuration
interface SecureFormConfig {
  formId: string;
  fields: FormFieldConfig[];
  submitEndpoint?: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  enableRealTimeValidation?: boolean;
  enableSecurityMonitoring?: boolean;
  customSecurityConfig?: any;
}

// Form State
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  submitCount: number;
}

// Form Validation Result
interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  securityFlags: string[];
}

// Security Status
interface FormSecurityStatus {
  level: 'SAFE' | 'WARNING' | 'DANGER' | 'BLOCKED';
  message: string;
  remainingAttempts?: number;
  blockExpiry?: number;
}

export function useSecureForm(config: SecureFormConfig) {
  // Form Security Hook
  const {
    csrfToken,
    isLoading: isSecurityLoading,
    securityResult,
    validateFormSubmission,
    getSecurityStats,
    resetFormSecurity,
    formConfig
  } = useFormSecurity(config.formId, config.customSecurityConfig);

  // General Security Context
  const security = useSecurity();

  // Form State
  const [formState, setFormState] = useState<FormState>({
    values: {},
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
    submitCount: 0
  });

  // Security Status
  const [securityStatus, setSecurityStatus] = useState<FormSecurityStatus>({
    level: 'SAFE',
    message: 'Form security active'
  });

  // Initialize form values
  const initialValues = useMemo(() => {
    const values: Record<string, any> = {};
    config.fields.forEach(field => {
      switch (field.type) {
        case 'checkbox':
          values[field.name] = false;
          break;
        case 'number':
          values[field.name] = field.validation?.min || 0;
          break;
        default:
          values[field.name] = '';
      }
    });
    return values;
  }, [config.fields]);

  // Set initial values
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      values: { ...initialValues }
    }));
  }, [initialValues]);

  // Update security status based on security result
  useEffect(() => {
    if (securityResult) {
      if (!securityResult.isAllowed) {
        if (securityResult.blockExpiry) {
          setSecurityStatus({
            level: 'BLOCKED',
            message: securityResult.reason || 'Form access blocked',
            remainingAttempts: securityResult.remainingAttempts,
            blockExpiry: securityResult.blockExpiry
          });
        } else {
          setSecurityStatus({
            level: 'DANGER',
            message: securityResult.reason || 'Security validation failed',
            remainingAttempts: securityResult.remainingAttempts
          });
        }
      } else {
        const remaining = securityResult.remainingAttempts || 0;
        if (remaining <= 2) {
          setSecurityStatus({
            level: 'DANGER',
            message: `Warning: Only ${remaining} attempts remaining`,
            remainingAttempts: remaining
          });
        } else if (remaining <= 4) {
          setSecurityStatus({
            level: 'WARNING',
            message: `${remaining} attempts remaining`,
            remainingAttempts: remaining
          });
        } else {
          setSecurityStatus({
            level: 'SAFE',
            message: 'Form security active',
            remainingAttempts: remaining
          });
        }
      }
    }
  }, [securityResult]);

  // Validate individual field
  const validateField = useCallback((name: string, value: any): string | null => {
    const field = config.fields.find(f => f.name === name);
    if (!field) return null;

    // Required field validation
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${field.label} is required`;
    }

    // Skip further validation if field is empty and not required
    if (!value && !field.required) return null;

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        break;

      case 'tel':
        const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
        if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
          return 'Please enter a valid Vietnamese phone number';
        }
        break;

      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return 'Please enter a valid number';
        }
        if (field.validation?.min !== undefined && numValue < field.validation.min) {
          return `Minimum value is ${field.validation.min}`;
        }
        if (field.validation?.max !== undefined && numValue > field.validation.max) {
          return `Maximum value is ${field.validation.max}`;
        }
        break;

      case 'password':
        if (field.validation?.minLength && value.length < field.validation.minLength) {
          return `Password must be at least ${field.validation.minLength} characters`;
        }
        // Check for strong password if required
        if (field.name.includes('password') && value.length > 0) {
          const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
          if (!strongPasswordRegex.test(value)) {
            return 'Password must contain uppercase, lowercase, number and special character';
          }
        }
        break;
    }

    // Length validation
    if (field.validation?.minLength && value.length < field.validation.minLength) {
      return `Minimum length is ${field.validation.minLength} characters`;
    }

    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      return `Maximum length is ${field.validation.maxLength} characters`;
    }

    // Pattern validation
    if (field.validation?.pattern && !field.validation.pattern.test(value)) {
      return `Invalid ${field.label.toLowerCase()} format`;
    }

    // Custom validation
    if (field.validation?.custom) {
      return field.validation.custom(value);
    }

    return null;
  }, [config.fields]);

  // Validate entire form
  const validateForm = useCallback((): FormValidationResult => {
    const errors: Record<string, string> = {};
    let securityFlags: string[] = [];

    // Validate each field
    config.fields.forEach(field => {
      const error = validateField(field.name, formState.values[field.name]);
      if (error) {
        errors[field.name] = error;
      }

      // Security validation for sensitive fields
      if (field.sensitiveField && formState.values[field.name]) {
        const value = String(formState.values[field.name]);
        
        // Check for XSS attempts
        if (security.checkXSS(value)) {
          securityFlags.push('XSS_DETECTED');
          errors[field.name] = 'Potentially malicious content detected';
        }

        // Check for SQL injection
        if (security.checkSQLInjection(value)) {
          securityFlags.push('SQL_INJECTION_DETECTED');
          errors[field.name] = 'Potentially harmful content detected';
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      securityFlags
    };
  }, [config.fields, formState.values, validateField, security]);

  // Handle field change
  const handleFieldChange = useCallback((name: string, value: any) => {
    // Sanitize input for sensitive fields
    const field = config.fields.find(f => f.name === name);
    let sanitizedValue = value;

    if (field?.sensitiveField && typeof value === 'string') {
      sanitizedValue = security.sanitizeInput(value, 'text');
    }

    setFormState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: sanitizedValue
      },
      errors: {
        ...prev.errors,
        [name]: '' // Clear error when user starts typing
      },
      touched: {
        ...prev.touched,
        [name]: true
      }
    }));

    // Real-time validation if enabled
    if (config.enableRealTimeValidation) {
      const error = validateField(name, sanitizedValue);
      if (error) {
        setFormState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [name]: error
          }
        }));
      }
    }
  }, [config.fields, config.enableRealTimeValidation, validateField, security]);

  // Handle field blur
  const handleFieldBlur = useCallback((name: string) => {
    setFormState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [name]: true
      }
    }));

    // Validate field on blur
    const error = validateField(name, formState.values[name]);
    if (error) {
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [name]: error
        }
      }));
    }
  }, [validateField, formState.values]);

  // Get form data for submission
  const getFormData = useCallback(() => {
    const data = { ...formState.values };

    // Add CSRF token if enabled
    if (formConfig.enableCSRF && csrfToken) {
      data.csrf_token = csrfToken;
    }

    return data;
  }, [formState.values, formConfig.enableCSRF, csrfToken]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Update submit count
    setFormState(prev => ({
      ...prev,
      submitCount: prev.submitCount + 1,
      isSubmitting: true
    }));

    try {
      // Validate form
      const validation = validateForm();
      
      if (!validation.isValid) {
        setFormState(prev => ({
          ...prev,
          errors: validation.errors,
          isSubmitting: false
        }));
        return false;
      }

      // Security validation
      const formData = getFormData();
      const securityValidation = await validateFormSubmission(formData);

      if (!securityValidation.isAllowed) {
        console.error('Form submission blocked by security:', securityValidation.reason);
        setFormState(prev => ({
          ...prev,
          isSubmitting: false
        }));
        return false;
      }

      // Submit form if endpoint is provided
      if (config.submitEndpoint) {
        const response = await fetch(config.submitEndpoint, {
          method: config.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken && { 'X-CSRF-Token': csrfToken })
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();
        
        if (config.onSuccess) {
          config.onSuccess(responseData);
        }

        // Reset form on successful submission
        resetForm();
      }

      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (config.onError) {
        config.onError(error);
      }

      return false;
    } finally {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false
      }));
    }
  }, [
    validateForm,
    getFormData,
    validateFormSubmission,
    config.submitEndpoint,
    config.method,
    config.onSuccess,
    config.onError,
    csrfToken
  ]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormState({
      values: { ...initialValues },
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
      submitCount: 0
    });
    resetFormSecurity();
  }, [initialValues, resetFormSecurity]);

  // Update form validity
  useEffect(() => {
    const validation = validateForm();
    setFormState(prev => ({
      ...prev,
      isValid: validation.isValid && Object.keys(validation.errors).length === 0
    }));
  }, [formState.values, validateForm]);

  // Get field props for easy integration
  const getFieldProps = useCallback((name: string) => {
    const field = config.fields.find(f => f.name === name);
    if (!field) return {};

    return {
      name,
      value: formState.values[name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = field.type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
        handleFieldChange(name, value);
      },
      onBlur: () => handleFieldBlur(name),
      error: formState.touched[name] ? formState.errors[name] : undefined,
      required: field.required,
      placeholder: field.placeholder,
      type: field.type === 'tel' ? 'text' : field.type, // Use text for tel to allow formatting
    };
  }, [config.fields, formState, handleFieldChange, handleFieldBlur]);

  // Get form security info
  const getSecurityInfo = useCallback(() => {
    return {
      status: securityStatus,
      csrfToken,
      config: formConfig,
      stats: getSecurityStats(),
      isLoading: isSecurityLoading
    };
  }, [securityStatus, csrfToken, formConfig, getSecurityStats, isSecurityLoading]);

  // Check if form is blocked
  const isBlocked = securityStatus.level === 'BLOCKED';

  // Calculate time remaining for blocked forms
  const getTimeRemaining = useCallback((): string => {
    if (!securityStatus.blockExpiry) return '';
    
    const remaining = securityStatus.blockExpiry - Date.now();
    if (remaining <= 0) return '';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }, [securityStatus.blockExpiry]);

  return {
    // Form state and values
    formState,
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    submitCount: formState.submitCount,

    // Security information
    securityStatus,
    isBlocked,
    getTimeRemaining,
    getSecurityInfo,

    // Form methods
    handleSubmit,
    resetForm,
    handleFieldChange,
    handleFieldBlur,
    getFieldProps,
    validateField,
    validateForm,
    getFormData,

    // Utility methods
    setFieldValue: (name: string, value: any) => handleFieldChange(name, value),
    setFieldError: (name: string, error: string) => {
      setFormState(prev => ({
        ...prev,
        errors: { ...prev.errors, [name]: error }
      }));
    },
    clearErrors: () => {
      setFormState(prev => ({ ...prev, errors: {} }));
    }
  };
}

export default useSecureForm;
export type { SecureFormConfig, FormFieldConfig, FormState, FormSecurityStatus };