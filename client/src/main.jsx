import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import App from './App.jsx'
import './index.css'
import theme from './theme.js'

// Import CSS cho react-slick
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

// VNPay error fix completely removed for debugging

// Ultimate VNPay and Chrome extension error suppression
const ultimateErrorSuppression = () => {
  // 1. Suppress console.error
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    const suppressPatterns = [
      'runtime.lastError',
      'extension port is moved into back/forward cache',
      'Content-Security-Policy',
      'Permissions-Policy',
      'browsing-topics',
      'join-ad-interest-group',
      'run-ad-auction',
      'attribution-reporting',
      'private-state-token',
      'private-aggregation',
      'timer is not defined',
      'updateTime',
      'jQuery.Deferred exception',
      'style-src',
      'img-src',
      'default-src',
      'script-src',
      'custom.min.js',
      'jquery.bundles.js',
      'host-console-events.js',
      'content-dom-snapshot.js',
      'VM36:',
      'vnpayment.vn',
      'sandbox.vnpayment',
      'Did you want to add it as a directive and forget a semicolon'
    ];
    
    for (const pattern of suppressPatterns) {
      if (message.includes(pattern)) {
        return; // Suppress this error
      }
    }
    
    // Log other errors normally
    originalConsoleError.apply(console, args);
  };

  // 2. Suppress console.warn
  const originalConsoleWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    
    const suppressPatterns = [
      'Content-Security-Policy',
      'default-src',
      'style-src',
      'img-src',
      'script-src',
      'Did you want to add it as a directive and forget a semicolon',
      'vnpayment.vn',
      'sandbox.vnpayment'
    ];
    
    for (const pattern of suppressPatterns) {
      if (message.includes(pattern)) {
        return; // Suppress this warning
      }
    }
    
    originalConsoleWarn.apply(console, args);
  };

  // 3. Global error handler
  window.addEventListener('error', function(e) {
    if (e.message && (
      e.message.includes('timer is not defined') ||
      e.message.includes('updateTime') ||
      e.message.includes('Content-Security-Policy') ||
      e.message.includes('runtime.lastError')
    )) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
  }, true);

  // 4. jQuery error suppression
  if (window.jQuery && window.jQuery.Deferred) {
    const originalDeferred = window.jQuery.Deferred;
    window.jQuery.Deferred = function() {
      const deferred = originalDeferred.apply(this, arguments);
      
      if (deferred.exceptionHook !== undefined) {
        deferred.exceptionHook = function(error, stack) {
          if (error && error.message && (
            error.message.includes('timer is not defined') ||
            error.message.includes('updateTime')
          )) {
            return false; // Suppress jQuery error
          }
          throw error;
        };
      }
      
      return deferred;
    };
    
    // Copy static methods
    Object.keys(originalDeferred).forEach(key => {
      window.jQuery.Deferred[key] = originalDeferred[key];
    });
  }
};

// Apply suppression immediately and on window load
ultimateErrorSuppression();
window.addEventListener('load', ultimateErrorSuppression);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
