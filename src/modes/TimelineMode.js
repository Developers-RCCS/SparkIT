/**
 * Timeline Mode System
 * Handles the timeline drilling/exploration mode
 * Manages timeline-specific navigation and content display
 */

import { eventBus } from '../core/EventBus.js';
import { clamp, lerp } from '../utils/math.js';
import { TIMELINE_CONFIG, WORLD } from '../config/constants.js';

export class TimelineMode {
  constructor() {
    this.name = 'TimelineMode';
    this.enabled = true;
    this.debugMode = false;
    
    // Mode state
    this.active = false;
    this.initialized = false;
    
    // Timeline data
    this.currentBranch = null;
    this.timelineData = [];
    this.currentLevel = 0;
    this.maxLevel = 0;
    this.drillPath = [];
    
    // Navigation state
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.targetZoom = 1.0;
    this.targetPanX = 0;
    this.targetPanY = 0;
    
    // Timeline nodes
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this.hoveredNode = null;
    
    // Interaction state
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.lastDragPos = { x: 0, y: 0 };
    
    // Animation state
    this.animations = [];
    this.expandAnimation = {
      active: false,
      progress: 0,
      duration: 800,
      startTime: 0
    };
    
    this.init();
  }

  /**
   * Initialize timeline mode
   */
  init() {
    this.setupEventListeners();
    this.loadTimelineConfig();
    
    if (this.debugMode) {
      console.log('📊 Timeline Mode initialized');
    }
    
    this.initialized = true;
    eventBus.emit('timeline-mode:initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Player events
    eventBus.on('player:updated', (data) => this.onPlayerUpdated(data));
    
    // Input events
    eventBus.on('input:key:down', (data) => this.onKeyDown(data));
    eventBus.on('input:mouse:down', (data) => this.onMouseDown(data));
    eventBus.on('input:mouse:move', (data) => this.onMouseMove(data));
    eventBus.on('input:mouse:up', (data) => this.onMouseUp(data));
    
    // Branch events
    eventBus.on('branch:selected', (data) => this.onBranchSelected(data));
    eventBus.on('timeline:drill-down', (data) => this.drillDown(data));
    eventBus.on('timeline:drill-up', () => this.drillUp());
    
    // Mode events
    eventBus.on('mode:changed', (data) => this.onModeChanged(data));
  }

  /**
   * Load timeline configuration
   */
  loadTimelineConfig() {
    // Set default timeline parameters
    this.config = {
      maxZoom: TIMELINE_CONFIG.maxZoom || 5,
      minZoom: TIMELINE_CONFIG.minZoom || 0.5,
      scrollSpeed: TIMELINE_CONFIG.scrollSpeed || 200,
      snapToGrid: TIMELINE_CONFIG.snapToGrid || true,
      gridSize: TIMELINE_CONFIG.gridSize || 50,
      maxDrillDepth: TIMELINE_CONFIG.maxDrillDepth || 10,
      nodeSpacing: TIMELINE_CONFIG.nodeSpacing || 100,
      branchHeight: TIMELINE_CONFIG.branchHeight || 80
    };
    
    if (this.debugMode) {
      console.log('📊 Timeline config loaded');
    }
  }

  /**
   * Enter timeline mode
   * @param {Object} options - Mode entry options
   */
  enter(options = {}) {
    this.active = true;
    
    // Set current branch if provided
    if (options.branch) {
      this.currentBranch = options.branch;
      this.loadBranchTimeline(options.branch);
    }
    
    // Reset timeline state
    this.currentLevel = 0;
    this.drillPath = [];
    this.selectedNode = null;
    this.hoveredNode = null;
    
    // Reset view
    this.resetView();
    
    // Start entry animation
    this.startExpandAnimation();
    
    eventBus.emit('timeline-mode:entered', { 
      branch: this.currentBranch,
      options 
    });
    
    if (this.debugMode) {
      console.log('📊 Timeline mode entered');
    }
  }

  /**
   * Exit timeline mode
   */
  exit() {
    this.active = false;
    
    // Clear timeline data
    this.currentBranch = null;
    this.timelineData = [];
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this.hoveredNode = null;
    
    // Reset animations
    this.animations = [];
    this.expandAnimation.active = false;
    
    eventBus.emit('timeline-mode:exited');
    
    if (this.debugMode) {
      console.log('📊 Timeline mode exited');
    }
  }

  /**
   * Update timeline mode - called every frame
   * @param {number} deltaTime - Frame delta time
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (!this.enabled || !this.active) return;
    
    // Update view animation
    this.updateViewAnimation(deltaTime);
    
    // Update expand animation
    this.updateExpandAnimation(deltaTime);
    
    // Update node animations
    this.updateNodeAnimations(deltaTime);
    
    // Update player constraints
    this.updatePlayerConstraints(gameState);
    
    // Sync to game state
    this.syncToGameState(gameState);
    
    eventBus.emit('timeline-mode:updated', { deltaTime });
  }

  /**
   * Update view animation (pan/zoom)
   * @param {number} deltaTime - Delta time
   */
  updateViewAnimation(deltaTime) {
    const smoothing = 0.1;
    
    // Smooth zoom
    this.zoom = lerp(this.zoom, this.targetZoom, smoothing);
    
    // Smooth pan
    this.panX = lerp(this.panX, this.targetPanX, smoothing);
    this.panY = lerp(this.panY, this.targetPanY, smoothing);
  }

  /**
   * Update expand animation
   * @param {number} deltaTime - Delta time
   */
  updateExpandAnimation(deltaTime) {
    if (!this.expandAnimation.active) return;
    
    const elapsed = performance.now() - this.expandAnimation.startTime;
    this.expandAnimation.progress = Math.min(1, elapsed / this.expandAnimation.duration);
    
    // Easing function for smooth animation
    const easeProgress = this.easeOutCubic(this.expandAnimation.progress);
    
    // Update zoom based on animation
    this.zoom = lerp(0.3, 1.0, easeProgress);
    
    // Check if animation is complete
    if (this.expandAnimation.progress >= 1) {
      this.expandAnimation.active = false;
      eventBus.emit('timeline-mode:expand-complete');
    }
  }

  /**
   * Update node animations
   * @param {number} deltaTime - Delta time
   */
  updateNodeAnimations(deltaTime) {
    // Update any node-specific animations
    this.animations = this.animations.filter(animation => {
      animation.time += deltaTime;
      
      if (animation.time >= animation.duration) {
        // Animation complete
        if (animation.onComplete) {
          animation.onComplete();
        }
        return false; // Remove from array
      }
      
      // Update animation progress
      animation.progress = animation.time / animation.duration;
      
      return true; // Keep in array
    });
  }

  /**
   * Update player constraints in timeline mode
   * @param {Object} gameState - Game state
   */
  updatePlayerConstraints(gameState) {
    const player = gameState.player;
    if (!player) return;
    
    // Constrain player to timeline boundaries
    const bounds = this.getTimelineBounds();
    
    if (player.x < bounds.left) {
      player.x = bounds.left;
      player.vx = Math.max(0, player.vx);
    }
    
    if (player.x > bounds.right) {
      player.x = bounds.right;
      player.vx = Math.min(0, player.vx);
    }
    
    if (player.y < bounds.top) {
      player.y = bounds.top;
      player.vy = Math.max(0, player.vy);
    }
    
    if (player.y > bounds.bottom) {
      player.y = bounds.bottom;
      player.vy = Math.min(0, player.vy);
    }
  }

  /**
   * Load timeline data for a branch
   * @param {Object} branch - Branch to load timeline for
   */
  loadBranchTimeline(branch) {
    // Generate timeline nodes based on branch content
    this.timelineData = this.generateTimelineData(branch);
    this.buildTimelineNodes();
    
    if (this.debugMode) {
      console.log(`📊 Timeline loaded for branch: ${branch.label}`);
    }
    
    eventBus.emit('timeline-mode:data-loaded', { 
      branch, 
      nodeCount: this.nodes.length 
    });
  }

  /**
   * Generate timeline data from branch
   * @param {Object} branch - Branch object
   * @returns {Array} Timeline data
   */
  generateTimelineData(branch) {
    // This would normally come from content management
    // For now, generate sample timeline data
    const timelineData = [];
    
    // Root level
    timelineData.push({
      id: 'root',
      level: 0,
      title: branch.label || 'Timeline Root',
      description: 'Main timeline entry point',
      type: 'root',
      children: ['phase1', 'phase2', 'phase3']
    });
    
    // Phase levels
    for (let i = 1; i <= 3; i++) {
      timelineData.push({
        id: `phase${i}`,
        level: 1,
        title: `Phase ${i}`,
        description: `Timeline phase ${i} content`,
        type: 'phase',
        parent: 'root',
        children: [`sub${i}a`, `sub${i}b`]
      });
      
      // Sub-phases
      for (const sub of ['a', 'b']) {
        timelineData.push({
          id: `sub${i}${sub}`,
          level: 2,
          title: `Sub-phase ${i}${sub.toUpperCase()}`,
          description: `Detailed content for phase ${i}${sub}`,
          type: 'detail',
          parent: `phase${i}`,
          children: []
        });
      }
    }
    
    return timelineData;
  }

  /**
   * Build timeline nodes from data
   */
  buildTimelineNodes() {
    this.nodes = [];
    this.connections = [];
    
    // Create nodes
    for (let i = 0; i < this.timelineData.length; i++) {
      const data = this.timelineData[i];
      
      const node = {
        id: data.id,
        x: this.calculateNodeX(data, i),
        y: this.calculateNodeY(data, i),
        width: 120,
        height: 80,
        level: data.level,
        title: data.title,
        description: data.description,
        type: data.type,
        parent: data.parent,
        children: data.children || [],
        visible: data.level <= this.currentLevel + 1,
        interactive: true
      };
      
      this.nodes.push(node);
    }
    
    // Create connections
    this.buildConnections();
    
    if (this.debugMode) {
      console.log(`📊 Built ${this.nodes.length} timeline nodes`);
    }
  }

  /**
   * Calculate node X position
   * @param {Object} data - Node data
   * @param {number} index - Node index
   * @returns {number} X position
   */
  calculateNodeX(data, index) {
    const baseX = 100;
    const levelOffset = data.level * this.config.nodeSpacing;
    const indexOffset = (index % 3) * 150; // Spread nodes horizontally
    
    return baseX + levelOffset + indexOffset;
  }

  /**
   * Calculate node Y position
   * @param {Object} data - Node data
   * @param {number} index - Node index
   * @returns {number} Y position
   */
  calculateNodeY(data, index) {
    const baseY = 200;
    const levelOffset = data.level * this.config.branchHeight;
    const variation = Math.sin(index) * 30; // Add some variation
    
    return baseY + levelOffset + variation;
  }

  /**
   * Build connections between nodes
   */
  buildConnections() {
    for (const node of this.nodes) {
      for (const childId of node.children) {
        const childNode = this.nodes.find(n => n.id === childId);
        if (childNode) {
          this.connections.push({
            from: node,
            to: childNode,
            visible: node.visible && childNode.visible
          });
        }
      }
    }
  }

  /**
   * Drill down into a timeline node
   * @param {Object} data - Drill down data
   */
  drillDown(data) {
    const { node } = data;
    
    if (this.currentLevel >= this.config.maxDrillDepth) {
      console.warn('📊 Maximum drill depth reached');
      return;
    }
    
    // Add to drill path
    this.drillPath.push({
      level: this.currentLevel,
      node: this.selectedNode,
      pan: { x: this.panX, y: this.panY },
      zoom: this.zoom
    });
    
    // Increase current level
    this.currentLevel++;
    this.selectedNode = node;
    
    // Update node visibility
    this.updateNodeVisibility();
    
    // Focus on selected node
    this.focusOnNode(node);
    
    // Start drill animation
    this.startDrillAnimation(node);
    
    eventBus.emit('timeline-mode:drilled-down', { 
      node, 
      level: this.currentLevel 
    });
    
    if (this.debugMode) {
      console.log(`📊 Drilled down to level ${this.currentLevel}: ${node.title}`);
    }
  }

  /**
   * Drill up to previous level
   */
  drillUp() {
    if (this.drillPath.length === 0) {
      // Exit timeline mode
      eventBus.emit('timeline:exit-requested');
      return;
    }
    
    // Restore previous state
    const previousState = this.drillPath.pop();
    this.currentLevel = previousState.level;
    this.selectedNode = previousState.node;
    
    // Restore view
    this.targetPanX = previousState.pan.x;
    this.targetPanY = previousState.pan.y;
    this.targetZoom = previousState.zoom;
    
    // Update node visibility
    this.updateNodeVisibility();
    
    eventBus.emit('timeline-mode:drilled-up', { 
      level: this.currentLevel 
    });
    
    if (this.debugMode) {
      console.log(`📊 Drilled up to level ${this.currentLevel}`);
    }
  }

  /**
   * Update node visibility based on current level
   */
  updateNodeVisibility() {
    for (const node of this.nodes) {
      node.visible = node.level <= this.currentLevel + 1;
    }
    
    // Update connection visibility
    for (const connection of this.connections) {
      connection.visible = connection.from.visible && connection.to.visible;
    }
  }

  /**
   * Focus camera on a specific node
   * @param {Object} node - Node to focus on
   */
  focusOnNode(node) {
    this.targetPanX = -node.x + window.innerWidth / 2;
    this.targetPanY = -node.y + window.innerHeight / 2;
    this.targetZoom = 1.5;
  }

  /**
   * Start expand animation
   */
  startExpandAnimation() {
    this.expandAnimation.active = true;
    this.expandAnimation.progress = 0;
    this.expandAnimation.startTime = performance.now();
    
    eventBus.emit('timeline-mode:expand-start');
  }

  /**
   * Start drill animation
   * @param {Object} node - Target node
   */
  startDrillAnimation(node) {
    this.animations.push({
      type: 'drill',
      target: node,
      time: 0,
      duration: 600,
      progress: 0,
      onComplete: () => {
        eventBus.emit('timeline-mode:drill-animation-complete', { node });
      }
    });
  }

  /**
   * Reset timeline view
   */
  resetView() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.targetZoom = 1.0;
    this.targetPanX = 0;
    this.targetPanY = 0;
  }

