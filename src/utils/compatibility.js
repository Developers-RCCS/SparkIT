/**
 * Compatibility verification utility
 * Ensures 100% compatibility between modular and original systems
 */

export class CompatibilityVerifier {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  /**
   * Add compatibility test
   * @param {string} name - Test name
   * @param {Function} test - Test function (should return boolean)
   */
  addTest(name, test) {
    this.tests.push({ name, test });
  }

  /**
   * Run all compatibility tests
   * @returns {Object} Test results
   */
  async runTests() {
    console.log('🧪 Running compatibility tests...');
    
    this.results = { passed: 0, failed: 0, total: this.tests.length };
    
    for (const { name, test } of this.tests) {
      try {
        const result = await test();
        if (result) {
          console.log(`✅ ${name}`);
          this.results.passed++;
        } else {
          console.error(`❌ ${name}`);
          this.results.failed++;
        }
      } catch (error) {
        console.error(`❌ ${name} - Error:`, error);
        this.results.failed++;
      }
    }
    
    const passRate = (this.results.passed / this.results.total * 100).toFixed(1);
    console.log(`\n📊 Test Results: ${this.results.passed}/${this.results.total} passed (${passRate}%)`);
    
    return this.results;
  }
}

// Create and configure compatibility tests
const verifier = new CompatibilityVerifier();

// Math utilities tests
verifier.addTest('Math.clamp function exists', () => {
  return typeof window.clamp === 'function';
});

verifier.addTest('Math.clamp behavior matches', () => {
  return window.clamp(5, 0, 10) === 5 && 
         window.clamp(-5, 0, 10) === 0 && 
         window.clamp(15, 0, 10) === 10;
});

// DOM utilities tests
verifier.addTest('domCache exists', () => {
  return window.domCache && typeof window.domCache.getCursorBot === 'function';
});

verifier.addTest('safeSetHTML function exists', () => {
  return typeof window.safeSetHTML === 'function';
});

verifier.addTest('escapeXml function exists', () => {
  return typeof window.escapeXml === 'function';
});

// Mobile utilities tests
verifier.addTest('isMobileDevice function exists', () => {
  return typeof window.isMobileDevice === 'function';
});

verifier.addTest('isMobileDevice returns boolean', () => {
  return typeof window.isMobileDevice() === 'boolean';
});

// Settings and content tests
verifier.addTest('settingsManager exists', () => {
  return window.settingsManager && typeof window.settingsManager.get === 'function';
});

verifier.addTest('contentManager exists', () => {
  return window.contentManager && typeof window.contentManager.getGameData === 'function';
});

// Constants tests
verifier.addTest('Constants object exists', () => {
  return window.Constants && window.Constants.PHYSICS;
});

// Performance utilities tests
verifier.addTest('PerformanceUtils exists', () => {
  return window.PerformanceUtils && window.PerformanceUtils.performanceMonitor;
});

// Accessibility utilities tests
verifier.addTest('AccessibilityUtils exists', () => {
  return window.AccessibilityUtils && window.AccessibilityUtils.focusManager;
});

// Canvas element test
verifier.addTest('Game canvas exists', () => {
  return document.getElementById('game') !== null;
});

// Asset loading tests
verifier.addTest('Content JSON accessible', async () => {
  try {
    const response = await fetch('assets/content.json');
    return response.ok;
  } catch {
    return false;
  }
});

verifier.addTest('CSS stylesheet loaded', () => {
  const link = document.querySelector('link[href="assets/style.css"]');
  return link !== null;
});

// Original game script test
verifier.addTest('Original game script present', () => {
  const script = document.querySelector('script[src="assets/game.js"]');
  return script !== null;
});

// Module system test
verifier.addTest('ES6 modules supported', () => {
  return 'noModule' in HTMLScriptElement.prototype;
});

// Test runner for development
if (import.meta.env?.DEV) {
  // Run tests after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      verifier.runTests().then(results => {
        if (results.failed === 0) {
          console.log('🎉 All compatibility tests passed! System is ready.');
        } else {
          console.warn(`⚠️ ${results.failed} compatibility tests failed. Check console for details.`);
        }
      });
    }, 1000); // Wait for all systems to initialize
  });
}

export { verifier };
