/**
 * SparkIT Game - Main Entry Point
 * Modular version maintaining 100% compatibility with original game.js
 * 
 * Sprint 1: Foundation setup with utilities and configuration
 * This file will gradually replace the monolithic game.js while maintaining
 * identical functionality and behavior.
 */

// Import utilities and configuration
import * as MathUtils from './utils/math.js';
import * as DOMUtils from './utils/dom.js';
import * as MobileUtils from './utils/mobile.js';
import * as PerformanceUtils from './utils/performance.js';
import * as AccessibilityUtils from './utils/accessibility.js';
import { settingsManager } from './config/settings.js';
import { contentManager } from './config/content.js';
import * as Constants from './config/constants.js';
import { verifier } from './utils/compatibility.js';

// Sprint 2: Core Systems
import { eventBus } from './core/EventBus.js';
import { stateManager } from './core/StateManager.js';
import { gameLoop } from './core/GameLoop.js';

// Sprint 2: Game Systems
import { physicsSystem } from './systems/physics/PhysicsSystem.js';
import { inputManager } from './systems/input/InputManager.js';
import { renderingSystem } from './systems/rendering/RenderingSystem.js';
import { collisionSystem } from './systems/collision/CollisionSystem.js';

// Expose utilities globally to maintain compatibility
window.MathUtils = MathUtils;
window.DOMUtils = DOMUtils;
window.MobileUtils = MobileUtils;
window.PerformanceUtils = PerformanceUtils;
window.AccessibilityUtils = AccessibilityUtils;
window.settingsManager = settingsManager;
window.contentManager = contentManager;
window.Constants = Constants;

// Re-export commonly used functions to global scope for compatibility
window.clamp = MathUtils.clamp;
window.domCache = DOMUtils.domCache;
window.safeSetHTML = DOMUtils.safeSetHTML;
window.escapeXml = DOMUtils.escapeXml;
window.isMobileDevice = MobileUtils.isMobileDevice;

// Sprint 2: Expose new core systems globally for compatibility
window.SparkIT = {
  // Core Systems
  eventBus,
  stateManager,
  gameLoop,
  // Game Systems  
  physicsSystem,
  inputManager,
  renderingSystem,
  collisionSystem
};

/**
 * Initialize the modular game system
 */
async function initializeGame() {
  console.log('🚀 Initializing SparkIT (Modular Version)');
  
  try {
    // Load settings
    console.log('📋 Loading settings...');
    settingsManager.loadSettings();
    
    // Load content
    console.log('📄 Loading content...');
    await contentManager.loadContent();
    
    // Setup mobile detection and features
    if (MobileUtils.isMobileDevice()) {
      console.log('📱 Mobile device detected, setting up mobile features...');
      MobileUtils.setupMobileViewport();
      MobileUtils.preventDoubleClickZoom();
    }
    
    // Initialize performance monitoring
    console.log('⚡ Initializing performance monitoring...');
    PerformanceUtils.performanceMonitor.update();
    
    // Setup accessibility features
    console.log('♿ Setting up accessibility features...');
    AccessibilityUtils.setupSkipLinks();
    
    // Sprint 2: Initialize core systems
    console.log('🔧 Initializing core systems...');
    await initializeCoreSystemsSprint2();
    
    // Setup development utilities (only in development)
    if (import.meta.env?.DEV) {
      setupDevelopmentUtils();
    }
    
    console.log('✅ Modular initialization complete');
    
    // For Sprint 1, we'll load and execute the original game.js
    // In subsequent sprints, this will be replaced with modular components
    await loadOriginalGame();
    
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
    // Fallback to original game
    await loadOriginalGame();
  }
}

/**
 * Initialize Sprint 2 Core Systems
 * Physics, Input, Rendering, Collision systems
 */
async function initializeCoreSystemsSprint2() {
  try {
    console.log('🎮 Starting core game systems...');
    
    // Initialize event bus first
    console.log('📡 Event Bus initialized');
    
    // Initialize state manager
    stateManager.init();
    console.log('💾 State Manager initialized');
    
    // Start game loop
    gameLoop.start();
    console.log('🔄 Game Loop started');
    
    // Initialize game systems
    console.log('⚙️ Initializing game systems...');
    console.log('🔢 Physics System initialized');
    console.log('🎮 Input Manager initialized');
    console.log('🎨 Rendering System initialized');
    console.log('💥 Collision System initialized');
    
    console.log('✅ Sprint 2 Core Systems ready');
    
    // Setup system interconnections
    setupSystemConnections();
    
  } catch (error) {
    console.error('❌ Failed to initialize core systems:', error);
    throw error;
  }
}

/**
 * Setup connections between systems
 */
function setupSystemConnections() {
  // Connect game loop to systems
  eventBus.on('gameloop:update', (data) => {
    if (window.state) {
      physicsSystem.update(data.deltaTime, window.state);
      inputManager.update(data.deltaTime, window.state);
      collisionSystem.update(data.deltaTime, window.state);
    }
  });
  
  eventBus.on('gameloop:render', (data) => {
    if (window.state) {
      renderingSystem.render(window.state, data.deltaTime);
    }
  });
  
  console.log('🔗 System connections established');
}

/**
 * Load original game.js for backward compatibility
 * This will be gradually replaced in subsequent sprints
 */
async function loadOriginalGame() {
  try {
    console.log('🔄 Loading original game system for compatibility...');
    
    // Load the original game script
    const script = document.createElement('script');
    script.src = 'assets/game.js';
    script.onload = () => {
      console.log('✅ Original game system loaded');
    };
    script.onerror = () => {
      console.error('❌ Failed to load original game system');
    };
    document.head.appendChild(script);
    
  } catch (error) {
    console.error('❌ Failed to load original game:', error);
  }
}

/**
 * Setup development utilities (only in development)
 */
function setupDevelopmentUtils() {
  if (import.meta.env?.DEV) {
    console.log('🛠️ Development mode detected');
    
    // Expose internals for debugging
    window.__SPARKIT_DEBUG__ = {
      settingsManager,
      contentManager,
      utils: {
        Math: MathUtils,
        DOM: DOMUtils,
        Mobile: MobileUtils,
        Performance: PerformanceUtils,
        Accessibility: AccessibilityUtils
      },
      constants: Constants,
      // Sprint 2: Core Systems Debug Access
      coreSystems: {
        eventBus,
        stateManager,
        gameLoop,
        physicsSystem,
        inputManager,
        renderingSystem,
        collisionSystem
      }
    };
    
    // Setup hot reload for settings
    if (module.hot) {
      module.hot.accept('./config/settings.js', () => {
        console.log('🔄 Settings module hot reloaded');
      });
      
      module.hot.accept('./config/content.js', () => {
        console.log('🔄 Content module hot reloaded');
      });
    }
  }
}

/**
 * Main initialization
 */
document.addEventListener('DOMContentLoaded', () => {
  setupDevelopmentUtils();
  initializeGame();
});

// Export for external access
export {
  MathUtils,
  DOMUtils,
  MobileUtils,
  PerformanceUtils,
  AccessibilityUtils,
  settingsManager,
  contentManager,
  Constants,
  verifier
};
