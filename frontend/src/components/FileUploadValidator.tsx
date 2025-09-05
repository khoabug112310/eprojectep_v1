import React, { useCallback, useState, useRef, useMemo } from 'react'
import { useValidationFeedback, ValidationMessage } from './ValidationFeedback'

export interface FileValidationRule {
  id: string
  name: string
  validator: (file: File) => boolean | Promise<boolean>
  message: string
  severity?: 'error' | 'warning' | 'info'
  async?: boolean
}

export interface FileUploadOptions {
  maxFileSize?: number // in bytes
  maxTotalSize?: number // in bytes
  maxFiles?: number
  allowedTypes?: string[] // MIME types
  allowedExtensions?: string[]
  minImageDimensions?: { width: number; height: number }
  maxImageDimensions?: { width: number; height: number }
  customRules?: FileValidationRule[]
  scanForViruses?: boolean
  checkDuplicates?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fileInfo: FileInfo
}

export interface FileInfo {
  name: string
  size: number
  type: string
  extension: string
  lastModified: number
  dimensions?: { width: number; height: number }
  checksum?: string
}

interface FileUploadValidatorProps {
  files: File[]
  options?: FileUploadOptions
  onValidationComplete?: (results: ValidationResult[]) => void
  onFilePreview?: (file: File, dataUrl: string) => void
  showPreview?: boolean
  showProgress?: boolean
  realTimeValidation?: boolean
  className?: string
}

const DEFAULT_OPTIONS: Required<Omit<FileUploadOptions, 'customRules' | 'minImageDimensions' | 'maxImageDimensions'>> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxTotalSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 10,
  allowedTypes: ['image/*', 'application/pdf', 'text/*'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', '.docx'],
  scanForViruses: false,
  checkDuplicates: true
}

