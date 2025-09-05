/**
 * Performance monitoring and optimization utilities
 * Extracted from original game.js to maintain exact functionality
 */

/**
 * Performance monitor for tracking FPS and optimization
 */
export class PerformanceMonitor {
  constructor() {
    this.samples = [];
    this.maxSamples = 60;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.averageFPS = 60;
  }

  /**
   * Update performance metrics
   * Maintains original performance tracking from game.js
   */
  update() {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.samples.push(deltaTime);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    this.frameCount++;

    // Calculate average FPS every 30 frames
    if (this.frameCount % 30 === 0) {
      const averageDelta = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
      this.averageFPS = Math.round(1000 / averageDelta);
    }
  }

  /**
   * Get current FPS
   * @returns {number} Current FPS
   */
  getFPS() {
    return this.averageFPS;
  }

  /**
   * Check if performance is low
   * @returns {boolean} True if low performance
   */
  isLowPerformance() {
    return this.averageFPS < 30;
  }

  /**
   * Get performance grade
   * @returns {string} Performance grade (excellent, good, fair, poor)
   */
  getPerformanceGrade() {
    if (this.averageFPS >= 55) return 'excellent';
    if (this.averageFPS >= 45) return 'good';
    if (this.averageFPS >= 30) return 'fair';
    return 'poor';
  }
}

/**
 * Canvas state manager to minimize save/restore calls
 * Maintains original canvas optimization from game.js
 */
export class CanvasStateManager {
  constructor() {
    this.stateStack = 0;
    this.maxStack = 10;
  }

  /**
   * Save canvas state with stack tracking
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  save(ctx) {
    if (this.stateStack >= this.maxStack) {
      console.warn(`Canvas state stack exceeded ${this.maxStack} levels`);
    }
    ctx.save();
    this.stateStack++;
  }

  /**
   * Restore canvas state with stack tracking
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  restore(ctx) {
    if (this.stateStack <= 0) {
      console.warn('Attempting to restore canvas state when none saved');
      return;
    }
    ctx.restore();
    this.stateStack--;
  }

  /**
   * Reset state tracking
   */
  reset() {
    this.stateStack = 0;
  }

  /**
   * Get current stack depth
   * @returns {number} Current stack depth
   */
  getStackDepth() {
    return this.stateStack;
  }
}

/**
 * Request animation frame with fallback
 * @param {Function} callback - Animation callback
 * @returns {number} Request ID
 */
export function requestAnimationFrame(callback) {
  return window.requestAnimationFrame || 
         window.webkitRequestAnimationFrame || 
         window.mozRequestAnimationFrame || 
         function(callback) { return setTimeout(callback, 1000 / 60); }
}

/**
 * Cancel animation frame with fallback
 * @param {number} id - Request ID
 */
export function cancelAnimationFrame(id) {
  const cancel = window.cancelAnimationFrame || 
                window.webkitCancelAnimationFrame || 
                window.mozCancelAnimationFrame || 
                clearTimeout;
  cancel(id);
}

/**
 * Adaptive DPR management for performance
 * Maintains original adaptive DPR logic from game.js
 */
export class AdaptiveDPRManager {
  constructor() {
    this.currentDPR = window.devicePixelRatio || 1;
    this.originalDPR = this.currentDPR;
    this.performanceMonitor = new PerformanceMonitor();
    this.lastAdjustment = 0;
    this.adjustmentCooldown = 5000; // 5 seconds
  }

  /**
   * Update DPR based on performance
   */
  update() {
    this.performanceMonitor.update();
    
    const now = performance.now();
    if (now - this.lastAdjustment < this.adjustmentCooldown) {
      return this.currentDPR;
    }

    const fps = this.performanceMonitor.getFPS();
    
    // Lower DPR if performance is poor
    if (fps < 25 && this.currentDPR > 1) {
      this.currentDPR = Math.max(1, this.currentDPR * 0.8);
      this.lastAdjustment = now;
      console.log(`Lowered DPR to ${this.currentDPR.toFixed(2)} due to poor performance`);
    }
    // Restore DPR if performance improves
    else if (fps > 50 && this.currentDPR < this.originalDPR) {
      this.currentDPR = Math.min(this.originalDPR, this.currentDPR * 1.1);
      this.lastAdjustment = now;
      console.log(`Restored DPR to ${this.currentDPR.toFixed(2)} due to improved performance`);
    }

    return this.currentDPR;
  }

  /**
   * Get current DPR
   * @returns {number} Current device pixel ratio
   */
  getCurrentDPR() {
    return this.currentDPR;
  }

  /**
   * Reset DPR to original value
   */
  reset() {
    this.currentDPR = this.originalDPR;
  }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  constructor() {
    this.lastCheck = performance.now();
    this.checkInterval = 10000; // 10 seconds
  }

  /**
   * Check memory usage
   * @returns {Object|null} Memory info or null if not available
   */
  checkMemory() {
    const now = performance.now();
    if (now - this.lastCheck < this.checkInterval) {
      return null;
    }

    this.lastCheck = now;

    if (performance.memory) {
      const memory = performance.memory;
      const used = memory.usedJSHeapSize;
      const total = memory.totalJSHeapSize;
      const limit = memory.jsHeapSizeLimit;

      return {
        used: Math.round(used / 1048576), // MB
        total: Math.round(total / 1048576), // MB
        limit: Math.round(limit / 1048576), // MB
        percentage: Math.round((used / limit) * 100)
      };
    }

    return null;
  }

  /**
   * Check if memory usage is high
   * @returns {boolean} True if memory usage is high
   */
  isMemoryHigh() {
    const memory = this.checkMemory();
    return memory ? memory.percentage > 80 : false;
  }
}

/**
 * Create performance monitor singleton
 */
export const performanceMonitor = new PerformanceMonitor();
export const canvasStateManager = new CanvasStateManager();
export const adaptiveDPRManager = new AdaptiveDPRManager();
export const memoryMonitor = new MemoryMonitor();
