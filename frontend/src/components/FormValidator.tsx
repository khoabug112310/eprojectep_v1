import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccessibility } from './AccessibilityProvider'

// Types for validation rules and results
export interface ValidationRule {
  name: string
  message: string
  validator: (value: any, formData?: Record<string, any>) => boolean | Promise<boolean>
  severity?: 'error' | 'warning' | 'info'
  dependencies?: string[]
  debounce?: number
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  info: ValidationError[]
}

export interface ValidationError {
  field: string
  rule: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface FormFieldConfig {
  name: string
  rules: ValidationRule[]
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnSubmit?: boolean
  debounceMs?: number
}

export interface FormValidatorConfig {
  fields: FormFieldConfig[]
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnSubmit?: boolean
  stopOnFirstError?: boolean
  validateDependencies?: boolean
}

// Built-in validation rules
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    name: 'required',
    message,
    validator: (value) => {
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') return value.trim().length > 0
      return value !== null && value !== undefined && value !== ''
    }
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    name: 'minLength',
    message: message || `Must be at least ${min} characters`,
    validator: (value) => !value || value.toString().length >= min
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    name: 'maxLength',
    message: message || `Must be no more than ${max} characters`,
    validator: (value) => !value || value.toString().length <= max
  }),

  email: (message = 'Invalid email address'): ValidationRule => ({
    name: 'email',
    message,
    validator: (value) => {
      if (!value) return true
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    }
  }),

  phone: (message = 'Invalid phone number'): ValidationRule => ({
    name: 'phone',
    message,
    validator: (value) => {
      if (!value) return true
      // Vietnamese phone number format
      const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/
      return phoneRegex.test(value.replace(/\s|-/g, ''))
    }
  }),

  password: (message = 'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, and 1 number'): ValidationRule => ({
    name: 'password',
    message,
    validator: (value) => {
      if (!value) return true
      const hasMinLength = value.length >= 8
      const hasUppercase = /[A-Z]/.test(value)
      const hasLowercase = /[a-z]/.test(value)
      const hasNumber = /\d/.test(value)
      return hasMinLength && hasUppercase && hasLowercase && hasNumber
    }
  }),

  confirmPassword: (passwordField: string, message = 'Passwords do not match'): ValidationRule => ({
    name: 'confirmPassword',
    message,
    dependencies: [passwordField],
    validator: (value, formData) => {
      if (!value || !formData) return true
      return value === formData[passwordField]
    }
  }),

  numeric: (message = 'Must be a valid number'): ValidationRule => ({
    name: 'numeric',
    message,
    validator: (value) => {
      if (!value) return true
      return !isNaN(parseFloat(value)) && isFinite(value)
    }
  }),

  range: (min: number, max: number, message?: string): ValidationRule => ({
    name: 'range',
    message: message || `Value must be between ${min} and ${max}`,
    validator: (value) => {
      if (!value) return true
      const num = parseFloat(value)
      return !isNaN(num) && num >= min && num <= max
    }
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
    name: 'pattern',
    message,
    validator: (value) => {
      if (!value) return true
      return regex.test(value)
    }
  }),

  custom: (validatorFn: (value: any, formData?: Record<string, any>) => boolean | Promise<boolean>, message: string): ValidationRule => ({
    name: 'custom',
    message,
    validator: validatorFn
  }),

  // Async validation example
  uniqueEmail: (checkUnique: (email: string) => Promise<boolean>, message = 'Email already exists'): ValidationRule => ({
    name: 'uniqueEmail',
    message,
    validator: async (value) => {
      if (!value) return true
      return await checkUnique(value)
    },
    debounce: 500
  })
}

