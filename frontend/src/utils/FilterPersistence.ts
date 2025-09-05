// FilterPersistence.ts - Utility for persisting filter state across sessions
import React from 'react'

export interface FilterPersistenceOptions {
  storageKey?: string
  storageType?: 'localStorage' | 'sessionStorage' | 'memory'
  expirationTime?: number // in milliseconds
  compress?: boolean
  encryption?: boolean
  maxStorageSize?: number // in bytes
  versionControl?: boolean
  currentVersion?: string
}

export interface PersistedFilterData {
  filters: any
  timestamp: number
  version?: string
  userAgent?: string
  url?: string
  metadata?: Record<string, any>
}

export interface FilterSnapshot {
  id: string
  name: string
  description?: string
  filters: any
  createdAt: number
  lastUsed: number
  useCount: number
  tags?: string[]
  isPublic?: boolean
  userId?: string
}

const DEFAULT_OPTIONS: Required<FilterPersistenceOptions> = {
  storageKey: 'cinebook-filters',
  storageType: 'localStorage',
  expirationTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  compress: false,
  encryption: false,
  maxStorageSize: 1024 * 1024, // 1MB
  versionControl: true,
  currentVersion: '1.0.0'
}

export class FilterPersistence {
  private options: Required<FilterPersistenceOptions>
  private storage: Storage | Map<string, string>
  private compressionEnabled: boolean
  private encryptionKey?: string

  constructor(options: FilterPersistenceOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.storage = this.initializeStorage()
    this.compressionEnabled = this.options.compress && this.isCompressionSupported()
    
    if (this.options.encryption) {
      this.initializeEncryption()
    }
  }

  private initializeStorage(): Storage | Map<string, string> {
    switch (this.options.storageType) {
      case 'localStorage':
        return typeof window !== 'undefined' ? window.localStorage : new Map()
      case 'sessionStorage':
        return typeof window !== 'undefined' ? window.sessionStorage : new Map()
      case 'memory':
      default:
        return new Map()
    }
  }

  private isCompressionSupported(): boolean {
    return typeof window !== 'undefined' && 'CompressionStream' in window
  }

  private async initializeEncryption(): Promise<void> {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      console.warn('Encryption not supported in this environment')
      return
    }

    try {
      // Generate or retrieve encryption key
      const keyData = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )
      
