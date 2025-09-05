/**
 * Rendering System
 * Extracted from original game.js render functionality
 * Maintains exact visual output and rendering behavior
 */

import { eventBus } from '../../core/EventBus.js';
import { CANVAS, ROAD_CONFIG, TIMELINE_CONFIG, COLORS, BILLBOARDS } from '../../config/constants.js';
import * as mathUtils from '../../utils/math.js';
import * as performanceUtils from '../../utils/performance.js';

export class RenderingSystem {
  constructor() {
    this.name = 'RenderingSystem';
    this.enabled = true;
    this.debugMode = false;
    
    // Canvas and context
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    
    // Performance tracking
    this.renderStats = {
      frameCount: 0,
      renderTime: 0,
      lastRenderTime: 0,
      averageRenderTime: 0
    };
    
    // Cached resources
    this.imageCache = new Map();
    this.fontCache = new Map();
    
    // Original rendering state
    this.roadOffset = 0;
    this.roadSegments = [];
    this.hillOffset = 0;
    
    this.init();
  }

  /**
   * Initialize rendering system
   */
  init() {
    this.setupCanvas();
    this.loadImages();
    this.setupEventListeners();
    
    if (this.debugMode) {
      console.log('🎨 Rendering System initialized');
    }
    
    eventBus.emit('render:initialized');
  }

