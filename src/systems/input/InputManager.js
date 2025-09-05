/**
 * Input Manager System
 * Extracted from original game.js input handling
 * Maintains exact input behavior and key mappings
 */

import { eventBus } from '../../core/EventBus.js';
import { isMobileDevice } from '../../utils/mobile.js';
import { INPUT } from '../../config/constants.js';

export class InputManager {
  constructor() {
    this.name = 'InputManager';
    this.enabled = true;
    this.debugMode = false;
    
    // Input state
    this.keys = {};
    this.mouse = { x: 0, y: 0, buttons: {} };
    this.touch = { active: false, points: new Map() };
    this.gamepad = { connected: false, state: {} };
    
    // Throttle system for mobile (matches original)
    this.throttle = { left: 0, right: 0 };
    
    // Event listeners storage for cleanup
    this.listeners = [];
    
    // Input configuration
    this.config = {
      keyboardEnabled: true,
      mouseEnabled: true,
      touchEnabled: true,
      gamepadEnabled: true,
      preventDefaults: [
        'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 
        'KeyE', 'Enter', 'Escape', 'KeyP', 'KeyH', 
        'KeyF', 'KeyT', 'ArrowUp', 'ArrowDown', 'KeyS', 'KeyW'
      ]
    };
    
    this.init();
  }

  /**
   * Initialize input system
   */
  init() {
    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();
    this.setupGamepad();
    this.setupAnalogThrottle();
    
    if (this.debugMode) {
      console.log('🎮 Input Manager initialized');
    }
    
    eventBus.emit('input:initialized');
  }

  /**
   * Setup keyboard input - matches original game.js exactly
   */
  setupKeyboard() {
    if (!this.config.keyboardEnabled) return;
    
    const keyDownHandler = (e) => {
      // Prevent default for game keys
      if (this.config.preventDefaults.includes(e.code)) {
        e.preventDefault();
      }
      
      this.keys[e.code] = true;
      
      // Emit specific key events matching original behavior
      eventBus.emit('input:key:down', { code: e.code, key: e.key, event: e });
      
      // Handle special key combinations and actions
      this.handleSpecialKeys(e);
      
      if (this.debugMode) {
        console.log(`⌨️ Key down: ${e.code}`);
      }
    };
    
    const keyUpHandler = (e) => {
      this.keys[e.code] = false;
      
      // Handle key-specific actions on release
      this.handleKeyRelease(e);
      
      eventBus.emit('input:key:up', { code: e.code, key: e.key, event: e });
      
      if (this.debugMode) {
        console.log(`⌨️ Key up: ${e.code}`);
      }
    };
    
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    
    this.listeners.push(
      () => document.removeEventListener('keydown', keyDownHandler),
      () => document.removeEventListener('keyup', keyUpHandler)
    );
  }

  /**
   * Handle special key combinations and actions
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleSpecialKeys(e) {
    // Timeline mode specific controls
    if (this.getGameMode() === 'timeline') {
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && this.getPlayerY() <= 140) {
        eventBus.emit('timeline:exit-requested');
      }
    }
    
    // Road mode specific controls
    if (this.getGameMode() === 'road') {
      const near = this.getNearObject();
      if (near && /phase 1/i.test(near.label || '')) {
        if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'KeyE' || e.code === 'Enter') {
          eventBus.emit('world:transition:start');
          return;
        }
      }
    }
    
    // Global controls
    if (e.code === 'KeyE' && this.getNearObject()) {
      eventBus.emit('branch:open', { branch: this.getNearObject() });
    }
    
    if (e.code === 'Enter' && this.getNearObject()) {
      eventBus.emit('branch:open', { branch: this.getNearObject() });
    }
    
    if (e.code === 'Escape') {
      eventBus.emit('panel:close');
    }
    
    if (e.code === 'KeyP') {
      eventBus.emit('game:toggle-pause');
    }
    
    if (e.code === 'KeyH') {
      eventBus.emit('help:show');
    }
    
    if (e.code === 'KeyF') {
      eventBus.emit('spotlight:activate');
    }
    
    if (e.code === 'ShiftLeft' && this.keys['KeyF']) {
      eventBus.emit('photo:trigger');
    }
    
    if (e.code === 'KeyT') {
      eventBus.emit('theme:toggle');
    }
  }

  /**
   * Handle key release actions
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyRelease(e) {
    if (e.code === 'KeyF') {
      eventBus.emit('spotlight:deactivate');
    }
  }

  /**
   * Setup mouse input
   */
  setupMouse() {
    if (!this.config.mouseEnabled) return;
    
    const mouseMoveHandler = (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      
      eventBus.emit('input:mouse:move', { x: e.clientX, y: e.clientY, event: e });
    };
    
    const mouseDownHandler = (e) => {
      this.mouse.buttons[e.button] = true;
      eventBus.emit('input:mouse:down', { button: e.button, x: e.clientX, y: e.clientY, event: e });
    };
    
    const mouseUpHandler = (e) => {
      this.mouse.buttons[e.button] = false;
      eventBus.emit('input:mouse:up', { button: e.button, x: e.clientX, y: e.clientY, event: e });
    };
    
    const clickHandler = (e) => {
      // Handle canvas clicks for road signs (matches original)
      if (this.getGameMode() === 'road') {
        const canvas = document.getElementById('game');
        if (e.target === canvas) {
          this.handleCanvasClick(e);
        }
      }
    };
    
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('click', clickHandler);
    
    this.listeners.push(
      () => document.removeEventListener('mousemove', mouseMoveHandler),
      () => document.removeEventListener('mousedown', mouseDownHandler),
      () => document.removeEventListener('mouseup', mouseUpHandler),
      () => document.removeEventListener('click', clickHandler)
    );
    
    // Spotlight pointer controls
    const pointerMoveHandler = (e) => {
      eventBus.emit('spotlight:pointer-move', { x: e.clientX, y: e.clientY });
    };
    
    document.addEventListener('pointermove', pointerMoveHandler);
    this.listeners.push(() => document.removeEventListener('pointermove', pointerMoveHandler));
  }