  /**
   * Get timeline bounds
   * @returns {Object} Bounds object
   */
  getTimelineBounds() {
    return {
      left: 0,
      right: window.innerWidth || 800,
      top: 0,
      bottom: window.innerHeight || 600
    };
  }

  /**
   * Handle player updated
   * @param {Object} data - Player data
   */
  onPlayerUpdated(data) {
    if (!this.active) return;
    
    // Player movement affects timeline navigation
  }

  /**
   * Handle key down
   * @param {Object} data - Key event data
   */
  onKeyDown(data) {
    if (!this.active) return;
    
    const { code } = data;
    
    switch (code) {
      case 'ArrowUp':
      case 'KeyW':
        // Check for timeline exit
        if (this.drillPath.length === 0) {
          eventBus.emit('timeline:exit-requested');
        } else {
          this.drillUp();
        }
        break;
        
      case 'ArrowDown':
      case 'KeyS':
        // Drill down if node selected
        if (this.selectedNode && this.selectedNode.children.length > 0) {
          this.drillDown({ node: this.selectedNode });
        }
        break;
        
      case 'Escape':
        // Exit timeline
        eventBus.emit('timeline:exit-requested');
        break;
        
      case 'KeyZ':
        // Zoom controls (debug)
        if (this.debugMode) {
          this.targetZoom = clamp(this.targetZoom + 0.2, this.config.minZoom, this.config.maxZoom);
        }
        break;
        
      case 'KeyX':
        // Zoom out (debug)
        if (this.debugMode) {
          this.targetZoom = clamp(this.targetZoom - 0.2, this.config.minZoom, this.config.maxZoom);
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
    
    const { x, y, button } = data;
    
    if (button === 0) { // Left click
      // Check for node clicks
      const clickedNode = this.findNodeAtPosition(x, y);
      if (clickedNode) {
        this.selectedNode = clickedNode;
        eventBus.emit('timeline-mode:node-selected', { node: clickedNode });
      } else {
        // Start panning
        this.isDragging = true;
        this.dragStart = { x, y };
        this.lastDragPos = { x, y };
      }
    }
  }

  /**
   * Handle mouse move
   * @param {Object} data - Mouse event data
   */
  onMouseMove(data) {
    if (!this.active) return;
    
    const { x, y } = data;
    
    if (this.isDragging) {
      // Pan the view
      const deltaX = x - this.lastDragPos.x;
      const deltaY = y - this.lastDragPos.y;
      
      this.targetPanX += deltaX;
      this.targetPanY += deltaY;
      
      this.lastDragPos = { x, y };
    } else {
      // Check for node hover
      const hoveredNode = this.findNodeAtPosition(x, y);
      if (hoveredNode !== this.hoveredNode) {
        this.hoveredNode = hoveredNode;
        eventBus.emit('timeline-mode:node-hovered', { node: hoveredNode });
      }
    }
  }

  /**
   * Handle mouse up
   * @param {Object} data - Mouse event data
   */
  onMouseUp(data) {
    if (!this.active) return;
    
    this.isDragging = false;
  }

  /**
   * Find node at screen position
   * @param {number} x - Screen X
   * @param {number} y - Screen Y
   * @returns {Object|null} Node or null
   */
  findNodeAtPosition(x, y) {
    // Convert screen coordinates to world coordinates
    const worldX = (x - this.panX) / this.zoom;
    const worldY = (y - this.panY) / this.zoom;
    
    for (const node of this.nodes) {
      if (!node.visible || !node.interactive) continue;
      
      if (worldX >= node.x && worldX <= node.x + node.width &&
          worldY >= node.y && worldY <= node.y + node.height) {
        return node;
      }
    }
    
    return null;
  }

  /**
   * Handle branch selected
   * @param {Object} data - Branch data
   */
  onBranchSelected(data) {
    if (!this.active) return;
    
    this.loadBranchTimeline(data.branch);
  }

  /**
   * Handle mode changed
   * @param {Object} data - Mode change data
   */
  onModeChanged(data) {
    // React to mode changes if needed
  }

  /**
   * Sync timeline data to game state
   * @param {Object} gameState - Game state
   */
  syncToGameState(gameState) {
    if (!gameState.timeline) {
      gameState.timeline = {};
    }
    
    Object.assign(gameState.timeline, {
      active: this.active,
      currentLevel: this.currentLevel,
      maxLevel: this.maxLevel,
      zoom: this.zoom,
      panX: this.panX,
      panY: this.panY,
      selectedNode: this.selectedNode,
      hoveredNode: this.hoveredNode,
      nodeCount: this.nodes.length,
      drillPath: this.drillPath.length
    });
  }

  /**
   * Ease out cubic function
   * @param {number} t - Time (0-1)
   * @returns {number} Eased value
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Get timeline mode state
   * @returns {Object} Current state
   */
  getState() {
    return {
      active: this.active,
      currentBranch: this.currentBranch,
      currentLevel: this.currentLevel,
      maxLevel: this.maxLevel,
      nodeCount: this.nodes.length,
      view: {
        zoom: this.zoom,
        panX: this.panX,
        panY: this.panY
      },
      interaction: {
        selectedNode: this.selectedNode?.id,
        hoveredNode: this.hoveredNode?.id,
        isDragging: this.isDragging
      },
      animation: {
        expanding: this.expandAnimation.active,
        activeAnimations: this.animations.length
      }
    };
  }

  /**
   * Enable/disable timeline mode
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('timeline-mode:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup timeline mode
   */
  destroy() {
    this.active = false;
    this.timelineData = [];
    this.nodes = [];
    this.connections = [];
    this.animations = [];
    
    eventBus.emit('timeline-mode:destroyed');
  }
}

export { TimelineMode };
