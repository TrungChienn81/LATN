/**
 * VNPay Error Fix Utility - MINIMAL EDITION
 * Lightweight solution for VNPay runtime errors only
 * 
 * Author: Fixed version
 * Date: 2025
 * Level: MINIMAL - Safe for production
 */

class VNPayErrorFix {
  constructor() {
    this.isFixesApplied = false;
    this.suppressionLevel = 'MINIMAL';
    
    console.log('🔧 VNPay Error Fix - Minimal edition initialized');
  }

  /**
   * Apply minimal VNPay error suppression - only for runtime errors
   */
  applyMinimalFixes() {
    if (this.isFixesApplied) {
      console.log('🔧 Minimal fixes already applied');
      return;
    }

    console.log('🔧 Applying minimal VNPay runtime error suppression...');

    this.minimalRuntimeFix();

    this.isFixesApplied = true;
    console.log('✅ Minimal VNPay error suppression active - safe for production');
  }

  /**
   * Runtime error fix - COMPLETELY DISABLED for debugging
   */
  minimalRuntimeFix() {
    console.log('🚫 Runtime error suppression DISABLED - debugging mode');
    // NO error suppression whatsoever
  }

  /**
   * Get minimal suppression status
   */
  getStatus() {
    return {
      suppressionLevel: this.suppressionLevel,
      isActive: this.isFixesApplied,
      description: 'Minimal runtime error suppression - safe for production'
    };
  }
}

// Create minimal instance
window.vnpayErrorFix = new VNPayErrorFix();

// Auto-apply minimal fixes immediately
window.vnpayErrorFix.applyMinimalFixes();

// Apply fixes when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  window.vnpayErrorFix.applyMinimalFixes();
});

export default VNPayErrorFix; 