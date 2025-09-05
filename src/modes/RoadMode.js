/**
 * Road Mode System
 * Handles the main highway driving game mode
 * Manages road-specific logic, camera following, and interactions
 */

import { eventBus } from '../core/EventBus.js';
import { clamp, lerp } from '../utils/math.js';
import { WORLD, ROAD_CONFIG, PHYSICS } from '../config/constants.js';

export class RoadMode {
  constructor() {
    this.name = 'RoadMode';
    this.enabled = true;
    this.debugMode = false;
    
    // Mode state
    this.active = false;
    this.initialized = false;
    
    // Camera system
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      followSpeed: WORLD.CAMERA_FOLLOW_SPEED || 0.1,
      lookahead: WORLD.CAMERA_LOOKAHEAD || 100,
      bounds: {
        left: WORLD.BOUNDARY_LEFT || -1000,
        right: WORLD.BOUNDARY_RIGHT || 15000
      }
    };
    
    // Road state
    this.roadOffset = 0;
    this.scrollSpeed = WORLD.SCROLL_SPEED || 200;
    this.autoScroll = false;
    
    // Interaction state
    this.nearObjects = [];
    this.interactables = [];
    
    // Performance tracking
    this.frameCount = 0;
    this.lastPerformanceCheck = 0;
    
