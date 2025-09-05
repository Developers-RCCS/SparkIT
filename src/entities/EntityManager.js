/**
 * Entity Manager System
 * Manages all game entities (Player, Ghost, NPCs)
 * Handles entity lifecycle, updates, and interactions
 */

import { eventBus } from '../core/EventBus.js';
import { player } from './Player.js';
import { ghost } from './Ghost.js';

export class EntityManager {
  constructor() {
    this.name = 'EntityManager';
    this.enabled = true;
    this.debugMode = false;
    
    // Entity registry
    this.entities = new Map();
    this.entityTypes = new Map();
    this.updateOrder = [];
    
    // Performance tracking
    this.updateStats = {
      totalEntities: 0,
      activeEntities: 0,
      updateTime: 0,
      averageUpdateTime: 0
    };
    
    // Entity groups for efficient querying
    this.groups = {
      player: new Set(),
      ghost: new Set(),
      npc: new Set(),
      interactive: new Set(),
      collidable: new Set()
    };
    
    this.init();
  }

  /**
   * Initialize entity manager
   */
  init() {
    this.setupEventListeners();
    this.registerCoreEntities();
    
    if (this.debugMode) {
      console.log('🎯 Entity Manager initialized');
    }
    
    eventBus.emit('entity-manager:initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Game lifecycle events
    eventBus.on('game:start', () => this.onGameStart());
    eventBus.on('game:reset', () => this.resetAllEntities());
    eventBus.on('game:pause', () => this.pauseAllEntities());
    eventBus.on('game:resume', () => this.resumeAllEntities());
    
    // Mode change events
    eventBus.on('mode:changed', (data) => this.onModeChanged(data));
    
    // Entity events
    eventBus.on('entity:created', (data) => this.onEntityCreated(data));
    eventBus.on('entity:destroyed', (data) => this.onEntityDestroyed(data));
  }

  /**
   * Register core entities (Player, Ghost)
   */
  registerCoreEntities() {
    // Register player
    this.registerEntity('player', player);
    this.addToGroup('player', player);
    this.addToGroup('collidable', player);
    this.addToGroup('interactive', player);
    
    // Register ghost
    this.registerEntity('ghost', ghost);
    this.addToGroup('ghost', ghost);
    this.addToGroup('collidable', ghost);
    
    if (this.debugMode) {
      console.log('🎯 Core entities registered: Player, Ghost');
    }
  }

  /**
   * Register an entity
   * @param {string} id - Unique entity ID
   * @param {Object} entity - Entity instance
   * @param {string} type - Entity type
   */
  registerEntity(id, entity, type = 'unknown') {
    if (this.entities.has(id)) {
      console.warn(`🎯 Entity ${id} already registered, replacing`);
    }
    
    this.entities.set(id, entity);
    this.entityTypes.set(id, type);
    this.updateOrder.push(id);
    
    // Add entity reference for debugging
    entity._entityId = id;
    entity._entityType = type;
    
    this.updateStats.totalEntities = this.entities.size;
    
    eventBus.emit('entity:registered', { id, entity, type });
    
    if (this.debugMode) {
      console.log(`🎯 Entity registered: ${id} (${type})`);
    }
  }

  /**
   * Unregister an entity
   * @param {string} id - Entity ID to unregister
   */
  unregisterEntity(id) {
    const entity = this.entities.get(id);
    if (!entity) {
      console.warn(`🎯 Entity ${id} not found for unregistration`);
      return;
    }
    
    // Remove from all groups
    Object.values(this.groups).forEach(group => {
      group.delete(entity);
    });
    
    // Remove from maps
    this.entities.delete(id);
    this.entityTypes.delete(id);
    this.updateOrder = this.updateOrder.filter(entityId => entityId !== id);
    
    // Cleanup entity
    if (typeof entity.destroy === 'function') {
      entity.destroy();
    }
    
    this.updateStats.totalEntities = this.entities.size;
    
    eventBus.emit('entity:unregistered', { id, entity });
    
    if (this.debugMode) {
      console.log(`🎯 Entity unregistered: ${id}`);
    }
  }

  /**
   * Add entity to a group
   * @param {string} groupName - Group name
   * @param {Object} entity - Entity to add
   */
  addToGroup(groupName, entity) {
    if (!this.groups[groupName]) {
      this.groups[groupName] = new Set();
    }
    
    this.groups[groupName].add(entity);
    
    if (this.debugMode) {
      console.log(`🎯 Entity ${entity._entityId || 'unknown'} added to group: ${groupName}`);
    }
  }

  /**
   * Remove entity from a group
   * @param {string} groupName - Group name
   * @param {Object} entity - Entity to remove
   */
  removeFromGroup(groupName, entity) {
    if (this.groups[groupName]) {
      this.groups[groupName].delete(entity);
    }
  }

  /**
   * Get entities in a group
   * @param {string} groupName - Group name
   * @returns {Set} Set of entities
   */
  getGroup(groupName) {
    return this.groups[groupName] || new Set();
  }

  /**
   * Update all entities - called every frame
   * @param {number} deltaTime - Frame delta time
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (!this.enabled) return;
    
    const startTime = performance.now();
    let activeCount = 0;
    
    // Update entities in order
    for (const entityId of this.updateOrder) {
      const entity = this.entities.get(entityId);
      
      if (entity && entity.enabled && typeof entity.update === 'function') {
        try {
          entity.update(deltaTime, gameState);
          activeCount++;
        } catch (error) {
          console.error(`🎯 Error updating entity ${entityId}:`, error);
        }
      }
    }
    
    // Update performance stats
    const endTime = performance.now();
    this.updateStats.updateTime = endTime - startTime;
    this.updateStats.activeEntities = activeCount;
    
    // Calculate rolling average
    const alpha = 0.1;
    this.updateStats.averageUpdateTime = 
      this.updateStats.averageUpdateTime * (1 - alpha) + 
      this.updateStats.updateTime * alpha;
    
    eventBus.emit('entity-manager:updated', { 
      deltaTime, 
      stats: this.updateStats 
    });
  }

  /**
   * Get entity by ID
   * @param {string} id - Entity ID
   * @returns {Object|null} Entity or null if not found
   */
  getEntity(id) {
    return this.entities.get(id) || null;
  }

  /**
   * Get all entities of a specific type
   * @param {string} type - Entity type
   * @returns {Array} Array of entities
   */
  getEntitiesByType(type) {
    const result = [];
    
    for (const [id, entityType] of this.entityTypes) {
      if (entityType === type) {
        const entity = this.entities.get(id);
        if (entity) {
          result.push(entity);
        }
      }
    }
    
    return result;
  }

  /**
   * Get all entities
   * @returns {Map} Map of all entities
   */
  getAllEntities() {
    return new Map(this.entities);
  }

  /**
   * Check if entity exists
   * @param {string} id - Entity ID
   * @returns {boolean} True if entity exists
   */
  hasEntity(id) {
    return this.entities.has(id);
  }

  /**
   * Find entities near a position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} radius - Search radius
   * @param {string} groupName - Optional group to search in
   * @returns {Array} Array of nearby entities
   */
  findEntitiesNear(x, y, radius, groupName = null) {
    const entities = groupName ? this.getGroup(groupName) : this.entities.values();
    const nearby = [];
    const radiusSquared = radius * radius;
    
    for (const entity of entities) {
      if (entity.x !== undefined && entity.y !== undefined) {
        const dx = entity.x - x;
        const dy = entity.y - y;
        const distanceSquared = dx * dx + dy * dy;
        
        if (distanceSquared <= radiusSquared) {
          nearby.push({
            entity,
            distance: Math.sqrt(distanceSquared)
          });
        }
      }
    }
    
    // Sort by distance
    nearby.sort((a, b) => a.distance - b.distance);
    
    return nearby.map(item => item.entity);
  }

  /**
   * Find entities within bounds
   * @param {Object} bounds - Bounds object {x, y, width, height}
   * @param {string} groupName - Optional group to search in
   * @returns {Array} Array of entities within bounds
   */
  findEntitiesInBounds(bounds, groupName = null) {
    const entities = groupName ? this.getGroup(groupName) : this.entities.values();
    const within = [];
    
    for (const entity of entities) {
      if (entity.x !== undefined && entity.y !== undefined) {
        const entityBounds = entity.getBounds ? entity.getBounds() : {
          x: entity.x - (entity.width || 0) / 2,
          y: entity.y - (entity.height || 0) / 2,
          width: entity.width || 0,
          height: entity.height || 0
        };
        
        // Check AABB collision
        if (entityBounds.x < bounds.x + bounds.width &&
            entityBounds.x + entityBounds.width > bounds.x &&
            entityBounds.y < bounds.y + bounds.height &&
            entityBounds.y + entityBounds.height > bounds.y) {
          within.push(entity);
        }
      }
    }
    
    return within;
  }

  /**
   * Handle game start
   */
  onGameStart() {
    // Initialize all entities
    for (const entity of this.entities.values()) {
      if (typeof entity.reset === 'function') {
        entity.reset();
      }
    }
    
    if (this.debugMode) {
      console.log('🎯 All entities reset for game start');
    }
  }

  /**
   * Reset all entities
   */
  resetAllEntities() {
    for (const entity of this.entities.values()) {
      if (typeof entity.reset === 'function') {
        entity.reset();
      }
    }
    
    eventBus.emit('entity-manager:all-reset');
    
    if (this.debugMode) {
      console.log('🎯 All entities reset');
    }
  }

  /**
   * Pause all entities
   */
  pauseAllEntities() {
    for (const entity of this.entities.values()) {
      if (entity.enabled !== undefined) {
        entity._wasPaused = entity.enabled;
        entity.enabled = false;
      }
    }
    
    eventBus.emit('entity-manager:all-paused');
  }

  /**
   * Resume all entities
   */
  resumeAllEntities() {
    for (const entity of this.entities.values()) {
      if (entity._wasPaused !== undefined) {
        entity.enabled = entity._wasPaused;
        delete entity._wasPaused;
      }
    }
    
    eventBus.emit('entity-manager:all-resumed');
  }

  /**
   * Handle mode change
   * @param {Object} data - Mode change data
   */
  onModeChanged(data) {
    // Notify all entities of mode change
    for (const entity of this.entities.values()) {
      if (typeof entity.onModeChanged === 'function') {
        entity.onModeChanged(data);
      }
    }
    
    if (this.debugMode) {
      console.log(`🎯 Mode change propagated to all entities: ${data.mode}`);
    }
  }

  /**
   * Handle entity created event
   * @param {Object} data - Entity creation data
   */
  onEntityCreated(data) {
    // Auto-register if not already registered
    if (data.entity && data.id && !this.hasEntity(data.id)) {
      this.registerEntity(data.id, data.entity, data.type);
    }
  }

  /**
   * Handle entity destroyed event
   * @param {Object} data - Entity destruction data
   */
  onEntityDestroyed(data) {
    // Auto-unregister if registered
    if (data.id && this.hasEntity(data.id)) {
      this.unregisterEntity(data.id);
    }
  }

  /**
   * Get entity manager statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.updateStats,
      totalEntities: this.entities.size,
      entityTypes: Object.fromEntries(this.entityTypes),
      groupSizes: Object.fromEntries(
        Object.entries(this.groups).map(([name, group]) => [name, group.size])
      )
    };
  }

  /**
   * Enable/disable entity manager
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('entity-manager:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    
    // Propagate to all entities
    for (const entity of this.entities.values()) {
      if (typeof entity.setDebugMode === 'function') {
        entity.setDebugMode(enabled);
      }
    }
  }

  /**
   * Cleanup entity manager
   */
  destroy() {
    // Destroy all entities
    for (const [id, entity] of this.entities) {
      if (typeof entity.destroy === 'function') {
        entity.destroy();
      }
    }
    
    // Clear all data structures
    this.entities.clear();
    this.entityTypes.clear();
    this.updateOrder = [];
    
    Object.values(this.groups).forEach(group => group.clear());
    
    eventBus.emit('entity-manager:destroyed');
  }
}

// Export singleton instance
export const entityManager = new EntityManager();
