/**
 * Game settings and configuration
 * Extracted from original game.js to maintain exact functionality
 */

import { COLORS, PERFORMANCE, MOBILE } from './constants.js';

/**
 * Default game settings
 */
export const DEFAULT_SETTINGS = {
  // Graphics settings
  graphics: {
    quality: 'auto', // 'low', 'medium', 'high', 'auto'
    dpr: 'auto', // number or 'auto'
    shadows: true,
    particles: true,
    reflections: true,
    lightning: true
  },

  // Audio settings
  audio: {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.6,
    muted: false
  },

  // Input settings
  input: {
    keyboardEnabled: true,
    mouseEnabled: true,
    touchEnabled: true,
    gamepadEnabled: true
  },

  // Accessibility settings
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: true
  },

  // Mobile settings
  mobile: {
    haptics: true,
    orientation: 'auto', // 'landscape', 'portrait', 'auto'
    controls: 'auto' // 'touch', 'gamepad', 'auto'
  },

  // Theme settings
  theme: {
    mode: 'neon', // 'neon', 'sunset'
    forceDark: true,
    customColors: null
  },

  // Performance settings
  performance: {
    targetFPS: 60,
    adaptiveDPR: true,
    memoryOptimization: true,
    backgroundThrottling: true
  }
};

/**
 * Settings manager class
 */
export class SettingsManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners = new Map();
    this.storageKey = 'sparkit_settings';
    this.loadSettings();
    this.detectSystemPreferences();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = this.mergeSettings(DEFAULT_SETTINGS, parsed);
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      this.emit('settingsSaved', this.settings);
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  /**
   * Merge settings objects deeply
   * @param {Object} defaults - Default settings
   * @param {Object} overrides - Override settings
   * @returns {Object} Merged settings
   */
  mergeSettings(defaults, overrides) {
    const result = { ...defaults };
    
    for (const [key, value] of Object.entries(overrides)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.mergeSettings(defaults[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Detect system preferences
   */
  detectSystemPreferences() {
    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.settings.accessibility.reducedMotion = true;
    }

    // Detect high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.settings.accessibility.highContrast = true;
    }

    // Detect color scheme preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.settings.theme.forceDark = true;
    }

    // Detect mobile device
    if (MOBILE.BREAKPOINT_TABLET && window.innerWidth < MOBILE.BREAKPOINT_TABLET) {
      this.settings.graphics.quality = 'medium';
      this.settings.graphics.particles = false;
    }

    // Auto-detect performance level
    if (this.settings.graphics.quality === 'auto') {
      this.autoDetectQuality();
    }
  }

  /**
   * Auto-detect graphics quality based on device capabilities
   */
  autoDetectQuality() {
    const memory = navigator.deviceMemory || 4; // GB
    const cores = navigator.hardwareConcurrency || 4;
    const mobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (mobile || memory < 2 || cores < 2) {
      this.settings.graphics.quality = 'low';
    } else if (memory >= 8 && cores >= 4) {
      this.settings.graphics.quality = 'high';
    } else {
      this.settings.graphics.quality = 'medium';
    }
  }

  /**
   * Get setting value
   * @param {string} path - Setting path (e.g., 'graphics.quality')
   * @returns {*} Setting value
   */
  get(path) {
    const keys = path.split('.');
    let value = this.settings;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    
    return value;
  }

  /**
   * Set setting value
   * @param {string} path - Setting path
   * @param {*} value - Setting value
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.settings;
    
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    const oldValue = target[lastKey];
    target[lastKey] = value;
    
    this.emit('settingChanged', { path, value, oldValue });
    this.saveSettings();
  }

  /**
   * Reset settings to defaults
   */
  reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    this.emit('settingsReset', this.settings);
  }

  /**
   * Apply graphics quality preset
   * @param {string} quality - Quality level
   */
  setGraphicsQuality(quality) {
    const presets = {
      low: {
        dpr: 1,
        shadows: false,
        particles: false,
        reflections: false,
        lightning: false
      },
      medium: {
        dpr: 'auto',
        shadows: true,
        particles: true,
        reflections: false,
        lightning: true
      },
      high: {
        dpr: 'auto',
        shadows: true,
        particles: true,
        reflections: true,
        lightning: true
      }
    };

    const preset = presets[quality];
    if (preset) {
      Object.assign(this.settings.graphics, preset);
      this.settings.graphics.quality = quality;
      this.saveSettings();
      this.emit('graphicsQualityChanged', quality);
    }
  }

  /**
   * Add setting change listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove setting change listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit setting change event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error('Settings listener error:', e);
        }
      });
    }
  }

  /**
   * Get all settings
   * @returns {Object} All settings
   */
  getAll() {
    return { ...this.settings };
  }

  /**
   * Validate settings object
   * @param {Object} settings - Settings to validate
   * @returns {boolean} True if valid
   */
  validate(settings) {
    // Basic validation - ensure required structure exists
    const requiredKeys = ['graphics', 'audio', 'input', 'accessibility', 'mobile', 'theme', 'performance'];
    
    for (const key of requiredKeys) {
      if (!settings[key] || typeof settings[key] !== 'object') {
        return false;
      }
    }
    
    return true;
  }
}

// Export singleton instance
export const settingsManager = new SettingsManager();
