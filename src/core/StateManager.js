/**
 * Global State Manager
 * Manages the global game state object extracted from original game.js
 * Maintains exact structure and behavior of original state object
 */

import { eventBus } from './EventBus.js';
import { WORLD, PHYSICS, EFFECTS } from '../config/constants.js';

/**
 * Create initial state matching original game.js state object exactly
 */
function createInitialState() {
  const canvas = document.getElementById('game');
  const W = canvas?.width || 1280;
  const H = canvas?.height || 720;

  return {
    // Player physics (px units in CSS pixels; velocities are px/s)
    player: {
      x: 120, 
      y: H - 160, 
      w: 80, 
      h: 36,
      vx: 0, 
      ax: 0,
      vy: 0, 
      ay: 0,
      accel: PHYSICS.PLAYER_ACCEL,
      friction: PHYSICS.PLAYER_FRICTION,
      maxSpeed: PHYSICS.PLAYER_MAX_SPEED,
      trailParticles: []
    },

    camera: { x: 0, y: 0 },
    mode: 'road', // 'road' | 'timeline'
    
    timeline: {
      active: false,
      length: 2000,
      milestones: [
        { y: 160, key: 'registration', title: 'Registration', text: 'Complete your Spark Flash registration.' },
        { y: 560, key: 'workshop1', title: 'Game Dev', text: 'Workshop 1 — Game Development: design, engines & rapid prototyping.' },
        { y: 960, key: 'workshop2', title: 'CTF', text: 'Workshop 2 — Capture The Flag: hacking challenges & cybersecurity basics.' },
        { y: 1360, key: 'workshop3', title: 'Programming', text: 'Workshop 3 — Programming: algorithms, team projects & mentoring.' },
        { y: 1760, key: 'competitions', title: 'Competitions', text: 'Pitch, demo & compete for recognition.' }
      ],
      crystals: [],
      particles: [],
      orbs: [],
      ambient: [],
      hack: { active: false, progress: 0, target: '', timer: 0, completed: false },
      confetti: [],
      camY: 0,
      visited: new Set(),
      roadReturnY: null
    },

    // Input state
    keys: {},
    paused: false,
    near: null,
    
    // Throttle system for mobile
    throttle: { left: 0, right: 0 },

    // World properties
    world: { length: WORLD.DEFAULT_LENGTH },
    
    // Hidden data layer for spotlight reveal
    hiddenData: [
      { x: 300, y: H - 200, type: 'glyph', text: '0x53' },
      { x: 650, y: H - 120, type: 'dataStream', width: 200 },
      { x: 1150, y: H - 180, type: 'circuit', targetBranch: 'phase2' },
      { x: 1550, y: H - 125, type: 'dataStream', width: 300 },
      { x: 2000, y: H - 190, type: 'glyph', text: 'init()' }
    ],

    // Game progress
    submissions: [],
    phase1Complete: false,
    lastBranchLabel: '',

    // Timing
    lastT: performance.now(),
    dt: 0,

    // Environment
    dayNight: { isNight: false, hour: 12 },
    theme: 'neon',
    settings: { forceDark: true },

    // Obstacles and interactions
    obstacles: { potholes: [], speedBumps: [] },

    // Phase gate
    gate: { x: WORLD.GATE_X, triggered: false },

    // Visual effects
    fireworks: [],
    skids: [],

    // Ghost car
    ghost: {
      x: 140,
      vx: WORLD.GHOST_BASE_SPEED,
      alpha: 0.25,
      pauseT: 0,
      stops: [],
      stopIndex: 0
    },

    // Billboards
    billboards: [],

    // Weather system
    weather: {
      type: 'clear',
      intensity: 0,
      transitionSpeed: 0.3,
      rainParticles: [],
      nextChange: performance.now() + 15000,
      puddles: []
    },

    // Robot spotlight system
    spotlight: {
      active: false,
      x: 0,
      y: 0,
      radius: EFFECTS.SPOTLIGHT_RADIUS,
      dustMotes: []
    },

    // World transformation drilling sequence
    worldTransition: {
      active: false,
      phase: 'none',
      progress: 0,
      startTime: 0,
      cameraShake: 0,
      roadCrackParticles: [],
      drillSparks: [],
      thrusterFlames: [],
      soundEffects: { drilling: false, transformation: false }
    },

    // Photo mode
    photo: { pending: false }
  };
}

