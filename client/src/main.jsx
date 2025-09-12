import { createRoot } from 'react-dom/client'
import './index.css'
import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import routes from './routes'
import { GoogleOAuthProvider } from '@react-oauth/google'
const VITE_GOOGLE_CLIENT_ID= import.meta.env.VITE_GOOGLE_CLIENT_ID
const router= createBrowserRouter(routes)
createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={VITE_GOOGLE_CLIENT_ID}>
        <RouterProvider router= {router}/>
    </GoogleOAuthProvider>
)
