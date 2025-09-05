/**
 * Effects Manager System
 * Manages visual effects, particle systems, and animation effects
 * Handles celebrations, transitions, and environmental effects
 */

import { eventBus } from '../core/EventBus.js';
import { distance, lerp, clamp } from '../utils/math.js';
import { EFFECTS_CONFIG } from '../config/constants.js';

export class EffectsManager {
  constructor() {
    this.name = 'EffectsManager';
    this.enabled = true;
    this.debugMode = false;
    
    // Effect pools
    this.particlePools = new Map();
    this.activeEffects = [];
    this.effectsQueue = [];
    
    // Particle systems
    this.particleSystems = new Map();
    this.maxParticles = 1000;
    this.particleUpdateBatch = 50; // Update particles in batches
    
    // Effect types
    this.effectTypes = {
      sparkle: { color: '#FFD700', life: 2000, speed: 100 },
      smoke: { color: '#CCCCCC', life: 3000, speed: 50 },
      fire: { color: '#FF4500', life: 1500, speed: 80 },
      celebration: { color: '#FF69B4', life: 2500, speed: 150 },
      magic: { color: '#9370DB', life: 2000, speed: 120 },
      energy: { color: '#00FFFF', life: 1800, speed: 200 },
      explosion: { color: '#FFA500', life: 1000, speed: 300 },
      healing: { color: '#32CD32', life: 2200, speed: 60 }
    };
    
    // Animation effects
    this.animations = [];
    this.tweens = [];
    
    // Environmental effects
    this.environment = {
      wind: { x: 0.1, y: 0.05 },
      gravity: { x: 0, y: 9.81 },
      airResistance: 0.98,
      turbulence: 0.1
    };
    
    // Performance settings
    this.performance = {
      quality: 'high', // 'low', 'medium', 'high'
      maxEffects: 50,
      updateFrequency: 60,
      lastUpdateTime: 0,
      frameSkip: 0
    };
    
    // Rendering settings
    this.rendering = {
      useWebGL: true,
      blendMode: 'normal',
      alpha: true,
      antialias: true
    };
    
    this.init();
  }

