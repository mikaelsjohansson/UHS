import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeCurrency } from './utils/currency'

// Initialize currency configuration before rendering app
initializeCurrency()
  .then(() => {
    console.log('Currency initialized successfully');
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
  .catch((error) => {
    console.error('Failed to initialize currency, using default:', error);
    // Still render app with default currency (USD)
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })

