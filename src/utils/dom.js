/**
 * DOM utility functions
 * Extracted from original game.js to maintain exact functionality
 */

/**
 * Safe HTML setter with basic sanitization
 * Maintains original functionality from game.js
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML string to set
 */
export function safeSetHTML(element, html) {
  if (!element) return;
  
  // Basic sanitization - remove script tags and event handlers
  const sanitized = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
    
  element.innerHTML = sanitized;
}

/**
 * Cache for frequently accessed DOM elements
 * Maintains original caching behavior from game.js
 */
class DOMCache {
  constructor() {
    this.cursorBot = null;
    this.toastsContainer = null;
  }

  /**
   * Get cursor bot element with caching
   * @returns {HTMLElement|null} Cursor bot element
   */
  getCursorBot() {
    if (!this.cursorBot || !document.contains(this.cursorBot)) {
      this.cursorBot = document.getElementById('cursor-bot');
    }
    return this.cursorBot;
  }

  /**
   * Get toasts container with caching
   * @returns {HTMLElement|null} Toasts container element
   */
  getToastsContainer() {
    if (!this.toastsContainer || !document.contains(this.toastsContainer)) {
      this.toastsContainer = document.getElementById('toasts');
    }
    return this.toastsContainer;
  }

  /**
   * Clear all cached elements
   */
  clear() {
    this.cursorBot = null;
    this.toastsContainer = null;
  }
}

// Export singleton instance to match original behavior
export const domCache = new DOMCache();

/**
 * Escape XML/HTML special characters
 * Maintains original escapeXml functionality
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Create element with attributes and text content
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string} textContent - Text content
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attributes = {}, textContent = '') {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  if (textContent) {
    element.textContent = textContent;
  }
  
  return element;
}

/**
 * Add event listener with automatic cleanup tracking
 * @param {HTMLElement} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 * @returns {Function} Cleanup function
 */
export function addEventListenerWithCleanup(element, event, handler, options = {}) {
  element.addEventListener(event, handler, options);
  
  return () => {
    element.removeEventListener(event, handler, options);
  };
}

/**
 * Get element's bounding rect with error handling
 * @param {HTMLElement} element - Target element
 * @returns {DOMRect|null} Bounding rect or null if error
 */
export function safeBoundingRect(element) {
  try {
    return element ? element.getBoundingClientRect() : null;
  } catch (e) {
    console.warn('Error getting bounding rect:', e);
    return null;
  }
}

/**
 * Check if element is visible in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if visible
 */
export function isElementVisible(element) {
  if (!element) return false;
  
  const rect = safeBoundingRect(element);
  if (!rect) return false;
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
