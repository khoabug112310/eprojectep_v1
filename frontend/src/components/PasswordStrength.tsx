import React, { useMemo, useCallback } from 'react'
import { useValidationFeedback, ValidationMessage } from './ValidationFeedback'

export interface PasswordStrengthOptions {
  minLength?: number
  maxLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumbers?: boolean
  requireSpecialChars?: boolean
  forbiddenPatterns?: string[]
  commonPasswords?: string[]
  minScore?: number
  customRules?: PasswordRule[]
}

export interface PasswordRule {
  id: string
  name: string
  test: (password: string) => boolean
  weight: number
  message: string
  type: 'requirement' | 'bonus' | 'penalty'
}

export interface PasswordStrengthResult {
  score: number
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  suggestions: string[]
  requirements: PasswordRequirement[]
  entropy: number
  estimatedCrackTime: string
}

export interface PasswordRequirement {
  id: string
  text: string
  met: boolean
  required: boolean
  weight: number
}

interface PasswordStrengthProps {
  password: string
  options?: PasswordStrengthOptions
  showMeter?: boolean
  showRequirements?: boolean
  showSuggestions?: boolean
  showEntropy?: boolean
  realTimeValidation?: boolean
  onStrengthChange?: (result: PasswordStrengthResult) => void
  className?: string
}

const DEFAULT_OPTIONS: Required<PasswordStrengthOptions> = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPatterns: [
    '12345', 'qwerty', 'password', 'admin', 'letmein',
    '123456', 'password123', 'admin123', 'qwerty123'
  ],
  commonPasswords: [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'password1', '123123', 'dragon', 'princess'
  ],
  minScore: 3,
  customRules: []
}

