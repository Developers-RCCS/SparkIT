/**
 * World Manager System
 * Manages overall world state, transitions, and environmental changes
 * Coordinates between different systems and maintains global game state
 */

import { eventBus } from '../core/EventBus.js';
import { clamp, lerp } from '../utils/math.js';
import { WORLD_CONFIG } from '../config/constants.js';

export class WorldManager {
  constructor() {
    this.name = 'WorldManager';
    this.enabled = true;
    this.debugMode = false;
    
    // World state
    this.worldState = 'road'; // 'road', 'timeline', 'transition'
    this.previousState = null;
    this.stateHistory = [];
    
    // World properties
    this.worldTime = 0;
    this.worldSpeed = 1.0;
    this.isPaused = false;
    
    // Environment
    this.environment = {
      lighting: {
        ambient: 0.6,
        sun: { x: 0.5, y: 1.0, intensity: 0.8 },
        shadows: true
      },
      weather: {
        type: 'clear', // 'clear', 'cloudy', 'rain', 'storm'
        intensity: 0,
        windSpeed: 0.1,
        windDirection: 0
      },
      atmosphere: {
        fog: { density: 0.1, color: '#e6f3ff' },
        particles: { enabled: true, density: 0.3 },
        timeOfDay: 'day' // 'dawn', 'day', 'dusk', 'night'
      }
    };
    
    // World boundaries and zones
    this.worldBounds = {
      minX: -1000,
      maxX: 2000,
      minY: 0,
      maxY: 600
    };
    
    this.zones = [];
    this.currentZone = null;
    
    // Transition system
    this.transition = {
      active: false,
      type: null,
      progress: 0,
      duration: 0,
      startTime: 0,
      fromState: null,
      toState: null,
      callback: null
    };
    
    // Performance tracking
    this.performance = {
      frameRate: 60,
      updateTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      entityCount: 0
    };
    
    // Save/Load system
    this.saveData = {
      worldState: null,
      playerProgress: null,
      lastSaveTime: 0,
      autoSaveInterval: 30000 // 30 seconds
    };
    
    this.init();
  }

