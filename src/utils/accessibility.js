/**
 * Accessibility utilities
 * Extracted from original game.js to maintain exact functionality
 */

/**
 * Screen reader utilities and text route generation
 * Maintains original accessibility features from game.js
 */

/**
 * Build text route for screen readers
 * Maintains original buildTextRoute functionality
 * @param {Array} branches - Game branches data
 * @param {Function} openBranch - Branch opening function
 */
export function buildTextRoute(branches, openBranch) {
  const container = document.getElementById('textRoute');
  if (!container) return;
  
  const div = container.querySelector('div');
  if (!div) return;
  
  div.innerHTML = '';
  
  // Create title
  const title = document.createElement('h2');
  title.textContent = 'Project Highway — Text Route';
  title.style.position = 'static';
  div.appendChild(title);
  
  // Create navigation list
  const ul = document.createElement('ul');
  
  (branches || []).forEach(branch => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = `${branch.label} — open`;
    btn.className = 'btn small';
    btn.onclick = () => openBranch(branch);
    li.appendChild(btn);
    ul.appendChild(li);
  });
  
  div.appendChild(ul);
}

/**
 * Setup keyboard navigation
 * @param {Object} keyHandlers - Key event handlers
 * @returns {Function} Cleanup function
 */
export function setupKeyboardNavigation(keyHandlers = {}) {
  const handleKeyDown = (e) => {
    // Prevent default for game keys
    const gameKeys = [
      'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 
      'KeyE', 'Enter', 'Escape', 'KeyP', 'KeyH', 
      'KeyF', 'KeyT', 'ArrowUp', 'ArrowDown', 'KeyS', 'KeyW'
    ];
    
    if (gameKeys.includes(e.code)) {
      e.preventDefault();
    }
    
    // Call appropriate handler
    const handler = keyHandlers[e.code];
    if (handler) {
      handler(e);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Priority level (polite, assertive)
 */
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, 1000);
}

/**
 * Focus management for overlays and panels
 */
export class FocusManager {
  constructor() {
    this.focusStack = [];
    this.trapElements = new WeakMap();
  }

  /**
   * Save current focus and set new focus
   * @param {HTMLElement} element - Element to focus
   */
  push(element) {
    const currentFocus = document.activeElement;
    this.focusStack.push(currentFocus);
    
    if (element) {
      element.focus();
    }
  }

  /**
   * Restore previous focus
   */
  pop() {
    const previousFocus = this.focusStack.pop();
    if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    }
  }

  /**
   * Setup focus trap for modal/overlay
   * @param {HTMLElement} container - Container element
   * @returns {Function} Cleanup function
   */
  setupFocusTrap(container) {
    if (!container) return () => {};

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll(focusableSelector);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    this.trapElements.set(container, handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      this.trapElements.delete(container);
    };
  }

  /**
   * Remove focus trap
   * @param {HTMLElement} container - Container element
   */
  removeFocusTrap(container) {
    const handler = this.trapElements.get(container);
    if (handler) {
      container.removeEventListener('keydown', handler);
      this.trapElements.delete(container);
    }
  }
}

/**
 * Skip link utilities
 */
export function setupSkipLinks() {
  const skipLinks = document.querySelectorAll('[href^="#"]');
  
  skipLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      
      if (target) {
        e.preventDefault();
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * ARIA live region manager
 */
export class LiveRegionManager {
  constructor() {
    this.regions = {
      polite: this.createLiveRegion('polite'),
      assertive: this.createLiveRegion('assertive')
    };
  }

  /**
   * Create live region element
   * @param {string} priority - Priority level
   * @returns {HTMLElement} Live region element
   */
  createLiveRegion(priority) {
    const region = document.createElement('div');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    
    document.body.appendChild(region);
    return region;
  }

  /**
   * Announce message
   * @param {string} message - Message to announce
   * @param {string} priority - Priority level
   */
  announce(message, priority = 'polite') {
    const region = this.regions[priority];
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  /**
   * Cleanup live regions
   */
  destroy() {
    Object.values(this.regions).forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
  }
}

/**
 * Color contrast utilities
 */
export function getContrastRatio(color1, color2) {
  const getLuminance = (color) => {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// Export singleton instances
export const focusManager = new FocusManager();
export const liveRegionManager = new LiveRegionManager();
