// CineBook Error Tracking Dashboard
// Real-time error monitoring, analysis, and management interface

import React, { useState, useEffect, useMemo } from 'react'
import { 
  AlertTriangle, 
  Bug, 
  Shield, 
  TrendingUp, 
  Filter, 
  Download,
  Eye,
  X,
  Calendar,
  MapPin,
  User,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Logger, LogEntry, ErrorCategory } from '../../services/Logger'
import performanceMonitor from '../../services/PerformanceMonitor'

// Error Statistics Interface
interface ErrorStatistics {
  totalErrors: number
  criticalErrors: number
  errorRate: number
  avgResolutionTime: number
  topErrorTypes: Array<{
    category: string
    count: number
    percentage: number
  }>
  errorTrend: Array<{
    timestamp: number
    count: number
    category: string
  }>
}

// Error Filter Options
interface ErrorFilters {
  severity: string[]
  category: string[]
  dateRange: {
    start: Date
    end: Date
  }
  userAgent: string[]
  page: string[]
}

// Grouped Error Entry
interface GroupedError {
  id: string
  fingerprint: string
  message: string
  category: ErrorCategory
  count: number
  firstSeen: Date
  lastSeen: Date
  affectedUsers: number
  stackTrace?: string
  context?: Record<string, any>
  resolved: boolean
}

