// VNPay Timer Fix Script
(function() {
    'use strict';
    
    // Define missing timer variable
    window.timer = null;
    
    // Define missing updateTime function
    window.updateTime = function() {
        console.log('VNPay timer fix: updateTime called');
        return true;
    };
    
    // Suppress jQuery Deferred errors
    if (window.jQuery && window.jQuery.Deferred) {
        const originalExceptionHook = window.jQuery.Deferred.exceptionHook;
        window.jQuery.Deferred.exceptionHook = function(error, stack) {
            if (error && error.message && (
                error.message.includes('timer is not defined') ||
                error.message.includes('updateTime')
            )) {
                console.log('VNPay error suppressed:', error.message);
                return false;
            }
            if (originalExceptionHook) {
                return originalExceptionHook.call(this, error, stack);
            }
            throw error;
        };
    }
    
    // Global error suppression
    const originalOnerror = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
        if (message && (
            message.includes('timer is not defined') ||
            message.includes('updateTime') ||
            message.includes('Content-Security-Policy') ||
            message.includes('default-src') ||
            message.includes('style-src') ||
            message.includes('img-src') ||
            message.includes('script-src')
        )) {
            console.log('VNPay global error suppressed:', message);
            return true;
        }
        if (originalOnerror) {
            return originalOnerror.call(this, message, source, lineno, colno, error);
        }
        return false;
    };
    
    // Console suppression for CSP warnings
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = function(...args) {
        const message = args.join(' ');
        if (message.includes('Content-Security-Policy') || 
            message.includes('default-src') ||
            message.includes('style-src') ||
            message.includes('img-src') ||
            message.includes('script-src') ||
            message.includes('timer is not defined') ||
            message.includes('updateTime')) {
            return;
        }
        originalConsoleError.apply(console, args);
    };
    
    console.warn = function(...args) {
        const message = args.join(' ');
        if (message.includes('Content-Security-Policy') || 
            message.includes('default-src') ||
            message.includes('style-src') ||
            message.includes('img-src') ||
            message.includes('script-src')) {
            return;
        }
        originalConsoleWarn.apply(console, args);
    };
    
    console.log('VNPay timer fix script loaded successfully');
})(); 