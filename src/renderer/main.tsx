import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Debug: Check if electronAPI is available
console.log('Window object:', window);
console.log('electronAPI available:', typeof window.electronAPI !== 'undefined');
if (typeof window.electronAPI !== 'undefined') {
  console.log('electronAPI methods:', Object.keys(window.electronAPI));
} else {
  console.error('electronAPI is not available!');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 