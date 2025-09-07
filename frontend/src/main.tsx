import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import Loading from './components/Loading'

// Lazy load components for better performance
const Home = lazy(() => import('./views/Home'))
const Movies = lazy(() => import('./views/Movies'))
const MovieDetail = lazy(() => import('./views/MovieDetail'))
const Theaters = lazy(() => import('./views/Theaters'))
const Login = lazy(() => import('./views/auth/Login'))
const Register = lazy(() => import('./views/auth/Register'))
const ForgotPassword = lazy(() => import('./views/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./views/auth/ResetPassword'))
const Profile = lazy(() => import('./views/Profile'))
const MyBookings = lazy(() => import('./views/MyBookings'))
const About = lazy(() => import('./views/About'))
const Contact = lazy(() => import('./views/Contact'))
const Help = lazy(() => import('./views/Help'))
const Privacy = lazy(() => import('./views/Privacy'))
const Terms = lazy(() => import('./views/Terms'))
const Sitemap = lazy(() => import('./views/Sitemap'))
const NotFound = lazy(() => import('./views/NotFound'))

// Booking flow components
const Showtimes = lazy(() => import('./views/booking/Showtimes'))
const Seats = lazy(() => import('./views/booking/Seats'))
const Checkout = lazy(() => import('./views/booking/Checkout'))
const TicketPage = lazy(() => import('./views/booking/TicketPage'))

// Admin components
const AdminLogin = lazy(() => import('./views/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./views/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./views/admin/Dashboard'))
const AdminMovies = lazy(() => import('./views/admin/Movies'))
const AdminTheaters = lazy(() => import('./views/admin/Theaters'))
const AdminShowtimes = lazy(() => import('./views/admin/Showtimes'))
const AdminBookings = lazy(() => import('./views/admin/Bookings'))
const AdminUsers = lazy(() => import('./views/admin/Users'))
const AdminReviews = lazy(() => import('./views/admin/Reviews'))
const AdminReports = lazy(() => import('./views/admin/Reports'))
const MovieForm = lazy(() => import('./views/admin/MovieForm'))
const TheaterForm = lazy(() => import('./views/admin/TheaterForm'))
const ShowtimeForm = lazy(() => import('./views/admin/ShowtimeForm'))

// Auth guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/auth/login" replace />
}

// Admin guard component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('adminToken')
  const user = localStorage.getItem('adminUser')
  const userData = user ? JSON.parse(user) : null
  
  return token && userData?.role === 'admin' ? <>{children}</> : <Navigate to="/admin/login" replace />
}

// Loading wrapper for lazy components
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
)

// Complete router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <LazyWrapper><NotFound /></LazyWrapper>,
    children: [
      {
        index: true,
        element: <LazyWrapper><Home /></LazyWrapper>
      },
      // Movie routes
      {
        path: 'movies',
        element: <LazyWrapper><Movies /></LazyWrapper>
      },
      {
        path: 'movies/:id',
        element: <LazyWrapper><MovieDetail /></LazyWrapper>
      },
      {
        path: 'showtimes',
        element: <LazyWrapper><Showtimes /></LazyWrapper>
      },
      // Theater routes
      {
        path: 'theaters',
        element: <LazyWrapper><Theaters /></LazyWrapper>
      },
      // Authentication routes
      {
        path: 'auth/login',
        element: <LazyWrapper><Login /></LazyWrapper>
      },
      {
        path: 'auth/register',
        element: <LazyWrapper><Register /></LazyWrapper>
      },
      {
        path: 'auth/forgot-password',
        element: <LazyWrapper><ForgotPassword /></LazyWrapper>
      },
      {
        path: 'auth/reset-password',
        element: <LazyWrapper><ResetPassword /></LazyWrapper>
      },
      // Protected user routes
      {
        path: 'profile',
        element: <ProtectedRoute><LazyWrapper><Profile /></LazyWrapper></ProtectedRoute>
      },
      {
        path: 'my-bookings',
        element: <ProtectedRoute><LazyWrapper><MyBookings /></LazyWrapper></ProtectedRoute>
      },
      // Booking flow routes
      {
        path: 'booking/showtimes/:movieId',
        element: <LazyWrapper><Showtimes /></LazyWrapper>
      },
      {
        path: 'booking/seats/:showtimeId',
        element: <LazyWrapper><Seats /></LazyWrapper>
      },
      {
        path: 'booking/checkout',
        element: <ProtectedRoute><LazyWrapper><Checkout /></LazyWrapper></ProtectedRoute>
      },
      {
        path: 'booking/ticket/:bookingId',
        element: <ProtectedRoute><LazyWrapper><TicketPage /></LazyWrapper></ProtectedRoute>
      },
      // Static pages
      {
        path: 'about',
        element: <LazyWrapper><About /></LazyWrapper>
      },
      {
        path: 'contact',
        element: <LazyWrapper><Contact /></LazyWrapper>
      },
      {
        path: 'help',
        element: <LazyWrapper><Help /></LazyWrapper>
      },
      {
        path: 'privacy',
        element: <LazyWrapper><Privacy /></LazyWrapper>
      },
      {
        path: 'terms',
        element: <LazyWrapper><Terms /></LazyWrapper>
      },
      {
        path: 'sitemap',
        element: <LazyWrapper><Sitemap /></LazyWrapper>
      }
    ]
  },
  // Admin routes (separate from main app layout)
  {
    path: '/admin/login',
    element: <LazyWrapper><AdminLogin /></LazyWrapper>
  },
  {
    path: '/admin',
    element: <AdminRoute><LazyWrapper><AdminLayout /></LazyWrapper></AdminRoute>,
    children: [
      {
        index: true,
        element: <LazyWrapper><AdminDashboard /></LazyWrapper>
      },
      {
        path: 'movies',
        element: <LazyWrapper><AdminMovies /></LazyWrapper>
      },
      {
        path: 'movies/create',
        element: <LazyWrapper><MovieForm /></LazyWrapper>
      },
      {
        path: 'movies/:id/edit',
        element: <LazyWrapper><MovieForm /></LazyWrapper>
      },
      {
        path: 'theaters',
        element: <LazyWrapper><AdminTheaters /></LazyWrapper>
      },
      {
        path: 'theaters/create',
        element: <LazyWrapper><TheaterForm /></LazyWrapper>
      },
      {
        path: 'theaters/:id/edit',
        element: <LazyWrapper><TheaterForm /></LazyWrapper>
      },
      {
        path: 'showtimes',
        element: <LazyWrapper><AdminShowtimes /></LazyWrapper>
      },
      {
        path: 'showtimes/create',
        element: <LazyWrapper><ShowtimeForm /></LazyWrapper>
      },
      {
        path: 'showtimes/:id/edit',
        element: <LazyWrapper><ShowtimeForm /></LazyWrapper>
      },
      {
        path: 'bookings',
        element: <LazyWrapper><AdminBookings /></LazyWrapper>
      },
      {
        path: 'users',
        element: <LazyWrapper><AdminUsers /></LazyWrapper>
      },
      {
        path: 'reviews',
        element: <LazyWrapper><AdminReviews /></LazyWrapper>
      },
      {
        path: 'reports',
        element: <LazyWrapper><AdminReports /></LazyWrapper>
      }
    ]
  },
  // Catch all route
  {
    path: '*',
    element: <LazyWrapper><NotFound /></LazyWrapper>
  }
])

// Render the app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>
)
