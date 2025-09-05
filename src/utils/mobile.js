/**
 * Mobile detection and utilities
 * Extracted from original game.js to maintain exact functionality
 */

/**
 * Check if device is mobile
 * Maintains original isMobileDevice functionality
 * @returns {boolean} True if mobile device
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if device has touch capability
 * @returns {boolean} True if touch capable
 */
export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get viewport dimensions accounting for mobile browsers
 * @returns {Object} Width and height
 */
export function getViewportDimensions() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    visualViewportWidth: window.visualViewport?.width || window.innerWidth,
    visualViewportHeight: window.visualViewport?.height || window.innerHeight
  };
}

/**
 * Check if device is in landscape orientation
 * @returns {boolean} True if landscape
 */
export function isLandscape() {
  return window.innerWidth > window.innerHeight;
}

/**
 * Check if device is in portrait orientation
 * @returns {boolean} True if portrait
 */
export function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

/**
 * Get device pixel ratio with fallback
 * @returns {number} Device pixel ratio
 */
export function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}

/**
 * Check if device prefers reduced motion
 * @returns {boolean} True if reduced motion preferred
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Vibrate device if supported
 * @param {number|number[]} pattern - Vibration pattern
 */
export function vibrate(pattern) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Silently fail on vibration errors
  }
}

/**
 * Setup mobile-specific event listeners
 * @param {Object} callbacks - Event callbacks
 * @returns {Function} Cleanup function
 */
export function setupMobileEvents(callbacks = {}) {
  const {
    onOrientationChange = () => {},
    onVisualViewportChange = () => {},
    onTouchStart = () => {},
    onTouchEnd = () => {}
  } = callbacks;

  const cleanupFunctions = [];

  // Orientation change
  if ('orientation' in window) {
    const orientationHandler = () => onOrientationChange();
    window.addEventListener('orientationchange', orientationHandler);
    cleanupFunctions.push(() => window.removeEventListener('orientationchange', orientationHandler));
  }

  // Visual viewport changes (mobile address bar)
  if (window.visualViewport) {
    const viewportHandler = () => onVisualViewportChange();
    window.visualViewport.addEventListener('resize', viewportHandler);
    cleanupFunctions.push(() => window.visualViewport.removeEventListener('resize', viewportHandler));
  }

  // Touch events
  const touchStartHandler = (e) => onTouchStart(e);
  const touchEndHandler = (e) => onTouchEnd(e);
  
  document.addEventListener('touchstart', touchStartHandler, { passive: true });
  document.addEventListener('touchend', touchEndHandler, { passive: true });
  
  cleanupFunctions.push(() => {
    document.removeEventListener('touchstart', touchStartHandler);
    document.removeEventListener('touchend', touchEndHandler);
  });

  // Return cleanup function
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}

/**
 * Prevent zoom on double tap (for games)
 */
export function preventDoubleClickZoom() {
  let lastTouchEnd = 0;
  
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
}

/**
 * Setup mobile meta viewport
 */
export function setupMobileViewport() {
  let viewport = document.querySelector('meta[name="viewport"]');
  
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }
  
  viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
}

/**
 * Mobile device detection details
 * @returns {Object} Detailed device info
 */
export function getMobileDeviceInfo() {
  const userAgent = navigator.userAgent;
  
  return {
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
    isTablet: /iPad/.test(userAgent) || (window.innerWidth >= 768 && isMobileDevice()),
    isPhone: isMobileDevice() && window.innerWidth < 768,
    hasNotch: CSS.supports('padding-top: env(safe-area-inset-top)'),
    standalone: window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
  };
}
