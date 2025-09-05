/**
 * Player Entity System
 * Extracted from original game.js player logic
 * Maintains exact player behavior and state management
 */

import { eventBus } from '../core/EventBus.js';
import { clamp, lerp } from '../utils/math.js';
import { PHYSICS, WORLD, PLAYER_CONFIG } from '../config/constants.js';

export class Player {
  constructor() {
    this.name = 'Player';
    this.enabled = true;
    this.debugMode = false;
    
    // Core properties - matches original exactly
    this.x = WORLD.PLAYER_SPAWN_X || 120;
    this.y = WORLD.ROAD_Y_OFFSET || 160;
    this.vx = 0;
    this.vy = 0;
    this.width = PLAYER_CONFIG.width || 20;
    this.height = PLAYER_CONFIG.height || 30;
    
    // Player state
    this.isGrounded = true;
    this.isJumping = false;
    this.health = PLAYER_CONFIG.maxHealth || 100;
    this.facing = 'right';
    this.mode = 'road'; // 'road' or 'timeline'
    
    // Animation state
    this.animationFrame = 0;
    this.animationTime = 0;
    this.walkCycle = 0;
    
    // Input state (cached from input manager)
    this.inputState = {
      left: false,
      right: false,
      up: false,
      down: false,
      interact: false,
      jump: false
    };
    
    // Recording for ghost replay
    this.recording = [];
    this.recordingEnabled = true;
    this.recordInterval = 100; // ms
    this.lastRecordTime = 0;
    
    // Physics parameters (matches original)
    this.physics = {
      road: {
        acceleration: PHYSICS.PLAYER_ACCEL,
        friction: PHYSICS.PLAYER_FRICTION,
        maxSpeed: PHYSICS.PLAYER_MAX_SPEED,
        gravity: PHYSICS.GRAVITY
      },
      timeline: {
        acceleration: PHYSICS.TIMELINE_ACCEL,
        friction: PHYSICS.TIMELINE_FRICTION,
        maxSpeed: PHYSICS.TIMELINE_MAX_SPEED,
        gravity: PHYSICS.GRAVITY * 0.8 // Slightly reduced for timeline
      }
    };
    
    this.init();
  }

  /**
   * Initialize player system
   */
  init() {
    this.setupEventListeners();
    this.reset();
    
    if (this.debugMode) {
      console.log('👤 Player initialized');
    }
    
    eventBus.emit('player:initialized', { player: this });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Input events
    eventBus.on('input:key:down', (data) => this.onKeyDown(data));
    eventBus.on('input:key:up', (data) => this.onKeyUp(data));
    eventBus.on('input:updated', (data) => this.updateInputState(data));
    
    // Game mode events
    eventBus.on('mode:changed', (data) => this.onModeChanged(data));
    eventBus.on('world:transition:start', () => this.onWorldTransition());
    
    // Collision events
    eventBus.on('collision:player-branch', (data) => this.onBranchCollision(data));
    eventBus.on('collision:world-boundary', (data) => this.onBoundaryCollision(data));
    
    // Timeline events
    eventBus.on('timeline:exit-requested', () => this.requestTimelineExit());
  }

  /**
   * Reset player to initial state
   */
  reset() {
    this.x = WORLD.PLAYER_SPAWN_X || 120;
    this.y = WORLD.ROAD_Y_OFFSET || 160;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = true;
    this.isJumping = false;
    this.health = PLAYER_CONFIG.maxHealth || 100;
    this.facing = 'right';
    this.mode = 'road';
    
    // Clear recording
    this.recording = [];
    this.lastRecordTime = 0;
    
    eventBus.emit('player:reset', { player: this });
  }

