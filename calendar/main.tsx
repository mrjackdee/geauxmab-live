// © MrJackDee™. All rights reserved.
import React from 'react';
import ReactDOM from 'react-dom/client';
import CalendarPage from './CalendarPage';
import '../index.css';
import './app.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <CalendarPage />
  </React.StrictMode>
);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}
