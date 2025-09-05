/**
 * Game Loop System
 * Extracted from original game.js step() function
 * Maintains exact timing and behavior of original game loop
 */

import { eventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { performanceMonitor } from '../utils/performance.js';

export class GameLoop {
  constructor() {
    this.isRunning = false;
    this.rafId = null;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.maxDeltaTime = 0.05; // 50ms cap to prevent large jumps
    this.targetFPS = 60;
    this.actualFPS = 60;
    this.frameCount = 0;
    this.systems = [];
    this.debugMode = false;
    
    // Performance tracking
    this.performanceStats = {
      frameTime: 0,
      updateTime: 0,
      renderTime: 0,
      systemTimes: new Map()
    };
  }

  /**
   * Add system to the game loop
   * @param {Object} system - System with update/render methods
   * @param {number} priority - Update priority (higher = earlier)
   */
  addSystem(system, priority = 0) {
    if (!system.name) {
      console.warn('System should have a name for debugging');
      system.name = `System_${this.systems.length}`;
    }

    this.systems.push({ 
      system, 
      priority, 
      enabled: true,
      name: system.name 
    });
    
    // Sort by priority (higher first)
    this.systems.sort((a, b) => b.priority - a.priority);
    
    if (this.debugMode) {
      console.log(`🎮 Added system: ${system.name} (priority: ${priority})`);
    }
    
    eventBus.emit('gameloop:system:added', { system, priority });
  }

  /**
   * Remove system from the game loop
   * @param {Object|string} systemOrName - System object or name
   */
  removeSystem(systemOrName) {
    const name = typeof systemOrName === 'string' ? systemOrName : systemOrName.name;
    const index = this.systems.findIndex(s => s.name === name || s.system === systemOrName);
    
    if (index !== -1) {
      const removed = this.systems.splice(index, 1)[0];
      if (this.debugMode) {
        console.log(`🎮 Removed system: ${removed.name}`);
      }
      eventBus.emit('gameloop:system:removed', { system: removed.system });
    }
  }

  /**
   * Enable/disable a system
   * @param {string} name - System name
   * @param {boolean} enabled - Enabled state
   */
  setSystemEnabled(name, enabled) {
    const systemEntry = this.systems.find(s => s.name === name);
    if (systemEntry) {
      systemEntry.enabled = enabled;
      if (this.debugMode) {
        console.log(`🎮 System ${name}: ${enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) {
      console.warn('Game loop is already running');
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    
    if (this.debugMode) {
      console.log('🎮 Game loop started');
    }
    
    eventBus.emit('gameloop:started');
    this.loop();
  }

  /**
   * Stop the game loop
   */
  stop() {
    if (!this.isRunning) {
      console.warn('Game loop is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    if (this.debugMode) {
      console.log('🎮 Game loop stopped');
    }
    
    eventBus.emit('gameloop:stopped');
  }

  /**
   * Pause the game loop
   */
  pause() {
    if (this.isRunning) {
      this.stop();
      eventBus.emit('gameloop:paused');
    }
  }

  /**
   * Resume the game loop
   */
  resume() {
    if (!this.isRunning) {
      this.start();
      eventBus.emit('gameloop:resumed');
    }
  }

  /**
   * Main game loop function - matches original step() behavior
   */
  loop() {
    if (!this.isRunning) return;

    const frameStartTime = performance.now();
    const currentTime = frameStartTime;
    
    // Calculate delta time (matches original game.js logic exactly)
    this.deltaTime = Math.min(this.maxDeltaTime, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;
    
    // Update global state delta time for compatibility
    const state = stateManager.getState();
    state.dt = this.deltaTime;
    state.lastT = currentTime;

    try {
      // Pre-update phase
      eventBus.emit('gameloop:pre-update', { deltaTime: this.deltaTime, time: currentTime });
      
      // Update phase - call all system updates
      const updateStartTime = performance.now();
      this.updateSystems();
      this.performanceStats.updateTime = performance.now() - updateStartTime;
      
      // Physics update phase
      eventBus.emit('gameloop:physics-update', { deltaTime: this.deltaTime });
      
      // Post-update phase
      eventBus.emit('gameloop:post-update', { deltaTime: this.deltaTime });
      
      // Render phase - call all system renders
      const renderStartTime = performance.now();
      this.renderSystems();
      this.performanceStats.renderTime = performance.now() - renderStartTime;
      
      // Post-render phase
      eventBus.emit('gameloop:post-render', { deltaTime: this.deltaTime });
      
    } catch (error) {
      console.error('Game loop error:', error);
      eventBus.emit('gameloop:error', { error, deltaTime: this.deltaTime });
    }

    // Performance tracking
    this.frameCount++;
    this.performanceStats.frameTime = performance.now() - frameStartTime;
    
    // Update performance monitor
    performanceMonitor.update();
    this.actualFPS = performanceMonitor.getFPS();
    
    // Schedule next frame
    this.rafId = requestAnimationFrame(() => this.loop());
    
    // Emit frame complete
    eventBus.emit('gameloop:frame-complete', { 
      frameCount: this.frameCount, 
      fps: this.actualFPS,
      deltaTime: this.deltaTime,
      performanceStats: this.performanceStats
    });
  }

  /**
   * Update all systems
   */
  updateSystems() {
    const state = stateManager.getState();
    
    for (const systemEntry of this.systems) {
      if (!systemEntry.enabled) continue;
      
      const { system, name } = systemEntry;
      
      if (system.update && typeof system.update === 'function') {
        const systemStartTime = performance.now();
        
        try {
          system.update(this.deltaTime, state);
        } catch (error) {
          console.error(`System update error (${name}):`, error);
          eventBus.emit('gameloop:system:error', { system, error, phase: 'update' });
        }
        
        const systemTime = performance.now() - systemStartTime;
        this.performanceStats.systemTimes.set(name, systemTime);
      }
    }
  }

  /**
   * Render all systems
   */
  renderSystems() {
    const state = stateManager.getState();
    
    for (const systemEntry of this.systems) {
      if (!systemEntry.enabled) continue;
      
      const { system, name } = systemEntry;
      
      if (system.render && typeof system.render === 'function') {
        try {
          system.render(this.deltaTime, state);
        } catch (error) {
          console.error(`System render error (${name}):`, error);
          eventBus.emit('gameloop:system:error', { system, error, phase: 'render' });
        }
      }
    }
  }

  /**
   * Get current FPS
   * @returns {number} Current FPS
   */
  getFPS() {
    return this.actualFPS;
  }

  /**
   * Get current delta time
   * @returns {number} Delta time in seconds
   */
  getDeltaTime() {
    return this.deltaTime;
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance stats
   */
  getPerformanceStats() {
    return { ...this.performanceStats };
  }

  /**
   * Get all systems
   * @returns {Array} Systems array
   */
  getSystems() {
    return this.systems.map(s => ({
      name: s.name,
      priority: s.priority,
      enabled: s.enabled,
      system: s.system
    }));
  }

  /**
   * Set target FPS
   * @param {number} fps - Target FPS
   */
  setTargetFPS(fps) {
    this.targetFPS = fps;
    this.maxDeltaTime = Math.max(0.016, 2 / fps); // Allow 2 frames worth of time
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      console.log('🎮 Game loop debug mode enabled');
    }
  }

  /**
   * Get system by name
   * @param {string} name - System name
   * @returns {Object|null} System or null
   */
  getSystem(name) {
    const systemEntry = this.systems.find(s => s.name === name);
    return systemEntry ? systemEntry.system : null;
  }
}

// Export singleton instance
export const gameLoop = new GameLoop();
