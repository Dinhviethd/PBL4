import { createRoot } from 'react-dom/client'
import './index.css'
import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { installMediaTracker } from '@/lib/mediaCleanup'
import routes from './routes'

// Install global media tracker once at app start
if (typeof window !== 'undefined') {
    try { installMediaTracker(); } catch {}
}

const router = createBrowserRouter(routes)
createRoot(document.getElementById('root')).render(
    <RouterProvider router={router} />
)
