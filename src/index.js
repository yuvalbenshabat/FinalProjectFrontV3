// Main entry point for the BookIt application
// This file initializes React and renders the root component

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Using AppWrapper to ensure UserProvider context works properly
import AppWrapper from './App';
// Performance measurement utilities
import reportWebVitals from './reportWebVitals';

// Create a root element for React to render into
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application inside StrictMode
// StrictMode helps identify potential problems in the application
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);

// Measure and report performance metrics
// This can help identify performance bottlenecks
// You can send the results to an analytics endpoint
reportWebVitals();
