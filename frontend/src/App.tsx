import React, { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

// Providers
import AccessibilityProvider from './components/AccessibilityProvider'
import { PWAProvider } from './components/PWAProvider'
import { NotificationProvider } from './components/NotificationSystem'

// Components
import Loading from './components/Loading'
import ErrorBoundary from './components/ErrorBoundary'
import PWAInstallBanner from './components/PWAInstallBanner'
import SkipLinks from './components/SkipLinks'

// Loading Component for Suspense fallback
const LoadingFallback = () => (
  <div className="loading-fallback">
    <Loading />
  </div>
)

// Main App Component - serves as layout wrapper with providers
function App() {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <PWAProvider>
          <NotificationProvider>
            <div className="app">
              <SkipLinks />
              <PWAInstallBanner />
              
              <Suspense fallback={<LoadingFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </NotificationProvider>
        </PWAProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  )
}

export default App