  /**
   * Initialize world manager
   */
  init() {
    this.loadWorldConfig();
    this.setupEventListeners();
    this.initializeWorld();
    this.setupZones();
    this.startAutoSave();
    
    if (this.debugMode) {
      console.log('🌍 World Manager initialized');
    }
    
    eventBus.emit('world-manager:initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mode events
    eventBus.on('mode:changed', (data) => this.onModeChanged(data));
    eventBus.on('mode:transition-start', (data) => this.onTransitionStart(data));
    eventBus.on('mode:transition-complete', (data) => this.onTransitionComplete(data));
    
    // Player events
    eventBus.on('player:updated', (data) => this.onPlayerUpdated(data));
    eventBus.on('player:zone-changed', (data) => this.onPlayerZoneChanged(data));
    
    // Branch events
    eventBus.on('branch:entered', (data) => this.onBranchEntered(data));
    eventBus.on('branch:completed', (data) => this.onBranchCompleted(data));
    
    // System events
    eventBus.on('game:pause', () => this.pauseWorld());
    eventBus.on('game:resume', () => this.resumeWorld());
    eventBus.on('game:reset', () => this.resetWorld());
    
    // Environment events
    eventBus.on('environment:change-weather', (data) => this.changeWeather(data));
    eventBus.on('environment:change-time', (data) => this.changeTimeOfDay(data));
    
    // Save/Load events
    eventBus.on('game:save', () => this.saveWorld());
    eventBus.on('game:load', (data) => this.loadWorld(data));
  }

  /**
   * Load world configuration
   */
  loadWorldConfig() {
    this.config = {
      transitionDuration: WORLD_CONFIG.transitionDuration || 1000,
      autoSaveInterval: WORLD_CONFIG.autoSaveInterval || 30000,
      maxStateHistory: WORLD_CONFIG.maxStateHistory || 50,
      performanceMonitoring: WORLD_CONFIG.performanceMonitoring || true,
      dynamicEnvironment: WORLD_CONFIG.dynamicEnvironment || true,
      worldBounds: WORLD_CONFIG.worldBounds || this.worldBounds
    };
    
    // Update world bounds from config
    Object.assign(this.worldBounds, this.config.worldBounds);
  }

  /**
   * Initialize world systems
   */
  initializeWorld() {
    // Set initial world state
    this.worldState = 'road';
    this.worldTime = 0;
    this.worldSpeed = 1.0;
    
    // Initialize environment
    this.setTimeOfDay('day');
    this.changeWeather({ type: 'clear', intensity: 0 });
    
    // Load saved data if available
    this.loadSavedData();
  }

  /**
   * Setup world zones
   */
  setupZones() {
    this.zones = [
      {
        id: 'starting-area',
        name: 'Welcome Zone',
        bounds: { minX: -100, maxX: 300, minY: 0, maxY: 600 },
        properties: {
          music: 'intro-theme',
          lighting: { ambient: 0.8 },
          effects: ['sparkles'],
          description: 'Your learning journey begins here'
        },
        triggers: [
          { type: 'enter', action: 'show-welcome-message' },
          { type: 'first-visit', action: 'play-tutorial' }
        ]
      },
      
      {
        id: 'learning-highway',
        name: 'Learning Highway',
        bounds: { minX: 300, maxX: 1200, minY: 100, maxY: 500 },
        properties: {
          music: 'driving-theme',
          lighting: { ambient: 0.6 },
          effects: ['road-particles'],
          description: 'The main road of knowledge'
        },
        triggers: [
          { type: 'enter', action: 'start-highway-music' },
          { type: 'speed-boost', action: 'show-encouragement' }
        ]
      },
      
      {
        id: 'advanced-territory',
        name: 'Advanced Learning Zone',
        bounds: { minX: 1200, maxX: 2000, minY: 50, maxY: 550 },
        properties: {
          music: 'challenge-theme',
          lighting: { ambient: 0.5, dramatic: true },
          effects: ['lightning', 'energy-fields'],
          description: 'For the bold and determined learners'
        },
        triggers: [
          { type: 'enter', action: 'increase-challenge' },
          { type: 'achievement', action: 'celebrate-mastery' }
        ]
      }
    ];
    
    eventBus.emit('world:zones-initialized', { zones: this.zones });
  }

  /**
   * Update world manager - called every frame
   * @param {number} deltaTime - Frame delta time
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (!this.enabled) return;
    
    const startTime = performance.now();
    
    // Update world time
    if (!this.isPaused) {
      this.worldTime += deltaTime * this.worldSpeed;
    }
    
    // Update transitions
    this.updateTransitions(deltaTime);
    
    // Update environment
    this.updateEnvironment(deltaTime, gameState);
    
    // Update zones
    this.updateZones(gameState);
    
    // Monitor performance
    this.updatePerformanceStats(deltaTime, gameState);
    
    // Handle auto-save
    this.handleAutoSave();
    
    // Sync to game state
    this.syncToGameState(gameState);
    
    // Track update time
    this.performance.updateTime = performance.now() - startTime;
    
    eventBus.emit('world-manager:updated', { deltaTime });
  }

  /**
   * Update world transitions
   * @param {number} deltaTime - Delta time
   */
  updateTransitions(deltaTime) {
    if (!this.transition.active) return;
    
    const elapsed = performance.now() - this.transition.startTime;
    this.transition.progress = Math.min(1, elapsed / this.transition.duration);
    
    // Apply transition effects based on type
    this.applyTransitionEffects(this.transition);
    
    // Check if transition is complete
    if (this.transition.progress >= 1) {
      this.completeTransition();
    }
  }

  /**
   * Update environment systems
   * @param {number} deltaTime - Delta time
   * @param {Object} gameState - Game state
   */
  updateEnvironment(deltaTime, gameState) {
    if (!this.config.dynamicEnvironment) return;
    
    // Update lighting based on time and state
    this.updateLighting(deltaTime);
    
    // Update weather effects
    this.updateWeather(deltaTime);
    
    // Update atmospheric effects
    this.updateAtmosphere(deltaTime, gameState);
  }

  /**
   * Update lighting system
   * @param {number} deltaTime - Delta time
   */
  updateLighting(deltaTime) {
    const { lighting } = this.environment;
    
    // Subtle lighting changes based on world time
    const timeEffect = Math.sin(this.worldTime * 0.001) * 0.1;
    lighting.ambient = clamp(0.6 + timeEffect, 0.3, 0.9);
    
    // Adjust sun position (very slow cycle)
    lighting.sun.x = 0.5 + Math.sin(this.worldTime * 0.0001) * 0.3;
    lighting.sun.y = 1.0 + Math.cos(this.worldTime * 0.0001) * 0.2;
  }

  /**
   * Update weather system
   * @param {number} deltaTime - Delta time
   */
  updateWeather(deltaTime) {
    const { weather } = this.environment;
    
    // Gradually change weather intensity
    if (weather.targetIntensity !== undefined) {
      weather.intensity = lerp(
        weather.intensity, 
        weather.targetIntensity, 
        deltaTime * 0.001
      );
      
      if (Math.abs(weather.intensity - weather.targetIntensity) < 0.01) {
        weather.intensity = weather.targetIntensity;
        delete weather.targetIntensity;
      }
    }
    
    // Update wind
    weather.windDirection += deltaTime * 0.001;
  }

  /**
   * Update atmospheric effects
   * @param {number} deltaTime - Delta time
   * @param {Object} gameState - Game state
   */
  updateAtmosphere(deltaTime, gameState) {
    const { atmosphere } = this.environment;
    
    // Adjust fog based on player speed
    const player = gameState.player;
    if (player) {
      const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      const targetFogDensity = clamp(0.1 + speed * 0.01, 0.05, 0.3);
      atmosphere.fog.density = lerp(atmosphere.fog.density, targetFogDensity, deltaTime * 0.001);
    }
    
    // Adjust particle density based on world state
    const targetParticleDensity = this.worldState === 'timeline' ? 0.5 : 0.3;
    atmosphere.particles.density = lerp(
      atmosphere.particles.density, 
      targetParticleDensity, 
      deltaTime * 0.0005
    );
  }

  /**
   * Update zone system
   * @param {Object} gameState - Game state
   */
  updateZones(gameState) {
    const player = gameState.player;
    if (!player) return;
    
    // Find current zone
    const newZone = this.findZoneAtPosition(player.x, player.y);
    
    if (newZone !== this.currentZone) {
      // Zone change
      if (this.currentZone) {
        this.exitZone(this.currentZone, player);
      }
      
      if (newZone) {
        this.enterZone(newZone, player);
      }
      
      this.currentZone = newZone;
      
      eventBus.emit('player:zone-changed', { 
        previous: this.currentZone,
        current: newZone,
        player: { x: player.x, y: player.y }
      });
    }
  }

  /**
   * Update performance statistics
   * @param {number} deltaTime - Delta time
   * @param {Object} gameState - Game state
   */
  updatePerformanceStats(deltaTime, gameState) {
    if (!this.config.performanceMonitoring) return;
    
    // Update frame rate
    this.performance.frameRate = 1000 / deltaTime;
    
    // Count entities
    this.performance.entityCount = 0;
    if (gameState.entities) {
      this.performance.entityCount = Object.keys(gameState.entities).length;
    }
    
    // Memory usage (if available)
    if (performance.memory) {
      this.performance.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  /**
   * Start world transition
   * @param {string} fromState - Current state
   * @param {string} toState - Target state
   * @param {Object} options - Transition options
   */
  startTransition(fromState, toState, options = {}) {
    if (this.transition.active) {
      console.warn('🌍 Transition already in progress');
      return;
    }
    
    this.transition = {
      active: true,
      type: options.type || 'fade',
      progress: 0,
      duration: options.duration || this.config.transitionDuration,
      startTime: performance.now(),
      fromState,
      toState,
      callback: options.callback
    };
    
    // Add to state history
    this.addToStateHistory(fromState, toState);
    
    eventBus.emit('world:transition-started', { 
      fromState, 
      toState, 
      type: this.transition.type 
    });
    
    if (this.debugMode) {
      console.log(`🌍 Starting transition: ${fromState} → ${toState}`);
    }
  }

  /**
   * Apply transition effects
   * @param {Object} transition - Transition data
   */
  applyTransitionEffects(transition) {
    const { type, progress } = transition;
    
    switch (type) {
      case 'fade':
        // Fade effect applied by renderer
        break;
        
      case 'slide':
        // Slide effect with camera movement
        break;
        
      case 'zoom':
        // Zoom in/out effect
        break;
        
      case 'dissolve':
        // Particle dissolve effect
        break;
    }
    
    eventBus.emit('world:transition-progress', { 
      type, 
      progress,
      fromState: transition.fromState,
      toState: transition.toState
    });
  }

  /**
   * Complete current transition
   */
  completeTransition() {
    const { fromState, toState, callback } = this.transition;
    
    // Update world state
    this.previousState = fromState;
    this.worldState = toState;
    
    // Execute callback if provided
    if (callback) {
      callback();
    }
    
    // Clear transition
    this.transition.active = false;
    
    eventBus.emit('world:transition-completed', { 
      fromState, 
      toState 
    });
    
    if (this.debugMode) {
      console.log(`🌍 Transition completed: ${fromState} → ${toState}`);
    }
  }

  /**
   * Find zone at position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object|null} Zone or null
   */
  findZoneAtPosition(x, y) {
    for (const zone of this.zones) {
      const { bounds } = zone;
      if (x >= bounds.minX && x <= bounds.maxX &&
          y >= bounds.minY && y <= bounds.maxY) {
        return zone;
      }
    }
    return null;
  }

  /**
   * Enter a zone
   * @param {Object} zone - Zone to enter
   * @param {Object} player - Player object
   */
  enterZone(zone, player) {
    // Apply zone properties
    this.applyZoneProperties(zone);
    
    // Trigger zone events
    this.triggerZoneEvents(zone, 'enter', player);
    
    eventBus.emit('zone:entered', { zone, player });
    
    if (this.debugMode) {
      console.log(`🌍 Entered zone: ${zone.name}`);
    }
  }

  /**
   * Exit a zone
   * @param {Object} zone - Zone to exit
   * @param {Object} player - Player object
   */
  exitZone(zone, player) {
    // Trigger zone events
    this.triggerZoneEvents(zone, 'exit', player);
    
    eventBus.emit('zone:exited', { zone, player });
    
    if (this.debugMode) {
      console.log(`🌍 Exited zone: ${zone.name}`);
    }
  }

  /**
   * Apply zone properties to environment
   * @param {Object} zone - Zone with properties
   */
  applyZoneProperties(zone) {
    const { properties } = zone;
    
    if (properties.lighting) {
      Object.assign(this.environment.lighting, properties.lighting);
    }
    
    if (properties.music) {
      eventBus.emit('audio:change-music', { track: properties.music });
    }
    
    if (properties.effects) {
      eventBus.emit('effects:enable', { effects: properties.effects });
    }
  }

  /**
   * Trigger zone events
   * @param {Object} zone - Zone
   * @param {string} eventType - Event type
   * @param {Object} player - Player object
   */
  triggerZoneEvents(zone, eventType, player) {
    if (!zone.triggers) return;
    
    for (const trigger of zone.triggers) {
      if (trigger.type === eventType) {
        eventBus.emit('zone:trigger', { 
          zone, 
          trigger, 
          player 
        });
      }
    }
  }

  /**
   * Change weather
   * @param {Object} weatherData - Weather configuration
   */
  changeWeather(weatherData) {
    const { type, intensity, duration } = weatherData;
    
    this.environment.weather.type = type;
    this.environment.weather.targetIntensity = intensity;
    
    eventBus.emit('environment:weather-changed', { 
      type, 
      intensity,
      duration 
    });
    
    if (this.debugMode) {
      console.log(`🌍 Weather changed to: ${type} (${intensity})`);
    }
  }

  /**
   * Change time of day
   * @param {string} timeOfDay - Time of day
   */
  changeTimeOfDay(timeOfDay) {
    this.environment.atmosphere.timeOfDay = timeOfDay;
    
    // Adjust lighting based on time
    switch (timeOfDay) {
      case 'dawn':
        this.environment.lighting.ambient = 0.5;
        this.environment.lighting.sun.intensity = 0.6;
        break;
      case 'day':
        this.environment.lighting.ambient = 0.7;
        this.environment.lighting.sun.intensity = 0.8;
        break;
      case 'dusk':
        this.environment.lighting.ambient = 0.4;
        this.environment.lighting.sun.intensity = 0.5;
        break;
      case 'night':
        this.environment.lighting.ambient = 0.2;
        this.environment.lighting.sun.intensity = 0.1;
        break;
    }
    
    eventBus.emit('environment:time-changed', { timeOfDay });
  }

  /**
   * Set time of day
   * @param {string} timeOfDay - Time of day to set
   */
  setTimeOfDay(timeOfDay) {
    this.changeTimeOfDay(timeOfDay);
  }

  /**
   * Pause world updates
   */
  pauseWorld() {
    this.isPaused = true;
    eventBus.emit('world:paused');
  }

  /**
   * Resume world updates
   */
  resumeWorld() {
    this.isPaused = false;
    eventBus.emit('world:resumed');
  }

  /**
   * Reset world to initial state
   */
  resetWorld() {
    this.worldTime = 0;
    this.worldSpeed = 1.0;
    this.worldState = 'road';
    this.previousState = null;
    this.stateHistory = [];
    this.currentZone = null;
    this.transition.active = false;
    
    // Reset environment
    this.setTimeOfDay('day');
    this.changeWeather({ type: 'clear', intensity: 0 });
    
    eventBus.emit('world:reset');
    
    if (this.debugMode) {
      console.log('🌍 World reset to initial state');
    }
  }

  /**
   * Add state change to history
   * @param {string} fromState - Previous state
   * @param {string} toState - New state
   */
  addToStateHistory(fromState, toState) {
    this.stateHistory.push({
      from: fromState,
      to: toState,
      timestamp: this.worldTime
    });
    
    // Limit history size
    if (this.stateHistory.length > this.config.maxStateHistory) {
      this.stateHistory.shift();
    }
  }

  /**
   * Start auto-save system
   */
  startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      this.saveWorld();
    }, this.config.autoSaveInterval);
  }

