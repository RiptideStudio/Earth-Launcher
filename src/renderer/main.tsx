import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Debug: Check if electronAPI is available
console.log('Window object:', window);
console.log('electronAPI available:', typeof window.electronAPI !== 'undefined');
if (typeof window.electronAPI !== 'undefined') {
  console.log('electronAPI methods:', Object.keys(window.electronAPI));
  // Test a simple method
  try {
    const result = await window.electronAPI.getInstalledGames();
    console.log('✅ electronAPI test successful:', result);
  } catch (error) {
    console.error('❌ electronAPI test failed:', error);
  }
} else {
  console.error('electronAPI is not available!');
  console.log('This might be because:');
  console.log('1. Preload script not loaded');
  console.log('2. Context isolation disabled');
  console.log('3. IPC handlers not registered');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 