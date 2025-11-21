import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Imports your game component
import './index.css'; // Imports your Tailwind styles

// This line finds the <div id="root"> element in your index.html
const rootElement = document.getElementById('root');

if (rootElement) {
  // This renders your entire application into the HTML page
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  // Simple error handling in case the root element isn't found
  console.error("Failed to find the root element to mount the React application.");
}