      // In a real application, you'd store this key securely
      this.encryptionKey = 'encryption-key-placeholder'
    } catch (error) {
      console.error('Failed to initialize encryption:', error)
    }
  }

  // Save filters to storage
  async saveFilters(filters: any, metadata?: Record<string, any>): Promise<boolean> {
    try {
      const data: PersistedFilterData = {
        filters,
        timestamp: Date.now(),
        metadata: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: typeof window !== 'undefined' ? window.location.pathname : '',
          ...metadata
        }
      }

      if (this.options.versionControl) {
        data.version = this.options.currentVersion
      }

      let serializedData = JSON.stringify(data)

      // Apply compression if enabled
      if (this.compressionEnabled) {
        serializedData = await this.compressData(serializedData)
      }

      // Apply encryption if enabled
      if (this.options.encryption && this.encryptionKey) {
        serializedData = await this.encryptData(serializedData)
      }

      // Check storage size limit
      if (this.options.maxStorageSize && serializedData.length > this.options.maxStorageSize) {
        console.warn('Filter data exceeds maximum storage size limit')
        return false
      }

      // Save to storage
      if (this.storage instanceof Map) {
        this.storage.set(this.options.storageKey, serializedData)
      } else {
        this.storage.setItem(this.options.storageKey, serializedData)
      }

      return true
    } catch (error) {
      console.error('Failed to save filters:', error)
      return false
    }
  }

  // Load filters from storage
  async loadFilters(): Promise<any | null> {
    try {
      let serializedData: string | null

      if (this.storage instanceof Map) {
        serializedData = this.storage.get(this.options.storageKey) || null
      } else {
        serializedData = this.storage.getItem(this.options.storageKey)
      }

      if (!serializedData) {
        return null
      }

      // Apply decryption if enabled
      if (this.options.encryption && this.encryptionKey) {
        serializedData = await this.decryptData(serializedData)
      }

      // Apply decompression if enabled
      if (this.compressionEnabled) {
        serializedData = await this.decompressData(serializedData)
      }

      const data: PersistedFilterData = JSON.parse(serializedData)

      // Check expiration
      if (this.options.expirationTime > 0) {
        const isExpired = Date.now() - data.timestamp > this.options.expirationTime
        if (isExpired) {
          this.clearFilters()
          return null
        }
      }

      // Check version compatibility
      if (this.options.versionControl && data.version && data.version !== this.options.currentVersion) {
        console.warn(`Filter data version mismatch: ${data.version} vs ${this.options.currentVersion}`)
        // You might want to migrate data here
        return this.migrateFilterData(data)
      }

      return data.filters
    } catch (error) {
      console.error('Failed to load filters:', error)
      return null
    }
  }

  // Clear stored filters
  clearFilters(): void {
    try {
      if (this.storage instanceof Map) {
        this.storage.delete(this.options.storageKey)
      } else {
        this.storage.removeItem(this.options.storageKey)
      }
    } catch (error) {
      console.error('Failed to clear filters:', error)
    }
  }

  // Check if filters exist in storage
  hasStoredFilters(): boolean {
    try {
      if (this.storage instanceof Map) {
        return this.storage.has(this.options.storageKey)
      } else {
        return this.storage.getItem(this.options.storageKey) !== null
      }
    } catch (error) {
      console.error('Failed to check stored filters:', error)
      return false
    }
  }

  // Get storage information
  getStorageInfo(): {
    hasData: boolean
    size: number
    lastModified: number | null
    version: string | null
  } {
    try {
      if (!this.hasStoredFilters()) {
        return {
          hasData: false,
          size: 0,
          lastModified: null,
          version: null
        }
      }

      let rawData: string | null
      if (this.storage instanceof Map) {
        rawData = this.storage.get(this.options.storageKey) || null
      } else {
        rawData = this.storage.getItem(this.options.storageKey)
      }

      if (!rawData) {
        return {
          hasData: false,
          size: 0,
          lastModified: null,
          version: null
        }
      }

      return {
        hasData: true,
        size: rawData.length,
        lastModified: Date.now(), // This would need to be stored separately for accuracy
        version: this.options.currentVersion
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
      return {
        hasData: false,
        size: 0,
        lastModified: null,
        version: null
      }
    }
  }

  // Save filter snapshot with name and description
  async saveSnapshot(
    id: string,
    name: string,
    filters: any,
    description?: string,
    tags?: string[]
  ): Promise<boolean> {
    try {
      const snapshots = await this.loadSnapshots()
      const snapshot: FilterSnapshot = {
        id,
        name,
        description,
        filters,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        useCount: 1,
        tags,
        isPublic: false
      }

      snapshots[id] = snapshot
      return this.saveSnapshots(snapshots)
    } catch (error) {
      console.error('Failed to save snapshot:', error)
      return false
    }
  }

  // Load filter snapshots
  async loadSnapshots(): Promise<Record<string, FilterSnapshot>> {
    try {
      const key = `${this.options.storageKey}-snapshots`
      let serializedData: string | null

      if (this.storage instanceof Map) {
        serializedData = this.storage.get(key) || null
      } else {
        serializedData = this.storage.getItem(key)
      }

      if (!serializedData) {
        return {}
      }

      if (this.options.encryption && this.encryptionKey) {
        serializedData = await this.decryptData(serializedData)
      }

      if (this.compressionEnabled) {
        serializedData = await this.decompressData(serializedData)
      }

      return JSON.parse(serializedData)
    } catch (error) {
      console.error('Failed to load snapshots:', error)
      return {}
    }
  }

  // Save snapshots to storage
  private async saveSnapshots(snapshots: Record<string, FilterSnapshot>): Promise<boolean> {
    try {
      const key = `${this.options.storageKey}-snapshots`
      let serializedData = JSON.stringify(snapshots)

      if (this.compressionEnabled) {
        serializedData = await this.compressData(serializedData)
      }

      if (this.options.encryption && this.encryptionKey) {
        serializedData = await this.encryptData(serializedData)
      }

      if (this.storage instanceof Map) {
        this.storage.set(key, serializedData)
      } else {
        this.storage.setItem(key, serializedData)
      }

      return true
    } catch (error) {
      console.error('Failed to save snapshots:', error)
      return false
    }
  }

  // Delete a snapshot
  async deleteSnapshot(id: string): Promise<boolean> {
    try {
      const snapshots = await this.loadSnapshots()
      delete snapshots[id]
      return this.saveSnapshots(snapshots)
    } catch (error) {
      console.error('Failed to delete snapshot:', error)
      return false
    }
  }

  // Update snapshot usage
  async updateSnapshotUsage(id: string): Promise<void> {
    try {
      const snapshots = await this.loadSnapshots()
      if (snapshots[id]) {
        snapshots[id].lastUsed = Date.now()
        snapshots[id].useCount += 1
        await this.saveSnapshots(snapshots)
      }
    } catch (error) {
      console.error('Failed to update snapshot usage:', error)
    }
  }

  // Export filters as JSON
  async exportFilters(includeMetadata = true): Promise<string | null> {
    try {
      const filters = await this.loadFilters()
      if (!filters) return null

      const exportData = {
        filters,
        exportedAt: Date.now(),
        version: this.options.currentVersion,
        ...(includeMetadata && {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: typeof window !== 'undefined' ? window.location.href : ''
        })
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Failed to export filters:', error)
      return null
    }
  }

  // Import filters from JSON
  async importFilters(jsonData: string): Promise<boolean> {
    try {
      const importData = JSON.parse(jsonData)
      
      if (!importData.filters) {
        throw new Error('Invalid import data: missing filters')
      }

      // Validate version compatibility if needed
      if (importData.version && importData.version !== this.options.currentVersion) {
        console.warn(`Importing filters from different version: ${importData.version}`)
      }

      return this.saveFilters(importData.filters, {
        imported: true,
        originalVersion: importData.version,
        importedAt: Date.now()
      })
    } catch (error) {
      console.error('Failed to import filters:', error)
      return false
    }
  }

  // Compress data (basic implementation)
  private async compressData(data: string): Promise<string> {
    // In a real implementation, you'd use compression algorithms
    // For now, this is a placeholder
    return data
  }

  // Decompress data (basic implementation)
  private async decompressData(data: string): Promise<string> {
    // In a real implementation, you'd use decompression algorithms
    // For now, this is a placeholder
    return data
  }

  // Encrypt data (basic implementation)
  private async encryptData(data: string): Promise<string> {
    // In a real implementation, you'd use proper encryption
    // For now, this is a placeholder
    return btoa(data) // Simple base64 encoding (NOT secure)
  }

  // Decrypt data (basic implementation)
  private async decryptData(data: string): Promise<string> {
    // In a real implementation, you'd use proper decryption
    // For now, this is a placeholder
    return atob(data) // Simple base64 decoding (NOT secure)
  }

  // Migrate filter data between versions
  private migrateFilterData(data: PersistedFilterData): any {
    // Implement version-specific migration logic here
    console.log('Migrating filter data from version', data.version, 'to', this.options.currentVersion)
    return data.filters
  }
}

// React hook for filter persistence
export function useFilterPersistence(options?: FilterPersistenceOptions) {
  const [persistence] = React.useState(() => new FilterPersistence(options))
  const [isLoading, setIsLoading] = React.useState(false)

  const saveFilters = React.useCallback(async (filters: any, metadata?: Record<string, any>) => {
    setIsLoading(true)
    try {
      const result = await persistence.saveFilters(filters, metadata)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [persistence])

  const loadFilters = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await persistence.loadFilters()
      return result
    } finally {
      setIsLoading(false)
    }
  }, [persistence])

  const clearFilters = React.useCallback(() => {
    persistence.clearFilters()
  }, [persistence])

  const hasStoredFilters = React.useCallback(() => {
    return persistence.hasStoredFilters()
  }, [persistence])

  const exportFilters = React.useCallback(async (includeMetadata = true) => {
    setIsLoading(true)
    try {
      const result = await persistence.exportFilters(includeMetadata)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [persistence])

  const importFilters = React.useCallback(async (jsonData: string) => {
    setIsLoading(true)
    try {
      const result = await persistence.importFilters(jsonData)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [persistence])

  const saveSnapshot = React.useCallback(async (
    id: string,
    name: string,
    filters: any,
    description?: string,
    tags?: string[]
  ) => {
    setIsLoading(true)
    try {
      const result = await persistence.saveSnapshot(id, name, filters, description, tags)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [persistence])

  const loadSnapshots = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await persistence.loadSnapshots()
      return result
    } finally {
      setIsLoading(false)
    }
  }, [persistence])

  const deleteSnapshot = React.useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const result = await persistence.deleteSnapshot(id)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [persistence])

  const getStorageInfo = React.useCallback(() => {
    return persistence.getStorageInfo()
  }, [persistence])

  return {
    saveFilters,
    loadFilters,
    clearFilters,
    hasStoredFilters,
    exportFilters,
    importFilters,
    saveSnapshot,
    loadSnapshots,
    deleteSnapshot,
    getStorageInfo,
    isLoading
  }
}

// Default instance for easy usage
export const defaultFilterPersistence = new FilterPersistence()

export default FilterPersistence