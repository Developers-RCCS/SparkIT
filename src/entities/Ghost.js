/**
 * Ghost Entity System
 * Extracted from original game.js ghost/replay logic
 * Handles replay ghost that follows recorded player path
 */

import { eventBus } from '../core/EventBus.js';
import { lerp } from '../utils/math.js';
import { WORLD, PLAYER_CONFIG } from '../config/constants.js';

export class Ghost {
  constructor() {
    this.name = 'Ghost';
    this.enabled = true;
    this.debugMode = false;
    
    // Core properties
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.width = PLAYER_CONFIG.width || 20;
    this.height = PLAYER_CONFIG.height || 30;
    
    // Ghost state
    this.active = false;
    this.visible = true;
    this.facing = 'right';
    this.mode = 'road';
    this.animationFrame = 0;
    this.opacity = 0.5;
    
    // Replay data
    this.replayData = [];
    this.replayIndex = 0;
    this.replayStartTime = 0;
    this.isReplaying = false;
    this.loopReplay = true;
    
    // Ghost behavior
    this.baseSpeed = WORLD.GHOST_BASE_SPEED || 140;
    this.smoothing = 0.15; // Smoothing factor for movement
    this.targetPosition = { x: 0, y: 0 };
    
    // Performance optimization
    this.updateInterval = 16; // ~60fps
    this.lastUpdateTime = 0;
    
    this.init();
  }

  /**
   * Initialize ghost system
   */
  init() {
    this.setupEventListeners();
    this.reset();
    
    if (this.debugMode) {
      console.log('👻 Ghost initialized');
    }
    
    eventBus.emit('ghost:initialized', { ghost: this });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Player events
    eventBus.on('player:reset', () => this.reset());
    eventBus.on('player:recording-changed', (data) => this.onPlayerRecordingChanged(data));
    
    // Game mode events
    eventBus.on('mode:changed', (data) => this.onModeChanged(data));
    
    // Ghost control events
    eventBus.on('ghost:start-replay', (data) => this.startReplay(data.recording));
    eventBus.on('ghost:stop-replay', () => this.stopReplay());
    eventBus.on('ghost:toggle', () => this.toggle());
    eventBus.on('ghost:set-visible', (data) => this.setVisible(data.visible));
    
    // World events
    eventBus.on('world:transition:start', () => this.onWorldTransition());
  }

  /**
   * Reset ghost to initial state
   */
  reset() {
    this.x = WORLD.PLAYER_SPAWN_X || 120;
    this.y = WORLD.ROAD_Y_OFFSET || 160;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'right';
    this.mode = 'road';
    this.animationFrame = 0;
    
    this.stopReplay();
    
    eventBus.emit('ghost:reset', { ghost: this });
  }

  /**
   * Update ghost - called every frame
   * @param {number} deltaTime - Frame delta time in seconds
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (!this.enabled || !this.active) return;
    
    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = now;
    
    // Update replay if active
    if (this.isReplaying) {
      this.updateReplay(deltaTime);
    } else {
      // Default ghost behavior (follow player at distance)
      this.updateDefaultBehavior(deltaTime, gameState);
    }
    
    // Update position with smoothing
    this.updatePosition(deltaTime);
    
    // Update animation
    this.updateAnimation(deltaTime);
    
    // Sync to game state for compatibility
    this.syncToGameState(gameState);
    
    eventBus.emit('ghost:updated', { 
      ghost: this, 
      deltaTime,
      position: { x: this.x, y: this.y },
      velocity: { x: this.vx, y: this.vy }
    });
  }

  /**
   * Update replay playback
   * @param {number} deltaTime - Delta time
   */
  updateReplay(deltaTime) {
    if (!this.replayData || this.replayData.length === 0) {
      this.stopReplay();
      return;
    }
    
    const currentTime = performance.now();
    const elapsedTime = currentTime - this.replayStartTime;
    
    // Find the appropriate replay frame based on timestamp
    let targetFrame = null;
    
    for (let i = this.replayIndex; i < this.replayData.length; i++) {
      const frame = this.replayData[i];
      const frameTime = frame.timestamp - this.replayData[0].timestamp;
      
      if (frameTime <= elapsedTime) {
        targetFrame = frame;
        this.replayIndex = i;
      } else {
        break;
      }
    }
    
    if (targetFrame) {
      // Set target position from replay data
      this.targetPosition.x = targetFrame.x;
      this.targetPosition.y = targetFrame.y;
      this.facing = targetFrame.facing || 'right';
      this.mode = targetFrame.mode || 'road';
      this.animationFrame = targetFrame.animationFrame || 0;
      
      // Calculate velocity for smooth movement
      this.vx = targetFrame.vx || 0;
      this.vy = targetFrame.vy || 0;
    }
    
    // Check if replay is complete
    if (this.replayIndex >= this.replayData.length - 1) {
      if (this.loopReplay) {
        this.restartReplay();
      } else {
        this.stopReplay();
      }
    }
  }

