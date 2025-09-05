/**
 * Collision Detection System
 * Extracted from original game.js collision logic
 * Maintains exact collision behavior and detection
 */

import { eventBus } from '../../core/EventBus.js';
import * as mathUtils from '../../utils/math.js';
import { COLLISION_CONFIG, PLAYER_CONFIG } from '../../config/constants.js';

export class CollisionSystem {
  constructor() {
    this.name = 'CollisionSystem';
    this.enabled = true;
    this.debugMode = false;
    
    // Collision state
    this.activeCollisions = new Set();
    this.collisionHistory = [];
    this.spatialGrid = new Map();
    
    // Performance optimization
    this.lastUpdateTime = 0;
    this.updateInterval = 16; // ~60fps
    
    this.init();
  }

  /**
   * Initialize collision system
   */
  init() {
    this.setupEventListeners();
    
    if (this.debugMode) {
      console.log('💥 Collision System initialized');
    }
    
    eventBus.emit('collision:initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    eventBus.on('physics:updated', (data) => {
      this.update(data.deltaTime, data.state);
    });
    
    eventBus.on('game:reset', () => {
      this.reset();
    });
  }

  /**
   * Main collision update - matches original game.js collision logic
   * @param {number} deltaTime - Frame delta time
   * @param {Object} state - Game state
   */
  update(deltaTime, state) {
    if (!this.enabled) return;
    
    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = now;
    
    // Check player-to-object collisions
    this.checkPlayerCollisions(state);
    
    // Check object-to-object collisions
    this.checkObjectCollisions(state);
    
    // Update near object detection
    this.updateNearObjectDetection(state);
    
    // Clean up old collision history
    this.cleanupCollisionHistory();
    
    eventBus.emit('collision:updated', { 
      deltaTime, 
      activeCollisions: this.activeCollisions.size 
    });
  }

  /**
   * Check player collisions with environment - matches original exactly
   * @param {Object} state - Game state
   */
  checkPlayerCollisions(state) {
    const { player, branches, billboards } = state;
    
    // Player bounds
    const playerBounds = this.getPlayerBounds(player);
    
    // Check collisions with branches (road signs)
    branches.forEach(branch => {
      const branchBounds = this.getBranchBounds(branch);
      
      if (this.isColliding(playerBounds, branchBounds)) {
        this.handlePlayerBranchCollision(player, branch, state);
      }
    });
    
    // Check collisions with billboards
    if (billboards) {
      billboards.forEach(billboard => {
        const billboardBounds = this.getBillboardBounds(billboard);
        
        if (this.isColliding(playerBounds, billboardBounds)) {
          this.handlePlayerBillboardCollision(player, billboard, state);
        }
      });
    }
    
    // Check world boundaries
    this.checkWorldBoundaries(player, state);
  }

  /**
   * Check object-to-object collisions
   * @param {Object} state - Game state
   */
  checkObjectCollisions(state) {
    // Check ghost collision with player (if ghost is active)
    if (state.ghost && state.ghost.active) {
      const playerBounds = this.getPlayerBounds(state.player);
      const ghostBounds = this.getGhostBounds(state.ghost);
      
      if (this.isColliding(playerBounds, ghostBounds)) {
        this.handlePlayerGhostCollision(state.player, state.ghost, state);
      }
    }
  }

  /**
   * Update near object detection - matches original game.js exactly
   * @param {Object} state - Game state
   */
  updateNearObjectDetection(state) {
    const { player, branches } = state;
    let nearestBranch = null;
    let nearestDistance = Infinity;
    
    branches.forEach(branch => {
      const distance = Math.abs(player.x - branch.x);
      
      // Near detection threshold - matches original
      if (distance < COLLISION_CONFIG.nearThreshold) {
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestBranch = branch;
        }
      }
    });
    
    // Update state.near
    const previousNear = state.near;
    state.near = nearestBranch;
    
    // Emit events if near object changed
    if (previousNear !== nearestBranch) {
      if (previousNear) {
        eventBus.emit('collision:near-exit', { object: previousNear });
      }
      
      if (nearestBranch) {
        eventBus.emit('collision:near-enter', { object: nearestBranch });
      }
    }
  }

  /**
   * Get player collision bounds
   * @param {Object} player - Player object
   * @returns {Object} Bounds object
   */
  getPlayerBounds(player) {
    return {
      x: player.x - player.width / 2,
      y: player.y - player.height / 2,
      width: player.width,
      height: player.height,
      centerX: player.x,
      centerY: player.y
    };
  }

  /**
   * Get branch (road sign) collision bounds
   * @param {Object} branch - Branch object
   * @returns {Object} Bounds object
   */
  getBranchBounds(branch) {
    const width = COLLISION_CONFIG.branchWidth || 80;
    const height = COLLISION_CONFIG.branchHeight || 60;
    
    return {
      x: branch.x - width / 2,
      y: branch.y - height / 2,
      width: width,
      height: height,
      centerX: branch.x,
      centerY: branch.y
    };
  }

  /**
   * Get billboard collision bounds
   * @param {Object} billboard - Billboard object
   * @returns {Object} Bounds object
   */
  getBillboardBounds(billboard) {
    const width = COLLISION_CONFIG.billboardWidth || 150;
    const height = COLLISION_CONFIG.billboardHeight || 100;
    
    return {
      x: billboard.x - width / 2,
      y: billboard.y - height / 2,
      width: width,
      height: height,
      centerX: billboard.x,
      centerY: billboard.y
    };
  }

  /**
   * Get ghost collision bounds
   * @param {Object} ghost - Ghost object
   * @returns {Object} Bounds object
   */
  getGhostBounds(ghost) {
    return {
      x: ghost.x - ghost.width / 2,
      y: ghost.y - ghost.height / 2,
      width: ghost.width,
      height: ghost.height,
      centerX: ghost.x,
      centerY: ghost.y
    };
  }

  /**
   * Check if two bounds are colliding - AABB collision detection
   * @param {Object} bounds1 - First bounds
   * @param {Object} bounds2 - Second bounds
   * @returns {boolean} True if colliding
   */
  isColliding(bounds1, bounds2) {
    return bounds1.x < bounds2.x + bounds2.width &&
           bounds1.x + bounds1.width > bounds2.x &&
           bounds1.y < bounds2.y + bounds2.height &&
           bounds1.y + bounds1.height > bounds2.y;
  }

  /**
   * Circle collision detection (alternative method)
   * @param {Object} obj1 - First object with x, y, radius
   * @param {Object} obj2 - Second object with x, y, radius
   * @returns {boolean} True if colliding
   */
  isCircleColliding(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.radius + obj2.radius);
  }

  /**
   * Handle player-branch collision
   * @param {Object} player - Player object
   * @param {Object} branch - Branch object
   * @param {Object} state - Game state
   */
  handlePlayerBranchCollision(player, branch, state) {
    const collisionId = `player-branch-${branch.id || branch.x}`;
    
    if (this.activeCollisions.has(collisionId)) return;
    
    this.activeCollisions.add(collisionId);
    
    // Log collision
    this.addCollisionHistory({
      type: 'player-branch',
      player: { x: player.x, y: player.y },
      branch: { x: branch.x, y: branch.y, label: branch.label },
      timestamp: performance.now()
    });
    
    // Emit collision event
    eventBus.emit('collision:player-branch', { 
      player, 
      branch, 
      collisionId 
    });
    
    if (this.debugMode) {
      console.log(`💥 Player-Branch collision: ${branch.label}`);
    }
  }

  /**
   * Handle player-billboard collision
   * @param {Object} player - Player object
   * @param {Object} billboard - Billboard object
   * @param {Object} state - Game state
   */
  handlePlayerBillboardCollision(player, billboard, state) {
    const collisionId = `player-billboard-${billboard.id || billboard.x}`;
    
    if (this.activeCollisions.has(collisionId)) return;
    
    this.activeCollisions.add(collisionId);
    
    // Billboard collision might stop player movement
    if (billboard.solid !== false) {
      // Push player back slightly
      const pushDirection = player.x > billboard.x ? 1 : -1;
      player.x += pushDirection * 5;
    }
    
    eventBus.emit('collision:player-billboard', { 
      player, 
      billboard, 
      collisionId 
    });
    
    if (this.debugMode) {
      console.log(`💥 Player-Billboard collision: ${billboard.text}`);
    }
  }

  /**
   * Handle player-ghost collision
   * @param {Object} player - Player object
   * @param {Object} ghost - Ghost object
   * @param {Object} state - Game state
   */
  handlePlayerGhostCollision(player, ghost, state) {
    const collisionId = 'player-ghost';
    
    if (this.activeCollisions.has(collisionId)) return;
    
    this.activeCollisions.add(collisionId);
    
    // Ghost collision effect (matches original)
    eventBus.emit('collision:player-ghost', { 
      player, 
      ghost, 
      collisionId 
    });
    
    // Visual effect or game mechanic here
    eventBus.emit('effect:ghost-touch', { x: player.x, y: player.y });
    
    if (this.debugMode) {
      console.log('💥 Player-Ghost collision');
    }
  }

  /**
   * Check world boundaries - prevent player from going off-screen
   * @param {Object} player - Player object
   * @param {Object} state - Game state
   */
  checkWorldBoundaries(player, state) {
    const bounds = this.getWorldBounds(state);
    let bounded = false;
    
    // Left boundary
    if (player.x < bounds.left) {
      player.x = bounds.left;
      player.vx = Math.max(0, player.vx); // Stop leftward velocity
      bounded = true;
    }
    
    // Right boundary
    if (player.x > bounds.right) {
      player.x = bounds.right;
      player.vx = Math.min(0, player.vx); // Stop rightward velocity
      bounded = true;
    }
    
    // Top boundary (timeline mode)
    if (state.mode === 'timeline' && player.y < bounds.top) {
      player.y = bounds.top;
      player.vy = Math.max(0, player.vy);
      bounded = true;
    }
    
    // Bottom boundary (timeline mode)
    if (state.mode === 'timeline' && player.y > bounds.bottom) {
      player.y = bounds.bottom;
      player.vy = Math.min(0, player.vy);
      bounded = true;
    }
    
    if (bounded) {
      eventBus.emit('collision:world-boundary', { 
        player, 
        bounds 
      });
    }
  }

  /**
   * Get world collision boundaries
   * @param {Object} state - Game state
   * @returns {Object} World bounds
   */
  getWorldBounds(state) {
    if (state.mode === 'timeline') {
      return {
        left: 0,
        right: window.innerWidth,
        top: 0,
        bottom: window.innerHeight
      };
    } else {
      // Road mode - infinite horizontal scrolling
      return {
        left: -Infinity,
        right: Infinity,
        top: -Infinity,
        bottom: Infinity
      };
    }
  }

  /**
   * Add collision to history
   * @param {Object} collision - Collision data
   */
  addCollisionHistory(collision) {
    this.collisionHistory.push(collision);
    
    // Keep only recent collisions
    if (this.collisionHistory.length > 100) {
      this.collisionHistory.shift();
    }
  }

  /**
   * Clean up old collisions
   */
  cleanupCollisionHistory() {
    const now = performance.now();
    const maxAge = 5000; // 5 seconds
    
    this.collisionHistory = this.collisionHistory.filter(
      collision => now - collision.timestamp < maxAge
    );
    
    // Clean up active collisions (they should be removed elsewhere)
    // This is a safety net
    if (this.activeCollisions.size > 50) {
      console.warn('Too many active collisions, clearing some');
      const toRemove = Array.from(this.activeCollisions).slice(0, 25);
      toRemove.forEach(id => this.activeCollisions.delete(id));
    }
  }

  /**
   * Remove active collision
   * @param {string} collisionId - Collision ID to remove
   */
  removeActiveCollision(collisionId) {
    this.activeCollisions.delete(collisionId);
  }

  /**
   * Clear all active collisions
   */
  clearActiveCollisions() {
    this.activeCollisions.clear();
  }

  /**
   * Reset collision system
   */
  reset() {
    this.clearActiveCollisions();
    this.collisionHistory = [];
    this.spatialGrid.clear();
    
    eventBus.emit('collision:reset');
  }

  /**
   * Get collision statistics
   * @returns {Object} Collision stats
   */
  getCollisionStats() {
    return {
      activeCollisions: this.activeCollisions.size,
      historyCount: this.collisionHistory.length,
      lastUpdate: this.lastUpdateTime
    };
  }

  /**
   * Check if specific collision is active
   * @param {string} collisionId - Collision ID
   * @returns {boolean} True if active
   */
  isCollisionActive(collisionId) {
    return this.activeCollisions.has(collisionId);
  }

  /**
   * Get recent collisions
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Array} Recent collisions
   */
  getRecentCollisions(maxAge = 1000) {
    const now = performance.now();
    return this.collisionHistory.filter(
      collision => now - collision.timestamp < maxAge
    );
  }

  /**
   * Enable/disable collision system
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('collision:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup collision system
   */
  destroy() {
    this.reset();
    eventBus.emit('collision:destroyed');
  }
}

// Export singleton instance
export const collisionSystem = new CollisionSystem();