/**
 * State Manager class
 */
export class StateManager {
  constructor() {
    this.state = createInitialState();
    this.previousState = null;
    this.listeners = new Map();
    this.middleware = [];
    this.history = [];
    this.maxHistorySize = 100;
    this.debugMode = false;
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return this.state;
  }

  /**
   * Get state property by path
   * @param {string} path - Property path (e.g., 'player.x')
   * @returns {*} Property value
   */
  get(path) {
    const keys = path.split('.');
    let value = this.state;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    
    return value;
  }

  /**
   * Set state property by path
   * @param {string} path - Property path
   * @param {*} value - New value
   * @param {boolean} silent - Skip notifications
   */
  set(path, value, silent = false) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.state;
    
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    const oldValue = target[lastKey];
    target[lastKey] = value;
    
    if (!silent) {
      this.notifyChange(path, value, oldValue);
    }
  }

  /**
   * Update state with partial object
   * @param {Object} updates - State updates
   * @param {boolean} silent - Skip notifications
   */
  update(updates, silent = false) {
    this.previousState = JSON.parse(JSON.stringify(this.state));
    
    // Apply middleware
    let processedUpdates = updates;
    for (const middleware of this.middleware) {
      try {
        processedUpdates = middleware(processedUpdates, this.state) || processedUpdates;
      } catch (error) {
        console.error('State middleware error:', error);
      }
    }
    
    // Apply updates
    Object.assign(this.state, processedUpdates);
    
    // Record history
    this.recordHistory();
    
    if (!silent) {
      this.notifyChange('*', this.state, this.previousState);
      eventBus.emit('state:updated', { 
        updates: processedUpdates, 
        state: this.state,
        previousState: this.previousState 
      });
    }
  }

  /**
   * Reset state to initial values
   */
  reset() {
    const oldState = this.state;
    this.state = createInitialState();
    this.previousState = oldState;
    this.history = [];
    
    this.notifyChange('*', this.state, oldState);
    eventBus.emit('state:reset', { state: this.state, previousState: oldState });
  }

  /**
   * Subscribe to state changes
   * @param {string} path - Property path or '*' for all changes
   * @param {Function} callback - Change callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    
    this.listeners.get(path).add(callback);
    
    return () => {
      const callbacks = this.listeners.get(path);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(path);
        }
      }
    };
  }

  /**
   * Add middleware for state updates
   * @param {Function} middleware - Middleware function
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Remove middleware
   * @param {Function} middleware - Middleware function
   */
  removeMiddleware(middleware) {
    const index = this.middleware.indexOf(middleware);
    if (index !== -1) {
      this.middleware.splice(index, 1);
    }
  }

  /**
   * Notify listeners of state changes
   * @param {string} path - Changed path
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   */
  notifyChange(path, newValue, oldValue) {
    const callbacks = this.listeners.get(path);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          console.error('State listener error:', error);
        }
      });
    }
    
    // Notify wildcard listeners
    if (path !== '*') {
      const wildcardCallbacks = this.listeners.get('*');
      if (wildcardCallbacks) {
        wildcardCallbacks.forEach(callback => {
          try {
            callback(this.state, this.previousState, path);
          } catch (error) {
            console.error('State wildcard listener error:', error);
          }
        });
      }
    }
  }

  /**
   * Record state in history
   */
  recordHistory() {
    if (this.previousState) {
      this.history.push({
        timestamp: performance.now(),
        state: this.previousState
      });
      
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }
    }
  }

  /**
   * Get state history
   * @returns {Array} State history
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Validate state integrity
   * @returns {boolean} True if state is valid
   */
  validate() {
    try {
      const requiredProps = ['player', 'camera', 'mode', 'timeline', 'keys'];
      for (const prop of requiredProps) {
        if (!this.state[prop]) {
          console.error(`Missing required state property: ${prop}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('State validation error:', error);
      return false;
    }
  }
}

// Export singleton instance to match original global state
export const stateManager = new StateManager();

// Expose state globally for compatibility with original game.js
window.state = stateManager.getState();
window.stateManager = stateManager;
