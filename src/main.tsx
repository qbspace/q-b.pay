import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import AppLayout from './layouts/AppLayout.tsx'
import HomePage from './pages/HomePage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import './index.css'
import CalendarPage from './pages/CalendarPage.tsx'
import PaymentPage from './pages/PaymentPage.tsx'

const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'payment',
        element: <PaymentPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
    ],
  },
])

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)


