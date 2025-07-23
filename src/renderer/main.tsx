import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { HashRouter } from 'react-router-dom';

// Add debugging to see what's happening
console.log('Renderer script starting...');
console.log('Document ready state:', document.readyState);
console.log('Root element exists:', !!document.getElementById('root'));

// Check if CSS is loaded
const styles = document.querySelectorAll('link[rel="stylesheet"]');
console.log('CSS files found:', styles.length);
styles.forEach((link, i) => {
  console.log(`CSS ${i}:`, (link as HTMLLinkElement).href);
});

// Check if our script loaded
console.log('Main script loaded successfully');

// Test direct DOM manipulation
console.log('Testing direct DOM manipulation...');
const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.innerHTML = '<div style="background-color: red; color: white; padding: 20px; font-size: 24px;">DIRECT DOM TEST - IF YOU SEE THIS, DOM IS WORKING</div>';
  console.log('Direct DOM manipulation completed');
} else {
  console.error('Root element not found for direct DOM test');
}

// Debug: Check if electronAPI is available
console.log('Window object:', window);
console.log('electronAPI available:', typeof window.electronAPI !== 'undefined');
if (typeof window.electronAPI !== 'undefined') {
  console.log('electronAPI methods:', Object.keys(window.electronAPI));
  // Test a simple method
  (async () => {
    try {
      const result = await window.electronAPI.getInstalledGames();
      console.log('✅ electronAPI test successful:', result);
    } catch (error) {
      console.error('❌ electronAPI test failed:', error);
    }
  })();
} else {
  console.error('electronAPI is not available!');
  console.log('This might be because:');
  console.log('1. Preload script not loaded');
  console.log('2. Context isolation disabled');
  console.log('3. IPC handlers not registered');
}

try {
  console.log('Attempting to render React app...');
  console.log('Creating React root...');
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  console.log('React root created, rendering...');
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  );
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Error rendering React app:', error);
  if (error instanceof Error) {
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
} 