  /**
   * Setup main canvas
   */
  setupCanvas() {
    this.canvas = document.getElementById('game');
    if (!this.canvas) {
      console.error('Canvas element "game" not found');
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    
    // Setup high DPI support
    const pixelRatio = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * pixelRatio;
    this.canvas.height = rect.height * pixelRatio;
    this.ctx.scale(pixelRatio, pixelRatio);
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.width = rect.width;
    this.height = rect.height;
  }

  /**
   * Load and cache images - matches original game.js
   */
  loadImages() {
    const imagesToLoad = [
      'assets/kghs1.png',
      'assets/kghs2.png',
      'assets/rc1.png',
      'assets/rc2.png',
      'assets/Logo-SparkIt.png'
    ];
    
    imagesToLoad.forEach(src => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(src, img);
        if (this.debugMode) {
          console.log(`🖼️ Loaded image: ${src}`);
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load image: ${src}`);
      };
      img.src = src;
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    window.addEventListener('resize', () => this.resize());
    
    eventBus.on('game:mode-changed', (data) => {
      this.onModeChanged(data.mode);
    });
    
    eventBus.on('theme:changed', (data) => {
      this.onThemeChanged(data.theme);
    });
  }

  /**
   * Handle window resize
   */
  resize() {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    eventBus.emit('render:resized', { width: this.width, height: this.height });
  }

  /**
   * Main render function - matches original game.js render logic
   * @param {Object} state - Current game state
   * @param {number} deltaTime - Frame delta time
   */
  render(state, deltaTime) {
    if (!this.enabled || !this.ctx) return;
    
    const startTime = performance.now();
    
    // Clear canvas
    this.clear();
    
    // Render based on current mode
    if (state.mode === 'road') {
      this.renderRoadMode(state, deltaTime);
    } else if (state.mode === 'timeline') {
      this.renderTimelineMode(state, deltaTime);
    }
    
    // Render UI overlay
    this.renderUI(state);
    
    // Update performance stats
    this.updateRenderStats(startTime);
    
    eventBus.emit('render:frame-complete', { 
      deltaTime, 
      renderTime: this.renderStats.lastRenderTime 
    });
  }

  /**
   * Clear canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Render road mode - exact match to original
   * @param {Object} state - Game state
   * @param {number} deltaTime - Delta time
   */
  renderRoadMode(state, deltaTime) {
    const { ctx } = this;
    const { camera, player, theme } = state;
    
    // Background
    this.renderBackground(state);
    
    // Hills
    this.renderHills(state);
    
    // Road
    this.renderRoad(state);
    
    // Road markings
    this.renderRoadMarkings(state);
    
    // Billboards and signs
    this.renderBillboards(state);
    
    // Player
    this.renderPlayer(state);
    
    // Ghost (if active)
    if (state.ghost && state.ghost.active) {
      this.renderGhost(state);
    }
    
    // Spotlight effect
    if (state.spotlight && state.spotlight.active) {
      this.renderSpotlight(state);
    }
    
    // Road signs text
    this.renderRoadSigns(state);
  }

  /**
   * Render timeline mode - exact match to original
   * @param {Object} state - Game state
   * @param {number} deltaTime - Delta time
   */
  renderTimelineMode(state, deltaTime) {
    const { ctx } = this;
    const { camera, player, timeline } = state;
    
    // Background
    this.renderTimelineBackground(state);
    
    // Timeline elements
    this.renderTimelineElements(state);
    
    // Player
    this.renderTimelinePlayer(state);
    
    // Timeline UI
    this.renderTimelineUI(state);
  }

  /**
   * Render background - matches original exactly
   * @param {Object} state - Game state
   */
  renderBackground(state) {
    const { ctx } = this;
    const { theme } = state;
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    
    if (theme === 'dark') {
      gradient.addColorStop(0, '#0c0c0c');
      gradient.addColorStop(0.5, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
    } else {
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.5, '#98D8E8');
      gradient.addColorStop(1, '#B0E0E6');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Sun/Moon
    this.renderCelestialBody(state);
  }

  /**
   * Render sun or moon based on theme
   * @param {Object} state - Game state
   */
  renderCelestialBody(state) {
    const { ctx } = this;
    const { theme } = state;
    
    ctx.save();
    
    if (theme === 'dark') {
      // Moon
      ctx.fillStyle = '#F5F5DC';
      ctx.beginPath();
      ctx.arc(this.width - 100, 80, 30, 0, Math.PI * 2);
      ctx.fill();
      
      // Moon craters
      ctx.fillStyle = '#E6E6E6';
      ctx.beginPath();
      ctx.arc(this.width - 110, 75, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.width - 95, 85, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Sun
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(this.width - 100, 80, 35, 0, Math.PI * 2);
      ctx.fill();
      
      // Sun rays
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = this.width - 100 + Math.cos(angle) * 45;
        const y1 = 80 + Math.sin(angle) * 45;
        const x2 = this.width - 100 + Math.cos(angle) * 60;
        const y2 = 80 + Math.sin(angle) * 60;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }

  /**
   * Render hills - matches original exactly
   * @param {Object} state - Game state
   */
  renderHills(state) {
    const { ctx } = this;
    const { camera, theme } = state;
    
    // Background hills
    this.hillOffset += 0.2; // Parallax scrolling
    
    ctx.save();
    ctx.fillStyle = theme === 'dark' ? '#2d3748' : '#90EE90';
    
    // Multiple hill layers for depth
    for (let layer = 0; layer < 3; layer++) {
      const layerOffset = this.hillOffset * (0.3 + layer * 0.1);
      const layerHeight = 100 + layer * 50;
      
      ctx.beginPath();
      ctx.moveTo(0, this.height - layerHeight);
      
      for (let x = 0; x <= this.width + 100; x += 50) {
        const y = this.height - layerHeight + 
                  Math.sin((x + layerOffset) * 0.01) * 30 +
                  Math.sin((x + layerOffset) * 0.02) * 20;
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(this.width, this.height);
      ctx.lineTo(0, this.height);
      ctx.closePath();
      ctx.fill();
      
      // Darker shade for each layer
      ctx.fillStyle = theme === 'dark' ? 
        `rgba(45, 55, 72, ${0.8 - layer * 0.2})` : 
        `rgba(144, 238, 144, ${0.8 - layer * 0.2})`;
    }
    
    ctx.restore();
  }

  /**
   * Render road - matches original exactly
   * @param {Object} state - Game state
   */
  renderRoad(state) {
    const { ctx } = this;
    const { camera, theme } = state;
    
    const roadY = this.height - ROAD_CONFIG.height;
    const roadWidth = ROAD_CONFIG.width;
    
    // Main road
    ctx.fillStyle = theme === 'dark' ? '#2d3748' : '#696969';
    ctx.fillRect(0, roadY, this.width, ROAD_CONFIG.height);
    
    // Road edges
    ctx.fillStyle = theme === 'dark' ? '#1a202c' : '#556B2F';
    ctx.fillRect(0, roadY - 10, this.width, 10); // Top edge
    ctx.fillRect(0, this.height - 10, this.width, 10); // Bottom edge
    
    // Road texture (optional subtle lines)
    ctx.strokeStyle = theme === 'dark' ? '#4a5568' : '#808080';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    
    for (let i = 0; i < 5; i++) {
      const y = roadY + (i + 1) * (ROAD_CONFIG.height / 6);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }

  /**
   * Render road markings - matches original exactly
   * @param {Object} state - Game state
   */
  renderRoadMarkings(state) {
    const { ctx } = this;
    const { camera, theme } = state;
    
    this.roadOffset += 5; // Scrolling effect
    
    const markingWidth = 40;
    const markingHeight = 4;
    const spacing = 80;
    const roadCenterY = this.height - ROAD_CONFIG.height / 2;
    
    ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#FFFF00';
    
    // Center line dashes
    for (let x = -this.roadOffset % spacing; x < this.width + markingWidth; x += spacing) {
      ctx.fillRect(x, roadCenterY - markingHeight / 2, markingWidth, markingHeight);
    }
    
    // Side lines (solid)
    const sideY = roadCenterY;
    const sideLineWidth = 3;
    
    ctx.fillRect(0, roadCenterY - 30 - sideLineWidth / 2, this.width, sideLineWidth);
    ctx.fillRect(0, roadCenterY + 30 - sideLineWidth / 2, this.width, sideLineWidth);
  }

  /**
   * Render billboards - matches original exactly
   * @param {Object} state - Game state
   */
  renderBillboards(state) {
    const { ctx } = this;
    const { camera } = state;
    
    const billboards = this.getBillboards();
    
    billboards.forEach(billboard => {
      const screenX = billboard.x - camera.x;
      
      // Only render if on screen
      if (screenX > -200 && screenX < this.width + 200) {
        this.renderBillboard(billboard, screenX);
      }
    });
  }

  /**
   * Render single billboard
   * @param {Object} billboard - Billboard data
   * @param {number} screenX - Screen X position
   */
  renderBillboard(billboard, screenX) {
    const { ctx } = this;
    
    const billboardY = this.height - ROAD_CONFIG.height - 120;
    const billboardWidth = 150;
    const billboardHeight = 100;
    
    // Billboard background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX, billboardY, billboardWidth, billboardHeight);
    
    // Billboard border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, billboardY, billboardWidth, billboardHeight);
    
    // Billboard content
    if (billboard.image && this.imageCache.has(billboard.image)) {
      const img = this.imageCache.get(billboard.image);
      ctx.drawImage(img, screenX + 10, billboardY + 10, 
                   billboardWidth - 20, billboardHeight - 40);
    }
    
    // Billboard text
    if (billboard.text) {
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(billboard.text, 
                  screenX + billboardWidth / 2, 
                  billboardY + billboardHeight - 15);
    }
    
    // Support posts
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(screenX + 20, billboardY + billboardHeight, 8, 30);
    ctx.fillRect(screenX + billboardWidth - 28, billboardY + billboardHeight, 8, 30);
  }

  /**
   * Render player - matches original exactly
   * @param {Object} state - Game state
   */
  renderPlayer(state) {
    const { ctx } = this;
    const { player, theme } = state;
    
    const playerScreenX = player.x - state.camera.x + this.width / 2;
    const playerY = this.height - ROAD_CONFIG.height - player.height;
    
    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.ellipse(playerScreenX, this.height - ROAD_CONFIG.height + 5, 
               player.width / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Player body
    ctx.fillStyle = theme === 'dark' ? '#4fd1c7' : '#FF6B6B';
    ctx.beginPath();
    ctx.roundRect(playerScreenX - player.width / 2, playerY, 
                 player.width, player.height, 5);
    ctx.fill();
    
    // Player outline
    ctx.strokeStyle = theme === 'dark' ? '#38b2ac' : '#FF5252';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Player details (simple face)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(playerScreenX - 5, playerY + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(playerScreenX + 5, playerY + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Player direction indicator
    if (player.vx !== 0) {
      ctx.fillStyle = theme === 'dark' ? '#ffd89b' : '#4ECDC4';
      const arrowX = playerScreenX + (player.vx > 0 ? 15 : -15);
      const arrowY = playerY + player.height / 2;
      
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX + (player.vx > 0 ? -8 : 8), arrowY - 4);
      ctx.lineTo(arrowX + (player.vx > 0 ? -8 : 8), arrowY + 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * Render ghost player - matches original exactly
   * @param {Object} state - Game state
   */
  renderGhost(state) {
    const { ctx } = this;
    const { ghost, camera } = state;
    
    const ghostScreenX = ghost.x - camera.x + this.width / 2;
    const ghostY = this.height - ROAD_CONFIG.height - ghost.height;
    
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#cccccc';
    
    ctx.beginPath();
    ctx.roundRect(ghostScreenX - ghost.width / 2, ghostY, 
                 ghost.width, ghost.height, 5);
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * Render spotlight effect - matches original exactly
   * @param {Object} state - Game state
   */
  renderSpotlight(state) {
    const { ctx } = this;
    const { spotlight } = state;
    
    if (!spotlight.active) return;
    
    ctx.save();
    
    // Create spotlight mask
    const gradient = ctx.createRadialGradient(
      spotlight.x, spotlight.y, 0,
      spotlight.x, spotlight.y, spotlight.radius
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    
    // Dark overlay everywhere except spotlight
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Cut out spotlight area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    
    ctx.restore();
  }

  /**
   * Render road signs - matches original exactly
   * @param {Object} state - Game state
   */
  renderRoadSigns(state) {
    const { ctx } = this;
    const { camera, near } = state;
    
    const branches = this.getBranches();
    
    branches.forEach(branch => {
      const screenX = branch.x - camera.x;
      
      // Only render if on screen
      if (screenX > -100 && screenX < this.width + 100) {
        this.renderRoadSign(branch, screenX, branch === near);
      }
    });
  }

  /**
   * Render single road sign
   * @param {Object} branch - Branch data
   * @param {number} screenX - Screen X position
   * @param {boolean} isNear - Is player near this sign
   */
  renderRoadSign(branch, screenX, isNear) {
    const { ctx } = this;
    
    const signY = this.height - ROAD_CONFIG.height - 80;
    const signWidth = 80;
    const signHeight = 60;
    
    // Sign background
    ctx.fillStyle = isNear ? '#ffff88' : '#ffffff';
    ctx.fillRect(screenX - signWidth / 2, signY, signWidth, signHeight);
    
    // Sign border
    ctx.strokeStyle = isNear ? '#ff6b6b' : '#000000';
    ctx.lineWidth = isNear ? 3 : 2;
    ctx.strokeRect(screenX - signWidth / 2, signY, signWidth, signHeight);
    
    // Sign text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    
    const words = branch.label.split(' ');
    words.forEach((word, i) => {
      ctx.fillText(word, screenX, signY + 20 + i * 12);
    });
    
    // Sign post
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(screenX - 4, signY + signHeight, 8, 25);
    
    // Interaction indicator
    if (isNear) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 12px Arial';
      ctx.fillText('Press E', screenX, signY - 10);
    }
  }

  /**
   * Timeline mode rendering methods
   */
  renderTimelineBackground(state) {
    const { ctx } = this;
    const { theme } = state;
    
    // Simple background for timeline
    ctx.fillStyle = theme === 'dark' ? '#1a1a1a' : '#f0f0f0';
    ctx.fillRect(0, 0, this.width, this.height);
  }

  renderTimelineElements(state) {
    const { ctx } = this;
    const { timeline, camera } = state;
    
    // Render timeline elements based on current drill level
    // This is a simplified version - full implementation would match original
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Timeline Mode', this.width / 2, 50);
  }

  renderTimelinePlayer(state) {
    const { ctx } = this;
    const { player } = state;
    
    // Simple timeline player representation
    ctx.fillStyle = '#4ECDC4';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  renderTimelineUI(state) {
    // Timeline-specific UI elements
    // Implementation would match original timeline UI
  }

  /**
   * Render UI overlay
   * @param {Object} state - Game state
   */
  renderUI(state) {
    // UI elements like HUD, minimap, etc.
    // Implementation depends on specific UI needs
  }

  /**
   * Handle mode change
   * @param {string} mode - New mode
   */
  onModeChanged(mode) {
    if (this.debugMode) {
      console.log(`🎨 Render mode changed to: ${mode}`);
    }
  }

  /**
   * Handle theme change
   * @param {string} theme - New theme
   */
  onThemeChanged(theme) {
    if (this.debugMode) {
      console.log(`🎨 Theme changed to: ${theme}`);
    }
  }

  /**
   * Update render performance stats
   * @param {number} startTime - Render start time
   */
  updateRenderStats(startTime) {
    const endTime = performance.now();
    this.renderStats.lastRenderTime = endTime - startTime;
    this.renderStats.frameCount++;
    
    // Calculate rolling average
    const alpha = 0.1;
    this.renderStats.averageRenderTime = 
      this.renderStats.averageRenderTime * (1 - alpha) + 
      this.renderStats.lastRenderTime * alpha;
  }

  /**
   * Helper methods for compatibility
   */
  getBillboards() {
    return window.GAME_DATA?.billboards || [];
  }

  getBranches() {
    return window.GAME_DATA?.branches || [];
  }

  /**
   * Get render statistics
   * @returns {Object} Render stats
   */
  getRenderStats() {
    return { ...this.renderStats };
  }

  /**
   * Enable/disable rendering
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('render:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup rendering system
   */
  destroy() {
    this.imageCache.clear();
    this.fontCache.clear();
    eventBus.emit('render:destroyed');
  }
}

// Export singleton instance
export const renderingSystem = new RenderingSystem();
