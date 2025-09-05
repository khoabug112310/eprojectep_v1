import React, { useState, useEffect, useMemo } from 'react'
import './BundleAnalyzer.css'

interface BundleData {
  modules: Array<{
    id: string
    name: string
    size: number
    gzippedSize: number
    chunks: string[]
    reasons: Array<{
      module: string
      reason: string
    }>
  }>
  chunks: Array<{
    id: string
    name: string
    size: number
    modules: string[]
    entry: boolean
    initial: boolean
  }>
  assets: Array<{
    name: string
    size: number
    gzippedSize: number
    type: 'js' | 'css' | 'image' | 'font' | 'other'
  }>
  dependencies: Array<{
    name: string
    version: string
    size: number
    type: 'dependency' | 'devDependency'
    treeshakeable: boolean
  }>
  optimization: {
    treeshaking: boolean
    minification: boolean
    compression: boolean
    codesplitting: boolean
    recommendations: Array<{
      type: 'warning' | 'error' | 'info'
      message: string
      impact: 'high' | 'medium' | 'low'
      solution: string
    }>
  }
}

interface AnalysisFilters {
  minSize: number
  chunkType: 'all' | 'entry' | 'async'
  assetType: 'all' | 'js' | 'css' | 'image' | 'font'
  sortBy: 'size' | 'gzippedSize' | 'name'
  sortOrder: 'asc' | 'desc'
}

