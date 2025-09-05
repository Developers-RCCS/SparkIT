/**
 * Event Bus System
 * Central communication hub for all game systems
 * Extracted from original game.js event handling patterns
 */

export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.oneTimeListeners = new Map();
    this.maxListeners = 100;
    this.debugMode = false;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @param {Object} options - Options (once, priority)
   * @returns {Function} Unsubscribe function
   */
  on(event, callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    const { once = false, priority = 0 } = options;
    const targetMap = once ? this.oneTimeListeners : this.listeners;

    if (!targetMap.has(event)) {
      targetMap.set(event, []);
    }

    const eventListeners = targetMap.get(event);
    
    // Check listener limit
    if (eventListeners.length >= this.maxListeners) {
      console.warn(`Event "${event}" has reached maximum listeners (${this.maxListeners})`);
    }

    const listener = { callback, priority, id: Math.random().toString(36) };
    eventListeners.push(listener);
    
    // Sort by priority (higher priority first)
    eventListeners.sort((a, b) => b.priority - a.priority);

    if (this.debugMode) {
      console.log(`📡 Added listener for "${event}" (priority: ${priority})`);
    }

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Add one-time event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @param {number} priority - Priority level
   * @returns {Function} Unsubscribe function
   */
  once(event, callback, priority = 0) {
    return this.on(event, callback, { once: true, priority });
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    const maps = [this.listeners, this.oneTimeListeners];
    
    for (const map of maps) {
      if (map.has(event)) {
        const eventListeners = map.get(event);
        const index = eventListeners.findIndex(listener => listener.callback === callback);
        
        if (index !== -1) {
          eventListeners.splice(index, 1);
          
          if (eventListeners.length === 0) {
            map.delete(event);
          }
          
          if (this.debugMode) {
            console.log(`📡 Removed listener for "${event}"`);
          }
          break;
        }
      }
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @returns {boolean} True if event had listeners
   */
  emit(event, data) {
    if (this.debugMode) {
      console.log(`📡 Emitting "${event}"`, data);
    }

    let hasListeners = false;

    // Execute regular listeners
    if (this.listeners.has(event)) {
      const eventListeners = [...this.listeners.get(event)];
      hasListeners = true;

      for (const listener of eventListeners) {
        try {
          listener.callback(data, event);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      }
    }

    // Execute one-time listeners
    if (this.oneTimeListeners.has(event)) {
      const eventListeners = [...this.oneTimeListeners.get(event)];
      this.oneTimeListeners.delete(event);
      hasListeners = true;

      for (const listener of eventListeners) {
        try {
          listener.callback(data, event);
        } catch (error) {
          console.error(`Error in one-time event listener for "${event}":`, error);
        }
      }
    }

    return hasListeners;
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
      this.oneTimeListeners.delete(event);
      
      if (this.debugMode) {
        console.log(`📡 Removed all listeners for "${event}"`);
      }
    } else {
      // Remove all listeners for all events
      this.listeners.clear();
      this.oneTimeListeners.clear();
      
      if (this.debugMode) {
        console.log('📡 Removed all event listeners');
      }
    }
  }

  /**
   * Get listener count for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    const regular = this.listeners.get(event)?.length || 0;
    const oneTime = this.oneTimeListeners.get(event)?.length || 0;
    return regular + oneTime;
  }

  /**
   * Get all event names that have listeners
   * @returns {string[]} Array of event names
   */
  eventNames() {
    const names = new Set([
      ...this.listeners.keys(),
      ...this.oneTimeListeners.keys()
    ]);
    return Array.from(names);
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug mode enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    console.log(`📡 Event bus debug mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Set maximum listeners per event
   * @param {number} max - Maximum listeners
   */
  setMaxListeners(max) {
    this.maxListeners = max;
  }

  /**
   * Create a namespaced event emitter
   * @param {string} namespace - Namespace prefix
   * @returns {Object} Namespaced emitter
   */
  namespace(namespace) {
    return {
      on: (event, callback, options) => this.on(`${namespace}:${event}`, callback, options),
      once: (event, callback, priority) => this.once(`${namespace}:${event}`, callback, priority),
      off: (event, callback) => this.off(`${namespace}:${event}`, callback),
      emit: (event, data) => this.emit(`${namespace}:${event}`, data),
      removeAllListeners: (event) => this.removeAllListeners(event ? `${namespace}:${event}` : undefined)
    };
  }
}

// Export singleton instance
export const eventBus = new EventBus();
