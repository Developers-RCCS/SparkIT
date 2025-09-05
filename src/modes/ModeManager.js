/**
 * Mode Manager System
 * Handles switching between Road and Timeline modes
 * Manages mode-specific logic and state transitions
 */

import { eventBus } from '../core/EventBus.js';
import { RoadMode } from './RoadMode.js';
import { TimelineMode } from './TimelineMode.js';

export class ModeManager {
  constructor() {
    this.name = 'ModeManager';
    this.enabled = true;
    this.debugMode = false;
    
    // Current mode state
    this.currentMode = 'road';
    this.previousMode = null;
    this.isTransitioning = false;
    this.transitionStartTime = 0;
    this.transitionDuration = 1000; // ms
    
    // Mode instances
    this.modes = new Map();
    this.modeHistory = [];
    this.maxHistoryLength = 10;
    
    // Transition effects
    this.transitionCallbacks = [];
    this.fadeEffect = {
      active: false,
      progress: 0,
      direction: 'out' // 'out' or 'in'
    };
    
    this.init();
  }

  /**
   * Initialize mode manager
   */
  init() {
    this.registerModes();
    this.setupEventListeners();
    this.setMode('road', false); // Start in road mode
    
    if (this.debugMode) {
      console.log('🛤️ Mode Manager initialized');
    }
    
    eventBus.emit('mode-manager:initialized');
  }

