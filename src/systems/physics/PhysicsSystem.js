/**
 * Physics System
 * Extracted from original game.js physics calculations
 * Maintains exact physics behavior and formulas
 */

import { clamp, lerp, distance2D } from '../../utils/math.js';
import { PHYSICS, WORLD } from '../../config/constants.js';
import { eventBus } from '../../core/EventBus.js';

export class PhysicsSystem {
  constructor() {
    this.name = 'PhysicsSystem';
    this.enabled = true;
    this.gravity = PHYSICS.GRAVITY;
    this.debugMode = false;
    
    // Physics state tracking
    this.collisions = [];
    this.forces = [];
  }

  /**
   * Update physics - matches original game.js physics exactly
   * @param {number} deltaTime - Frame delta time
   * @param {Object} state - Game state
   */
  update(deltaTime, state) {
    if (!this.enabled || state.paused) return;

    const dt = deltaTime;
    const p = state.player;

    // Input handling for physics
    const leftKey = state.keys['ArrowLeft'] || state.keys['KeyA'];
    const rightKey = state.keys['ArrowRight'] || state.keys['KeyD'];
    const upKey = state.keys['ArrowUp'] || state.keys['KeyW'];
    const downKey = state.keys['ArrowDown'] || state.keys['KeyS'];

    // Mode-specific physics
    if (state.mode === 'road') {
      this.updateRoadPhysics(dt, state, leftKey, rightKey, upKey, downKey);
    } else if (state.mode === 'timeline') {
      this.updateTimelinePhysics(dt, state, leftKey, rightKey, upKey, downKey);
    }

    // Update other physics entities
    this.updateGhostCar(dt, state);
    this.updateParticles(dt, state);
    this.updateWeatherPhysics(dt, state);
    
    // Emit physics update event
    eventBus.emit('physics:updated', { deltaTime: dt, player: p });
  }

  /**
   * Road mode physics - exact match to original
   * @param {number} dt - Delta time
   * @param {Object} state - Game state
   * @param {boolean} leftKey - Left key pressed
   * @param {boolean} rightKey - Right key pressed
   * @param {boolean} upKey - Up key pressed
   * @param {boolean} downKey - Down key pressed
   */
  updateRoadPhysics(dt, state, leftKey, rightKey, upKey, downKey) {
    const p = state.player;
    
    // Horizontal movement with throttle support
    const analog = (rightKey ? 1 : state.throttle.right) - (leftKey ? 1 : state.throttle.left);
    const dir = clamp(analog, -1, 1);
    
    p.ax = dir * p.accel;
    p.vx += p.ax * dt;
    
    // Apply friction when no input
    if (dir === 0) {
      const sign = Math.sign(p.vx);
      const mag = Math.max(0, Math.abs(p.vx) - p.friction * dt);
      p.vx = mag * sign;
    }
    
    // Speed limits with sponsor lane boost
    let maxV = p.maxSpeed;
    const lanes = state.sponsorLanes || [];
    const onSponsor = lanes.some(l => p.x >= l.from && p.x <= l.to);
    if (onSponsor) maxV *= 1.25; // 25% boost on sponsor lanes
    
    p.vx = clamp(p.vx, -maxV, maxV);
    
    // Update position
    p.x += p.vx * dt;
    
    // World boundary constraints
    p.x = clamp(p.x, 0, state.world.length);
    
    // Vertical position locked to road
    p.y = state.canvas?.height - 160 || WORLD.DEFAULT_LENGTH - 160;
  }

  /**
   * Timeline mode physics - exact match to original
   * @param {number} dt - Delta time
   * @param {Object} state - Game state
   * @param {boolean} leftKey - Left key pressed
   * @param {boolean} rightKey - Right key pressed
   * @param {boolean} upKey - Up key pressed
   * @param {boolean} downKey - Down key pressed
   */
  updateTimelinePhysics(dt, state, leftKey, rightKey, upKey, downKey) {
    const p = state.player;
    
    // Vertical movement in timeline
    const verticalInput = (downKey ? 1 : 0) - (upKey ? 1 : 0);
    
    p.ay = verticalInput * PHYSICS.TIMELINE_ACCEL;
    p.vy += p.ay * dt;
    
    // Apply friction when no input
    if (verticalInput === 0) {
      const sign = Math.sign(p.vy);
      const mag = Math.max(0, Math.abs(p.vy) - PHYSICS.TIMELINE_FRICTION * dt);
      p.vy = mag * sign;
    }
    
    // Speed limits for timeline
    p.vy = clamp(p.vy, -PHYSICS.TIMELINE_MAX_SPEED * 0.75, PHYSICS.TIMELINE_MAX_SPEED * 0.75);
    
    // Lock horizontal position to track center
    const W = state.canvas?.width || 1280;
    p.x = W / 2;
    
    // Update vertical position
    p.y += p.vy * dt;
    p.y = clamp(p.y, 140, state.timeline.length);
    
    // Auto-exit when pushing beyond the top
    if (p.y <= 142 && (upKey || p.vy < -20)) {
      eventBus.emit('timeline:exit-requested');
    }
    
    // Camera smoothing for timeline
    this.updateTimelineCamera(dt, state);
  }

  /**
   * Update timeline camera with inertial smoothing
   * @param {number} dt - Delta time
   * @param {Object} state - Game state
   */
  updateTimelineCamera(dt, state) {
    const p = state.player;
    const H = state.canvas?.height || 720;
    
    const targetCam = clamp(p.y - H * 0.45, 0, state.timeline.length - H * 0.5 + 200);
    
    if (!state.timeline.camY) {
      state.timeline.camY = targetCam;
    }
    
    const ease = state._timelineCamEase || 3.5;
    state.timeline.camY += (targetCam - state.timeline.camY) * Math.min(1, dt * ease);
    state.camera.y = state.timeline.camY;
  }

