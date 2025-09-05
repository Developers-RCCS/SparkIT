/**
 * Camera System
 * Advanced camera management with smooth following, zoom effects, and cinematic control
 * Handles viewport management, shake effects, and transition animations
 */

import { eventBus } from '../core/EventBus.js';
import { lerp, clamp } from '../utils/math.js';
import { CAMERA_CONFIG } from '../config/constants.js';

export class CameraSystem {
  constructor() {
    this.name = 'CameraSystem';
    this.enabled = true;
    this.debugMode = false;
    
    // Camera state
    this.position = { x: 0, y: 0 };
    this.targetPosition = { x: 0, y: 0 };
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.rotation = 0;
    this.targetRotation = 0;
    
    // Viewport
    this.viewport = {
      width: window.innerWidth || 800,
      height: window.innerHeight || 600,
      centerX: 0,
      centerY: 0
    };
    this.updateViewportCenter();
    
    // Following system
    this.following = {
      target: null,
      enabled: true,
      smoothing: 0.05,
      deadZone: { width: 100, height: 60 },
      lookAhead: { distance: 100, factor: 0.3 },
      bounds: null
    };
    
    // Camera effects
    this.effects = {
      shake: {
        active: false,
        intensity: 0,
        duration: 0,
        elapsed: 0,
        frequency: 10,
        dampening: 0.9
      },
      parallax: {
        enabled: true,
        layers: [],
        strength: 0.5
      },
      cinematics: {
        active: false,
        sequence: null,
        currentShot: 0,
        shotTimer: 0
      }
    };
    
    // Zoom constraints
    this.zoomConstraints = {
      min: 0.3,
      max: 3.0,
      smoothing: 0.08
    };
    
    // Movement constraints
    this.bounds = {
      enabled: false,
      minX: -1000,
      maxX: 2000,
      minY: 0,
      maxY: 600
    };
    
    // Animation system
    this.animations = [];
    this.currentAnimation = null;
    
    // Performance tracking
    this.lastUpdateTime = 0;
    this.updateFrequency = 60;
    
    this.init();
  }