  /**
   * Initialize effects manager
   */
  init() {
    this.loadEffectsConfig();
    this.setupEventListeners();
    this.initializeParticlePools();
    this.setupBuiltInEffects();
    
    if (this.debugMode) {
      console.log('✨ Effects Manager initialized');
    }
    
    eventBus.emit('effects-manager:initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Achievement events
    eventBus.on('achievement:earned', (data) => this.onAchievementEarned(data));
    eventBus.on('milestone:completed', (data) => this.onMilestoneCompleted(data));
    
    // Branch events
    eventBus.on('branch:selected', (data) => this.onBranchSelected(data));
    eventBus.on('branch:entered', (data) => this.onBranchEntered(data));
    eventBus.on('branch:completed', (data) => this.onBranchCompleted(data));
    
    // Player events
    eventBus.on('player:updated', (data) => this.onPlayerUpdated(data));
    eventBus.on('player:collision', (data) => this.onPlayerCollision(data));
    
    // Mode events
    eventBus.on('mode:changed', (data) => this.onModeChanged(data));
    
    // Timeline events
    eventBus.on('timeline:drill-down', (data) => this.onTimelineDrillDown(data));
    eventBus.on('timeline:drill-up', () => this.onTimelineDrillUp());
    
    // World events
    eventBus.on('zone:entered', (data) => this.onZoneEntered(data));
    eventBus.on('world:transition-started', (data) => this.onTransitionStarted(data));
    
    // Effect requests
    eventBus.on('effects:create', (data) => this.createEffect(data));
    eventBus.on('effects:celebration', (data) => this.createCelebrationEffect(data));
    eventBus.on('effects:impact', (data) => this.createImpactEffect(data));
    eventBus.on('effects:trail', (data) => this.createTrailEffect(data));
    eventBus.on('effects:ambient', (data) => this.createAmbientEffect(data));
    
    // Performance events
    eventBus.on('effects:set-quality', (data) => this.setQuality(data.quality));
    eventBus.on('effects:clear-all', () => this.clearAllEffects());
  }

  /**
   * Load effects configuration
   */
  loadEffectsConfig() {
    this.config = {
      maxParticles: EFFECTS_CONFIG.maxParticles || 1000,
      maxEffects: EFFECTS_CONFIG.maxEffects || 50,
      quality: EFFECTS_CONFIG.quality || 'high',
      enableParticles: EFFECTS_CONFIG.enableParticles !== false,
      enableBloom: EFFECTS_CONFIG.enableBloom !== false,
      enableTrails: EFFECTS_CONFIG.enableTrails !== false,
      particleUpdateBatch: EFFECTS_CONFIG.particleUpdateBatch || 50
    };
    
    // Apply config
    this.maxParticles = this.config.maxParticles;
    this.performance.maxEffects = this.config.maxEffects;
    this.performance.quality = this.config.quality;
    this.particleUpdateBatch = this.config.particleUpdateBatch;
  }

  /**
   * Initialize particle pools for performance
   */
  initializeParticlePools() {
    for (const [type, config] of Object.entries(this.effectTypes)) {
      this.particlePools.set(type, {
        particles: [],
        available: [],
        maxSize: Math.floor(this.maxParticles / Object.keys(this.effectTypes).length)
      });
      
      // Pre-allocate particles
      const pool = this.particlePools.get(type);
      for (let i = 0; i < pool.maxSize; i++) {
        const particle = this.createParticle(type, config);
        particle.active = false;
        pool.particles.push(particle);
        pool.available.push(particle);
      }
    }
  }

  /**
   * Create a particle object
   * @param {string} type - Particle type
   * @param {Object} config - Particle configuration
   * @returns {Object} Particle object
   */
  createParticle(type, config) {
    return {
      type,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: config.life,
      maxLife: config.life,
      size: 1,
      color: config.color,
      alpha: 1,
      rotation: 0,
      rotationSpeed: 0,
      active: false,
      userData: {}
    };
  }

  /**
   * Setup built-in effect patterns
   */
  setupBuiltInEffects() {
    // Register common effect patterns
    this.effectPatterns = {
      burst: {
        particleCount: 20,
        spread: 360,
        speed: { min: 50, max: 150 },
        life: { min: 1000, max: 2000 }
      },
      
      fountain: {
        particleCount: 15,
        spread: 60,
        speed: { min: 100, max: 200 },
        life: { min: 1500, max: 2500 }
      },
      
      spiral: {
        particleCount: 30,
        speed: { min: 80, max: 120 },
        life: { min: 2000, max: 3000 },
        rotational: true
      },
      
      rain: {
        particleCount: 50,
        spread: 20,
        speed: { min: 200, max: 300 },
        life: { min: 2000, max: 4000 },
        direction: 270 // Downward
      }
    };
  }

  /**
   * Update effects manager - called every frame
   * @param {number} deltaTime - Frame delta time
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (!this.enabled) return;
    
    const now = performance.now();
    
    // Performance throttling
    if (now - this.performance.lastUpdateTime < 1000 / this.performance.updateFrequency) {
      return;
    }
    
    this.performance.lastUpdateTime = now;
    
    // Update particle systems
    this.updateParticleSystems(deltaTime, gameState);
    
    // Update animations
    this.updateAnimations(deltaTime);
    
    // Update tweens
    this.updateTweens(deltaTime);
    
    // Process effects queue
    this.processEffectsQueue();
    
    // Clean up expired effects
    this.cleanupEffects();
    
    // Sync to game state
    this.syncToGameState(gameState);
    
    eventBus.emit('effects-manager:updated', { deltaTime });
  }

  /**
   * Update particle systems
   * @param {number} deltaTime - Delta time
   * @param {Object} gameState - Game state
   */
  updateParticleSystems(deltaTime, gameState) {
    if (!this.config.enableParticles) return;
    
    let particlesUpdated = 0;
    const maxUpdatesPerFrame = this.particleUpdateBatch;
    
    for (const [type, pool] of this.particlePools) {
      for (const particle of pool.particles) {
        if (!particle.active) continue;
        
        if (particlesUpdated >= maxUpdatesPerFrame) {
          break; // Spread updates across frames
        }
        
        this.updateParticle(particle, deltaTime);
        particlesUpdated++;
        
        // Check if particle should be deactivated
        if (particle.life <= 0) {
          this.deactivateParticle(particle, type);
        }
      }
      
      if (particlesUpdated >= maxUpdatesPerFrame) break;
    }
  }

  /**
   * Update individual particle
   * @param {Object} particle - Particle to update
   * @param {number} deltaTime - Delta time
   */
  updateParticle(particle, deltaTime) {
    const dt = deltaTime / 1000; // Convert to seconds
    
    // Update physics
    particle.vx += this.environment.gravity.x * dt;
    particle.vy += this.environment.gravity.y * dt;
    
    // Apply wind
    particle.vx += this.environment.wind.x * dt * 100;
    particle.vy += this.environment.wind.y * dt * 100;
    
    // Apply air resistance
    particle.vx *= this.environment.airResistance;
    particle.vy *= this.environment.airResistance;
    
    // Add turbulence
    if (this.environment.turbulence > 0) {
      particle.vx += (Math.random() - 0.5) * this.environment.turbulence * dt * 100;
      particle.vy += (Math.random() - 0.5) * this.environment.turbulence * dt * 100;
    }
    
    // Update position
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    
    // Update rotation
    particle.rotation += particle.rotationSpeed * dt;
    
    // Update life
    particle.life -= deltaTime;
    
    // Update alpha based on life
    particle.alpha = particle.life / particle.maxLife;
    
    // Update size based on life (optional effect)
    if (particle.type === 'sparkle' || particle.type === 'celebration') {
      const lifeRatio = particle.life / particle.maxLife;
      particle.size = 1 + (1 - lifeRatio) * 0.5; // Grow slightly as it dies
    }
  }

  /**
   * Deactivate particle and return to pool
   * @param {Object} particle - Particle to deactivate
   * @param {string} type - Particle type
   */
  deactivateParticle(particle, type) {
    particle.active = false;
    const pool = this.particlePools.get(type);
    if (pool) {
      pool.available.push(particle);
    }
  }

  /**
   * Update animations
   * @param {number} deltaTime - Delta time
   */
  updateAnimations(deltaTime) {
    this.animations = this.animations.filter(animation => {
      animation.elapsed += deltaTime;
      animation.progress = Math.min(1, animation.elapsed / animation.duration);
      
      // Apply animation
      this.applyAnimation(animation);
      
      // Check if complete
      if (animation.progress >= 1) {
        if (animation.onComplete) {
          animation.onComplete();
        }
        return false; // Remove from array
      }
      
      return true; // Keep in array
    });
  }

  /**
   * Apply animation to target
   * @param {Object} animation - Animation data
   */
  applyAnimation(animation) {
    const { target, properties, easing, progress } = animation;
    
    if (!target) return;
    
    const easedProgress = this.applyEasing(progress, easing);
    
    for (const [property, values] of Object.entries(properties)) {
      if (target[property] !== undefined) {
        target[property] = lerp(values.from, values.to, easedProgress);
      }
    }
  }

  /**
   * Update tweens
   * @param {number} deltaTime - Delta time
   */
  updateTweens(deltaTime) {
    this.tweens = this.tweens.filter(tween => {
      tween.elapsed += deltaTime;
      tween.progress = Math.min(1, tween.elapsed / tween.duration);
      
      // Apply tween
      const easedProgress = this.applyEasing(tween.progress, tween.easing);
      tween.update(easedProgress);
      
      // Check if complete
      if (tween.progress >= 1) {
        if (tween.onComplete) {
          tween.onComplete();
        }
        return false; // Remove from array
      }
      
      return true; // Keep in array
    });
  }

  /**
   * Process effects queue
   */
  processEffectsQueue() {
    while (this.effectsQueue.length > 0 && this.activeEffects.length < this.performance.maxEffects) {
      const effect = this.effectsQueue.shift();
      this.executeEffect(effect);
    }
  }

  /**
   * Clean up expired effects
   */
  cleanupEffects() {
    this.activeEffects = this.activeEffects.filter(effect => {
      if (effect.expired || effect.duration <= 0) {
        if (effect.cleanup) {
          effect.cleanup();
        }
        return false;
      }
      
      effect.duration -= 16.67; // Approximate frame time
      return true;
    });
  }

  /**
   * Create effect
   * @param {Object} effectData - Effect configuration
   */
  createEffect(effectData) {
    const {
      type,
      position,
      pattern = 'burst',
      intensity = 1,
      duration = 2000,
      particleType = 'sparkle'
    } = effectData;
    
    if (this.activeEffects.length >= this.performance.maxEffects) {
      this.effectsQueue.push(effectData);
      return;
    }
    
    const effect = {
      type,
      position: { ...position },
      pattern,
      intensity,
      duration,
      originalDuration: duration,
      particleType,
      particles: []
    };
    
    this.executeEffect(effect);
  }

  /**
   * Execute effect
   * @param {Object} effect - Effect to execute
   */
  executeEffect(effect) {
    const patternConfig = this.effectPatterns[effect.pattern];
    if (!patternConfig) return;
    
    const particleCount = Math.floor(patternConfig.particleCount * effect.intensity);
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.getParticleFromPool(effect.particleType);
      if (!particle) continue;
      
      this.initializeEffectParticle(particle, effect, patternConfig, i);
      effect.particles.push(particle);
    }
    
    this.activeEffects.push(effect);
    
    eventBus.emit('effects:created', { effect });
  }