  /**
   * Handle canvas clicks for road signs
   * @param {MouseEvent} e - Mouse event
   */
  handleCanvasClick(e) {
    const canvas = document.getElementById('game');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    
    // Get camera and world position
    const state = window.state || {};
    const camera = state.camera || { x: 0 };
    const wx = cx + camera.x;
    
    // Check for branch clicks (matches original logic)
    const branches = this.getBranches();
    let found = null;
    
    for (const branch of branches) {
      if (Math.abs(wx - branch.x) < 80) {
        found = branch;
        break;
      }
    }
    
    if (found) {
      if (found.type === 'phase1') {
        eventBus.emit('world:transition:start');
      } else {
        eventBus.emit('branch:open', { branch: found });
      }
    }
  }

  /**
   * Setup touch input
   */
  setupTouch() {
    if (!this.config.touchEnabled || !isMobileDevice()) return;
    
    // Setup mobile control buttons
    this.setupMobileControls();
    
    // Touch event handlers
    const touchStartHandler = (e) => {
      for (const touch of e.changedTouches) {
        this.touch.points.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
          startX: touch.clientX,
          startY: touch.clientY,
          startTime: performance.now()
        });
      }
      
      this.touch.active = this.touch.points.size > 0;
      eventBus.emit('input:touch:start', { touches: e.touches, event: e });
    };
    
    const touchMoveHandler = (e) => {
      for (const touch of e.changedTouches) {
        const point = this.touch.points.get(touch.identifier);
        if (point) {
          point.x = touch.clientX;
          point.y = touch.clientY;
        }
      }
      
      eventBus.emit('input:touch:move', { touches: e.touches, event: e });
    };
    
    const touchEndHandler = (e) => {
      for (const touch of e.changedTouches) {
        this.touch.points.delete(touch.identifier);
      }
      
      this.touch.active = this.touch.points.size > 0;
      eventBus.emit('input:touch:end', { touches: e.touches, event: e });
    };
    
    document.addEventListener('touchstart', touchStartHandler, { passive: true });
    document.addEventListener('touchmove', touchMoveHandler, { passive: true });
    document.addEventListener('touchend', touchEndHandler, { passive: true });
    
    this.listeners.push(
      () => document.removeEventListener('touchstart', touchStartHandler),
      () => document.removeEventListener('touchmove', touchMoveHandler),
      () => document.removeEventListener('touchend', touchEndHandler)
    );
  }

  /**
   * Setup mobile control buttons - matches original exactly
   */
  setupMobileControls() {
    const events = ['pointerdown', 'pointerup'];
    
    events.forEach(ev => {
      const leftBtn = document.getElementById('leftBtn');
      const rightBtn = document.getElementById('rightBtn');
      const interactBtn = document.getElementById('interactBtn');
      const upBtn = document.getElementById('upBtn');
      const downBtn = document.getElementById('downBtn');
      const interactBtn2 = document.getElementById('interactBtn2');
      
      if (leftBtn) {
        const handler = (e) => {
          if (ev === 'pointerdown') {
            this.keys['ArrowLeft'] = true;
            this.throttle.left = 1;
          } else {
            this.keys['ArrowLeft'] = false;
            this.throttle.left = 0;
          }
        };
        leftBtn.addEventListener(ev, handler);
        this.listeners.push(() => leftBtn.removeEventListener(ev, handler));
      }
      
      if (rightBtn) {
        const handler = (e) => {
          if (ev === 'pointerdown') {
            this.keys['ArrowRight'] = true;
            this.throttle.right = 1;
          } else {
            this.keys['ArrowRight'] = false;
            this.throttle.right = 0;
          }
        };
        rightBtn.addEventListener(ev, handler);
        this.listeners.push(() => rightBtn.removeEventListener(ev, handler));
      }
      
      if (interactBtn) {
        const handler = (e) => {
          if (ev === 'pointerdown' && this.getNearObject()) {
            eventBus.emit('branch:open', { branch: this.getNearObject() });
          }
        };
        interactBtn.addEventListener(ev, handler);
        this.listeners.push(() => interactBtn.removeEventListener(ev, handler));
      }
      
      if (upBtn) {
        const handler = (e) => {
          this.keys['ArrowUp'] = ev === 'pointerdown';
        };
        upBtn.addEventListener(ev, handler);
        this.listeners.push(() => upBtn.removeEventListener(ev, handler));
      }
      
      if (downBtn) {
        const handler = (e) => {
          this.keys['ArrowDown'] = ev === 'pointerdown';
        };
        downBtn.addEventListener(ev, handler);
        this.listeners.push(() => downBtn.removeEventListener(ev, handler));
      }
      
      if (interactBtn2) {
        const handler = (e) => {
          if (ev === 'pointerdown' && this.getNearObject()) {
            eventBus.emit('branch:open', { branch: this.getNearObject() });
          }
        };
        interactBtn2.addEventListener(ev, handler);
        this.listeners.push(() => interactBtn2.removeEventListener(ev, handler));
      }
    });
  }

  /**
   * Setup analog throttle for mobile - matches original exactly
   */
  setupAnalogThrottle() {
    let lastAnalogT = performance.now();
    
    const updateAnalogThrottle = () => {
      const now = performance.now();
      const dt = (now - lastAnalogT) / 1000;
      lastAnalogT = now;
      
      // Smooth throttle decay
      this.throttle.left = Math.max(0, this.throttle.left - dt * 4);
      this.throttle.right = Math.max(0, this.throttle.right - dt * 4);
      
      requestAnimationFrame(updateAnalogThrottle);
    };
    
    updateAnalogThrottle();
  }

  /**
   * Setup gamepad input
   */
  setupGamepad() {
    if (!this.config.gamepadEnabled) return;
    
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepad.connected = true;
      eventBus.emit('input:gamepad:connected', { gamepad: e.gamepad });
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
      this.gamepad.connected = false;
      eventBus.emit('input:gamepad:disconnected', { gamepad: e.gamepad });
    });
  }

  /**
   * Update input system - called each frame
   * @param {number} deltaTime - Frame delta time
   * @param {Object} state - Game state
   */
  update(deltaTime, state) {
    if (!this.enabled) return;
    
    // Update throttle state in global state for compatibility
    state.throttle = this.throttle;
    state.keys = this.keys;
    
    // Update gamepad if connected
    if (this.gamepad.connected) {
      this.updateGamepad();
    }
    
    eventBus.emit('input:updated', { deltaTime, keys: this.keys, throttle: this.throttle });
  }

  /**
   * Update gamepad state
   */
  updateGamepad() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad) {
        // Map gamepad buttons to keyboard keys
        this.keys['ArrowLeft'] = gamepad.buttons[14]?.pressed || gamepad.axes[0] < -0.5;
        this.keys['ArrowRight'] = gamepad.buttons[15]?.pressed || gamepad.axes[0] > 0.5;
        this.keys['ArrowUp'] = gamepad.buttons[12]?.pressed || gamepad.axes[1] < -0.5;
        this.keys['ArrowDown'] = gamepad.buttons[13]?.pressed || gamepad.axes[1] > 0.5;
        this.keys['KeyE'] = gamepad.buttons[0]?.pressed; // A button
        this.keys['Escape'] = gamepad.buttons[1]?.pressed; // B button
        break;
      }
    }
  }

  /**
   * Helper methods for compatibility with original code
   */
  getGameMode() {
    return window.state?.mode || 'road';
  }

  getPlayerY() {
    return window.state?.player?.y || 0;
  }

  getNearObject() {
    return window.state?.near || null;
  }

  getBranches() {
    return window.GAME_DATA?.branches || [];
  }

  /**
   * Get current input state
   * @returns {Object} Input state
   */
  getInputState() {
    return {
      keys: { ...this.keys },
      mouse: { ...this.mouse },
      touch: { 
        active: this.touch.active,
        pointCount: this.touch.points.size
      },
      throttle: { ...this.throttle },
      gamepad: { ...this.gamepad }
    };
  }

  /**
   * Check if key is pressed
   * @param {string} keyCode - Key code
   * @returns {boolean} True if pressed
   */
  isKeyPressed(keyCode) {
    return !!this.keys[keyCode];
  }

  /**
   * Enable/disable input system
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('input:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup input system
   */
  destroy() {
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
    eventBus.emit('input:destroyed');
  }
}

// Export singleton instance
export const inputManager = new InputManager();