    this.init();
  }

  /**
   * Initialize road mode
   */
  init() {
    this.setupEventListeners();
    this.loadRoadData();
    
    if (this.debugMode) {
      console.log('🛣️ Road Mode initialized');
    }
    
    this.initialized = true;
    eventBus.emit('road-mode:initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Player events
    eventBus.on('player:updated', (data) => this.onPlayerUpdated(data));
    eventBus.on('player:position-changed', (data) => this.onPlayerPositionChanged(data));
    
    // Input events
    eventBus.on('input:key:down', (data) => this.onKeyDown(data));
    eventBus.on('input:mouse:down', (data) => this.onMouseDown(data));
    
    // Collision events
    eventBus.on('collision:near-enter', (data) => this.onNearObjectEnter(data));
    eventBus.on('collision:near-exit', (data) => this.onNearObjectExit(data));
    
    // Branch events
    eventBus.on('branch:interaction', (data) => this.onBranchInteraction(data));
  }

  /**
   * Load road-specific data
   */
  loadRoadData() {
    // Load branch/sign positions
    this.loadBranches();
    
    // Load billboard positions
    this.loadBillboards();
    
    // Load interactive objects
    this.loadInteractables();
    
    if (this.debugMode) {
      console.log('🛣️ Road data loaded');
    }
  }

  /**
   * Load branch data from global content
   */
  loadBranches() {
    // Get branches from global GAME_DATA or content manager
    const branches = window.GAME_DATA?.branches || [];
    this.branches = branches.map(branch => ({
      ...branch,
      type: 'branch',
      interactive: true
    }));
    
    if (this.debugMode) {
      console.log(`🛣️ Loaded ${this.branches.length} branches`);
    }
  }

  /**
   * Load billboard data
   */
  loadBillboards() {
    // Get billboards from global data
    const billboards = window.GAME_DATA?.billboards || [];
    this.billboards = billboards.map(billboard => ({
      ...billboard,
      type: 'billboard',
      interactive: false
    }));
    
    if (this.debugMode) {
      console.log(`🛣️ Loaded ${this.billboards.length} billboards`);
    }
  }

  /**
   * Load interactive objects
   */
  loadInteractables() {
    // Combine all interactive objects
    this.interactables = [
      ...this.branches.filter(b => b.interactive),
      // Add other interactive objects here
    ];
    
    if (this.debugMode) {
      console.log(`🛣️ Loaded ${this.interactables.length} interactive objects`);
    }
  }

  /**
   * Enter road mode
   * @param {Object} options - Mode entry options
   */
  enter(options = {}) {
    this.active = true;
    
    // Reset camera to player position
    this.resetCamera(options);
    
    // Reset road state
    this.roadOffset = 0;
    this.nearObjects = [];
    
    // Enable auto-scroll if specified
    this.autoScroll = options.autoScroll || false;
    
    eventBus.emit('road-mode:entered', { options });
    
    if (this.debugMode) {
      console.log('🛣️ Road mode entered');
    }
  }

  /**
   * Exit road mode
   */
  exit() {
    this.active = false;
    this.autoScroll = false;
    
    eventBus.emit('road-mode:exited');
    
    if (this.debugMode) {
      console.log('🛣️ Road mode exited');
    }
  }

  /**
   * Update road mode - called every frame
   * @param {number} deltaTime - Frame delta time
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (!this.enabled || !this.active) return;
    
    // Update camera
    this.updateCamera(deltaTime, gameState);
    
    // Update road scrolling
    this.updateRoadScrolling(deltaTime);
    
    // Update interactions
    this.updateInteractions(gameState);
    
    // Update performance tracking
    this.updatePerformance(deltaTime);
    
    // Sync to game state
    this.syncToGameState(gameState);
    
    eventBus.emit('road-mode:updated', { deltaTime });
  }

  /**
   * Update camera following player
   * @param {number} deltaTime - Delta time
   * @param {Object} gameState - Game state
   */
  updateCamera(deltaTime, gameState) {
    const player = gameState.player;
    if (!player) return;
    
    // Calculate target camera position
    const playerFacing = player.facing || 'right';
    const lookaheadOffset = playerFacing === 'right' ? this.camera.lookahead : -this.camera.lookahead;
    
    this.camera.targetX = player.x + lookaheadOffset;
    this.camera.targetY = player.y;
    
    // Apply camera bounds
    this.camera.targetX = clamp(
      this.camera.targetX,
      this.camera.bounds.left,
      this.camera.bounds.right
    );
    
    // Smooth camera movement
    this.camera.x = lerp(this.camera.x, this.camera.targetX, this.camera.followSpeed);
    this.camera.y = lerp(this.camera.y, this.camera.targetY, this.camera.followSpeed);
    
    // Auto-scroll camera if enabled
    if (this.autoScroll) {
      this.camera.x += this.scrollSpeed * deltaTime;
      this.camera.targetX = this.camera.x;
    }
  }

  /**
   * Update road scrolling effects
   * @param {number} deltaTime - Delta time
   */
  updateRoadScrolling(deltaTime) {
    // Update road offset for visual effects
    this.roadOffset += this.scrollSpeed * deltaTime * 0.1;
    
    // Keep offset reasonable for performance
    if (this.roadOffset > 1000) {
      this.roadOffset = 0;
    }
  }

  /**
   * Update object interactions
   * @param {Object} gameState - Game state
   */
  updateInteractions(gameState) {
    const player = gameState.player;
    if (!player) return;
    
    // Find nearby interactive objects
    const nearbyObjects = this.findNearbyObjects(player.x, player.y, 80);
    
    // Update near objects list
    this.updateNearObjects(nearbyObjects);
    
    // Update game state near object for compatibility
    gameState.near = nearbyObjects.length > 0 ? nearbyObjects[0] : null;
  }

  /**
   * Find objects near a position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} radius - Search radius
   * @returns {Array} Nearby objects
   */
  findNearbyObjects(x, y, radius) {
    const nearby = [];
    
    // Check branches
    for (const branch of this.branches) {
      const distance = Math.abs(branch.x - x);
      if (distance <= radius) {
        nearby.push({
          ...branch,
          distance
        });
      }
    }
    
    // Sort by distance
    nearby.sort((a, b) => a.distance - b.distance);
    
    return nearby;
  }

  /**
   * Update near objects list
   * @param {Array} newNearObjects - New nearby objects
   */
  updateNearObjects(newNearObjects) {
    const previousNear = this.nearObjects;
    this.nearObjects = newNearObjects;
    
    // Emit events for objects that entered/exited range
    const previousIds = new Set(previousNear.map(obj => obj.id || obj.x));
    const currentIds = new Set(newNearObjects.map(obj => obj.id || obj.x));
    
    // Objects that left range
    for (const obj of previousNear) {
      const id = obj.id || obj.x;
      if (!currentIds.has(id)) {
        eventBus.emit('road-mode:object-exit-range', { object: obj });
      }
    }
    
    // Objects that entered range
    for (const obj of newNearObjects) {
      const id = obj.id || obj.x;
      if (!previousIds.has(id)) {
        eventBus.emit('road-mode:object-enter-range', { object: obj });
      }
    }
  }

  /**
   * Update performance tracking
   * @param {number} deltaTime - Delta time
   */
  updatePerformance(deltaTime) {
    this.frameCount++;
    
    const now = performance.now();
    if (now - this.lastPerformanceCheck >= 1000) {
      const fps = this.frameCount;
      this.frameCount = 0;
      this.lastPerformanceCheck = now;
      
      eventBus.emit('road-mode:performance', { fps, deltaTime });
    }
  }

  /**
   * Sync road mode data to game state
   * @param {Object} gameState - Game state
   */
  syncToGameState(gameState) {
    // Update camera in game state
    if (!gameState.camera) {
      gameState.camera = {};
    }
    
    Object.assign(gameState.camera, {
      x: this.camera.x,
      y: this.camera.y,
      targetX: this.camera.targetX,
      targetY: this.camera.targetY
    });
    
    // Update road state
    if (!gameState.road) {
      gameState.road = {};
    }
    
    Object.assign(gameState.road, {
      offset: this.roadOffset,
      scrollSpeed: this.scrollSpeed,
      autoScroll: this.autoScroll
    });
    
    // Update branches and billboards
    gameState.branches = this.branches;
    gameState.billboards = this.billboards;
  }

  /**
   * Reset camera to player position
   * @param {Object} options - Reset options
   */
  resetCamera(options = {}) {
    const targetX = options.x || WORLD.PLAYER_SPAWN_X || 120;
    const targetY = options.y || WORLD.ROAD_Y_OFFSET || 160;
    
    this.camera.x = targetX;
    this.camera.y = targetY;
    this.camera.targetX = targetX;
    this.camera.targetY = targetY;
    
    eventBus.emit('road-mode:camera-reset', { 
      camera: this.camera 
    });
  }

  /**
   * Handle player updated
   * @param {Object} data - Player update data
   */
  onPlayerUpdated(data) {
    if (!this.active) return;
    
    // Camera follows player automatically in update loop
  }

  /**
   * Handle player position change
   * @param {Object} data - Position change data
   */
  onPlayerPositionChanged(data) {
    if (!this.active) return;
    
    const { position } = data;
    
    // Update camera target immediately for large position changes
    const deltaX = Math.abs(position.x - this.camera.targetX);
    if (deltaX > 200) {
      this.camera.targetX = position.x;
    }
  }

  /**
   * Handle key down
   * @param {Object} data - Key event data
   */
  onKeyDown(data) {
    if (!this.active) return;
    
    const { code } = data;
    
    // Road mode specific controls
    switch (code) {
      case 'KeyC':
        // Toggle auto-scroll (debug)
        if (this.debugMode) {
          this.autoScroll = !this.autoScroll;
          console.log(`🛣️ Auto-scroll: ${this.autoScroll}`);
        }
        break;
        
      case 'KeyR':
        // Reset camera (debug)
        if (this.debugMode) {
          this.resetCamera();
          console.log('🛣️ Camera reset');
        }
        break;
    }
  }

  /**
   * Handle mouse down
   * @param {Object} data - Mouse event data
   */
  onMouseDown(data) {
    if (!this.active) return;
    
    // Handle road sign clicks
    this.handleRoadSignClick(data);
  }

  /**
   * Handle road sign clicks
   * @param {Object} data - Mouse event data
   */
  handleRoadSignClick(data) {
    const { x, y } = data;
    
    // Convert screen coordinates to world coordinates
    const worldX = x + this.camera.x;
    
    // Find clicked branch
    for (const branch of this.branches) {
      const distance = Math.abs(worldX - branch.x);
      if (distance < 40) { // Click tolerance
        eventBus.emit('branch:clicked', { branch });
        break;
      }
    }
  }

  /**
   * Handle near object enter
   * @param {Object} data - Near object data
   */
  onNearObjectEnter(data) {
    if (!this.active) return;
    
    const { object } = data;
    
    if (this.debugMode) {
      console.log(`🛣️ Near object entered: ${object.label || object.type}`);
    }
  }

  /**
   * Handle near object exit
   * @param {Object} data - Near object data
   */
  onNearObjectExit(data) {
    if (!this.active) return;
    
    const { object } = data;
    
    if (this.debugMode) {
      console.log(`🛣️ Near object exited: ${object.label || object.type}`);
    }
  }

  /**
   * Handle branch interaction
   * @param {Object} data - Branch interaction data
   */
  onBranchInteraction(data) {
    if (!this.active) return;
    
    const { branch, action } = data;
    
    // Handle specific branch types
    if (branch.type === 'phase1' || /phase 1/i.test(branch.label || '')) {
      // Trigger world transition
      eventBus.emit('world:transition:start', { branch });
    } else {
      // Regular branch interaction
      eventBus.emit('branch:open', { branch });
    }
    
    if (this.debugMode) {
      console.log(`🛣️ Branch interaction: ${branch.label} (${action})`);
    }
  }

  /**
   * Get road mode state
   * @returns {Object} Current state
   */
  getState() {
    return {
      active: this.active,
      camera: { ...this.camera },
      road: {
        offset: this.roadOffset,
        scrollSpeed: this.scrollSpeed,
        autoScroll: this.autoScroll
      },
      objects: {
        branches: this.branches.length,
        billboards: this.billboards.length,
        nearObjects: this.nearObjects.length
      }
    };
  }

  /**
   * Set camera follow speed
   * @param {number} speed - Follow speed (0-1)
   */
  setCameraFollowSpeed(speed) {
    this.camera.followSpeed = clamp(speed, 0, 1);
    eventBus.emit('road-mode:camera-speed-changed', { speed });
  }

  /**
   * Set camera lookahead distance
   * @param {number} distance - Lookahead distance
   */
  setCameraLookahead(distance) {
    this.camera.lookahead = distance;
    eventBus.emit('road-mode:camera-lookahead-changed', { distance });
  }

  /**
   * Enable/disable road mode
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('road-mode:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup road mode
   */
  destroy() {
    this.active = false;
    this.branches = [];
    this.billboards = [];
    this.interactables = [];
    this.nearObjects = [];
    
    eventBus.emit('road-mode:destroyed');
  }
}

export { RoadMode };