  /**
   * Get particle from pool
   * @param {string} type - Particle type
   * @returns {Object|null} Particle or null if none available
   */
  getParticleFromPool(type) {
    const pool = this.particlePools.get(type);
    if (!pool || pool.available.length === 0) return null;
    
    const particle = pool.available.pop();
    particle.active = true;
    
    // Reset particle properties
    const config = this.effectTypes[type];
    particle.life = config.life;
    particle.maxLife = config.life;
    particle.alpha = 1;
    particle.size = 1;
    particle.rotation = 0;
    
    return particle;
  }

  /**
   * Initialize particle for effect
   * @param {Object} particle - Particle to initialize
   * @param {Object} effect - Effect configuration
   * @param {Object} patternConfig - Pattern configuration
   * @param {number} index - Particle index
   */
  initializeEffectParticle(particle, effect, patternConfig, index) {
    // Set position
    particle.x = effect.position.x;
    particle.y = effect.position.y;
    
    // Set velocity based on pattern
    if (patternConfig.direction !== undefined) {
      // Directional pattern
      const angle = patternConfig.direction + (Math.random() - 0.5) * patternConfig.spread;
      const speed = lerp(patternConfig.speed.min, patternConfig.speed.max, Math.random());
      
      particle.vx = Math.cos(angle * Math.PI / 180) * speed;
      particle.vy = Math.sin(angle * Math.PI / 180) * speed;
    } else if (patternConfig.rotational) {
      // Spiral pattern
      const angle = (index / patternConfig.particleCount) * 360;
      const speed = lerp(patternConfig.speed.min, patternConfig.speed.max, Math.random());
      
      particle.vx = Math.cos(angle * Math.PI / 180) * speed;
      particle.vy = Math.sin(angle * Math.PI / 180) * speed;
      particle.rotationSpeed = (Math.random() - 0.5) * 360; // Random rotation
    } else {
      // Burst pattern
      const angle = (Math.random() * patternConfig.spread) - (patternConfig.spread / 2);
      const speed = lerp(patternConfig.speed.min, patternConfig.speed.max, Math.random());
      
      particle.vx = Math.cos(angle * Math.PI / 180) * speed;
      particle.vy = Math.sin(angle * Math.PI / 180) * speed;
    }
    
    // Set life with variation
    const lifeVariation = lerp(patternConfig.life.min, patternConfig.life.max, Math.random());
    particle.life = lifeVariation;
    particle.maxLife = lifeVariation;
    
    // Apply intensity scaling
    particle.size *= effect.intensity;
    const speedMultiplier = 0.5 + effect.intensity * 0.5;
    particle.vx *= speedMultiplier;
    particle.vy *= speedMultiplier;
  }