  /**
   * Update default ghost behavior (follow player)
   * @param {number} deltaTime - Delta time
   * @param {Object} gameState - Game state
   */
  updateDefaultBehavior(deltaTime, gameState) {
    const player = gameState.player;
    if (!player) return;
    
    // Follow player at a distance
    const followDistance = 100;
    const targetX = player.x - followDistance;
    const targetY = player.y;
    
    this.targetPosition.x = targetX;
    this.targetPosition.y = targetY;
    
    // Match player mode and facing
    this.mode = player.mode || 'road';
    
    // Face towards player
    if (player.x > this.x) {
      this.facing = 'right';
    } else if (player.x < this.x) {
      this.facing = 'left';
    }
  }

  /**
   * Update ghost position with smoothing
   * @param {number} deltaTime - Delta time
   */
  updatePosition(deltaTime) {
    // Smooth movement towards target
    this.x = lerp(this.x, this.targetPosition.x, this.smoothing);
    this.y = lerp(this.y, this.targetPosition.y, this.smoothing);
    
    // Update velocity based on position change
    const dx = this.targetPosition.x - this.x;
    const dy = this.targetPosition.y - this.y;
    
    this.vx = dx * this.baseSpeed * deltaTime;
    this.vy = dy * this.baseSpeed * deltaTime;
  }

  /**
   * Update ghost animation
   * @param {number} deltaTime - Delta time
   */
  updateAnimation(deltaTime) {
    // Simple animation based on movement
    if (Math.abs(this.vx) > 10) {
      this.animationFrame = (this.animationFrame + deltaTime * 6) % 4;
    } else {
      this.animationFrame = 0;
    }
  }

  /**
   * Sync ghost data to global game state for compatibility
   * @param {Object} gameState - Game state to update
   */
  syncToGameState(gameState) {
    if (!gameState.ghost) {
      gameState.ghost = {};
    }
    
    // Update global state with current ghost data
    Object.assign(gameState.ghost, {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      width: this.width,
      height: this.height,
      facing: this.facing,
      mode: this.mode,
      active: this.active,
      visible: this.visible,
      opacity: this.opacity,
      animationFrame: this.animationFrame,
      isReplaying: this.isReplaying
    });
  }

  /**
   * Start replay from recording data
   * @param {Array} recording - Player recording data
   */
  startReplay(recording) {
    if (!recording || recording.length === 0) {
      console.warn('👻 Cannot start replay: no recording data');
      return;
    }
    
    this.replayData = [...recording];
    this.replayIndex = 0;
    this.replayStartTime = performance.now();
    this.isReplaying = true;
    this.active = true;
    
    // Set initial position from first frame
    if (this.replayData.length > 0) {
      const firstFrame = this.replayData[0];
      this.x = firstFrame.x;
      this.y = firstFrame.y;
      this.facing = firstFrame.facing || 'right';
      this.mode = firstFrame.mode || 'road';
    }
    
    eventBus.emit('ghost:replay-started', { 
      ghost: this, 
      recordingLength: recording.length 
    });
    
    if (this.debugMode) {
      console.log(`👻 Ghost replay started with ${recording.length} frames`);
    }
  }