  /**
   * Handle auto-save
   */
  handleAutoSave() {
    const now = Date.now();
    if (now - this.saveData.lastSaveTime >= this.config.autoSaveInterval) {
      this.saveWorld();
    }
  }

  /**
   * Save world state
   */
  saveWorld() {
    try {
      const worldData = {
        worldState: this.worldState,
        worldTime: this.worldTime,
        environment: this.environment,
        currentZone: this.currentZone?.id,
        stateHistory: this.stateHistory.slice(-10), // Save last 10 states
        timestamp: Date.now()
      };
      
      localStorage.setItem('sparkit-world-state', JSON.stringify(worldData));
      this.saveData.lastSaveTime = Date.now();
      
      eventBus.emit('world:saved', { worldData });
      
      if (this.debugMode) {
        console.log('🌍 World state saved');
      }
    } catch (error) {
      console.warn('🌍 Failed to save world state:', error);
    }
  }

  /**
   * Load world state
   * @param {Object} data - Optional data to load
   */
  loadWorld(data = null) {
    try {
      const worldData = data || this.loadSavedData();
      if (!worldData) return;
      
      this.worldState = worldData.worldState || 'road';
      this.worldTime = worldData.worldTime || 0;
      this.environment = { ...this.environment, ...worldData.environment };
      this.stateHistory = worldData.stateHistory || [];
      
      // Restore current zone
      if (worldData.currentZone) {
        this.currentZone = this.zones.find(z => z.id === worldData.currentZone);
      }
      
      eventBus.emit('world:loaded', { worldData });
      
      if (this.debugMode) {
        console.log('🌍 World state loaded');
      }
    } catch (error) {
      console.warn('🌍 Failed to load world state:', error);
    }
  }