  /**
   * Update player - called every frame
   * @param {number} deltaTime - Frame delta time in seconds
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (!this.enabled) return;
    
    // Update physics based on current mode
    this.updatePhysics(deltaTime, gameState);
    
    // Update animation
    this.updateAnimation(deltaTime);
    
    // Record position for ghost replay
    this.updateRecording(deltaTime);
    
    // Update state in global game state for compatibility
    this.syncToGameState(gameState);
    
    eventBus.emit('player:updated', { 
      player: this, 
      deltaTime,
      position: { x: this.x, y: this.y },
      velocity: { x: this.vx, y: this.vy }
    });
  }

  /**
   * Update player physics - matches original game.js exactly
   * @param {number} deltaTime - Delta time in seconds
   * @param {Object} gameState - Game state
   */
  updatePhysics(deltaTime, gameState) {
    const currentPhysics = this.physics[this.mode];
    
    // Horizontal movement
    let targetVelocity = 0;
    
    if (this.inputState.left) {
      targetVelocity = -currentPhysics.maxSpeed;
      this.facing = 'left';
    }
    
    if (this.inputState.right) {
      targetVelocity = currentPhysics.maxSpeed;
      this.facing = 'right';
    }
    
    // Apply acceleration/friction
    if (targetVelocity !== 0) {
      // Accelerating
      this.vx = lerp(this.vx, targetVelocity, 
                    currentPhysics.acceleration * deltaTime / currentPhysics.maxSpeed);
    } else {
      // Friction
      this.vx = lerp(this.vx, 0, currentPhysics.friction * deltaTime / currentPhysics.maxSpeed);
    }
    
    // Vertical movement (mode-dependent)
    if (this.mode === 'road') {
      this.updateRoadPhysics(deltaTime, gameState);
    } else if (this.mode === 'timeline') {
      this.updateTimelinePhysics(deltaTime, gameState);
    }
    
    // Apply velocity to position
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    
    // Clamp to reasonable bounds
    this.x = clamp(this.x, -1000, 15000);
    
    if (this.mode === 'timeline') {
      this.y = clamp(this.y, 0, window.innerHeight || 600);
    }
  }

  /**
   * Update road mode physics
   * @param {number} deltaTime - Delta time
   * @param {Object} gameState - Game state
   */
  updateRoadPhysics(deltaTime, gameState) {
    // In road mode, player is on the ground
    this.y = WORLD.ROAD_Y_OFFSET || 160;
    this.vy = 0;
    this.isGrounded = true;
    this.isJumping = false;
  }

  /**
   * Update timeline mode physics
   * @param {number} deltaTime - Delta time
   * @param {Object} gameState - Game state
   */
  updateTimelinePhysics(deltaTime, gameState) {
    // Vertical movement in timeline mode
    let targetVerticalVelocity = 0;
    
    if (this.inputState.up) {
      targetVerticalVelocity = -this.physics.timeline.maxSpeed;
    }
    
    if (this.inputState.down) {
      targetVerticalVelocity = this.physics.timeline.maxSpeed;
    }
    
    // Apply vertical acceleration/friction
    if (targetVerticalVelocity !== 0) {
      this.vy = lerp(this.vy, targetVerticalVelocity,
                    this.physics.timeline.acceleration * deltaTime / this.physics.timeline.maxSpeed);
    } else {
      this.vy = lerp(this.vy, 0, this.physics.timeline.friction * deltaTime / this.physics.timeline.maxSpeed);
    }
    
    // Check for timeline exit at top
    if ((this.inputState.up || this.inputState.down) && this.y <= 140) {
      eventBus.emit('timeline:exit-requested');
    }
  }

  /**
   * Update player animation
   * @param {number} deltaTime - Delta time
   */
  updateAnimation(deltaTime) {
    this.animationTime += deltaTime;
    
    // Walking animation
    if (Math.abs(this.vx) > 10) {
      this.walkCycle += deltaTime * 8; // Animation speed
      this.animationFrame = Math.floor(this.walkCycle) % 4;
    } else {
      this.animationFrame = 0;
      this.walkCycle = 0;
    }
  }

  /**
   * Update recording for ghost replay
   * @param {number} deltaTime - Delta time
   */
  updateRecording(deltaTime) {
    if (!this.recordingEnabled) return;
    
    const now = performance.now();
    
    if (now - this.lastRecordTime >= this.recordInterval) {
      this.recording.push({
        x: this.x,
        y: this.y,
        vx: this.vx,
        vy: this.vy,
        facing: this.facing,
        mode: this.mode,
        timestamp: now,
        animationFrame: this.animationFrame
      });
      
      this.lastRecordTime = now;
      
      // Limit recording size for performance
      if (this.recording.length > 10000) {
        this.recording.shift();
      }
    }
  }

  /**
   * Sync player data to global game state for compatibility
   * @param {Object} gameState - Game state to update
   */
  syncToGameState(gameState) {
    if (!gameState.player) {
      gameState.player = {};
    }
    
    // Update global state with current player data
    Object.assign(gameState.player, {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      width: this.width,
      height: this.height,
      facing: this.facing,
      mode: this.mode,
      isGrounded: this.isGrounded,
      isJumping: this.isJumping,
      health: this.health,
      animationFrame: this.animationFrame
    });
  }