  /**
   * Register available game modes
   */
  registerModes() {
    // Register road mode
    this.modes.set('road', new RoadMode());
    
    // Register timeline mode
    this.modes.set('timeline', new TimelineMode());
    
    if (this.debugMode) {
      console.log('🛤️ Modes registered: Road, Timeline');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mode change requests
    eventBus.on('mode:change-requested', (data) => this.requestModeChange(data));
    eventBus.on('world:transition:start', () => this.onWorldTransition());
    eventBus.on('timeline:exit-requested', () => this.exitTimeline());
    
    // Branch interactions
    eventBus.on('branch:open', (data) => this.onBranchOpen(data));
    eventBus.on('branch:close', () => this.onBranchClose());
    
    // Input events
    eventBus.on('input:key:down', (data) => this.onKeyDown(data));
    
    // Player events
    eventBus.on('player:mode-changed', (data) => this.onPlayerModeChanged(data));
  }

  /**
   * Request mode change
   * @param {Object} data - Mode change request data
   */
  requestModeChange(data) {
    const { newMode, reason, immediate = false, ...options } = data;
    
    if (!this.isValidMode(newMode)) {
      console.warn(`🛤️ Invalid mode requested: ${newMode}`);
      return false;
    }
    
    if (this.currentMode === newMode) {
      if (this.debugMode) {
        console.log(`🛤️ Already in mode: ${newMode}`);
      }
      return true;
    }
    
    if (this.isTransitioning && !immediate) {
      if (this.debugMode) {
        console.log('🛤️ Mode change ignored: transition in progress');
      }
      return false;
    }
    
    return this.setMode(newMode, !immediate, reason, options);
  }

  /**
   * Set current mode
   * @param {string} mode - Mode to set
   * @param {boolean} useTransition - Whether to use transition effects
   * @param {string} reason - Reason for mode change
   * @param {Object} options - Additional options
   * @returns {boolean} Success
   */
  setMode(mode, useTransition = true, reason = 'manual', options = {}) {
    if (!this.isValidMode(mode)) {
      console.error(`🛤️ Invalid mode: ${mode}`);
      return false;
    }
    
    const oldMode = this.currentMode;
    
    if (useTransition && !this.isTransitioning) {
      this.startTransition(oldMode, mode, reason, options);
    } else {
      this.changeMode(oldMode, mode, reason, options);
    }
    
    return true;
  }

  /**
   * Start mode transition
   * @param {string} fromMode - Current mode
   * @param {string} toMode - Target mode
   * @param {string} reason - Reason for change
   * @param {Object} options - Transition options
   */
  startTransition(fromMode, toMode, reason, options) {
    this.isTransitioning = true;
    this.transitionStartTime = performance.now();
    
    // Start fade out effect
    this.fadeEffect.active = true;
    this.fadeEffect.progress = 0;
    this.fadeEffect.direction = 'out';
    
    eventBus.emit('mode:transition:start', {
      fromMode,
      toMode,
      reason,
      duration: this.transitionDuration,
      options
    });
    
    if (this.debugMode) {
      console.log(`🛤️ Starting transition: ${fromMode} → ${toMode} (${reason})`);
    }
    
    // Schedule mode change at midpoint of transition
    setTimeout(() => {
      this.changeMode(fromMode, toMode, reason, options);
      
      // Start fade in effect
      this.fadeEffect.direction = 'in';
      this.fadeEffect.progress = 0;
      
    }, this.transitionDuration / 2);
    
    // End transition
    setTimeout(() => {
      this.endTransition(toMode);
    }, this.transitionDuration);
  }

  /**
   * Change mode immediately
   * @param {string} fromMode - Current mode
   * @param {string} toMode - Target mode
   * @param {string} reason - Reason for change
   * @param {Object} options - Change options
   */
  changeMode(fromMode, toMode, reason, options) {
    // Exit current mode
    if (fromMode && this.modes.has(fromMode)) {
      this.modes.get(fromMode).exit();
    }
    
    // Update mode state
    this.previousMode = fromMode;
    this.currentMode = toMode;
    
    // Add to history
    this.addToHistory(fromMode, toMode, reason);
    
    // Enter new mode
    if (this.modes.has(toMode)) {
      this.modes.get(toMode).enter(options);
    }
    
    // Emit mode change event
    eventBus.emit('mode:changed', {
      mode: toMode,
      previousMode: fromMode,
      reason,
      options
    });
    
    if (this.debugMode) {
      console.log(`🛤️ Mode changed: ${fromMode} → ${toMode}`);
    }
  }

  /**
   * End mode transition
   * @param {string} mode - Current mode
   */
  endTransition(mode) {
    this.isTransitioning = false;
    this.fadeEffect.active = false;
    this.fadeEffect.progress = 0;
    
    eventBus.emit('mode:transition:complete', {
      mode,
      previousMode: this.previousMode
    });
    
    if (this.debugMode) {
      console.log(`🛤️ Transition complete: ${mode}`);
    }
  }

  /**
   * Update mode manager - called every frame
   * @param {number} deltaTime - Frame delta time
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (!this.enabled) return;
    
    // Update transition effects
    if (this.isTransitioning) {
      this.updateTransition(deltaTime);
    }
    
    // Update current mode
    const currentModeInstance = this.modes.get(this.currentMode);
    if (currentModeInstance && currentModeInstance.enabled) {
      currentModeInstance.update(deltaTime, gameState);
    }
    
    // Update game state mode for compatibility
    gameState.mode = this.currentMode;
    
    eventBus.emit('mode-manager:updated', {
      deltaTime,
      currentMode: this.currentMode,
      isTransitioning: this.isTransitioning
    });
  }

  /**
   * Update transition effects
   * @param {number} deltaTime - Delta time
   */
  updateTransition(deltaTime) {
    if (!this.fadeEffect.active) return;
    
    const elapsed = performance.now() - this.transitionStartTime;
    const halfDuration = this.transitionDuration / 2;
    
    if (this.fadeEffect.direction === 'out') {
      this.fadeEffect.progress = Math.min(1, elapsed / halfDuration);
    } else {
      this.fadeEffect.progress = Math.max(0, 1 - (elapsed - halfDuration) / halfDuration);
    }
    
    eventBus.emit('mode:transition:progress', {
      progress: this.fadeEffect.progress,
      direction: this.fadeEffect.direction,
      elapsed
    });
  }

  /**
   * Add mode change to history
   * @param {string} fromMode - Previous mode
   * @param {string} toMode - New mode
   * @param {string} reason - Reason for change
   */
  addToHistory(fromMode, toMode, reason) {
    this.modeHistory.push({
      from: fromMode,
      to: toMode,
      reason,
      timestamp: performance.now()
    });
    
    // Limit history size
    if (this.modeHistory.length > this.maxHistoryLength) {
      this.modeHistory.shift();
    }
  }

  /**
   * Get current mode instance
   * @returns {Object|null} Current mode instance
   */
  getCurrentMode() {
    return this.modes.get(this.currentMode) || null;
  }

  /**
   * Get mode instance by name
   * @param {string} modeName - Mode name
   * @returns {Object|null} Mode instance
   */
  getMode(modeName) {
    return this.modes.get(modeName) || null;
  }

  /**
   * Check if mode is valid
   * @param {string} mode - Mode to check
   * @returns {boolean} True if valid
   */
  isValidMode(mode) {
    return this.modes.has(mode);
  }

  /**
   * Get available modes
   * @returns {Array} Array of mode names
   */
  getAvailableModes() {
    return Array.from(this.modes.keys());
  }

  /**
   * Handle world transition
   */
  onWorldTransition() {
    // Transition to timeline mode
    this.requestModeChange({
      newMode: 'timeline',
      reason: 'world-transition'
    });
  }

  /**
   * Exit timeline mode
   */
  exitTimeline() {
    if (this.currentMode === 'timeline') {
      this.requestModeChange({
        newMode: 'road',
        reason: 'timeline-exit'
      });
    }
  }

  /**
   * Handle branch open
   * @param {Object} data - Branch data
   */
  onBranchOpen(data) {
    const { branch } = data;
    
    // Check if this branch triggers timeline mode
    if (branch && /phase 1/i.test(branch.label || '')) {
      this.requestModeChange({
        newMode: 'timeline',
        reason: 'branch-phase1',
        branch
      });
    }
  }

  /**
   * Handle branch close
   */
  onBranchClose() {
    // Return to road mode if in timeline
    if (this.currentMode === 'timeline') {
      this.requestModeChange({
        newMode: 'road',
        reason: 'branch-close'
      });
    }
  }

  /**
   * Handle key down events
   * @param {Object} data - Key event data
   */
  onKeyDown(data) {
    const { code } = data;
    
    // Mode switching shortcuts (for debugging)
    if (this.debugMode) {
      switch (code) {
        case 'Digit1':
          this.requestModeChange({ newMode: 'road', reason: 'debug-key' });
          break;
        case 'Digit2':
          this.requestModeChange({ newMode: 'timeline', reason: 'debug-key' });
          break;
      }
    }
  }

  /**
   * Handle player mode change (for synchronization)
   * @param {Object} data - Player mode change data
   */
  onPlayerModeChanged(data) {
    // Ensure mode manager and player are synchronized
    if (data.mode !== this.currentMode) {
      if (this.debugMode) {
        console.log(`🛤️ Syncing mode with player: ${data.mode}`);
      }
      
      this.setMode(data.mode, false, 'player-sync');
    }
  }

  /**
   * Get mode manager state
   * @returns {Object} Current state
   */
  getState() {
    return {
      currentMode: this.currentMode,
      previousMode: this.previousMode,
      isTransitioning: this.isTransitioning,
      availableModes: this.getAvailableModes(),
      history: [...this.modeHistory],
      fadeEffect: { ...this.fadeEffect }
    };
  }

  /**
   * Get transition progress (0-1)
   * @returns {number} Transition progress
   */
  getTransitionProgress() {
    if (!this.isTransitioning) return 0;
    
    const elapsed = performance.now() - this.transitionStartTime;
    return Math.min(1, elapsed / this.transitionDuration);
  }

  /**
   * Force mode change without transition
   * @param {string} mode - Mode to set
   * @param {string} reason - Reason for change
   */
  forceMode(mode, reason = 'forced') {
    return this.setMode(mode, false, reason);
  }

  /**
   * Enable/disable mode manager
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('mode-manager:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    
    // Propagate to all modes
    for (const mode of this.modes.values()) {
      if (typeof mode.setDebugMode === 'function') {
        mode.setDebugMode(enabled);
      }
    }
  }

  /**
   * Cleanup mode manager
   */
  destroy() {
    // Destroy all modes
    for (const mode of this.modes.values()) {
      if (typeof mode.destroy === 'function') {
        mode.destroy();
      }
    }
    
    this.modes.clear();
    this.modeHistory = [];
    
    eventBus.emit('mode-manager:destroyed');
  }
}

// Export singleton instance
export const modeManager = new ModeManager();