// Custom hook for form validation
export function useFormValidator(config: FormValidatorConfig) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, ValidationError[]>>({})
  const [warnings, setWarnings] = useState<Record<string, ValidationError[]>>({})
  const [info, setInfo] = useState<Record<string, ValidationError[]>>({})
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({})
  const [isValid, setIsValid] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const { announce } = useAccessibility()

  // Debounced validation function
  const debounceValidation = useMemo(() => {
    const timers: Record<string, NodeJS.Timeout> = {}
    
    return (fieldName: string, value: any, delay: number = 300) => {
      if (timers[fieldName]) {
        clearTimeout(timers[fieldName])
      }
      
      timers[fieldName] = setTimeout(() => {
        validateField(fieldName, value)
      }, delay)
    }
  }, [])

  // Validate a single field
  const validateField = useCallback(async (fieldName: string, value: any) => {
    const fieldConfig = config.fields.find(f => f.name === fieldName)
    if (!fieldConfig) return

    setIsValidating(prev => ({ ...prev, [fieldName]: true }))

    const fieldErrors: ValidationError[] = []
    const fieldWarnings: ValidationError[] = []
    const fieldInfo: ValidationError[] = []

    for (const rule of fieldConfig.rules) {
      try {
        const isValid = await rule.validator(value, formData)
        
        if (!isValid) {
          const error: ValidationError = {
            field: fieldName,
            rule: rule.name,
            message: rule.message,
            severity: rule.severity || 'error'
          }
          
          switch (rule.severity) {
            case 'warning':
              fieldWarnings.push(error)
              break
            case 'info':
              fieldInfo.push(error)
              break
            default:
              fieldErrors.push(error)
              break
          }
          
          if (config.stopOnFirstError && rule.severity !== 'warning' && rule.severity !== 'info') {
            break
          }
        }
      } catch (error) {
        console.error(`Validation error for field ${fieldName}, rule ${rule.name}:`, error)
        fieldErrors.push({
          field: fieldName,
          rule: rule.name,
          message: 'Validation error occurred',
          severity: 'error'
        })
      }
    }

    setErrors(prev => ({ ...prev, [fieldName]: fieldErrors }))
    setWarnings(prev => ({ ...prev, [fieldName]: fieldWarnings }))
    setInfo(prev => ({ ...prev, [fieldName]: fieldInfo }))
    setIsValidating(prev => ({ ...prev, [fieldName]: false }))

    // Announce errors for accessibility
    if (fieldErrors.length > 0 && touched[fieldName]) {
      announce(`Validation error in ${fieldName}: ${fieldErrors[0].message}`, 'assertive')
    }

    return fieldErrors.length === 0
  }, [config, formData, touched, announce])

  // Validate dependent fields when a field changes
  const validateDependentFields = useCallback(async (changedField: string) => {
    if (!config.validateDependencies) return

    const dependentFields = config.fields.filter(field => 
      field.rules.some(rule => rule.dependencies?.includes(changedField))
    )

    for (const field of dependentFields) {
      await validateField(field.name, formData[field.name])
    }
  }, [config, formData, validateField])

  // Update form data and trigger validation
  const updateField = useCallback(async (fieldName: string, value: any, shouldValidate = true) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))

    const fieldConfig = config.fields.find(f => f.name === fieldName)
    const shouldValidateOnChange = fieldConfig?.validateOnChange ?? config.validateOnChange ?? true

    if (shouldValidate && shouldValidateOnChange) {
      const debounceMs = fieldConfig?.debounceMs ?? 300
      debounceValidation(fieldName, value, debounceMs)
    }

    // Validate dependent fields
    await validateDependentFields(fieldName)
  }, [config, debounceValidation, validateDependentFields])

  // Handle field blur
  const handleBlur = useCallback(async (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))

    const fieldConfig = config.fields.find(f => f.name === fieldName)
    const shouldValidateOnBlur = fieldConfig?.validateOnBlur ?? config.validateOnBlur ?? true

    if (shouldValidateOnBlur) {
      await validateField(fieldName, formData[fieldName])
    }
  }, [config, formData, validateField])

  // Validate all fields
  const validateAll = useCallback(async () => {
    const validationPromises = config.fields.map(field => 
      validateField(field.name, formData[field.name])
    )

    const results = await Promise.all(validationPromises)
    return results.every(result => result)
  }, [config.fields, formData, validateField])

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit: (data: Record<string, any>) => void | Promise<void>) => {
    setSubmitAttempted(true)
    
    // Mark all fields as touched
    const allTouched = config.fields.reduce((acc, field) => {
      acc[field.name] = true
      return acc
    }, {} as Record<string, boolean>)
    setTouched(allTouched)

    const isFormValid = await validateAll()
    
    if (isFormValid) {
      try {
        await onSubmit(formData)
        announce('Form submitted successfully', 'polite')
      } catch (error) {
        announce('Form submission failed', 'assertive')
        console.error('Form submission error:', error)
      }
    } else {
      announce('Please fix form errors before submitting', 'assertive')
    }

    return isFormValid
  }, [config.fields, formData, validateAll, announce])

  // Reset form
  const reset = useCallback(() => {
    setFormData({})
    setErrors({})
    setWarnings({})
    setInfo({})
    setTouched({})
    setSubmitAttempted(false)
    setIsValidating({})
  }, [])

  // Update overall form validity
  useEffect(() => {
    const hasErrors = Object.values(errors).some(fieldErrors => fieldErrors.length > 0)
    setIsValid(!hasErrors)
  }, [errors])

  // Get field validation state
  const getFieldState = useCallback((fieldName: string) => {
    const fieldErrors = errors[fieldName] || []
    const fieldWarnings = warnings[fieldName] || []
    const fieldInfo = info[fieldName] || []
    const isFieldValidating = isValidating[fieldName] || false
    const isFieldTouched = touched[fieldName] || false

    return {
      value: formData[fieldName] || '',
      errors: fieldErrors,
      warnings: fieldWarnings,
      info: fieldInfo,
      isValidating: isFieldValidating,
      isTouched: isFieldTouched,
      isValid: fieldErrors.length === 0,
      hasErrors: fieldErrors.length > 0,
      hasWarnings: fieldWarnings.length > 0,
      hasInfo: fieldInfo.length > 0,
      shouldShowErrors: isFieldTouched || submitAttempted
    }
  }, [formData, errors, warnings, info, isValidating, touched, submitAttempted])

  return {
    formData,
    errors,
    warnings,
    info,
    isValid,
    isValidating,
    touched,
    submitAttempted,
    updateField,
    handleBlur,
    validateField,
    validateAll,
    handleSubmit,
    reset,
    getFieldState
  }
}

