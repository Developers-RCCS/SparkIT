/**
 * Game constants
 * Extracted from original game.js to maintain exact functionality
 */

// Physics constants
export const PHYSICS = {
  GRAVITY: 350,
  PLAYER_ACCEL: 600,
  PLAYER_FRICTION: 380,
  PLAYER_MAX_SPEED: 420,
  TIMELINE_ACCEL: 400,
  TIMELINE_FRICTION: 300,
  TIMELINE_MAX_SPEED: 300
};

// Canvas and rendering constants
export const RENDERING = {
  MIN_DPR: 1,
  MAX_DPR: 3,
  CANVAS_SAVE_RESTORE_LIMIT: 10,
  PERFORMANCE_CHECK_INTERVAL: 30, // frames
  LOW_PERFORMANCE_THRESHOLD: 30, // FPS
  MEMORY_CHECK_INTERVAL: 10000 // ms
};

// Canvas configuration (for Sprint 2 systems)
export const CANVAS = {
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600,
  MAX_FPS: 60,
  PIXEL_RATIO: window.devicePixelRatio || 1
};

// Road rendering configuration
export const ROAD_CONFIG = {
  width: 400,
  height: 100,
  segments: 200,
  segmentLength: 200,
  rumbleLength: 3,
  trackWidth: 2000,
  lanes: 3,
  fieldOfView: 100,
  cameraHeight: 1000,
  drawDistance: 300,
  fogDensity: 5
};

// Timeline configuration
export const TIMELINE_CONFIG = {
  maxZoom: 5,
  minZoom: 0.5,
  scrollSpeed: 200,
  snapToGrid: true,
  gridSize: 50,
  maxDrillDepth: 10,
  nodeSpacing: 100,
  branchHeight: 80
};

// Billboard configuration
export const BILLBOARDS = {
  width: 150,
  height: 100,
  spacing: 500,
  types: ['info', 'warning', 'achievement', 'branch']
};

// Collision system configuration
export const COLLISION_CONFIG = {
  nearThreshold: 80,
  branchWidth: 80,
  branchHeight: 60,
  billboardWidth: 150,
  billboardHeight: 100,
  playerRadius: 20,
  checkInterval: 16 // ~60fps
};

// Player configuration
export const PLAYER_CONFIG = {
  width: 20,
  height: 30,
  speed: 200,
  jumpPower: 300,
  maxHealth: 100,
  startX: 0,
  startY: 0
};

// UI constants
export const UI = {
  TOAST_DURATION: 3000,
  PANEL_ANIMATION_DURATION: 300,
  TOOLTIP_DELAY: 500,
  BUTTON_HIT_PADDING: 10,
  MOBILE_TOUCH_THRESHOLD: 15
};

// Game world constants
export const WORLD = {
  DEFAULT_LENGTH: 3000,
  TIMELINE_LENGTH: 2000,
  ROAD_Y_OFFSET: 160,
  PLAYER_SPAWN_X: 120,
  GATE_X: 1800,
  GHOST_BASE_SPEED: 140,
  // Additional properties for Sprint 2 systems
  WIDTH: 10000,
  HEIGHT: 600,
  GROUND_Y: 500,
  CAMERA_FOLLOW_SPEED: 0.1,
  CAMERA_LOOKAHEAD: 100,
  SCROLL_SPEED: 200,
  BOUNDARY_LEFT: -1000,
  BOUNDARY_RIGHT: 15000
};

// Visual effects constants
export const EFFECTS = {
  SPOTLIGHT_RADIUS: 250,
  LIGHTNING_COOLDOWN: 9000,
  PARTICLE_MAX_COUNT: 200,
  RAIN_PARTICLE_COUNT: 100,
  FIREWORKS_DURATION: 3000,
  CONFETTI_COUNT: 50
};

// Input constants
export const INPUT = {
  DOUBLE_CLICK_THRESHOLD: 300,
  LONG_PRESS_DURATION: 500,
  SWIPE_THRESHOLD: 50,
  THROTTLE_SENSITIVITY: 0.1,
  ANALOG_DEADZONE: 0.05
};

// Performance constants
export const PERFORMANCE = {
  TARGET_FPS: 60,
  MIN_FPS: 30,
  DPR_ADJUSTMENT_COOLDOWN: 5000,
  MEMORY_WARNING_THRESHOLD: 80, // percentage
  FRAME_BUDGET: 16.67 // milliseconds (60 FPS)
};

// Timeline mode constants
export const TIMELINE = {
  CAMERA_EASE: 3.5,
  WORKSHOP_PROXIMITY: 70,
  ORB_COLLECTION_DISTANCE: 30,
  CRYSTAL_COUNT_MOBILE: 20,
  CRYSTAL_COUNT_DESKTOP: 32,
  HACK_PROGRESS_SPEED: 8,
  HACK_PROGRESS_SPEED_FAST: 28
};

// Color scheme constants
export const COLORS = {
  PRIMARY: '#7C7CE0',
  SECONDARY: '#A855F7',
  ACCENT: '#EC4899',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#E5E7EB',
  BACKGROUND: '#0F172A',
  SURFACE: '#1E293B'
};

// Animation easing constants
export const EASING = {
  LINEAR: 'linear',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  ELASTIC: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

// Audio constants
export const AUDIO = {
  MASTER_VOLUME: 0.7,
  SFX_VOLUME: 0.8,
  MUSIC_VOLUME: 0.6,
  FADE_DURATION: 1000
};

// Storage keys
export const STORAGE_KEYS = {
  SUBMISSIONS: 'sparkit_submissions',
  PHASE1_COMPLETE: 'phase1Complete',
  PHASE1_DRAFT: 'phase1Draft',
  GUIDED_START: 'sparkit_guided_start_v1',
  SETTINGS: 'sparkit_settings',
  PROGRESS: 'sparkit_progress'
};

// Form validation constants
export const VALIDATION = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_BIO_LENGTH: 10,
  MAX_BIO_LENGTH: 500,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[+]?[\d\s\-\(\)]{10,}$/
};

// Game mode constants
export const GAME_MODES = {
  ROAD: 'road',
  TIMELINE: 'timeline'
};

// Weather constants
export const WEATHER = {
  CLEAR: 'clear',
  RAINING: 'raining',
  TRANSITION_SPEED: 0.3,
  RAIN_PARTICLE_COUNT: 100,
  CHANGE_INTERVAL: 15000
};

// Mobile constants
export const MOBILE = {
  BREAKPOINT_TABLET: 768,
  BREAKPOINT_SMALL: 640,
  TOUCH_DELAY: 100,
  ORIENTATION_CHANGE_DELAY: 500,
  VIEWPORT_UPDATE_DELAY: 100
};

// Accessibility constants
export const A11Y = {
  FOCUS_OUTLINE_WIDTH: 2,
  MIN_CONTRAST_RATIO: 4.5,
  ANIMATION_DURATION_REDUCED: 200,
  SKIP_LINK_OFFSET: 10000
};

// Debug constants
export const DEBUG = {
  SHOW_FPS: false,
  SHOW_COLLISION_BOXES: false,
  SHOW_PERFORMANCE_METRICS: false,
  LOG_LEVEL: 'warn' // 'debug', 'info', 'warn', 'error'
};