  /**
   * Handle key down events
   * @param {Object} data - Key event data
   */
  onKeyDown(data) {
    const { code } = data;
    
    // Map keys to input state
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.inputState.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.inputState.right = true;
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.inputState.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.inputState.down = true;
        break;
      case 'KeyE':
      case 'Enter':
        this.inputState.interact = true;
        break;
      case 'Space':
        this.inputState.jump = true;
        this.jump();
        break;
    }
  }

  /**
   * Handle key up events
   * @param {Object} data - Key event data
   */
  onKeyUp(data) {
    const { code } = data;
    
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.inputState.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.inputState.right = false;
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.inputState.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.inputState.down = false;
        break;
      case 'KeyE':
      case 'Enter':
        this.inputState.interact = false;
        break;
      case 'Space':
        this.inputState.jump = false;
        break;
    }
  }

  /**
   * Update input state from input manager
   * @param {Object} data - Input data
   */
  updateInputState(data) {
    const { keys } = data;
    
    // Update input state from keys object
    this.inputState.left = keys['ArrowLeft'] || keys['KeyA'] || false;
    this.inputState.right = keys['ArrowRight'] || keys['KeyD'] || false;
    this.inputState.up = keys['ArrowUp'] || keys['KeyW'] || false;
    this.inputState.down = keys['ArrowDown'] || keys['KeyS'] || false;
    this.inputState.interact = keys['KeyE'] || keys['Enter'] || false;
    this.inputState.jump = keys['Space'] || false;
  }

  /**
   * Handle mode change
   * @param {Object} data - Mode change data
   */
  onModeChanged(data) {
    const { mode, previousMode } = data;
    
    this.mode = mode;
    
    // Reset velocities on mode change
    if (mode === 'road') {
      this.y = WORLD.ROAD_Y_OFFSET || 160;
      this.vy = 0;
      this.isGrounded = true;
    }
    
    eventBus.emit('player:mode-changed', { 
      player: this, 
      mode, 
      previousMode 
    });
    
    if (this.debugMode) {
      console.log(`👤 Player mode changed: ${previousMode} → ${mode}`);
    }
  }

  /**
   * Handle world transition
   */
  onWorldTransition() {
    // Stop player movement during transition
    this.vx = 0;
    this.vy = 0;
    
    eventBus.emit('player:world-transition', { player: this });
  }

  /**
   * Handle branch collision
   * @param {Object} data - Collision data
   */
  onBranchCollision(data) {
    const { branch } = data;
    
    if (this.debugMode) {
      console.log(`👤 Player collided with branch: ${branch.label}`);
    }
  }

  /**
   * Handle boundary collision
   * @param {Object} data - Collision data
   */
  onBoundaryCollision(data) {
    // Player position has already been corrected by collision system
    eventBus.emit('player:boundary-hit', { player: this, bounds: data.bounds });
  }

  /**
   * Request timeline exit
   */
  requestTimelineExit() {
    if (this.mode === 'timeline' && this.y <= 140) {
      eventBus.emit('mode:change-requested', { 
        newMode: 'road',
        reason: 'timeline-exit',
        player: this
      });
    }
  }

  /**
   * Make player jump (if applicable)
   */
  jump() {
    if (this.mode === 'road' && this.isGrounded) {
      this.vy = -400; // Jump velocity
      this.isGrounded = false;
      this.isJumping = true;
      
      eventBus.emit('player:jump', { player: this });
    }
  }

  /**
   * Set player position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    
    eventBus.emit('player:position-changed', { 
      player: this, 
      position: { x, y } 
    });
  }

  /**
   * Add velocity to player
   * @param {number} vx - X velocity
   * @param {number} vy - Y velocity
   */
  addVelocity(vx, vy) {
    this.vx += vx;
    this.vy += vy;
  }

  /**
   * Get player bounds for collision detection
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
   * Get recording data for ghost replay
   * @returns {Array} Recording data
   */
  getRecording() {
    return [...this.recording];
  }

  /**
   * Start/stop recording
   * @param {boolean} enabled - Recording enabled
   */
  setRecording(enabled) {
    this.recordingEnabled = enabled;
    if (!enabled) {
      this.recording = [];
    }
    
    eventBus.emit('player:recording-changed', { 
      player: this, 
      enabled 
    });
  }

  /**
   * Get player state for serialization
   * @returns {Object} Player state
   */
  getState() {
    return {
      position: { x: this.x, y: this.y },
      velocity: { x: this.vx, y: this.vy },
      dimensions: { width: this.width, height: this.height },
      state: {
        facing: this.facing,
        mode: this.mode,
        isGrounded: this.isGrounded,
        isJumping: this.isJumping,
        health: this.health,
        animationFrame: this.animationFrame
      },
      input: { ...this.inputState }
    };
  }

  /**
   * Enable/disable player
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('player:enabled-changed', { player: this, enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup player system
   */
  destroy() {
    this.recording = [];
    eventBus.emit('player:destroyed', { player: this });
  }
}

// Export singleton instance
export const player = new Player();