  /**
   * Load saved data from storage
   * @returns {Object|null} Saved data or null
   */
  loadSavedData() {
    try {
      const saved = localStorage.getItem('sparkit-world-state');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('🌍 Failed to load saved data:', error);
      return null;
    }
  }

  /**
   * Handle mode changed
   * @param {Object} data - Mode change data
   */
  onModeChanged(data) {
    const { newMode, oldMode } = data;
    
    // Start transition between modes
    this.startTransition(oldMode, newMode, {
      type: 'fade',
      duration: this.config.transitionDuration
    });
  }

  /**
   * Handle transition start
   * @param {Object} data - Transition data
   */
  onTransitionStart(data) {
    // Sync with mode manager transitions
  }

  /**
   * Handle transition complete
   * @param {Object} data - Transition data
   */
  onTransitionComplete(data) {
    // Finalize any world changes after transition
  }

  /**
   * Handle player updated
   * @param {Object} data - Player data
   */
  onPlayerUpdated(data) {
    // Player updates are handled in zone system
  }

  /**
   * Handle player zone changed
   * @param {Object} data - Zone change data
   */
  onPlayerZoneChanged(data) {
    // Zone changes are handled in update loop
  }

  /**
   * Handle branch entered
   * @param {Object} data - Branch data
   */
  onBranchEntered(data) {
    // Adjust world based on branch type
    const { branch } = data;
    
    if (branch.category === 'advanced') {
      this.changeWeather({ type: 'dramatic', intensity: 0.3 });
    }
  }

