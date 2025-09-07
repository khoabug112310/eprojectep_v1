import { Outlet, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/Header'
import Footer from './components/Footer'
import Loading from './components/Loading'
import './App.css'

// Loading Component for Suspense fallback
const LoadingFallback = () => (
  <div className="loading-fallback">
    <Loading />
  </div>
)

// Main App Component - serves as layout wrapper
function App() {
  const location = useLocation()
  
  // Check if current route is admin (admin routes have separate layout)
  const isAdminRoute = location.pathname.startsWith('/admin')
  
  if (isAdminRoute) {
    return (
      <ErrorBoundary>
        <div className="app admin-app">
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </ErrorBoundary>
    )
  }
  
  return (
    <ErrorBoundary>
      <div className="app">
        <Header />
        <main className="main-content">
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  )
}

export default App