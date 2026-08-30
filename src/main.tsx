import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Handle dynamic import failures when a new version is deployed
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register and auto-update service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Check for SW updates periodically and on page focus
        reg.update().catch(() => {});
        window.addEventListener('focus', () => {
          reg.update().catch(() => {});
        });
      })
      .catch(() => {
        // Runs without offline cache if unsupported
      });
  });
}
