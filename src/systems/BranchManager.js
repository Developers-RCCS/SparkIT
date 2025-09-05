/**
 * Branch Manager System
 * Handles road sign interactions, branch selections, and content management
 * Manages the learning path progression and decision points
 */

import { eventBus } from '../core/EventBus.js';
import { distance, clamp } from '../utils/math.js';
import { BRANCH_CONFIG, WORLD } from '../config/constants.js';

export class BranchManager {
  constructor() {
    this.name = 'BranchManager';
    this.enabled = true;
    this.debugMode = false;
    
    // Branch data
    this.branches = [];
    this.currentBranch = null;
    this.branchHistory = [];
    this.availableBranches = [];
    
    // Interaction state
    this.nearbyBranches = [];
    this.selectedBranch = null;
    this.interactionRange = BRANCH_CONFIG.interactionRange || 100;
    this.autoSelectRange = BRANCH_CONFIG.autoSelectRange || 50;
    
    // Branch progression
    this.completedBranches = new Set();
    this.unlockedBranches = new Set();
    this.branchProgress = new Map();
    
    // Decision points
    this.decisionPoints = [];
    this.activeDecision = null;
    this.decisionTimeout = null;
    
    // Sign management
    this.roadSigns = [];
    this.billboards = [];
    this.nextSignId = 1;
    
    // Performance tracking
    this.lastUpdateTime = 0;
    this.updateFrequency = 60; // Updates per second
    this.performanceStats = {
      branchChecks: 0,
      interactionTests: 0,
      signUpdates: 0
    };
    
    this.init();
  }