  /**
   * Update ghost car physics
   * @param {number} dt - Delta time
   * @param {Object} state - Game state
   */
  updateGhostCar(dt, state) {
    const ghost = state.ghost;
    if (!ghost || state.mode !== 'road') return;
    
    // Ghost car movement logic from original
    if (ghost.pauseT > 0) {
      ghost.pauseT -= dt;
      return;
    }
    
    ghost.x += ghost.vx * dt;
    
    // Check if ghost reached a stop
    if (ghost.stops && ghost.stops.length > 0) {
      const currentStop = ghost.stops[ghost.stopIndex];
      if (currentStop && Math.abs(ghost.x - currentStop.x) < 20) {
        ghost.pauseT = currentStop.duration || 2.0;
        ghost.stopIndex = (ghost.stopIndex + 1) % ghost.stops.length;
      }
    }
    
    // Wrap around world
    if (ghost.x > state.world.length) {
      ghost.x = -100;
    }
  }

  /**
   * Update particle physics
   * @param {number} dt - Delta time
   * @param {Object} state - Game state
   */
  updateParticles(dt, state) {
    // Update trail particles
    if (state.player.trailParticles) {
      this.updateTrailParticles(dt, state.player.trailParticles);
    }
    
    // Update timeline particles
    if (state.timeline.particles) {
      this.updateTimelineParticles(dt, state.timeline.particles);
    }
    
    // Update firework particles
    if (state.fireworks) {
      this.updateFireworkParticles(dt, state.fireworks);
    }
    
    // Update weather particles
    if (state.weather.rainParticles) {
      this.updateRainParticles(dt, state.weather.rainParticles);
    }
  }

  /**
   * Update trail particles physics
   * @param {number} dt - Delta time
   * @param {Array} particles - Particle array
   */
  updateTrailParticles(dt, particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += this.gravity * dt * 0.1; // Light gravity
      
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  /**
   * Update timeline particles physics
   * @param {number} dt - Delta time
   * @param {Array} particles - Particle array
   */
  updateTimelineParticles(dt, particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      particle.life -= dt;
      particle.y += particle.speed * dt;
      particle.alpha = particle.life / particle.maxLife;
      
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  /**
   * Update firework particles physics
   * @param {number} dt - Delta time
   * @param {Array} fireworks - Firework array
   */
  updateFireworkParticles(dt, fireworks) {
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const firework = fireworks[i];
      
      firework.life -= dt;
      firework.x += firework.vx * dt;
      firework.y += firework.vy * dt;
      firework.vy += this.gravity * dt * 0.3; // Gravity effect
      
      if (firework.life <= 0) {
        fireworks.splice(i, 1);
      }
    }
  }

  /**
   * Update rain particles physics
   * @param {number} dt - Delta time
   * @param {Array} rainParticles - Rain particle array
   */
  updateRainParticles(dt, rainParticles) {
    for (const particle of rainParticles) {
      particle.y += particle.speed * dt;
      particle.x += particle.wind * dt;
      
      // Reset particle when it goes off screen
      if (particle.y > (state.canvas?.height || 720) + 10) {
        particle.y = -10;
        particle.x = Math.random() * (state.canvas?.width || 1280);
      }
    }
  }

  /**
   * Update weather physics effects
   * @param {number} dt - Delta time
   * @param {Object} state - Game state
   */
  updateWeatherPhysics(dt, state) {
    const weather = state.weather;
    if (!weather) return;
    
    // Weather intensity transitions
    const now = performance.now();
    if (now > weather.nextChange) {
      const newType = weather.type === 'clear' ? 'raining' : 'clear';
      this.changeWeather(state, newType);
      weather.nextChange = now + 15000 + Math.random() * 10000;
    }
    
    // Smooth intensity transitions
    const targetIntensity = weather.type === 'raining' ? 1 : 0;
    const intensityDiff = targetIntensity - weather.intensity;
    weather.intensity += intensityDiff * weather.transitionSpeed * dt;
    weather.intensity = clamp(weather.intensity, 0, 1);
  }

  /**
   * Change weather type
   * @param {Object} state - Game state
   * @param {string} newType - New weather type
   */
  changeWeather(state, newType) {
    state.weather.type = newType;
    eventBus.emit('weather:changed', { type: newType, state });
  }

  /**
   * Add force to an entity
   * @param {Object} entity - Entity to apply force to
   * @param {number} fx - Force X
   * @param {number} fy - Force Y
   * @param {number} duration - Force duration
   */
  addForce(entity, fx, fy, duration = 0.1) {
    this.forces.push({
      entity,
      fx,
      fy,
      duration,
      timeLeft: duration
    });
  }

  /**
   * Check collision between two rectangular entities
   * @param {Object} a - Entity A
   * @param {Object} b - Entity B
   * @returns {boolean} True if colliding
   */
  checkCollision(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  /**
   * Enable/disable physics system
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('physics:enabled-changed', { enabled });
  }

  /**
   * Set gravity value
   * @param {number} gravity - Gravity value
   */
  setGravity(gravity) {
    this.gravity = gravity;
    eventBus.emit('physics:gravity-changed', { gravity });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Get physics statistics
   * @returns {Object} Physics stats
   */
  getStats() {
    return {
      gravity: this.gravity,
      enabled: this.enabled,
      forceCount: this.forces.length,
      collisionCount: this.collisions.length
    };
  }
}

// Export singleton instance
export const physicsSystem = new PhysicsSystem();
