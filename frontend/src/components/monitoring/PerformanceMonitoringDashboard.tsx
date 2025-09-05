// CineBook Performance Monitoring Dashboard
// Real-time performance metrics, Core Web Vitals, and system health monitoring

import React, { useState, useEffect, useMemo } from 'react'
import {
  Activity,
  Clock,
  Zap,
  TrendingUp,
  Monitor,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import performanceMonitor, { 
  CoreWebVitals, 
  PerformanceMetric,
  InteractionMetrics
} from '../../services/PerformanceMonitor'
import { Logger } from '../../services/Logger'

// Performance Dashboard State
interface PerformanceDashboardState {
  vitals: CoreWebVitals
  interactions: InteractionMetrics
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical'
    uptime: number
    responseTime: number
    errorRate: number
    score: number
  }
  deviceBreakdown: {
    mobile: number
    tablet: number
    desktop: number
  }
  alerts: Array<{
    id: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: number
  }>
}

const PerformanceMonitoringDashboard: React.FC = () => {
  const [dashboardState, setDashboardState] = useState<PerformanceDashboardState>({
    vitals: {},
    interactions: {
      pageViews: 0,
      sessionDuration: 0,
      bounceRate: 0,
      clickThroughRate: 0,
      formCompletionRate: 0,
      errorRate: 0
    },
    systemHealth: {
      status: 'healthy',
      uptime: 99.9,
      responseTime: 120,
      errorRate: 0.1,
      score: 85
    },
    deviceBreakdown: {
      mobile: 65,
      tablet: 15,
      desktop: 20
    },
    alerts: []
  })

  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h')
  const logger = useMemo(() => new Logger({ level: 'INFO' }), [])

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      const currentSummary = performanceMonitor.getPerformanceSummary()
      
      const response = await fetch(`/api/monitoring/performance?timeRange=${selectedTimeRange}`)
      
      if (response.ok) {
        const data = await response.json()
        
        setDashboardState(prev => ({
          ...prev,
          vitals: currentSummary.vitals,
          interactions: currentSummary.interactions,
          systemHealth: data.systemHealth || prev.systemHealth,
          deviceBreakdown: data.deviceBreakdown || prev.deviceBreakdown,
          alerts: generateAlerts(currentSummary.vitals)
        }))
      }
    } catch (error) {
      logger.logError('performance_fetch_error', error as Error)
    } finally {
      setLoading(false)
    }
  }

  // Generate performance alerts
  const generateAlerts = (vitals: CoreWebVitals) => {
    const alerts = []

    if (vitals.LCP && vitals.LCP > 2500) {
      alerts.push({
        id: `lcp-${Date.now()}`,
        severity: vitals.LCP > 4000 ? 'critical' : 'high' as const,
        message: `Largest Contentful Paint is ${vitals.LCP.toFixed(0)}ms (threshold: 2500ms)`,
        timestamp: Date.now()
      })
    }

    if (vitals.FID && vitals.FID > 100) {
      alerts.push({
        id: `fid-${Date.now()}`,
        severity: vitals.FID > 300 ? 'critical' : 'high' as const,
        message: `First Input Delay is ${vitals.FID.toFixed(0)}ms (threshold: 100ms)`,
        timestamp: Date.now()
      })
    }

    if (vitals.CLS && vitals.CLS > 0.1) {
      alerts.push({
        id: `cls-${Date.now()}`,
        severity: vitals.CLS > 0.25 ? 'critical' : 'high' as const,
        message: `Cumulative Layout Shift is ${vitals.CLS.toFixed(3)} (threshold: 0.1)`,
        timestamp: Date.now()
      })
    }

    return alerts
  }

  // Load data on mount and time range change
  useEffect(() => {
    fetchPerformanceData()
    const interval = setInterval(fetchPerformanceData, 30000)
    return () => clearInterval(interval)
  }, [selectedTimeRange])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  // Get Web Vitals score color
  const getVitalsColor = (metric: string, value: number) => {
    switch (metric) {
      case 'LCP':
        return value <= 2500 ? 'text-green-500' : value <= 4000 ? 'text-yellow-500' : 'text-red-500'
      case 'FID':
        return value <= 100 ? 'text-green-500' : value <= 300 ? 'text-yellow-500' : 'text-red-500'
      case 'CLS':
        return value <= 0.1 ? 'text-green-500' : value <= 0.25 ? 'text-yellow-500' : 'text-red-500'
      case 'FCP':
        return value <= 1800 ? 'text-green-500' : value <= 3000 ? 'text-yellow-500' : 'text-red-500'
      default:
        return 'text-gray-500'
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
                Performance Monitoring Dashboard
              </h1>
              <p className="text-gray-600">
                Real-time performance metrics and Core Web Vitals monitoring
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
              
              <button
                onClick={fetchPerformanceData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Activity className="w-4 h-4" />
                <span>{loading ? 'Loading...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-5 h-5 ${getStatusColor(dashboardState.systemHealth.status)}`} />
              <span className={`font-medium ${getStatusColor(dashboardState.systemHealth.status)}`}>
                {dashboardState.systemHealth.status.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dashboardState.systemHealth.uptime}%
              </div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardState.systemHealth.responseTime}ms
              </div>
              <div className="text-sm text-gray-500">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {dashboardState.systemHealth.errorRate}%
              </div>
              <div className="text-sm text-gray-500">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {dashboardState.systemHealth.score}
              </div>
              <div className="text-sm text-gray-500">Performance Score</div>
            </div>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {dashboardState.vitals.LCP && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">LCP</div>
                <Zap className={`w-5 h-5 ${getVitalsColor('LCP', dashboardState.vitals.LCP)}`} />
              </div>
              <div className={`text-2xl font-bold ${getVitalsColor('LCP', dashboardState.vitals.LCP)}`}>
                {dashboardState.vitals.LCP.toFixed(0)}ms
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Largest Contentful Paint
              </div>
            </div>
          )}

          {dashboardState.vitals.FID && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">FID</div>
                <Clock className={`w-5 h-5 ${getVitalsColor('FID', dashboardState.vitals.FID)}`} />
              </div>
              <div className={`text-2xl font-bold ${getVitalsColor('FID', dashboardState.vitals.FID)}`}>
                {dashboardState.vitals.FID.toFixed(0)}ms
              </div>
              <div className="text-xs text-gray-500 mt-1">
                First Input Delay
              </div>
            </div>
          )}

          {dashboardState.vitals.CLS && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">CLS</div>
                <BarChart3 className={`w-5 h-5 ${getVitalsColor('CLS', dashboardState.vitals.CLS)}`} />
              </div>
              <div className={`text-2xl font-bold ${getVitalsColor('CLS', dashboardState.vitals.CLS)}`}>
                {dashboardState.vitals.CLS.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Cumulative Layout Shift
              </div>
            </div>
          )}

          {dashboardState.vitals.FCP && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-500">FCP</div>
                <TrendingUp className={`w-5 h-5 ${getVitalsColor('FCP', dashboardState.vitals.FCP)}`} />
              </div>
              <div className={`text-2xl font-bold ${getVitalsColor('FCP', dashboardState.vitals.FCP)}`}>
                {dashboardState.vitals.FCP.toFixed(0)}ms
              </div>
              <div className="text-xs text-gray-500 mt-1">
                First Contentful Paint
              </div>
            </div>
          )}
        </div>

        {/* Device Breakdown and Interactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Mobile</span>
                </div>
                <span className="font-medium">{dashboardState.deviceBreakdown.mobile}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Desktop</span>
                </div>
                <span className="font-medium">{dashboardState.deviceBreakdown.desktop}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Tablet</span>
                </div>
                <span className="font-medium">{dashboardState.deviceBreakdown.tablet}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Interactions</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Page Views:</span>
                <span className="font-medium">{dashboardState.interactions.pageViews}</span>
              </div>
              <div className="flex justify-between">
                <span>Session Duration:</span>
                <span className="font-medium">
                  {Math.round(dashboardState.interactions.sessionDuration / 60000)}min
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bounce Rate:</span>
                <span className="font-medium">
                  {(dashboardState.interactions.bounceRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Form Completion:</span>
                <span className="font-medium">
                  {(dashboardState.interactions.formCompletionRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Alerts */}
        {dashboardState.alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Performance Alerts ({dashboardState.alerts.length})
                </h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {dashboardState.alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'critical'
                        ? 'bg-red-50 border-red-500'
                        : alert.severity === 'high'
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`text-sm font-medium ${
                        alert.severity === 'critical'
                          ? 'text-red-800'
                          : alert.severity === 'high'
                          ? 'text-orange-800'
                          : 'text-yellow-800'
                      }`}>
                        {alert.message}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PerformanceMonitoringDashboard