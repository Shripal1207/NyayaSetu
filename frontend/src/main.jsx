import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { FirebaseProvider } from './context/FirebaseContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { startKeepalive } from './utils/keepalive.js'
import './index.css'

// Start keepalive pings to prevent Render cold starts
if (import.meta.env.PROD) {
  startKeepalive()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <FirebaseProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </FirebaseProvider>
    </ErrorBoundary>
  </StrictMode>
)