// Form validator component
interface FormValidatorProps {
  config: FormValidatorConfig
  onValidationChange?: (isValid: boolean, errors: Record<string, ValidationError[]>) => void
  children: (formValidator: ReturnType<typeof useFormValidator>) => React.ReactNode
}

export function FormValidator({ config, onValidationChange, children }: FormValidatorProps) {
  const formValidator = useFormValidator(config)

  useEffect(() => {
    onValidationChange?.(formValidator.isValid, formValidator.errors)
  }, [formValidator.isValid, formValidator.errors, onValidationChange])

  return <>{children(formValidator)}</>
}

// Enhanced form field component with validation
interface ValidatedFieldProps {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'textarea'
  placeholder?: string
  formValidator: ReturnType<typeof useFormValidator>
  className?: string
  rows?: number
  autoComplete?: string
  required?: boolean
}

export function ValidatedField({
  name,
  label,
  type = 'text',
  placeholder,
  formValidator,
  className = '',
  rows = 4,
  autoComplete,
  required = false
}: ValidatedFieldProps) {
  const fieldState = formValidator.getFieldState(name)
  const fieldId = `field-${name}`

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    formValidator.updateField(name, e.target.value)
  }

  const handleBlur = () => {
    formValidator.handleBlur(name)
  }

  const getAriaDescribedBy = () => {
    const ids = []
    if (fieldState.hasErrors) ids.push(`${fieldId}-error`)
    if (fieldState.hasWarnings) ids.push(`${fieldId}-warning`)
    if (fieldState.hasInfo) ids.push(`${fieldId}-info`)
    return ids.length > 0 ? ids.join(' ') : undefined
  }

  return (
    <div className={`validated-field ${className}`}>
      <label htmlFor={fieldId} className="validated-field__label">
        {label}
        {required && <span className="validated-field__required" aria-label="required">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={fieldId}
          name={name}
          value={fieldState.value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          className={`validated-field__input validated-field__textarea ${
            fieldState.hasErrors ? 'validated-field__input--error' : ''
          } ${fieldState.hasWarnings ? 'validated-field__input--warning' : ''}`}
          aria-required={required}
          aria-invalid={fieldState.hasErrors}
          aria-describedby={getAriaDescribedBy()}
          autoComplete={autoComplete}
        />
      ) : (
        <input
          id={fieldId}
          name={name}
          type={type}
          value={fieldState.value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`validated-field__input ${
            fieldState.hasErrors ? 'validated-field__input--error' : ''
          } ${fieldState.hasWarnings ? 'validated-field__input--warning' : ''}`}
          aria-required={required}
          aria-invalid={fieldState.hasErrors}
          aria-describedby={getAriaDescribedBy()}
          autoComplete={autoComplete}
        />
      )}

      {fieldState.isValidating && (
        <div className="validated-field__validating" aria-live="polite">
          Validating...
        </div>
      )}

      {fieldState.shouldShowErrors && fieldState.hasErrors && (
        <div 
          id={`${fieldId}-error`}
          className="validated-field__errors"
          role="alert"
          aria-live="polite"
        >
          {fieldState.errors.map((error, index) => (
            <div key={index} className="validated-field__error">
              {error.message}
            </div>
          ))}
        </div>
      )}

      {fieldState.hasWarnings && (
        <div 
          id={`${fieldId}-warning`}
          className="validated-field__warnings"
          aria-live="polite"
        >
          {fieldState.warnings.map((warning, index) => (
            <div key={index} className="validated-field__warning">
              {warning.message}
            </div>
          ))}
        </div>
      )}

      {fieldState.hasInfo && (
        <div 
          id={`${fieldId}-info`}
          className="validated-field__info"
          aria-live="polite"
        >
          {fieldState.info.map((info, index) => (
            <div key={index} className="validated-field__info-item">
              {info.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FormValidator