  /**
   * Initialize branch manager
   */
  init() {
    this.loadBranchData();
    this.setupEventListeners();
    this.initializeUnlockedBranches();
    
    if (this.debugMode) {
      console.log('🎯 Branch Manager initialized');
    }
    
    eventBus.emit('branch-manager:initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Player events
    eventBus.on('player:updated', (data) => this.onPlayerUpdated(data));
    eventBus.on('player:interacted', (data) => this.onPlayerInteraction(data));
    
    // Input events
    eventBus.on('input:key:down', (data) => this.onKeyDown(data));
    
    // Mode events
    eventBus.on('mode:changed', (data) => this.onModeChanged(data));
    eventBus.on('road-mode:entered', () => this.onRoadModeEntered());
    eventBus.on('timeline-mode:entered', () => this.onTimelineModeEntered());
    
    // Branch events
    eventBus.on('branch:selection-timeout', () => this.onSelectionTimeout());
    eventBus.on('world:progress-updated', (data) => this.onProgressUpdated(data));
  }

  /**
   * Load branch data from content system
   */
  loadBranchData() {
    // This would normally load from content.json or API
    // For now, create sample branch data
    this.branches = [
      {
        id: 'intro',
        label: 'Getting Started',
        type: 'tutorial',
        position: { x: 200, y: 300 },
        content: {
          title: 'Welcome to SparkIT',
          description: 'Learn the basics of our platform',
          lessons: ['intro-1', 'intro-2', 'intro-3']
        },
        prerequisites: [],
        unlocks: ['coding-basics', 'design-intro'],
        difficulty: 1,
        estimatedTime: 15,
        category: 'fundamentals'
      },
      
      {
        id: 'coding-basics',
        label: 'Coding Fundamentals',
        type: 'learning',
        position: { x: 400, y: 250 },
        content: {
          title: 'Programming Basics',
          description: 'Learn fundamental programming concepts',
          lessons: ['variables', 'functions', 'loops', 'conditionals']
        },
        prerequisites: ['intro'],
        unlocks: ['javascript-intro', 'python-basics'],
        difficulty: 2,
        estimatedTime: 45,
        category: 'programming'
      },
      
      {
        id: 'design-intro',
        label: 'Design Principles',
        type: 'learning',
        position: { x: 400, y: 350 },
        content: {
          title: 'Design Fundamentals',
          description: 'Learn core design principles',
          lessons: ['color-theory', 'typography', 'layout', 'user-experience']
        },
        prerequisites: ['intro'],
        unlocks: ['ui-design', 'graphic-design'],
        difficulty: 2,
        estimatedTime: 30,
        category: 'design'
      },
      
      {
        id: 'javascript-intro',
        label: 'JavaScript Basics',
        type: 'learning',
        position: { x: 600, y: 200 },
        content: {
          title: 'JavaScript Programming',
          description: 'Learn JavaScript fundamentals',
          lessons: ['js-syntax', 'dom-manipulation', 'events', 'async']
        },
        prerequisites: ['coding-basics'],
        unlocks: ['web-development', 'react-intro'],
        difficulty: 3,
        estimatedTime: 60,
        category: 'web-development'
      },
      
      {
        id: 'python-basics',
        label: 'Python Programming',
        type: 'learning',
        position: { x: 600, y: 300 },
        content: {
          title: 'Python Fundamentals',
          description: 'Learn Python programming',
          lessons: ['python-syntax', 'data-structures', 'modules', 'file-handling']
        },
        prerequisites: ['coding-basics'],
        unlocks: ['data-science', 'web-backend'],
        difficulty: 3,
        estimatedTime: 50,
        category: 'programming'
      }
    ];
    
    this.generateRoadSigns();
    
    if (this.debugMode) {
      console.log(`🎯 Loaded ${this.branches.length} branches`);
    }
  }

  /**
   * Generate road signs for branches
   */
  generateRoadSigns() {
    this.roadSigns = [];
    
    for (const branch of this.branches) {
      const sign = {
        id: `sign-${branch.id}`,
        branchId: branch.id,
        position: { ...branch.position },
        type: 'branch-sign',
        width: 80,
        height: 60,
        content: {
          title: branch.label,
          subtitle: `${branch.estimatedTime}min • ${branch.category}`,
          difficulty: branch.difficulty
        },
        interactive: true,
        visible: true
      };
      
      this.roadSigns.push(sign);
    }
    
    // Add some decorative billboards
    this.billboards = [
      {
        id: 'welcome-billboard',
        position: { x: 50, y: 280 },
        type: 'billboard',
        width: 120,
        height: 80,
        content: {
          title: 'Welcome to SparkIT',
          subtitle: 'Your Learning Journey Starts Here',
          image: 'Logo-SparkIt.png'
        },
        interactive: false,
        visible: true
      },
      
      {
        id: 'progress-billboard',
        position: { x: 800, y: 250 },
        type: 'billboard',
        width: 100,
        height: 70,
        content: {
          title: 'Keep Going!',
          subtitle: 'You\'re doing great',
          dynamic: true
        },
        interactive: false,
        visible: true
      }
    ];
  }

  /**
   * Initialize unlocked branches based on progress
   */
  initializeUnlockedBranches() {
    // Start with intro branch unlocked
    this.unlockedBranches.add('intro');
    
    // Check for any saved progress
    const savedProgress = this.loadSavedProgress();
    if (savedProgress) {
      this.completedBranches = new Set(savedProgress.completed || []);
      this.unlockedBranches = new Set(savedProgress.unlocked || ['intro']);
      this.branchProgress = new Map(savedProgress.progress || []);
    }
    
    this.updateAvailableBranches();
  }

  /**
   * Update branch manager - called every frame
   * @param {number} deltaTime - Frame delta time
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (!this.enabled) return;
    
    const now = performance.now();
    if (now - this.lastUpdateTime < 1000 / this.updateFrequency) return;
    
    this.lastUpdateTime = now;
    
    // Update player interactions with branches
    this.updatePlayerInteractions(gameState);
    
    // Update decision timeouts
    this.updateDecisionTimeouts(deltaTime);
    
    // Update dynamic content
    this.updateDynamicContent(gameState);
    
    // Sync to game state
    this.syncToGameState(gameState);
    
    eventBus.emit('branch-manager:updated', { deltaTime });
  }

  /**
   * Update player interactions with branches
   * @param {Object} gameState - Game state
   */
  updatePlayerInteractions(gameState) {
    const player = gameState.player;
    if (!player) return;
    
    this.performanceStats.branchChecks++;
    
    // Find nearby branches
    this.nearbyBranches = [];
    
    for (const sign of this.roadSigns) {
      const dist = distance(player.x, player.y, sign.position.x, sign.position.y);
      
      this.performanceStats.interactionTests++;
      
      if (dist <= this.interactionRange) {
        const branch = this.getBranchById(sign.branchId);
        if (branch && this.isBranchAccessible(branch)) {
          this.nearbyBranches.push({
            branch,
            sign,
            distance: dist,
            canInteract: dist <= this.autoSelectRange
          });
        }
      }
    }
    
    // Sort by distance
    this.nearbyBranches.sort((a, b) => a.distance - b.distance);
    
    // Auto-select closest branch if in range
    if (this.nearbyBranches.length > 0) {
      const closest = this.nearbyBranches[0];
      if (closest.canInteract && this.selectedBranch !== closest.branch) {
        this.selectBranch(closest.branch);
      }
    } else if (this.selectedBranch) {
      this.deselectBranch();
    }
  }

  /**
   * Update decision timeouts
   * @param {number} deltaTime - Delta time
   */
  updateDecisionTimeouts(deltaTime) {
    if (this.activeDecision && this.decisionTimeout) {
      this.decisionTimeout -= deltaTime;
      
      if (this.decisionTimeout <= 0) {
        this.onSelectionTimeout();
      }
    }
  }

  /**
   * Update dynamic content
   * @param {Object} gameState - Game state
   */
  updateDynamicContent(gameState) {
    this.performanceStats.signUpdates++;
    
    // Update progress billboard
    const progressBillboard = this.billboards.find(b => b.id === 'progress-billboard');
    if (progressBillboard && progressBillboard.content.dynamic) {
      const completedCount = this.completedBranches.size;
      const totalCount = this.branches.length;
      const percentage = Math.round((completedCount / totalCount) * 100);
      
      progressBillboard.content.subtitle = `${percentage}% Complete`;
    }
  }

  /**
   * Select a branch for interaction
   * @param {Object} branch - Branch to select
   */
  selectBranch(branch) {
    if (this.selectedBranch === branch) return;
    
    this.selectedBranch = branch;
    
    // Start decision timer if configured
    if (BRANCH_CONFIG.selectionTimeout) {
      this.startDecisionTimer(branch);
    }
    
    eventBus.emit('branch:selected', { 
      branch,
      position: branch.position,
      canEnter: this.isBranchAccessible(branch)
    });
    
    if (this.debugMode) {
      console.log(`🎯 Branch selected: ${branch.label}`);
    }
  }

  /**
   * Deselect current branch
   */
  deselectBranch() {
    if (!this.selectedBranch) return;
    
    const previousBranch = this.selectedBranch;
    this.selectedBranch = null;
    
    this.clearDecisionTimer();
    
    eventBus.emit('branch:deselected', { branch: previousBranch });
    
    if (this.debugMode) {
      console.log('🎯 Branch deselected');
    }
  }

  /**
   * Enter a branch (start learning content)
   * @param {Object} branch - Branch to enter
   */
  enterBranch(branch) {
    if (!this.isBranchAccessible(branch)) {
      console.warn(`🎯 Cannot enter branch: ${branch.label} - not accessible`);
      return false;
    }
    
    this.currentBranch = branch;
    this.branchHistory.push(branch.id);
    
    // Mark branch as started
    this.setBranchProgress(branch.id, { started: true, startTime: Date.now() });
    
    eventBus.emit('branch:entered', { 
      branch,
      timeline: this.shouldEnterTimeline(branch)
    });
    
    if (this.debugMode) {
      console.log(`🎯 Entered branch: ${branch.label}`);
    }
    
    return true;
  }

  /**
   * Complete a branch
   * @param {string} branchId - Branch ID to complete
   * @param {Object} completionData - Completion data
   */
  completeBranch(branchId, completionData = {}) {
    const branch = this.getBranchById(branchId);
    if (!branch) return;
    
    // Mark as completed
    this.completedBranches.add(branchId);
    
    // Update progress
    this.setBranchProgress(branchId, {
      completed: true,
      completionTime: Date.now(),
      score: completionData.score || 0,
      timeSpent: completionData.timeSpent || 0
    });
    
    // Unlock new branches
    this.unlockBranches(branch.unlocks || []);
    
    eventBus.emit('branch:completed', { 
      branch,
      completionData,
      newlyUnlocked: this.getNewlyUnlockedBranches(branch.unlocks || [])
    });
    
    // Save progress
    this.saveProgress();
    
    if (this.debugMode) {
      console.log(`🎯 Branch completed: ${branch.label}`);
    }
  }

  /**
   * Unlock branches
   * @param {Array} branchIds - Branch IDs to unlock
   */
  unlockBranches(branchIds) {
    const newlyUnlocked = [];
    
    for (const branchId of branchIds) {
      if (!this.unlockedBranches.has(branchId)) {
        const branch = this.getBranchById(branchId);
        if (branch && this.arePrerequisitesMet(branch)) {
          this.unlockedBranches.add(branchId);
          newlyUnlocked.push(branch);
        }
      }
    }
    
    if (newlyUnlocked.length > 0) {
      this.updateAvailableBranches();
      
      eventBus.emit('branches:unlocked', { 
        branches: newlyUnlocked 
      });
    }
    
    return newlyUnlocked;
  }

  /**
   * Check if branch is accessible
   * @param {Object} branch - Branch to check
   * @returns {boolean} Is accessible
   */
  isBranchAccessible(branch) {
    return this.unlockedBranches.has(branch.id) && 
           this.arePrerequisitesMet(branch);
  }

  /**
   * Check if prerequisites are met
   * @param {Object} branch - Branch to check
   * @returns {boolean} Prerequisites met
   */
  arePrerequisitesMet(branch) {
    if (!branch.prerequisites || branch.prerequisites.length === 0) {
      return true;
    }
    
    return branch.prerequisites.every(prereqId => 
      this.completedBranches.has(prereqId)
    );
  }

  /**
   * Determine if branch should enter timeline mode
   * @param {Object} branch - Branch to check
   * @returns {boolean} Should enter timeline
   */
  shouldEnterTimeline(branch) {
    // Enter timeline for learning branches with multiple lessons
    return branch.type === 'learning' && 
           branch.content.lessons && 
           branch.content.lessons.length > 1;
  }

  /**
   * Update available branches list
   */
  updateAvailableBranches() {
    this.availableBranches = this.branches.filter(branch => 
      this.isBranchAccessible(branch)
    );
    
    eventBus.emit('branches:available-updated', { 
      branches: this.availableBranches 
    });
  }

  /**
   * Start decision timer for branch selection
   * @param {Object} branch - Selected branch
   */
  startDecisionTimer(branch) {
    this.activeDecision = {
      branch,
      startTime: performance.now()
    };
    
    this.decisionTimeout = BRANCH_CONFIG.selectionTimeout;
    
    eventBus.emit('branch:decision-started', { 
      branch, 
      timeout: this.decisionTimeout 
    });
  }

  /**
   * Clear decision timer
   */
  clearDecisionTimer() {
    this.activeDecision = null;
    this.decisionTimeout = null;
    
    eventBus.emit('branch:decision-cleared');
  }

  /**
   * Get newly unlocked branches
   * @param {Array} branchIds - Branch IDs to check
   * @returns {Array} Newly unlocked branches
   */
  getNewlyUnlockedBranches(branchIds) {
    return branchIds
      .filter(id => this.unlockedBranches.has(id))
      .map(id => this.getBranchById(id))
      .filter(branch => branch);
  }

  /**
   * Set branch progress
   * @param {string} branchId - Branch ID
   * @param {Object} progress - Progress data
   */
  setBranchProgress(branchId, progress) {
    const existing = this.branchProgress.get(branchId) || {};
    this.branchProgress.set(branchId, { ...existing, ...progress });
    
    eventBus.emit('branch:progress-updated', { 
      branchId, 
      progress: this.branchProgress.get(branchId) 
    });
  }

  /**
   * Get branch by ID
   * @param {string} id - Branch ID
   * @returns {Object|null} Branch or null
   */
  getBranchById(id) {
    return this.branches.find(branch => branch.id === id) || null;
  }

  /**
   * Handle player updated
   * @param {Object} data - Player data
   */
  onPlayerUpdated(data) {
    // Player updates are handled in main update loop
  }

  /**
   * Handle player interaction
   * @param {Object} data - Interaction data
   */
  onPlayerInteraction(data) {
    if (this.selectedBranch) {
      this.enterBranch(this.selectedBranch);
    }
  }

  /**
   * Handle key down
   * @param {Object} data - Key event data
   */
  onKeyDown(data) {
    const { code } = data;
    
    switch (code) {
      case 'Enter':
      case 'Space':
        // Enter selected branch
        if (this.selectedBranch) {
          this.enterBranch(this.selectedBranch);
        }
        break;
        
      case 'Escape':
        // Deselect branch
        if (this.selectedBranch) {
          this.deselectBranch();
        }
        break;
    }
  }

  /**
   * Handle mode changed
   * @param {Object} data - Mode change data
   */
  onModeChanged(data) {
    // Adjust behavior based on current mode
  }

  /**
   * Handle road mode entered
   */
  onRoadModeEntered() {
    this.updateAvailableBranches();
  }

  /**
   * Handle timeline mode entered
   */
  onTimelineModeEntered() {
    // Timeline mode handles branch content
  }

  /**
   * Handle selection timeout
   */
  onSelectionTimeout() {
    if (this.activeDecision) {
      eventBus.emit('branch:selection-timeout', { 
        branch: this.activeDecision.branch 
      });
      
      this.clearDecisionTimer();
    }
  }

  /**
   * Handle progress updated
   * @param {Object} data - Progress data
   */
  onProgressUpdated(data) {
    // React to overall progress changes
    this.updateAvailableBranches();
  }

  /**
   * Sync branch data to game state
   * @param {Object} gameState - Game state
   */
  syncToGameState(gameState) {
    if (!gameState.branches) {
      gameState.branches = {};
    }
    
    Object.assign(gameState.branches, {
      current: this.currentBranch?.id,
      selected: this.selectedBranch?.id,
      nearby: this.nearbyBranches.map(nb => nb.branch.id),
      completed: Array.from(this.completedBranches),
      unlocked: Array.from(this.unlockedBranches),
      available: this.availableBranches.length,
      roadSigns: this.roadSigns.length,
      billboards: this.billboards.length,
      hasDecision: !!this.activeDecision
    });
  }

  /**
   * Load saved progress
   * @returns {Object|null} Saved progress or null
   */
  loadSavedProgress() {
    try {
      const saved = localStorage.getItem('sparkit-branch-progress');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('🎯 Failed to load saved progress:', error);
      return null;
    }
  }

  /**
   * Save current progress
   */
  saveProgress() {
    try {
      const progressData = {
        completed: Array.from(this.completedBranches),
        unlocked: Array.from(this.unlockedBranches),
        progress: Array.from(this.branchProgress.entries()),
        lastSaved: Date.now()
      };
      
      localStorage.setItem('sparkit-branch-progress', JSON.stringify(progressData));
      
      eventBus.emit('branch:progress-saved', { progressData });
    } catch (error) {
      console.warn('🎯 Failed to save progress:', error);
    }
  }

  /**
   * Get branch manager state
   * @returns {Object} Current state
   */
  getState() {
    return {
      branches: this.branches.length,
      currentBranch: this.currentBranch?.id,
      selectedBranch: this.selectedBranch?.id,
      nearbyBranches: this.nearbyBranches.length,
      completedBranches: this.completedBranches.size,
      unlockedBranches: this.unlockedBranches.size,
      availableBranches: this.availableBranches.length,
      hasActiveDecision: !!this.activeDecision,
      roadSigns: this.roadSigns.length,
      billboards: this.billboards.length,
      performanceStats: { ...this.performanceStats }
    };
  }

  /**
   * Enable/disable branch manager
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('branch-manager:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup branch manager
   */
  destroy() {
    this.branches = [];
    this.roadSigns = [];
    this.billboards = [];
    this.nearbyBranches = [];
    this.completedBranches.clear();
    this.unlockedBranches.clear();
    this.branchProgress.clear();
    
    this.clearDecisionTimer();
    
    eventBus.emit('branch-manager:destroyed');
  }
}

export { BranchManager };