export default function BundleAnalyzer() {
  const [bundleData, setBundleData] = useState<BundleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'modules' | 'chunks' | 'dependencies' | 'optimization'>('overview')
  const [filters, setFilters] = useState<AnalysisFilters>({
    minSize: 0,
    chunkType: 'all',
    assetType: 'all',
    sortBy: 'size',
    sortOrder: 'desc'
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Load bundle data
  useEffect(() => {
    loadBundleData()
  }, [])

  const loadBundleData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Try to load actual bundle stats
      const response = await fetch('/api/bundle-stats')
      if (response.ok) {
        const data = await response.json()
        setBundleData(data)
      } else {
        throw new Error('Bundle stats not available')
      }
    } catch (error) {
      console.error('Error loading bundle data:', error)
      setError('Unable to load bundle analysis. Showing mock data.')
      
      // Generate comprehensive mock data
      const mockData: BundleData = {
        modules: [
          {
            id: '1',
            name: 'react',
            size: 42500,
            gzippedSize: 13200,
            chunks: ['main'],
            reasons: [{ module: 'App.tsx', reason: 'import React from "react"' }]
          },
          {
            id: '2',
            name: 'react-dom',
            size: 135600,
            gzippedSize: 42300,
            chunks: ['main'],
            reasons: [{ module: 'index.tsx', reason: 'import ReactDOM from "react-dom"' }]
          },
          {
            id: '3',
            name: 'react-router-dom',
            size: 56800,
            gzippedSize: 18200,
            chunks: ['main'],
            reasons: [{ module: 'App.tsx', reason: 'import { BrowserRouter } from "react-router-dom"' }]
          },
          {
            id: '4',
            name: 'axios',
            size: 24700,
            gzippedSize: 8900,
            chunks: ['main'],
            reasons: [{ module: 'api.ts', reason: 'import axios from "axios"' }]
          },
          {
            id: '5',
            name: 'lodash',
            size: 67200,
            gzippedSize: 22100,
            chunks: ['main'],
            reasons: [{ module: 'utils.ts', reason: 'import _ from "lodash"' }]
          },
          {
            id: '6',
            name: 'moment',
            size: 328000,
            gzippedSize: 68400,
            chunks: ['main'],
            reasons: [{ module: 'DateUtils.ts', reason: 'import moment from "moment"' }]
          },
          {
            id: '7',
            name: '@types/react',
            size: 0,
            gzippedSize: 0,
            chunks: [],
            reasons: [{ module: 'typescript', reason: 'type definitions' }]
          },
          {
            id: '8',
            name: 'src/components',
            size: 156800,
            gzippedSize: 42100,
            chunks: ['main'],
            reasons: [{ module: 'App.tsx', reason: 'component imports' }]
          },
          {
            id: '9',
            name: 'src/pages',
            size: 89200,
            gzippedSize: 28400,
            chunks: ['main', 'pages'],
            reasons: [{ module: 'Router.tsx', reason: 'page imports' }]
          },
          {
            id: '10',
            name: 'material-ui/core',
            size: 245800,
            gzippedSize: 76200,
            chunks: ['main'],
            reasons: [{ module: 'components', reason: 'UI component library' }]
          }
        ],
        chunks: [
          {
            id: 'main',
            name: 'main',
            size: 567800,
            modules: ['1', '2', '3', '4', '5', '8', '10'],
            entry: true,
            initial: true
          },
          {
            id: 'vendor',
            name: 'vendor',
            size: 328000,
            modules: ['6'],
            entry: false,
            initial: true
          },
          {
            id: 'pages',
            name: 'pages',
            size: 89200,
            modules: ['9'],
            entry: false,
            initial: false
          }
        ],
        assets: [
          { name: 'main.js', size: 567800, gzippedSize: 156200, type: 'js' },
          { name: 'vendor.js', size: 328000, gzippedSize: 68400, type: 'js' },
          { name: 'pages.js', size: 89200, gzippedSize: 28400, type: 'js' },
          { name: 'main.css', size: 45600, gzippedSize: 12300, type: 'css' },
          { name: 'logo.png', size: 24600, gzippedSize: 24100, type: 'image' },
          { name: 'font.woff2', size: 18200, gzippedSize: 18000, type: 'font' }
        ],
        dependencies: [
          { name: 'react', version: '18.2.0', size: 42500, type: 'dependency', treeshakeable: false },
          { name: 'react-dom', version: '18.2.0', size: 135600, type: 'dependency', treeshakeable: false },
          { name: 'react-router-dom', version: '6.4.0', size: 56800, type: 'dependency', treeshakeable: true },
          { name: 'axios', version: '1.1.3', size: 24700, type: 'dependency', treeshakeable: true },
          { name: 'lodash', version: '4.17.21', size: 67200, type: 'dependency', treeshakeable: true },
          { name: 'moment', version: '2.29.4', size: 328000, type: 'dependency', treeshakeable: false },
          { name: 'material-ui/core', version: '5.0.0', size: 245800, type: 'dependency', treeshakeable: true },
          { name: '@types/react', version: '18.0.21', size: 0, type: 'devDependency', treeshakeable: false }
        ],
        optimization: {
          treeshaking: true,
          minification: true,
          compression: true,
          codesplitting: true,
          recommendations: [
            {
              type: 'error',
              message: 'Moment.js is a large dependency (328KB)',
              impact: 'high',
              solution: 'Consider switching to date-fns or dayjs for smaller bundle size'
            },
            {
              type: 'warning',
              message: 'Lodash is imported as entire library',
              impact: 'medium',
              solution: 'Use lodash-es or import specific functions: import { debounce } from "lodash/debounce"'
            },
            {
              type: 'warning',
              message: 'Material-UI could be tree-shaken better',
              impact: 'medium',
              solution: 'Use named imports: import { Button } from "@mui/material"'
            },
            {
              type: 'info',
              message: 'Code splitting is implemented for page routes',
              impact: 'low',
              solution: 'Good! Consider splitting large components as well'
            },
            {
              type: 'warning',
              message: 'Some components could be lazy loaded',
              impact: 'medium',
              solution: 'Use React.lazy() for components not used on initial render'
            }
          ]
        }
      }
      
      setBundleData(mockData)
    } finally {
      setLoading(false)
    }
  }

  // Filtered and sorted data
  const filteredModules = useMemo(() => {
    if (!bundleData) return []

    let filtered = bundleData.modules.filter(module => {
      if (module.size < filters.minSize * 1024) return false
      if (searchQuery && !module.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })

    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy] || 0
      const bValue = b[filters.sortBy] || 0
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [bundleData, filters, searchQuery])

  const filteredAssets = useMemo(() => {
    if (!bundleData) return []

    let filtered = bundleData.assets.filter(asset => {
      if (filters.assetType !== 'all' && asset.type !== filters.assetType) return false
      if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })

    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy] || 0
      const bValue = b[filters.sortBy] || 0
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [bundleData, filters, searchQuery])

  // Utility functions
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const calculateCompressionRatio = (original: number, compressed: number) => {
    if (original === 0) return 0
    return ((original - compressed) / original * 100).toFixed(1)
  }

  const generateOptimizationReport = () => {
    if (!bundleData) return

    const report = {
      totalSize: bundleData.assets.reduce((sum, asset) => sum + asset.size, 0),
      totalGzipped: bundleData.assets.reduce((sum, asset) => sum + asset.gzippedSize, 0),
      largestAssets: bundleData.assets.sort((a, b) => b.size - a.size).slice(0, 5),
      duplicateModules: [], // Would need to analyze actual module tree
      unusedModules: [], // Would need to analyze actual usage
      recommendations: bundleData.optimization.recommendations
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bundle-analysis-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="bundle-analyzer loading">
        <div className="loading-spinner"></div>
        <p>Analyzing bundle...</p>
      </div>
    )
  }

  if (!bundleData) {
    return (
      <div className="bundle-analyzer error">
        <h3>Bundle Analysis Failed</h3>
        <p>{error}</p>
        <button onClick={loadBundleData} className="retry-btn">
          Retry Analysis
        </button>
      </div>
    )
  }

  const totalSize = bundleData.assets.reduce((sum, asset) => sum + asset.size, 0)
  const totalGzipped = bundleData.assets.reduce((sum, asset) => sum + asset.gzippedSize, 0)
  const compressionRatio = calculateCompressionRatio(totalSize, totalGzipped)

  return (
    <div className="bundle-analyzer">
      <div className="analyzer-header">
        <div className="header-content">
          <h2>Bundle Analyzer</h2>
          <p>Analyze and optimize your application bundle</p>
        </div>
        
        <div className="header-actions">
          <button onClick={generateOptimizationReport} className="export-btn">
            📊 Export Report
          </button>
          <button onClick={loadBundleData} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="analyzer-warning">
          <span className="warning-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Bundle Size</h3>
          <div className="size-value">{formatSize(totalSize)}</div>
          <div className="size-detail">
            Gzipped: {formatSize(totalGzipped)} ({compressionRatio}% compression)
          </div>
        </div>

        <div className="summary-card">
          <h3>Total Modules</h3>
          <div className="size-value">{bundleData.modules.length}</div>
          <div className="size-detail">
            {bundleData.dependencies.filter(d => d.type === 'dependency').length} dependencies
          </div>
        </div>

        <div className="summary-card">
          <h3>Chunks</h3>
          <div className="size-value">{bundleData.chunks.length}</div>
          <div className="size-detail">
            {bundleData.chunks.filter(c => c.entry).length} entry points
          </div>
        </div>

        <div className="summary-card">
          <h3>Optimization Score</h3>
          <div className="size-value score">
            {bundleData.optimization.recommendations.filter(r => r.type === 'error').length === 0 ? '85' : '65'}/100
          </div>
          <div className="size-detail">
            {bundleData.optimization.recommendations.length} recommendations
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="analyzer-tabs">
        <button
          className={`tab ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${selectedTab === 'modules' ? 'active' : ''}`}
          onClick={() => setSelectedTab('modules')}
        >
          Modules ({bundleData.modules.length})
        </button>
        <button
          className={`tab ${selectedTab === 'chunks' ? 'active' : ''}`}
          onClick={() => setSelectedTab('chunks')}
        >
          Chunks ({bundleData.chunks.length})
        </button>
        <button
          className={`tab ${selectedTab === 'dependencies' ? 'active' : ''}`}
          onClick={() => setSelectedTab('dependencies')}
        >
          Dependencies ({bundleData.dependencies.length})
        </button>
        <button
          className={`tab ${selectedTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setSelectedTab('optimization')}
        >
          Optimization ({bundleData.optimization.recommendations.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {selectedTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="chart-section">
                <h3>Bundle Composition</h3>
                <div className="bundle-treemap">
                  {bundleData.chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="treemap-item"
                      style={{
                        width: `${(chunk.size / totalSize) * 100}%`,
                        minWidth: '60px'
                      }}
                    >
                      <div className="treemap-label">{chunk.name}</div>
                      <div className="treemap-size">{formatSize(chunk.size)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="largest-files">
                <h3>Largest Files</h3>
                <div className="files-list">
                  {bundleData.assets
                    .sort((a, b) => b.size - a.size)
                    .slice(0, 10)
                    .map((asset, index) => (
                      <div key={index} className="file-item">
                        <div className="file-info">
                          <div className="file-name">{asset.name}</div>
                          <div className="file-type">{asset.type}</div>
                        </div>
                        <div className="file-sizes">
                          <div className="file-size">{formatSize(asset.size)}</div>
                          <div className="file-gzipped">gzip: {formatSize(asset.gzippedSize)}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'modules' && (
          <div className="modules-tab">
            <div className="filters-bar">
              <div className="search-input">
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Min Size (KB):</label>
                <input
                  type="number"
                  value={filters.minSize}
                  onChange={(e) => setFilters(prev => ({ ...prev, minSize: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>

              <div className="filter-group">
                <label>Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                >
                  <option value="size">Size</option>
                  <option value="gzippedSize">Gzipped Size</option>
                  <option value="name">Name</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Order:</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>

            <div className="modules-table">
              <table>
                <thead>
                  <tr>
                    <th>Module Name</th>
                    <th>Size</th>
                    <th>Gzipped</th>
                    <th>Chunks</th>
                    <th>Reasons</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModules.map((module) => (
                    <tr key={module.id}>
                      <td className="module-name">{module.name}</td>
                      <td className="module-size">{formatSize(module.size)}</td>
                      <td className="module-gzipped">{formatSize(module.gzippedSize)}</td>
                      <td className="module-chunks">
                        {module.chunks.map((chunk, i) => (
                          <span key={i} className="chunk-tag">{chunk}</span>
                        ))}
                      </td>
                      <td className="module-reasons">{module.reasons.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'chunks' && (
          <div className="chunks-tab">
            <div className="chunks-grid">
              {bundleData.chunks.map((chunk) => (
                <div key={chunk.id} className="chunk-card">
                  <div className="chunk-header">
                    <h4>{chunk.name}</h4>
                    <div className="chunk-badges">
                      {chunk.entry && <span className="badge entry">Entry</span>}
                      {chunk.initial && <span className="badge initial">Initial</span>}
                    </div>
                  </div>
                  <div className="chunk-stats">
                    <div className="stat">
                      <span className="label">Size:</span>
                      <span className="value">{formatSize(chunk.size)}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Modules:</span>
                      <span className="value">{chunk.modules.length}</span>
                    </div>
                  </div>
                  <div className="chunk-modules">
                    <div className="modules-preview">
                      {chunk.modules.slice(0, 3).map((moduleId) => {
                        const module = bundleData.modules.find(m => m.id === moduleId)
                        return module ? (
                          <div key={moduleId} className="module-preview">
                            {module.name}
                          </div>
                        ) : null
                      })}
                      {chunk.modules.length > 3 && (
                        <div className="modules-more">
                          +{chunk.modules.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'dependencies' && (
          <div className="dependencies-tab">
            <div className="dependencies-table">
              <table>
                <thead>
                  <tr>
                    <th>Package Name</th>
                    <th>Version</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Tree Shakeable</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bundleData.dependencies.map((dep, index) => (
                    <tr key={index}>
                      <td className="dep-name">{dep.name}</td>
                      <td className="dep-version">{dep.version}</td>
                      <td className="dep-size">{formatSize(dep.size)}</td>
                      <td className="dep-type">
                        <span className={`type-badge ${dep.type}`}>
                          {dep.type === 'dependency' ? 'Prod' : 'Dev'}
                        </span>
                      </td>
                      <td className="dep-treeshake">
                        <span className={`treeshake-badge ${dep.treeshakeable ? 'yes' : 'no'}`}>
                          {dep.treeshakeable ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className="dep-actions">
                        <button className="action-btn">Analyze</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'optimization' && (
          <div className="optimization-tab">
            <div className="optimization-status">
              <h3>Current Optimizations</h3>
              <div className="status-grid">
                <div className={`status-item ${bundleData.optimization.treeshaking ? 'enabled' : 'disabled'}`}>
                  <span className="status-icon">{bundleData.optimization.treeshaking ? '✓' : '✗'}</span>
                  <span className="status-label">Tree Shaking</span>
                </div>
                <div className={`status-item ${bundleData.optimization.minification ? 'enabled' : 'disabled'}`}>
                  <span className="status-icon">{bundleData.optimization.minification ? '✓' : '✗'}</span>
                  <span className="status-label">Minification</span>
                </div>
                <div className={`status-item ${bundleData.optimization.compression ? 'enabled' : 'disabled'}`}>
                  <span className="status-icon">{bundleData.optimization.compression ? '✓' : '✗'}</span>
                  <span className="status-label">Compression</span>
                </div>
                <div className={`status-item ${bundleData.optimization.codesplitting ? 'enabled' : 'disabled'}`}>
                  <span className="status-icon">{bundleData.optimization.codesplitting ? '✓' : '✗'}</span>
                  <span className="status-label">Code Splitting</span>
                </div>
              </div>
            </div>

            <div className="recommendations">
              <h3>Optimization Recommendations</h3>
              <div className="recommendations-list">
                {bundleData.optimization.recommendations.map((rec, index) => (
                  <div key={index} className={`recommendation ${rec.type}`}>
                    <div className="rec-header">
                      <div className="rec-type">
                        <span className={`type-icon ${rec.type}`}>
                          {rec.type === 'error' ? '🔴' : rec.type === 'warning' ? '🟡' : '🔵'}
                        </span>
                        <span className="type-label">
                          {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                        </span>
                      </div>
                      <div className={`impact-badge ${rec.impact}`}>
                        {rec.impact} impact
                      </div>
                    </div>
                    <div className="rec-message">{rec.message}</div>
                    <div className="rec-solution">
                      <strong>Solution:</strong> {rec.solution}
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