  /**
   * Handle branch completed
   * @param {Object} data - Branch completion data
   */
  onBranchCompleted(data) {
    // Celebrate completion with environmental effects
    eventBus.emit('effects:celebration', { 
      position: data.branch.position 
    });
  }

  /**
   * Sync world data to game state
   * @param {Object} gameState - Game state
   */
  syncToGameState(gameState) {
    if (!gameState.world) {
      gameState.world = {};
    }
    
    Object.assign(gameState.world, {
      state: this.worldState,
      previousState: this.previousState,
      time: this.worldTime,
      speed: this.worldSpeed,
      paused: this.isPaused,
      currentZone: this.currentZone?.id,
      environment: this.environment,
      transition: {
        active: this.transition.active,
        progress: this.transition.progress,
        type: this.transition.type
      },
      performance: this.performance,
      bounds: this.worldBounds
    });
  }

  /**
   * Get world manager state
   * @returns {Object} Current state
   */
  getState() {
    return {
      worldState: this.worldState,
      previousState: this.previousState,
      worldTime: this.worldTime,
      worldSpeed: this.worldSpeed,
      isPaused: this.isPaused,
      currentZone: this.currentZone?.id,
      zones: this.zones.length,
      transition: {
        active: this.transition.active,
        progress: this.transition.progress
      },
      environment: {
        weather: this.environment.weather.type,
        timeOfDay: this.environment.atmosphere.timeOfDay,
        lighting: this.environment.lighting.ambient
      },
      performance: { ...this.performance }
    };
  }

  /**
   * Enable/disable world manager
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('world-manager:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup world manager
   */
  destroy() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.zones = [];
    this.stateHistory = [];
    this.transition.active = false;
    
    eventBus.emit('world-manager:destroyed');
  }
}

export { WorldManager };