const ErrorTrackingDashboard: React.FC = () => {
  const [errors, setErrors] = useState<LogEntry[]>([])
  const [groupedErrors, setGroupedErrors] = useState<GroupedError[]>([])
  const [statistics, setStatistics] = useState<ErrorStatistics | null>(null)
  const [filters, setFilters] = useState<ErrorFilters>({
    severity: [],
    category: [],
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      end: new Date()
    },
    userAgent: [],
    page: []
  })
  const [selectedError, setSelectedError] = useState<GroupedError | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize Logger instance for dashboard
  const logger = useMemo(() => new Logger({
    level: 'INFO',
    enableConsole: false,
    enableRemote: true,
    remoteEndpoint: '/api/monitoring/errors'
  }), [])

  // Fetch errors from API
  const fetchErrors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filters,
          limit: 1000
        })
      })

      if (response.ok) {
        const data = await response.json()
        setErrors(data.errors || [])
        setStatistics(data.statistics || null)
      }
    } catch (error) {
      console.error('Failed to fetch errors:', error)
      logger.logError('dashboard_fetch_error', error as Error, {
        component: 'ErrorTrackingDashboard',
        action: 'fetchErrors'
      })
    } finally {
      setLoading(false)
    }
  }

  // Group errors by fingerprint
  useEffect(() => {
    const grouped = errors.reduce((acc, error) => {
      const fingerprint = error.fingerprint || `${error.level}-${error.message}`
      
      if (!acc[fingerprint]) {
        acc[fingerprint] = {
          id: fingerprint,
          fingerprint,
          message: error.message,
          category: error.category || 'UNKNOWN',
          count: 0,
          firstSeen: new Date(error.timestamp),
          lastSeen: new Date(error.timestamp),
          affectedUsers: new Set(),
          stackTrace: error.context?.stackTrace,
          context: error.context,
          resolved: false
        }
      }

      acc[fingerprint].count++
      acc[fingerprint].lastSeen = new Date(Math.max(
        acc[fingerprint].lastSeen.getTime(),
        error.timestamp
      ))
      acc[fingerprint].firstSeen = new Date(Math.min(
        acc[fingerprint].firstSeen.getTime(),
        error.timestamp
      ))

      if (error.context?.userId) {
        acc[fingerprint].affectedUsers.add(error.context.userId)
      }

      return acc
    }, {} as Record<string, any>)

    const groupedArray = Object.values(grouped).map(group => ({
      ...group,
      affectedUsers: group.affectedUsers.size
    })) as GroupedError[]

    setGroupedErrors(groupedArray.sort((a, b) => b.count - a.count))
  }, [errors])

  // Apply filters
  const filteredErrors = useMemo(() => {
    return groupedErrors.filter(error => {
      // Severity filter
      if (filters.severity.length > 0 && !filters.severity.includes(error.category)) {
        return false
      }

      // Category filter
      if (filters.category.length > 0 && !filters.category.includes(error.category)) {
        return false
      }

      // Date range filter
      if (error.lastSeen < filters.dateRange.start || error.lastSeen > filters.dateRange.end) {
        return false
      }

      return true
    })
  }, [groupedErrors, filters])

  // Load errors on component mount and filter changes
  useEffect(() => {
    fetchErrors()
    
    // Set up real-time updates
    const interval = setInterval(fetchErrors, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [filters])

  // Handle error resolution
  const resolveError = async (errorId: string) => {
    try {
      const response = await fetch(`/api/monitoring/errors/${errorId}/resolve`, {
        method: 'POST'
      })

      if (response.ok) {
        setGroupedErrors(prev => 
          prev.map(error => 
            error.id === errorId 
              ? { ...error, resolved: true }
              : error
          )
        )
        
        logger.logInfo('error_resolved', {
          errorId,
          resolvedBy: 'admin',
          timestamp: Date.now()
        })
      }
    } catch (error) {
      logger.logError('resolve_error_failed', error as Error, { errorId })
    }
  }

  // Export errors
  const exportErrors = async () => {
    try {
      const response = await fetch('/api/monitoring/errors/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filters })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `errors-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      logger.logError('export_errors_failed', error as Error)
    }
  }

  // Get severity color
  const getSeverityColor = (category: string) => {
    switch (category) {
      case 'CRITICAL': return 'text-red-500'
      case 'ERROR': return 'text-orange-500'
      case 'WARNING': return 'text-yellow-500'
      case 'INFO': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  // Get severity icon
  const getSeverityIcon = (category: string) => {
    switch (category) {
      case 'CRITICAL': return AlertCircle
      case 'ERROR': return AlertTriangle
      case 'WARNING': return Shield
      default: return Bug
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Error Tracking Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor, analyze, and resolve application errors in real-time
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={exportErrors}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={fetchErrors}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{loading ? 'Loading...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Errors</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.totalErrors.toLocaleString()}
                  </p>
                </div>
                <Bug className="w-12 h-12 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Critical Errors</p>
                  <p className="text-3xl font-bold text-red-600">
                    {statistics.criticalErrors}
                  </p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Error Rate</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {statistics.errorRate.toFixed(2)}%
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Resolution</p>
                  <p className="text-3xl font-bold text-green-600">
                    {Math.round(statistics.avgResolutionTime / 3600)}h
                  </p>
                </div>
                <Clock className="w-12 h-12 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium">Filters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                multiple
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  severity: Array.from(e.target.selectedOptions, option => option.value)
                }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="CRITICAL">Critical</option>
                <option value="ERROR">Error</option>
                <option value="WARNING">Warning</option>
                <option value="INFO">Info</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: {
                    ...prev.dateRange,
                    start: new Date(e.target.value)
                  }
                }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: {
                    ...prev.dateRange,
                    end: new Date(e.target.value)
                  }
                }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  severity: [],
                  category: [],
                  dateRange: {
                    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    end: new Date()
                  },
                  userAgent: [],
                  page: []
                })}
                className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Error Groups ({filteredErrors.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users Affected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredErrors.map((error) => {
                  const SeverityIcon = getSeverityIcon(error.category)
                  
                  return (
                    <tr key={error.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <SeverityIcon className={`w-5 h-5 mr-3 ${getSeverityColor(error.category)}`} />
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate max-w-md">
                              {error.message}
                            </div>
                            <div className="text-sm text-gray-500">
                              {error.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {error.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {error.affectedUsers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {error.lastSeen.toLocaleDateString()} {error.lastSeen.toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {error.resolved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Open
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedError(error)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!error.resolved && (
                            <button
                              onClick={() => resolveError(error.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {filteredErrors.length === 0 && (
              <div className="text-center py-12">
                <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No errors found matching your criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Error Detail Modal */}
        {selectedError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Error Details
                </h3>
                <button
                  onClick={() => setSelectedError(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Message</h4>
                  <p className="text-gray-900">{selectedError.message}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Category</h4>
                    <p className="text-gray-900">{selectedError.category}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Count</h4>
                    <p className="text-gray-900">{selectedError.count}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">First Seen</h4>
                    <p className="text-gray-900">{selectedError.firstSeen.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Last Seen</h4>
                    <p className="text-gray-900">{selectedError.lastSeen.toLocaleString()}</p>
                  </div>
                </div>
                
                {selectedError.stackTrace && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Stack Trace</h4>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                      {selectedError.stackTrace}
                    </pre>
                  </div>
                )}
                
                {selectedError.context && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Context</h4>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(selectedError.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorTrackingDashboard