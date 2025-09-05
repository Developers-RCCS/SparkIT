/**
 * Game content configuration
 * Extracted from original game.js to maintain exact functionality
 */

/**
 * Default game data structure
 * Maintains exact structure from original GAME_DATA
 */
export const DEFAULT_GAME_DATA = {
  project: {
    name: "SparkIT — ICT Literacy Initiative",
    tagline: "Igniting ICT literacy across Sri Lanka, one district at a time.",
    about: "Axis 25 explores Sri Lanka's digital economy through hands-on learning and maker energy. Start in Phase 1 to register and pitch your idea; build in Phase 2; showcase in Phase 3.",
    location: "Sri Lanka",
    date: "2024-2025"
  },
  
  phases: [
    {
      id: 1, 
      title: "Phase 1 & 2 — Bridging the Gap",
      summary: "For schools already exposed to ICT, SparkIT strengthens their foundation with advanced programming, robotics, and cybersecurity.",
      open: true,
      formFields: [
        {name:"fullName", label:"Full Name", type:"text", required:true},
        {name:"email", label:"Email", type:"email", required:true},
        {name:"phone", label:"Phone", type:"tel", required:true},
        {name:"bio", label:"Short Bio / Motivation", type:"textarea", required:true}
      ]
    },
    {
      id: 2, 
      title: "Phase 2 — Advanced Foundation",
      summary: "Students dive into advanced topics like programming, robotics, and cybersecurity to match real industry needs.",
      open: false
    },
    {
      id: 3, 
      title: "Phase 3 — The Big Leap",
      summary: "Monthly district workshops with sci-fi themed immersive learning, establishing ICT societies and continuous mentorship.",
      open: false
    }
  ],
  
  branches: [
    { x: 300,  label:"Overview", type:"about" },
    { x: 700,  label:"Phase 1 — Register", type:"phase1" },
    { x: 1150, label:"Phase 2 — Details", type:"phase2" },
    { x: 1600, label:"Phase 3 — Details", type:"phase3" },
    { x: 2000, label:"FAQ", type:"faq" },
    { x: 2400, label:"Contact", type:"contact" }
  ],

  timeline: {
    milestones: [
      { y:160, key:'registration', title:'Registration', text:'Complete your Spark Flash registration.' },
      { y:560, key:'workshop1', title:'Game Dev', text:'Workshop 1 — Game Development: design, engines & rapid prototyping.' },
      { y:960, key:'workshop2', title:'CTF', text:'Workshop 2 — Capture The Flag: hacking challenges & cybersecurity basics.' },
      { y:1360, key:'workshop3', title:'Programming', text:'Workshop 3 — Programming: algorithms, team projects & mentoring.' },
      { y:1760, key:'competitions', title:'Competitions', text:'Pitch, demo & compete for recognition.' }
    ]
  }
};

/**
 * Content manager class for handling dynamic content loading
 */
export class ContentManager {
  constructor() {
    this.gameData = { ...DEFAULT_GAME_DATA };
    this.contentLoaded = false;
    this.listeners = new Map();
    this.contentUrl = 'assets/content.json';
  }

  /**
   * Load content from external source
   * @param {string} url - Content URL (optional)
   * @returns {Promise<Object>} Loaded content
   */
  async loadContent(url = this.contentUrl) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load content: ${response.status}`);
      }
      
      const content = await response.json();
      this.mergeContent(content);
      this.contentLoaded = true;
      this.emit('contentLoaded', this.gameData);
      
      return this.gameData;
    } catch (error) {
      console.warn('Failed to load external content, using defaults:', error);
      this.contentLoaded = true;
      this.emit('contentLoadFailed', error);
      return this.gameData;
    }
  }

  /**
   * Merge external content with defaults
   * @param {Object} content - External content
   */
  mergeContent(content) {
    // Deep merge while preserving structure
    if (content.project) {
      Object.assign(this.gameData.project, content.project);
    }
    
    if (content.phases) {
      this.gameData.phases = content.phases;
    }
    
    if (content.branches) {
      this.gameData.branches = content.branches;
    }
    
    if (content.timeline?.milestones) {
      this.gameData.timeline.milestones = content.timeline.milestones;
    }
  }

  /**
   * Get game data
   * @returns {Object} Current game data
   */
  getGameData() {
    return this.gameData;
  }

  /**
   * Get project information
   * @returns {Object} Project data
   */
  getProject() {
    return this.gameData.project;
  }

  /**
   * Get phases information
   * @returns {Array} Phases array
   */
  getPhases() {
    return this.gameData.phases;
  }

  /**
   * Get specific phase by ID
   * @param {number} id - Phase ID
   * @returns {Object|null} Phase data
   */
  getPhase(id) {
    return this.gameData.phases.find(phase => phase.id === id) || null;
  }

  /**
   * Get branches information
   * @returns {Array} Branches array
   */
  getBranches() {
    return this.gameData.branches;
  }

  /**
   * Get specific branch by type
   * @param {string} type - Branch type
   * @returns {Object|null} Branch data
   */
  getBranch(type) {
    return this.gameData.branches.find(branch => branch.type === type) || null;
  }

  /**
   * Get timeline milestones
   * @returns {Array} Timeline milestones
   */
  getTimelineMilestones() {
    return this.gameData.timeline.milestones;
  }

  /**
   * Get specific milestone by key
   * @param {string} key - Milestone key
   * @returns {Object|null} Milestone data
   */
  getMilestone(key) {
    return this.gameData.timeline.milestones.find(milestone => milestone.key === key) || null;
  }

  /**
   * Update content data
   * @param {string} path - Data path (e.g., 'project.name')
   * @param {*} value - New value
   */
  updateContent(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.gameData;
    
    for (const key of keys) {
      if (!target[key]) {
        target[key] = {};
      }
      target = target[key];
    }
    
    const oldValue = target[lastKey];
    target[lastKey] = value;
    
    this.emit('contentUpdated', { path, value, oldValue });
  }

  /**
   * Check if content is loaded
   * @returns {boolean} True if content is loaded
   */
  isContentLoaded() {
    return this.contentLoaded;
  }

  /**
   * Add content change listener
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
   * Remove content change listener
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
   * Emit content change event
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
          console.error('Content listener error:', e);
        }
      });
    }
  }

  /**
   * Validate content structure
   * @param {Object} content - Content to validate
   * @returns {boolean} True if valid
   */
  validateContent(content) {
    if (!content || typeof content !== 'object') {
      return false;
    }

    // Check required structure
    const requiredKeys = ['project', 'phases', 'branches'];
    for (const key of requiredKeys) {
      if (!content[key]) {
        return false;
      }
    }

    // Validate phases
    if (!Array.isArray(content.phases) || content.phases.length === 0) {
      return false;
    }

    // Validate branches
    if (!Array.isArray(content.branches) || content.branches.length === 0) {
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const contentManager = new ContentManager();