  /**
   * Initialize camera system
   */
  init() {
    this.loadCameraConfig();
    this.setupEventListeners();
    this.setupResizeHandler();
    
    if (this.debugMode) {
      console.log('🎥 Camera System initialized');
    }
    
    eventBus.emit('camera-system:initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Player events
    eventBus.on('player:updated', (data) => this.onPlayerUpdated(data));
    eventBus.on('player:spawned', (data) => this.onPlayerSpawned(data));
    
    // Mode events
    eventBus.on('mode:changed', (data) => this.onModeChanged(data));
    eventBus.on('road-mode:entered', () => this.onRoadModeEntered());
    eventBus.on('timeline-mode:entered', () => this.onTimelineModeEntered());
    
    // Effect events
    eventBus.on('camera:shake', (data) => this.shake(data));
    eventBus.on('camera:zoom', (data) => this.zoomTo(data));
    eventBus.on('camera:move', (data) => this.moveTo(data));
    eventBus.on('camera:follow', (data) => this.follow(data));
    
    // Branch events
    eventBus.on('branch:selected', (data) => this.onBranchSelected(data));
    eventBus.on('branch:entered', (data) => this.onBranchEntered(data));
    
    // Cinematic events
    eventBus.on('cinematic:start', (data) => this.startCinematic(data));
    eventBus.on('cinematic:stop', () => this.stopCinematic());
    
    // Achievement events
    eventBus.on('achievement:earned', (data) => this.onAchievementEarned(data));
    eventBus.on('milestone:completed', (data) => this.onMilestoneCompleted(data));
    
    // Input events (for manual camera control)
    eventBus.on('input:key:down', (data) => this.onKeyDown(data));
  }

  /**
   * Load camera configuration
   */
  loadCameraConfig() {
    this.config = {
      followSmoothing: CAMERA_CONFIG.followSmoothing || 0.05,
      zoomSmoothing: CAMERA_CONFIG.zoomSmoothing || 0.08,
      shakeIntensity: CAMERA_CONFIG.shakeIntensity || 10,
      maxShakeDuration: CAMERA_CONFIG.maxShakeDuration || 2000,
      parallaxStrength: CAMERA_CONFIG.parallaxStrength || 0.5,
      deadZoneWidth: CAMERA_CONFIG.deadZoneWidth || 100,
      deadZoneHeight: CAMERA_CONFIG.deadZoneHeight || 60,
      lookAheadDistance: CAMERA_CONFIG.lookAheadDistance || 100,
      boundsEnabled: CAMERA_CONFIG.boundsEnabled || false
    };
    
    // Apply config to systems
    this.following.smoothing = this.config.followSmoothing;
    this.zoomConstraints.smoothing = this.config.zoomSmoothing;
    this.following.deadZone.width = this.config.deadZoneWidth;
    this.following.deadZone.height = this.config.deadZoneHeight;
    this.following.lookAhead.distance = this.config.lookAheadDistance;
    this.bounds.enabled = this.config.boundsEnabled;
  }

  /**
   * Setup window resize handler
   */
  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.viewport.width = window.innerWidth;
      this.viewport.height = window.innerHeight;
      this.updateViewportCenter();
      
      eventBus.emit('camera:viewport-changed', { 
        viewport: this.viewport 
      });
    });
  }

  /**
   * Update viewport center
   */
  updateViewportCenter() {
    this.viewport.centerX = this.viewport.width / 2;
    this.viewport.centerY = this.viewport.height / 2;
  }

  /**
   * Update camera system - called every frame
   * @param {number} deltaTime - Frame delta time
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (!this.enabled) return;
    
    const now = performance.now();
    if (now - this.lastUpdateTime < 1000 / this.updateFrequency) return;
    
    this.lastUpdateTime = now;
    
    // Update following behavior
    this.updateFollowing(deltaTime, gameState);
    
    // Update camera animations
    this.updateAnimations(deltaTime);
    
    // Update effects
    this.updateShake(deltaTime);
    this.updateCinematics(deltaTime);
    
    // Apply constraints
    this.applyConstraints();
    
    // Smooth camera movement
    this.smoothCamera(deltaTime);
    
    // Update parallax layers
    this.updateParallax(gameState);
    
    // Sync to game state
    this.syncToGameState(gameState);
    
    eventBus.emit('camera-system:updated', { deltaTime });
  }

  /**
   * Update camera following behavior
   * @param {number} deltaTime - Delta time
   * @param {Object} gameState - Game state
   */
  updateFollowing(deltaTime, gameState) {
    if (!this.following.enabled || !this.following.target) return;
    
    const target = this.following.target;
    const { deadZone, lookAhead } = this.following;
    
    // Calculate dead zone boundaries
    const deadZoneLeft = this.position.x - deadZone.width / 2;
    const deadZoneRight = this.position.x + deadZone.width / 2;
    const deadZoneTop = this.position.y - deadZone.height / 2;
    const deadZoneBottom = this.position.y + deadZone.height / 2;
    
    // Check if target is outside dead zone
    let targetX = this.targetPosition.x;
    let targetY = this.targetPosition.y;
    
    if (target.x < deadZoneLeft) {
      targetX = target.x + deadZone.width / 2;
    } else if (target.x > deadZoneRight) {
      targetX = target.x - deadZone.width / 2;
    }
    
    if (target.y < deadZoneTop) {
      targetY = target.y + deadZone.height / 2;
    } else if (target.y > deadZoneBottom) {
      targetY = target.y - deadZone.height / 2;
    }
    
    // Apply look-ahead based on target velocity
    if (target.vx || target.vy) {
      const speed = Math.sqrt(target.vx * target.vx + target.vy * target.vy);
      const normalizedVx = target.vx / speed;
      const normalizedVy = target.vy / speed;
      
      targetX += normalizedVx * lookAhead.distance * lookAhead.factor;
      targetY += normalizedVy * lookAhead.distance * lookAhead.factor * 0.3; // Less vertical look-ahead
    }
    
    this.targetPosition.x = targetX;
    this.targetPosition.y = targetY;
  }

  /**
   * Update camera animations
   * @param {number} deltaTime - Delta time
   */
  updateAnimations(deltaTime) {
    if (this.currentAnimation) {
      this.currentAnimation.elapsed += deltaTime;
      const progress = Math.min(1, this.currentAnimation.elapsed / this.currentAnimation.duration);
      
      // Apply easing
      const easedProgress = this.easeInOutCubic(progress);
      
      // Interpolate values
      this.targetPosition.x = lerp(
        this.currentAnimation.startPosition.x,
        this.currentAnimation.endPosition.x,
        easedProgress
      );
      
      this.targetPosition.y = lerp(
        this.currentAnimation.startPosition.y,
        this.currentAnimation.endPosition.y,
        easedProgress
      );
      
      if (this.currentAnimation.endZoom !== undefined) {
        this.targetZoom = lerp(
          this.currentAnimation.startZoom,
          this.currentAnimation.endZoom,
          easedProgress
        );
      }
      
      // Check if animation is complete
      if (progress >= 1) {
        const callback = this.currentAnimation.callback;
        this.currentAnimation = null;
        
        if (callback) {
          callback();
        }
        
        eventBus.emit('camera:animation-complete');
      }
    }
  }

  /**
   * Update shake effect
   * @param {number} deltaTime - Delta time
   */
  updateShake(deltaTime) {
    const { shake } = this.effects;
    
    if (!shake.active) return;
    
    shake.elapsed += deltaTime;
    
    if (shake.elapsed >= shake.duration) {
      // End shake
      shake.active = false;
      shake.intensity = 0;
      eventBus.emit('camera:shake-complete');
      return;
    }
    
    // Calculate shake intensity with dampening
    const remainingTime = shake.duration - shake.elapsed;
    const dampenedIntensity = shake.intensity * (remainingTime / shake.duration);
    
    // Apply shake offset
    const shakeX = (Math.random() - 0.5) * dampenedIntensity;
    const shakeY = (Math.random() - 0.5) * dampenedIntensity;
    
    this.position.x += shakeX;
    this.position.y += shakeY;
  }

  /**
   * Update cinematic sequences
   * @param {number} deltaTime - Delta time
   */
  updateCinematics(deltaTime) {
    const { cinematics } = this.effects;
    
    if (!cinematics.active || !cinematics.sequence) return;
    
    cinematics.shotTimer += deltaTime;
    
    const currentShot = cinematics.sequence.shots[cinematics.currentShot];
    if (!currentShot) return;
    
    // Check if shot duration is complete
    if (cinematics.shotTimer >= currentShot.duration) {
      cinematics.currentShot++;
      cinematics.shotTimer = 0;
      
      // Check if sequence is complete
      if (cinematics.currentShot >= cinematics.sequence.shots.length) {
        this.stopCinematic();
        return;
      }
      
      // Start next shot
      this.executeCinematicShot(cinematics.sequence.shots[cinematics.currentShot]);
    }
  }

  /**
   * Apply camera constraints
   */
  applyConstraints() {
    // Zoom constraints
    this.targetZoom = clamp(this.targetZoom, this.zoomConstraints.min, this.zoomConstraints.max);
    
    // Position constraints
    if (this.bounds.enabled) {
      this.targetPosition.x = clamp(this.targetPosition.x, this.bounds.minX, this.bounds.maxX);
      this.targetPosition.y = clamp(this.targetPosition.y, this.bounds.minY, this.bounds.maxY);
    }
    
    // Rotation constraints
    this.targetRotation = clamp(this.targetRotation, -Math.PI / 4, Math.PI / 4); // ±45 degrees
  }

  /**
   * Smooth camera movement
   * @param {number} deltaTime - Delta time
   */
  smoothCamera(deltaTime) {
    // Smooth position
    this.position.x = lerp(this.position.x, this.targetPosition.x, this.following.smoothing);
    this.position.y = lerp(this.position.y, this.targetPosition.y, this.following.smoothing);
    
    // Smooth zoom
    this.zoom = lerp(this.zoom, this.targetZoom, this.zoomConstraints.smoothing);
    
    // Smooth rotation
    this.rotation = lerp(this.rotation, this.targetRotation, 0.1);
  }

  /**
   * Update parallax layers
   * @param {Object} gameState - Game state
   */
  updateParallax(gameState) {
    if (!this.effects.parallax.enabled) return;
    
    for (const layer of this.effects.parallax.layers) {
      layer.x = this.position.x * layer.speed * this.effects.parallax.strength;
      layer.y = this.position.y * layer.speed * this.effects.parallax.strength * 0.5; // Less vertical parallax
    }
  }

  /**
   * Start camera shake effect
   * @param {Object} options - Shake options
   */
  shake(options = {}) {
    const { shake } = this.effects;
    
    shake.active = true;
    shake.intensity = options.intensity || this.config.shakeIntensity;
    shake.duration = options.duration || 500;
    shake.elapsed = 0;
    shake.frequency = options.frequency || 10;
    
    eventBus.emit('camera:shake-started', { 
      intensity: shake.intensity,
      duration: shake.duration 
    });
    
    if (this.debugMode) {
      console.log(`🎥 Camera shake: ${shake.intensity} intensity for ${shake.duration}ms`);
    }
  }

  /**
   * Zoom camera to specific level
   * @param {Object} options - Zoom options
   */
  zoomTo(options = {}) {
    const { zoom, duration = 1000, callback } = options;
    
    if (duration === 0) {
      this.targetZoom = zoom;
      this.zoom = zoom;
      if (callback) callback();
      return;
    }
    
    this.currentAnimation = {
      type: 'zoom',
      startZoom: this.zoom,
      endZoom: zoom,
      duration,
      elapsed: 0,
      callback
    };
    
    eventBus.emit('camera:zoom-started', { zoom, duration });
  }

  /**
   * Move camera to specific position
   * @param {Object} options - Move options
   */
  moveTo(options = {}) {
    const { x, y, zoom, duration = 1000, callback } = options;
    
    if (duration === 0) {
      this.targetPosition.x = x !== undefined ? x : this.targetPosition.x;
      this.targetPosition.y = y !== undefined ? y : this.targetPosition.y;
      if (zoom !== undefined) {
        this.targetZoom = zoom;
      }
      if (callback) callback();
      return;
    }
    
    this.currentAnimation = {
      type: 'move',
      startPosition: { x: this.position.x, y: this.position.y },
      endPosition: { 
        x: x !== undefined ? x : this.position.x,
        y: y !== undefined ? y : this.position.y 
      },
      startZoom: this.zoom,
      endZoom: zoom,
      duration,
      elapsed: 0,
      callback
    };
    
    eventBus.emit('camera:move-started', { x, y, zoom, duration });
  }

  /**
   * Set camera to follow target
   * @param {Object} options - Follow options
   */
  follow(options = {}) {
    const { target, immediate = false } = options;
    
    this.following.target = target;
    this.following.enabled = true;
    
    if (immediate && target) {
      this.position.x = target.x;
      this.position.y = target.y;
      this.targetPosition.x = target.x;
      this.targetPosition.y = target.y;
    }
    
    eventBus.emit('camera:follow-started', { target });
    
    if (this.debugMode) {
      console.log('🎥 Camera following target');
    }
  }

  /**
   * Stop camera following
   */
  stopFollowing() {
    this.following.enabled = false;
    this.following.target = null;
    
    eventBus.emit('camera:follow-stopped');
  }

  /**
   * Start cinematic sequence
   * @param {Object} sequence - Cinematic sequence data
   */
  startCinematic(sequence) {
    const { cinematics } = this.effects;
    
    cinematics.active = true;
    cinematics.sequence = sequence;
    cinematics.currentShot = 0;
    cinematics.shotTimer = 0;
    
    // Disable following during cinematics
    this.following.enabled = false;
    
    // Start first shot
    if (sequence.shots && sequence.shots.length > 0) {
      this.executeCinematicShot(sequence.shots[0]);
    }
    
    eventBus.emit('camera:cinematic-started', { sequence });
    
    if (this.debugMode) {
      console.log('🎥 Cinematic sequence started');
    }
  }

  /**
   * Execute a cinematic shot
   * @param {Object} shot - Shot data
   */
  executeCinematicShot(shot) {
    const { type, position, zoom, duration, easing } = shot;
    
    switch (type) {
      case 'move':
        this.moveTo({
          x: position.x,
          y: position.y,
          zoom,
          duration: duration || 1000
        });
        break;
        
      case 'zoom':
        this.zoomTo({
          zoom,
          duration: duration || 1000
        });
        break;
        
      case 'shake':
        this.shake({
          intensity: shot.intensity || 15,
          duration: duration || 500
        });
        break;
        
      case 'follow':
        if (shot.target) {
          this.follow({ target: shot.target });
        }
        break;
    }
    
    eventBus.emit('camera:cinematic-shot', { shot });
  }

  /**
   * Stop cinematic sequence
   */
  stopCinematic() {
    const { cinematics } = this.effects;
    
    cinematics.active = false;
    cinematics.sequence = null;
    cinematics.currentShot = 0;
    cinematics.shotTimer = 0;
    
    // Re-enable following if there's a target
    if (this.following.target) {
      this.following.enabled = true;
    }
    
    eventBus.emit('camera:cinematic-stopped');
    
    if (this.debugMode) {
      console.log('🎥 Cinematic sequence stopped');
    }
  }

  /**
   * Set camera bounds
   * @param {Object} bounds - Boundary limits
   */
  setBounds(bounds) {
    this.bounds = { ...this.bounds, ...bounds };
    this.bounds.enabled = true;
    
    eventBus.emit('camera:bounds-set', { bounds: this.bounds });
  }

  /**
   * Clear camera bounds
   */
  clearBounds() {
    this.bounds.enabled = false;
    eventBus.emit('camera:bounds-cleared');
  }

  /**
   * Get world position from screen coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.viewport.centerX) / this.zoom + this.position.x,
      y: (screenY - this.viewport.centerY) / this.zoom + this.position.y
    };
  }

  /**
   * Get screen position from world coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.position.x) * this.zoom + this.viewport.centerX,
      y: (worldY - this.position.y) * this.zoom + this.viewport.centerY
    };
  }

  /**
   * Check if point is visible in viewport
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @param {number} margin - Margin around viewport
   * @returns {boolean} Is visible
   */
  isVisible(worldX, worldY, margin = 0) {
    const screen = this.worldToScreen(worldX, worldY);
    
    return screen.x >= -margin &&
           screen.x <= this.viewport.width + margin &&
           screen.y >= -margin &&
           screen.y <= this.viewport.height + margin;
  }

  /**
   * Handle player updated
   * @param {Object} data - Player data
   */
  onPlayerUpdated(data) {
    // Player updates are handled in following system
  }

  /**
   * Handle player spawned
   * @param {Object} data - Player spawn data
   */
  onPlayerSpawned(data) {
    this.follow({ target: data.player, immediate: true });
  }

  /**
   * Handle mode changed
   * @param {Object} data - Mode change data
   */
  onModeChanged(data) {
    const { newMode } = data;
    
    // Adjust camera behavior based on mode
    switch (newMode) {
      case 'road':
        this.zoomTo({ zoom: 1.0, duration: 1000 });
        break;
        
      case 'timeline':
        this.zoomTo({ zoom: 0.7, duration: 1000 });
        break;
    }
  }

  /**
   * Handle road mode entered
   */
  onRoadModeEntered() {
    // Set appropriate camera settings for road mode
    this.following.smoothing = this.config.followSmoothing;
    this.following.deadZone.width = this.config.deadZoneWidth;
    this.following.lookAhead.factor = 0.3;
  }

  /**
   * Handle timeline mode entered
   */
  onTimelineModeEntered() {
    // Set appropriate camera settings for timeline mode
    this.following.smoothing = 0.1; // Slower following for timeline
    this.following.deadZone.width = 150; // Larger dead zone
    this.following.lookAhead.factor = 0.1; // Less look-ahead
  }

  /**
   * Handle branch selected
   * @param {Object} data - Branch data
   */
  onBranchSelected(data) {
    // Optional: Slightly zoom in on selected branch
    this.shake({ intensity: 3, duration: 200 });
  }

  /**
   * Handle branch entered
   * @param {Object} data - Branch data
   */
  onBranchEntered(data) {
    // Create entering effect
    this.shake({ intensity: 8, duration: 400 });
  }

  /**
   * Handle achievement earned
   * @param {Object} data - Achievement data
   */
  onAchievementEarned(data) {
    // Celebration shake
    this.shake({ intensity: 12, duration: 600 });
  }

  /**
   * Handle milestone completed
   * @param {Object} data - Milestone data
   */
  onMilestoneCompleted(data) {
    // More dramatic celebration
    this.shake({ intensity: 20, duration: 1000 });
  }

  /**
   * Handle key down (debug controls)
   * @param {Object} data - Key event data
   */
  onKeyDown(data) {
    if (!this.debugMode) return;
    
    const { code } = data;
    
    switch (code) {
      case 'Digit1':
        this.zoomTo({ zoom: 0.5, duration: 500 });
        break;
      case 'Digit2':
        this.zoomTo({ zoom: 1.0, duration: 500 });
        break;
      case 'Digit3':
        this.zoomTo({ zoom: 2.0, duration: 500 });
        break;
      case 'KeyR':
        this.shake({ intensity: 15, duration: 1000 });
        break;
    }
  }

  /**
   * Ease in-out cubic function
   * @param {number} t - Time (0-1)
   * @returns {number} Eased value
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Sync camera data to game state
   * @param {Object} gameState - Game state
   */
  syncToGameState(gameState) {
    if (!gameState.camera) {
      gameState.camera = {};
    }
    
    Object.assign(gameState.camera, {
      position: { ...this.position },
      targetPosition: { ...this.targetPosition },
      zoom: this.zoom,
      targetZoom: this.targetZoom,
      rotation: this.rotation,
      viewport: { ...this.viewport },
      following: this.following.enabled,
      followingTarget: this.following.target ? 'player' : null,
      bounds: this.bounds.enabled ? this.bounds : null,
      shake: this.effects.shake.active,
      cinematic: this.effects.cinematics.active,
      animation: !!this.currentAnimation
    });
  }

  /**
   * Get camera system state
   * @returns {Object} Current state
   */
  getState() {
    return {
      position: { ...this.position },
      zoom: this.zoom,
      rotation: this.rotation,
      following: this.following.enabled,
      target: this.following.target ? 'player' : null,
      viewport: { ...this.viewport },
      bounds: this.bounds.enabled,
      shake: this.effects.shake.active,
      cinematic: this.effects.cinematics.active,
      animation: !!this.currentAnimation,
      parallax: this.effects.parallax.enabled
    };
  }

  /**
   * Enable/disable camera system
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('camera-system:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup camera system
   */
  destroy() {
    this.following.target = null;
    this.currentAnimation = null;
    this.effects.shake.active = false;
    this.effects.cinematics.active = false;
    
    eventBus.emit('camera-system:destroyed');
  }
}

export { CameraSystem };