export function PasswordStrength({
  password,
  options = {},
  showMeter = true,
  showRequirements = true,
  showSuggestions = true,
  showEntropy = false,
  realTimeValidation = true,
  onStrengthChange,
  className = ''
}: PasswordStrengthProps) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const { addMessage, removeMessage, clearMessages } = useValidationFeedback()

  // Calculate password strength
  const strengthResult = useMemo(() => {
    return calculatePasswordStrength(password, config)
  }, [password, config])

  // Handle strength change callback
  React.useEffect(() => {
    onStrengthChange?.(strengthResult)
  }, [strengthResult, onStrengthChange])

  // Real-time validation messages
  React.useEffect(() => {
    if (!realTimeValidation || !password) {
      clearMessages('password')
      return
    }

    // Clear previous messages
    clearMessages('password')

    // Add new validation messages
    if (strengthResult.score < config.minScore) {
      addMessage({
        field: 'password',
        type: 'error',
        message: `Password strength is ${strengthResult.level}. Please improve your password.`,
        severity: 'high'
      })
    }

    strengthResult.suggestions.forEach((suggestion, index) => {
      addMessage({
        field: 'password',
        type: 'warning',
        message: suggestion,
        severity: 'medium',
        details: `Suggestion ${index + 1}`
      })
    })
  }, [strengthResult, realTimeValidation, password, config.minScore, addMessage, clearMessages])

  const getStrengthColor = (level: PasswordStrengthResult['level']) => {
    const colors = {
      'very-weak': '#ef4444',
      'weak': '#f97316',
      'fair': '#eab308',
      'good': '#22c55e',
      'strong': '#16a34a',
      'very-strong': '#15803d'
    }
    return colors[level]
  }

  const getStrengthText = (level: PasswordStrengthResult['level']) => {
    const texts = {
      'very-weak': 'Very Weak',
      'weak': 'Weak',
      'fair': 'Fair',
      'good': 'Good',
      'strong': 'Strong',
      'very-strong': 'Very Strong'
    }
    return texts[level]
  }

  if (!password) return null

  return (
    <div className={`password-strength ${className}`}>
      {showMeter && (
        <div className="password-strength__meter">
          <div className="password-strength__meter-bar">
            <div
              className="password-strength__meter-fill"
              style={{
                width: `${(strengthResult.score / 6) * 100}%`,
                backgroundColor: getStrengthColor(strengthResult.level)
              }}
            />
          </div>
          
          <div className="password-strength__meter-label">
            <span 
              className="password-strength__level"
              style={{ color: getStrengthColor(strengthResult.level) }}
            >
              {getStrengthText(strengthResult.level)}
            </span>
            
            <span className="password-strength__score">
              {strengthResult.score}/6
            </span>
          </div>
        </div>
      )}

      {showEntropy && (
        <div className="password-strength__entropy">
          <span className="password-strength__entropy-label">Entropy:</span>
          <span className="password-strength__entropy-value">
            {strengthResult.entropy.toFixed(1)} bits
          </span>
          <span className="password-strength__crack-time">
            (Est. crack time: {strengthResult.estimatedCrackTime})
          </span>
        </div>
      )}

      {showRequirements && (
        <div className="password-strength__requirements">
          <h4 className="password-strength__requirements-title">
            Password Requirements
          </h4>
          
          <ul className="password-strength__requirements-list">
            {strengthResult.requirements.map((req) => (
              <li
                key={req.id}
                className={`password-strength__requirement ${
                  req.met ? 'password-strength__requirement--met' : 'password-strength__requirement--unmet'
                } ${
                  req.required ? 'password-strength__requirement--required' : 'password-strength__requirement--optional'
                }`}
              >
                <span className="password-strength__requirement-icon">
                  {req.met ? '✓' : '✗'}
                </span>
                <span className="password-strength__requirement-text">
                  {req.text}
                </span>
                {req.required && (
                  <span className="password-strength__requirement-badge">
                    Required
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions && strengthResult.suggestions.length > 0 && (
        <div className="password-strength__suggestions">
          <h4 className="password-strength__suggestions-title">
            Suggestions to Improve
          </h4>
          
          <ul className="password-strength__suggestions-list">
            {strengthResult.suggestions.map((suggestion, index) => (
              <li key={index} className="password-strength__suggestion">
                <span className="password-strength__suggestion-icon">💡</span>
                <span className="password-strength__suggestion-text">
                  {suggestion}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Calculate password strength
function calculatePasswordStrength(
  password: string, 
  options: Required<PasswordStrengthOptions>
): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      level: 'very-weak',
      suggestions: ['Enter a password'],
      requirements: [],
      entropy: 0,
      estimatedCrackTime: 'Instant'
    }
  }

  let score = 0
  const suggestions: string[] = []
  const requirements: PasswordRequirement[] = []

  // Basic requirements
  const hasLength = password.length >= options.minLength
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  // Length requirement
  requirements.push({
    id: 'length',
    text: `At least ${options.minLength} characters`,
    met: hasLength,
    required: true,
    weight: 1
  })

  if (hasLength) score += 1
  else suggestions.push(`Use at least ${options.minLength} characters`)

  // Character type requirements
  if (options.requireUppercase) {
    requirements.push({
      id: 'uppercase',
      text: 'At least one uppercase letter (A-Z)',
      met: hasUppercase,
      required: true,
      weight: 1
    })
    if (hasUppercase) score += 1
    else suggestions.push('Add uppercase letters')
  }

  if (options.requireLowercase) {
    requirements.push({
      id: 'lowercase',
      text: 'At least one lowercase letter (a-z)',
      met: hasLowercase,
      required: true,
      weight: 1
    })
    if (hasLowercase) score += 1
    else suggestions.push('Add lowercase letters')
  }

  if (options.requireNumbers) {
    requirements.push({
      id: 'numbers',
      text: 'At least one number (0-9)',
      met: hasNumbers,
      required: true,
      weight: 1
    })
    if (hasNumbers) score += 1
    else suggestions.push('Add numbers')
  }

  if (options.requireSpecialChars) {
    requirements.push({
      id: 'special',
      text: 'At least one special character (!@#$%^&*)',
      met: hasSpecialChars,
      required: true,
      weight: 1
    })
    if (hasSpecialChars) score += 1
    else suggestions.push('Add special characters')
  }

  // Bonus points for longer passwords
  if (password.length >= 12) {
    score += 0.5
    requirements.push({
      id: 'long',
      text: '12+ characters (bonus)',
      met: true,
      required: false,
      weight: 0.5
    })
  }

  if (password.length >= 16) {
    score += 0.5
    requirements.push({
      id: 'very-long',
      text: '16+ characters (extra bonus)',
      met: true,
      required: false,
      weight: 0.5
    })
  }

  // Penalty for common patterns
  const lowerPassword = password.toLowerCase()
  const hasCommonPassword = options.commonPasswords.some(common => 
    lowerPassword.includes(common.toLowerCase())
  )
  
  if (hasCommonPassword) {
    score -= 1
    suggestions.push('Avoid common passwords')
    requirements.push({
      id: 'not-common',
      text: 'Not a common password',
      met: false,
      required: true,
      weight: -1
    })
  }

  // Penalty for forbidden patterns
  const hasForbiddenPattern = options.forbiddenPatterns.some(pattern =>
    lowerPassword.includes(pattern.toLowerCase())
  )

  if (hasForbiddenPattern) {
    score -= 0.5
    suggestions.push('Avoid common patterns like "123" or "qwerty"')
    requirements.push({
      id: 'no-patterns',
      text: 'No common patterns',
      met: false,
      required: true,
      weight: -0.5
    })
  }

  // Check for repetitive characters
  const hasRepetition = /(.)\1{2,}/.test(password)
  if (hasRepetition) {
    score -= 0.5
    suggestions.push('Avoid repeating characters')
    requirements.push({
      id: 'no-repetition',
      text: 'No repeated characters',
      met: false,
      required: false,
      weight: -0.5
    })
  }

  // Custom rules
  options.customRules.forEach(rule => {
    const met = rule.test(password)
    requirements.push({
      id: rule.id,
      text: rule.name,
      met,
      required: rule.type === 'requirement',
      weight: met ? rule.weight : (rule.type === 'penalty' ? -rule.weight : 0)
    })

    if (met && rule.type !== 'penalty') {
      score += rule.weight
    } else if (!met && rule.type === 'requirement') {
      suggestions.push(rule.message)
    } else if (met && rule.type === 'penalty') {
      score -= rule.weight
      suggestions.push(rule.message)
    }
  })

  // Normalize score (0-6)
  score = Math.max(0, Math.min(6, score))

  // Determine level
  let level: PasswordStrengthResult['level']
  if (score < 1) level = 'very-weak'
  else if (score < 2) level = 'weak'
  else if (score < 3) level = 'fair'
  else if (score < 4) level = 'good'
  else if (score < 5) level = 'strong'
  else level = 'very-strong'

  // Calculate entropy
  const entropy = calculateEntropy(password)
  const estimatedCrackTime = estimateCrackTime(entropy)

  return {
    score,
    level,
    suggestions,
    requirements,
    entropy,
    estimatedCrackTime
  }
}

// Calculate password entropy
function calculateEntropy(password: string): number {
  if (!password) return 0

  let charsetSize = 0
  
  // Count character sets
  if (/[a-z]/.test(password)) charsetSize += 26
  if (/[A-Z]/.test(password)) charsetSize += 26
  if (/\d/.test(password)) charsetSize += 10
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) charsetSize += 32
  if (/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) charsetSize += 30

  return password.length * Math.log2(charsetSize)
}

// Estimate crack time based on entropy
function estimateCrackTime(entropy: number): string {
  // Assume 1 billion guesses per second
  const guessesPerSecond = 1e9
  const totalGuesses = Math.pow(2, entropy) / 2 // Average case
  const seconds = totalGuesses / guessesPerSecond

  if (seconds < 1) return 'Instant'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`
  return `${Math.round(seconds / 31536000)} years`
}

// Hook for password strength validation
export function usePasswordStrength(options?: PasswordStrengthOptions) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  const validatePassword = useCallback((password: string) => {
    return calculatePasswordStrength(password, config)
  }, [config])

  const isStrongEnough = useCallback((password: string) => {
    const result = validatePassword(password)
    return result.score >= config.minScore
  }, [validatePassword, config.minScore])

  const getPasswordSuggestions = useCallback((password: string) => {
    const result = validatePassword(password)
    return result.suggestions
  }, [validatePassword])

  return {
    validatePassword,
    isStrongEnough,
    getPasswordSuggestions,
    config
  }
}

export default PasswordStrength