  /**
   * Create celebration effect
   * @param {Object} data - Celebration data
   */
  createCelebrationEffect(data) {
    const { position, intensity = 1 } = data;
    
    // Multiple bursts for celebration
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.createEffect({
          type: 'celebration',
          position: {
            x: position.x + (Math.random() - 0.5) * 50,
            y: position.y + (Math.random() - 0.5) * 30
          },
          pattern: 'burst',
          intensity: intensity + Math.random() * 0.5,
          particleType: 'celebration'
        });
      }, i * 200);
    }
    
    // Add sparkles
    this.createEffect({
      type: 'sparkles',
      position,
      pattern: 'fountain',
      intensity: intensity * 0.8,
      particleType: 'sparkle',
      duration: 3000
    });
  }

  /**
   * Create impact effect
   * @param {Object} data - Impact data
   */
  createImpactEffect(data) {
    const { position, intensity = 1, type = 'normal' } = data;
    
    let particleType = 'smoke';
    let pattern = 'burst';
    
    switch (type) {
      case 'magic':
        particleType = 'magic';
        pattern = 'spiral';
        break;
      case 'energy':
        particleType = 'energy';
        pattern = 'burst';
        break;
      case 'explosion':
        particleType = 'explosion';
        pattern = 'burst';
        break;
    }
    
    this.createEffect({
      type: 'impact',
      position,
      pattern,
      intensity,
      particleType,
      duration: 1000
    });
  }

  /**
   * Create trail effect
   * @param {Object} data - Trail data
   */
  createTrailEffect(data) {
    if (!this.config.enableTrails) return;
    
    const { start, end, type = 'energy', segments = 10 } = data;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const position = {
        x: lerp(start.x, end.x, t),
        y: lerp(start.y, end.y, t)
      };
      
      setTimeout(() => {
        this.createEffect({
          type: 'trail',
          position,
          pattern: 'burst',
          intensity: 0.3,
          particleType: type,
          duration: 1500
        });
      }, i * 50);
    }
  }

  /**
   * Create ambient effect
   * @param {Object} data - Ambient data
   */
  createAmbientEffect(data) {
    const { zone, type = 'sparkle' } = data;
    
    // Create continuous ambient particles
    const ambientEffect = {
      type: 'ambient',
      zone,
      particleType: type,
      spawnRate: 2, // Particles per second
      lastSpawn: 0,
      duration: Infinity // Continuous
    };
    
    this.activeEffects.push(ambientEffect);
  }

  /**
   * Create animation
   * @param {Object} animationData - Animation configuration
   * @returns {Object} Animation object
   */
  createAnimation(animationData) {
    const {
      target,
      properties,
      duration = 1000,
      easing = 'easeInOut',
      onComplete
    } = animationData;
    
    const animation = {
      target,
      properties: {},
      duration,
      elapsed: 0,
      progress: 0,
      easing,
      onComplete
    };
    
    // Store initial values
    for (const [property, toValue] of Object.entries(properties)) {
      animation.properties[property] = {
        from: target[property],
        to: toValue
      };
    }
    
    this.animations.push(animation);
    return animation;
  }

  /**
   * Create tween
   * @param {Object} tweenData - Tween configuration
   * @returns {Object} Tween object
   */
  createTween(tweenData) {
    const {
      duration = 1000,
      easing = 'easeInOut',
      update,
      onComplete
    } = tweenData;
    
    const tween = {
      duration,
      elapsed: 0,
      progress: 0,
      easing,
      update,
      onComplete
    };
    
    this.tweens.push(tween);
    return tween;
  }

  /**
   * Apply easing function
   * @param {number} t - Time (0-1)
   * @param {string} easing - Easing type
   * @returns {number} Eased value
   */
  applyEasing(t, easing) {
    switch (easing) {
      case 'linear':
        return t;
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return 1 - (1 - t) * (1 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'bounce':
        return this.bounceEasing(t);
      default:
        return t;
    }
  }

  /**
   * Bounce easing function
   * @param {number} t - Time (0-1)
   * @returns {number} Bounced value
   */
  bounceEasing(t) {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  /**
   * Set effects quality
   * @param {string} quality - Quality level ('low', 'medium', 'high')
   */
  setQuality(quality) {
    this.performance.quality = quality;
    
    switch (quality) {
      case 'low':
        this.maxParticles = 200;
        this.performance.maxEffects = 15;
        this.particleUpdateBatch = 20;
        break;
      case 'medium':
        this.maxParticles = 500;
        this.performance.maxEffects = 30;
        this.particleUpdateBatch = 35;
        break;
      case 'high':
        this.maxParticles = 1000;
        this.performance.maxEffects = 50;
        this.particleUpdateBatch = 50;
        break;
    }
    
    eventBus.emit('effects:quality-changed', { quality });
  }

  /**
   * Clear all effects
   */
  clearAllEffects() {
    // Deactivate all particles
    for (const [type, pool] of this.particlePools) {
      for (const particle of pool.particles) {
        if (particle.active) {
          this.deactivateParticle(particle, type);
        }
      }
    }
    
    // Clear effect arrays
    this.activeEffects = [];
    this.effectsQueue = [];
    this.animations = [];
    this.tweens = [];
    
    eventBus.emit('effects:cleared');
  }

  /**
   * Handle achievement earned
   * @param {Object} data - Achievement data
   */
  onAchievementEarned(data) {
    // Create celebration effect at achievement location
    this.createCelebrationEffect({
      position: { x: 400, y: 300 }, // Center screen
      intensity: 1.5
    });
  }

  /**
   * Handle milestone completed
   * @param {Object} data - Milestone data
   */
  onMilestoneCompleted(data) {
    // More dramatic celebration
    this.createCelebrationEffect({
      position: { x: 400, y: 300 },
      intensity: 2.0
    });
    
    // Add extra sparkles
    setTimeout(() => {
      this.createEffect({
        type: 'milestone',
        position: { x: 400, y: 300 },
        pattern: 'spiral',
        intensity: 1.5,
        particleType: 'magic',
        duration: 4000
      });
    }, 500);
  }

  /**
   * Handle branch selected
   * @param {Object} data - Branch data
   */
  onBranchSelected(data) {
    const { branch } = data;
    
    // Subtle sparkle effect
    this.createEffect({
      type: 'selection',
      position: branch.position,
      pattern: 'burst',
      intensity: 0.5,
      particleType: 'sparkle',
      duration: 1000
    });
  }

  /**
   * Handle branch entered
   * @param {Object} data - Branch data
   */
  onBranchEntered(data) {
    const { branch } = data;
    
    // Entry effect
    this.createImpactEffect({
      position: branch.position,
      intensity: 1.2,
      type: 'energy'
    });
  }

  /**
   * Handle branch completed
   * @param {Object} data - Branch completion data
   */
  onBranchCompleted(data) {
    const { branch } = data;
    
    // Completion celebration
    this.createCelebrationEffect({
      position: branch.position,
      intensity: 1.5
    });
    
    // Success trail
    this.createTrailEffect({
      start: branch.position,
      end: { x: branch.position.x, y: branch.position.y - 100 },
      type: 'healing'
    });
  }

  /**
   * Handle player updated
   * @param {Object} data - Player data
   */
  onPlayerUpdated(data) {
    // Could add movement trail effects here
    if (this.config.enableTrails && data.player) {
      const speed = Math.sqrt(data.player.vx * data.player.vx + data.player.vy * data.player.vy);
      
      if (speed > 200) { // High speed trail
        if (Math.random() < 0.1) { // 10% chance per frame
          this.createEffect({
            type: 'speed-trail',
            position: { x: data.player.x, y: data.player.y },
            pattern: 'burst',
            intensity: 0.3,
            particleType: 'energy',
            duration: 800
          });
        }
      }
    }
  }

  /**
   * Handle player collision
   * @param {Object} data - Collision data
   */
  onPlayerCollision(data) {
    this.createImpactEffect({
      position: data.position,
      intensity: 0.8,
      type: 'normal'
    });
  }

  /**
   * Handle mode changed
   * @param {Object} data - Mode change data
   */
  onModeChanged(data) {
    // Clear mode-specific effects
    this.clearAllEffects();
    
    // Set appropriate effects for new mode
    const { newMode } = data;
    
    if (newMode === 'timeline') {
      // Add ambient timeline effects
      this.createAmbientEffect({
        zone: 'timeline',
        type: 'magic'
      });
    }
  }

  /**
   * Handle timeline drill down
   * @param {Object} data - Drill down data
   */
  onTimelineDrillDown(data) {
    const { node } = data;
    
    this.createEffect({
      type: 'drill-down',
      position: { x: node.x, y: node.y },
      pattern: 'spiral',
      intensity: 1.0,
      particleType: 'magic',
      duration: 1500
    });
  }

  /**
   * Handle timeline drill up
   */
  onTimelineDrillUp() {
    this.createEffect({
      type: 'drill-up',
      position: { x: 400, y: 300 },
      pattern: 'burst',
      intensity: 0.8,
      particleType: 'energy',
      duration: 1000
    });
  }

  /**
   * Handle zone entered
   * @param {Object} data - Zone data
   */
  onZoneEntered(data) {
    const { zone } = data;
    
    // Zone-specific ambient effects
    if (zone.properties && zone.properties.effects) {
      for (const effectType of zone.properties.effects) {
        this.createAmbientEffect({
          zone: zone.id,
          type: effectType
        });
      }
    }
  }

  /**
   * Handle transition started
   * @param {Object} data - Transition data
   */
  onTransitionStarted(data) {
    // Transition effects
    this.createEffect({
      type: 'transition',
      position: { x: 400, y: 300 },
      pattern: 'burst',
      intensity: 1.0,
      particleType: 'energy',
      duration: data.duration || 1000
    });
  }

  /**
   * Sync effects data to game state
   * @param {Object} gameState - Game state
   */
  syncToGameState(gameState) {
    if (!gameState.effects) {
      gameState.effects = {};
    }
    
    // Count active particles
    let activeParticleCount = 0;
    for (const [type, pool] of this.particlePools) {
      activeParticleCount += pool.particles.filter(p => p.active).length;
    }
    
    Object.assign(gameState.effects, {
      activeEffects: this.activeEffects.length,
      queuedEffects: this.effectsQueue.length,
      activeParticles: activeParticleCount,
      maxParticles: this.maxParticles,
      quality: this.performance.quality,
      animations: this.animations.length,
      tweens: this.tweens.length
    });
  }

  /**
   * Get effects manager state
   * @returns {Object} Current state
   */
  getState() {
    let activeParticleCount = 0;
    for (const [type, pool] of this.particlePools) {
      activeParticleCount += pool.particles.filter(p => p.active).length;
    }
    
    return {
      enabled: this.enabled,
      quality: this.performance.quality,
      activeEffects: this.activeEffects.length,
      queuedEffects: this.effectsQueue.length,
      activeParticles: activeParticleCount,
      maxParticles: this.maxParticles,
      animations: this.animations.length,
      tweens: this.tweens.length,
      particleTypes: Object.keys(this.effectTypes).length
    };
  }

  /**
   * Enable/disable effects manager
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (!enabled) {
      this.clearAllEffects();
    }
    
    eventBus.emit('effects-manager:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup effects manager
   */
  destroy() {
    this.clearAllEffects();
    this.particlePools.clear();
    this.particleSystems.clear();
    
    eventBus.emit('effects-manager:destroyed');
  }
}

export { EffectsManager };