export function FileUploadValidator({
  files = [],
  options = {},
  onValidationComplete,
  onFilePreview,
  showPreview = true,
  showProgress = true,
  realTimeValidation = true,
  className = ''
}: FileUploadValidatorProps) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [validationProgress, setValidationProgress] = useState<Map<string, number>>(new Map())
  const [previews, setPreviews] = useState<Map<string, string>>(new Map())
  const { addMessage, clearMessages } = useValidationFeedback()
  const validateTimeoutRef = useRef<NodeJS.Timeout>()

  // Memoized file checksums for duplicate detection
  const fileChecksums = useMemo(() => {
    return new Map<string, string>()
  }, [])

  // Validate files whenever the files array changes
  React.useEffect(() => {
    if (!realTimeValidation) return

    // Debounce validation
    if (validateTimeoutRef.current) {
      clearTimeout(validateTimeoutRef.current)
    }

    validateTimeoutRef.current = setTimeout(() => {
      validateFiles()
    }, 300)

    return () => {
      if (validateTimeoutRef.current) {
        clearTimeout(validateTimeoutRef.current)
      }
    }
  }, [files, realTimeValidation])

  const validateFiles = useCallback(async () => {
    clearMessages('file-upload')
    setValidationProgress(new Map())

    if (files.length === 0) {
      setValidationResults([])
      return
    }

    const results: ValidationResult[] = []
    const totalFiles = files.length

    // Check total file count
    if (files.length > config.maxFiles) {
      addMessage({
        field: 'file-upload',
        type: 'error',
        message: `Too many files. Maximum ${config.maxFiles} files allowed.`,
        severity: 'high'
      })
    }

    // Check total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > config.maxTotalSize) {
      addMessage({
        field: 'file-upload',
        type: 'error',
        message: `Total file size too large. Maximum ${formatFileSize(config.maxTotalSize)} allowed.`,
        severity: 'high'
      })
    }

    // Validate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const progress = ((i + 1) / totalFiles) * 100

      setValidationProgress(prev => new Map(prev.set(file.name, progress)))

      try {
        const result = await validateSingleFile(file, config, fileChecksums)
        results.push(result)

        // Generate preview for images
        if (showPreview && file.type.startsWith('image/')) {
          generatePreview(file)
        }

        // Add validation messages
        result.errors.forEach(error => {
          addMessage({
            field: 'file-upload',
            type: 'error',
            message: `${file.name}: ${error}`,
            severity: 'high'
          })
        })

        result.warnings.forEach(warning => {
          addMessage({
            field: 'file-upload',
            type: 'warning',
            message: `${file.name}: ${warning}`,
            severity: 'medium'
          })
        })

      } catch (error) {
        results.push({
          isValid: false,
          errors: [`Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
            extension: getFileExtension(file.name),
            lastModified: file.lastModified
          }
        })
      }
    }

    setValidationResults(results)
    onValidationComplete?.(results)
  }, [files, config, addMessage, clearMessages, onValidationComplete, showPreview, fileChecksums])

  const generatePreview = useCallback(async (file: File) => {
    try {
      const dataUrl = await readFileAsDataURL(file)
      setPreviews(prev => new Map(prev.set(file.name, dataUrl)))
      onFilePreview?.(file, dataUrl)
    } catch (error) {
      console.warn('Failed to generate preview for', file.name, error)
    }
  }, [onFilePreview])

  const getValidationSummary = () => {
    const totalFiles = validationResults.length
    const validFiles = validationResults.filter(r => r.isValid).length
    const errorFiles = validationResults.filter(r => r.errors.length > 0).length
    const warningFiles = validationResults.filter(r => r.warnings.length > 0).length

    return { totalFiles, validFiles, errorFiles, warningFiles }
  }

  const renderFileCard = (file: File, index: number) => {
    const result = validationResults[index]
    const progress = validationProgress.get(file.name) || 0
    const preview = previews.get(file.name)

    return (
      <div 
        key={file.name}
        className={`file-upload-validator__card ${
          result?.isValid ? 'file-upload-validator__card--valid' : 
          result?.errors.length > 0 ? 'file-upload-validator__card--error' : 
          'file-upload-validator__card--pending'
        }`}
      >
        {preview && (
          <div className="file-upload-validator__preview">
            <img 
              src={preview} 
              alt={`Preview of ${file.name}`}
              className="file-upload-validator__preview-image"
            />
          </div>
        )}

        <div className="file-upload-validator__info">
          <div className="file-upload-validator__name">{file.name}</div>
          <div className="file-upload-validator__meta">
            <span className="file-upload-validator__size">
              {formatFileSize(file.size)}
            </span>
            <span className="file-upload-validator__type">
              {file.type || getFileExtension(file.name)}
            </span>
          </div>

          {result?.fileInfo.dimensions && (
            <div className="file-upload-validator__dimensions">
              {result.fileInfo.dimensions.width} × {result.fileInfo.dimensions.height}
            </div>
          )}
        </div>

        {showProgress && progress < 100 && (
          <div className="file-upload-validator__progress">
            <div 
              className="file-upload-validator__progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="file-upload-validator__status">
          {result?.isValid && (
            <span className="file-upload-validator__status-icon file-upload-validator__status-icon--success">
              ✓
            </span>
          )}
          {result?.errors.length > 0 && (
            <span className="file-upload-validator__status-icon file-upload-validator__status-icon--error">
              ✗
            </span>
          )}
          {result?.warnings.length > 0 && !result.errors.length && (
            <span className="file-upload-validator__status-icon file-upload-validator__status-icon--warning">
              ⚠
            </span>
          )}
        </div>
      </div>
    )
  }

  const summary = getValidationSummary()

  return (
    <div className={`file-upload-validator ${className}`}>
      {files.length > 0 && (
        <div className="file-upload-validator__summary">
          <div className="file-upload-validator__summary-stats">
            <span className="file-upload-validator__stat">
              {summary.totalFiles} file{summary.totalFiles !== 1 ? 's' : ''}
            </span>
            {summary.validFiles > 0 && (
              <span className="file-upload-validator__stat file-upload-validator__stat--success">
                {summary.validFiles} valid
              </span>
            )}
            {summary.errorFiles > 0 && (
              <span className="file-upload-validator__stat file-upload-validator__stat--error">
                {summary.errorFiles} error{summary.errorFiles !== 1 ? 's' : ''}
              </span>
            )}
            {summary.warningFiles > 0 && (
              <span className="file-upload-validator__stat file-upload-validator__stat--warning">
                {summary.warningFiles} warning{summary.warningFiles !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="file-upload-validator__summary-size">
            Total: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))} / {formatFileSize(config.maxTotalSize)}
          </div>
        </div>
      )}

      <div className="file-upload-validator__files">
        {files.map(renderFileCard)}
      </div>
    </div>
  )
}

// Validate a single file
async function validateSingleFile(
  file: File, 
  config: Required<Omit<FileUploadOptions, 'customRules' | 'minImageDimensions' | 'maxImageDimensions'>> & FileUploadOptions,
  checksumCache: Map<string, string>
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const fileInfo: FileInfo = {
    name: file.name,
    size: file.size,
    type: file.type,
    extension: getFileExtension(file.name),
    lastModified: file.lastModified
  }

  // File size validation
  if (file.size > config.maxFileSize) {
    errors.push(`File too large. Maximum ${formatFileSize(config.maxFileSize)} allowed.`)
  }

  if (file.size === 0) {
    errors.push('File is empty.')
  }

  // File type validation
  const isTypeAllowed = config.allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1))
    }
    return file.type === type
  })

  const isExtensionAllowed = config.allowedExtensions.includes(fileInfo.extension.toLowerCase())

  if (!isTypeAllowed && !isExtensionAllowed) {
    errors.push(`File type not allowed. Allowed types: ${config.allowedExtensions.join(', ')}`)
  }

  // Image validation
  if (file.type.startsWith('image/')) {
    try {
      const dimensions = await getImageDimensions(file)
      fileInfo.dimensions = dimensions

      if (config.minImageDimensions) {
        if (dimensions.width < config.minImageDimensions.width || 
            dimensions.height < config.minImageDimensions.height) {
          errors.push(
            `Image too small. Minimum ${config.minImageDimensions.width}×${config.minImageDimensions.height} required.`
          )
        }
      }

      if (config.maxImageDimensions) {
        if (dimensions.width > config.maxImageDimensions.width || 
            dimensions.height > config.maxImageDimensions.height) {
          errors.push(
            `Image too large. Maximum ${config.maxImageDimensions.width}×${config.maxImageDimensions.height} allowed.`
          )
        }
      }
    } catch (error) {
      warnings.push('Could not read image dimensions.')
    }
  }

  // Duplicate file check
  if (config.checkDuplicates) {
    try {
      const checksum = await calculateFileChecksum(file)
      fileInfo.checksum = checksum

      if (checksumCache.has(checksum)) {
        warnings.push('Duplicate file detected.')
      } else {
        checksumCache.set(checksum, file.name)
      }
    } catch (error) {
      warnings.push('Could not calculate file checksum.')
    }
  }

  // Custom validation rules
  if (config.customRules) {
    for (const rule of config.customRules) {
      try {
        const isValid = rule.async ? await rule.validator(file) : rule.validator(file)
        if (!isValid) {
          if (rule.severity === 'error') {
            errors.push(rule.message)
          } else if (rule.severity === 'warning') {
            warnings.push(rule.message)
          }
        }
      } catch (error) {
        warnings.push(`Custom validation rule "${rule.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo
  }
}

// Utility functions
function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.')).toLowerCase()
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = reject

    const reader = new FileReader()
    reader.onload = () => {
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function calculateFileChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Hook for file upload validation
export function useFileUploadValidator(options?: FileUploadOptions) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  const validateFiles = useCallback(async (files: File[]) => {
    const checksumCache = new Map<string, string>()
    const results: ValidationResult[] = []

    for (const file of files) {
      const result = await validateSingleFile(file, config, checksumCache)
      results.push(result)
    }

    return results
  }, [config])

  const isValidFileType = useCallback((file: File) => {
    const extension = getFileExtension(file.name)
    const isTypeAllowed = config.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })
    const isExtensionAllowed = config.allowedExtensions.includes(extension.toLowerCase())
    return isTypeAllowed || isExtensionAllowed
  }, [config])

  const isValidFileSize = useCallback((file: File) => {
    return file.size > 0 && file.size <= config.maxFileSize
  }, [config.maxFileSize])

  return {
    validateFiles,
    isValidFileType,
    isValidFileSize,
    config
  }
}

export default FileUploadValidator