  /**
   * Stop replay
   */
  stopReplay() {
    this.isReplaying = false;
    this.replayData = [];
    this.replayIndex = 0;
    this.replayStartTime = 0;
    
    eventBus.emit('ghost:replay-stopped', { ghost: this });
    
    if (this.debugMode) {
      console.log('👻 Ghost replay stopped');
    }
  }

  /**
   * Restart replay from beginning
   */
  restartReplay() {
    if (this.replayData && this.replayData.length > 0) {
      this.replayIndex = 0;
      this.replayStartTime = performance.now();
      
      // Reset to first frame
      const firstFrame = this.replayData[0];
      this.x = firstFrame.x;
      this.y = firstFrame.y;
      this.facing = firstFrame.facing || 'right';
      this.mode = firstFrame.mode || 'road';
      
      eventBus.emit('ghost:replay-restarted', { ghost: this });
    }
  }

  /**
   * Toggle ghost active state
   */
  toggle() {
    this.active = !this.active;
    
    if (!this.active) {
      this.stopReplay();
    }
    
    eventBus.emit('ghost:toggled', { ghost: this, active: this.active });
    
    if (this.debugMode) {
      console.log(`👻 Ghost ${this.active ? 'activated' : 'deactivated'}`);
    }
  }

  /**
   * Set ghost visibility
   * @param {boolean} visible - Visible state
   */
  setVisible(visible) {
    this.visible = visible;
    eventBus.emit('ghost:visibility-changed', { ghost: this, visible });
  }

  /**
   * Set ghost opacity
   * @param {number} opacity - Opacity (0-1)
   */
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity));
    eventBus.emit('ghost:opacity-changed', { ghost: this, opacity: this.opacity });
  }

  /**
   * Set loop replay
   * @param {boolean} loop - Loop enabled
   */
  setLoopReplay(loop) {
    this.loopReplay = loop;
    eventBus.emit('ghost:loop-changed', { ghost: this, loop });
  }

  /**
   * Handle player recording change
   * @param {Object} data - Recording change data
   */
  onPlayerRecordingChanged(data) {
    const { player, enabled } = data;
    
    if (!enabled && this.isReplaying) {
      // Player stopped recording, we can start replaying
      const recording = player.getRecording();
      if (recording.length > 0) {
        this.startReplay(recording);
      }
    }
  }

  /**
   * Handle mode change
   * @param {Object} data - Mode change data
   */
  onModeChanged(data) {
    const { mode } = data;
    this.mode = mode;
    
    // Adjust position for mode
    if (mode === 'road') {
      this.y = WORLD.ROAD_Y_OFFSET || 160;
    }
  }

  /**
   * Handle world transition
   */
  onWorldTransition() {
    // Pause ghost during transitions
    if (this.isReplaying) {
      this.replayStartTime += 1000; // Add delay to account for transition
    }
  }

  /**
   * Get ghost bounds for collision detection
   * @returns {Object} Bounds object
   */
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
      centerX: this.x,
      centerY: this.y
    };
  }

  /**
   * Get ghost state for serialization
   * @returns {Object} Ghost state
   */
  getState() {
    return {
      position: { x: this.x, y: this.y },
      velocity: { x: this.vx, y: this.vy },
      dimensions: { width: this.width, height: this.height },
      state: {
        facing: this.facing,
        mode: this.mode,
        active: this.active,
        visible: this.visible,
        opacity: this.opacity,
        animationFrame: this.animationFrame,
        isReplaying: this.isReplaying
      },
      replay: {
        hasData: this.replayData.length > 0,
        frameCount: this.replayData.length,
        currentFrame: this.replayIndex,
        loopEnabled: this.loopReplay
      }
    };
  }

  /**
   * Enable/disable ghost
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('ghost:enabled-changed', { ghost: this, enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup ghost system
   */
  destroy() {
    this.stopReplay();
    this.replayData = [];
    eventBus.emit('ghost:destroyed', { ghost: this });
  }
}

// Export singleton instance
export const ghost = new Ghost();
