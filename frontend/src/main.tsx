import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import { routes } from './routes'
import ErrorBoundary from './components/ErrorBoundary'
import Loading from './components/Loading'

const children = routes.map((r) => ({
  path: r.path,
  element: (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <r.component />
      </Suspense>
    </ErrorBoundary>
  ),
}))

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children,
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)
