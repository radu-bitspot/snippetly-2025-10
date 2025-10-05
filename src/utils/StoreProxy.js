/**
 * StoreProxy - Extends Polotno Store functionality using ES6 Proxy
 * This allows us to add custom methods and behaviors without modifying the original library
 */

export class SnippetlyStoreExtensions {
  constructor(store) {
    this.originalStore = store;
    this.customData = new Map(); // Store custom data per element
    this.analyticsEvents = []; // Track user interactions
    this.aiHistory = []; // Track AI-generated content
  }

  // Custom method: Track AI content generation
  trackAIGeneration(type, content, metadata = {}) {
    const event = {
      id: Date.now(),
      type,
      content,
      metadata,
      timestamp: new Date().toISOString(),
      pageId: this.originalStore.activePage?.id
    };
    
    this.aiHistory.push(event);
    console.log('🤖 AI Content Generated:', event);
    
    // Could send to analytics service
    this.trackAnalytics('ai_generation', event);
    
    return event;
  }

  // Custom method: Enhanced analytics tracking
  trackAnalytics(eventType, data) {
    const analyticsEvent = {
      event: eventType,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      userId: this.getCurrentUserId()
    };
    
    this.analyticsEvents.push(analyticsEvent);
    
    // In real app, send to analytics service
    console.log('📊 Analytics Event:', analyticsEvent);
  }

  // Custom method: Smart element positioning
  smartPositionElement(element, strategy = 'center') {
    const page = this.originalStore.activePage;
    if (!page || !element) return;

    const strategies = {
      center: () => ({
        x: (page.width - element.width) / 2,
        y: (page.height - element.height) / 2
      }),
      topLeft: () => ({ x: 20, y: 20 }),
      topRight: () => ({ 
        x: page.width - element.width - 20, 
        y: 20 
      }),
      bottomCenter: () => ({
        x: (page.width - element.width) / 2,
        y: page.height - element.height - 40
      })
    };

    const position = strategies[strategy]?.() || strategies.center();
    element.set(position);
    
    this.trackAnalytics('smart_positioning', { strategy, elementType: element.type });
  }

  // Custom method: Bulk text replacement with styling preservation
  replaceTextWithAI(searchText, replaceText, preserveFormatting = true) {
    const textElements = this.originalStore.activePage.children.filter(
      child => child.type === 'text' && child.text.includes(searchText)
    );

    textElements.forEach(element => {
      if (preserveFormatting) {
        // Preserve existing formatting
        const originalFontSize = element.fontSize;
        const originalFontFamily = element.fontFamily;
        const originalFill = element.fill;
        
        element.set({ text: element.text.replace(searchText, replaceText) });
        
        // Restore formatting
        element.set({
          fontSize: originalFontSize,
          fontFamily: originalFontFamily,
          fill: originalFill
        });
      } else {
        element.set({ text: element.text.replace(searchText, replaceText) });
      }
    });

    this.trackAIGeneration('text_replacement', {
      searchText,
      replaceText,
      elementsAffected: textElements.length
    });

    return textElements.length;
  }

  // Custom method: Get design complexity score
  getDesignComplexityScore() {
    const page = this.originalStore.activePage;
    if (!page) return 0;

    const elements = page.children;
    const elementTypes = elements.map(el => el.type);
    
    const score = {
      totalElements: elements.length,
      uniqueTypes: new Set(elementTypes).size,
      textElements: elementTypes.filter(t => t === 'text').length,
      imageElements: elementTypes.filter(t => t === 'image').length,
      shapeElements: elementTypes.filter(t => t === 'svg').length,
      complexity: elements.length * 0.5 + new Set(elementTypes).size * 2
    };

    this.trackAnalytics('design_complexity', score);
    return score;
  }

  // Custom method: Auto-save with versioning
  autoSaveWithVersion(name) {
    const version = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Auto-save ${new Date().toLocaleTimeString()}`,
      data: this.originalStore.toJSON(),
      timestamp: new Date().toISOString(),
      complexity: this.getDesignComplexityScore()
    };

    // In real app, save to backend/localStorage
    console.log('💾 Auto-saved version:', version.id);
    this.trackAnalytics('auto_save', { versionId: version.id });
    
    return version;
  }

  // Helper methods
  getSessionId() {
    return sessionStorage.getItem('snippetly_session') || 'anonymous';
  }

  getCurrentUserId() {
    return localStorage.getItem('authToken') ? 'authenticated_user' : 'guest';
  }

  // Custom method: Export design with metadata
  exportWithMetadata() {
    const designData = this.originalStore.toJSON();
    const metadata = {
      exported: new Date().toISOString(),
      complexity: this.getDesignComplexityScore(),
      aiHistory: this.aiHistory,
      version: '1.0',
      app: 'Snippetly Studio'
    };

    return {
      design: designData,
      metadata,
      analytics: this.analyticsEvents.slice(-10) // Last 10 events
    };
  }
}

/**
 * Create a Proxy wrapper for the Polotno store
 * This extends the original store with custom Snippetly functionality
 */
export function createSnippetlyStore(originalStore) {
  const extensions = new SnippetlyStoreExtensions(originalStore);
  
  return new Proxy(extensions, {
    get: (target, property) => {
      // First check if the property exists on our extensions
      if (property in target) {
        return target[property];
      }
      
      // If not, check the original store
      if (property in target.originalStore) {
        const value = target.originalStore[property];
        
        // If it's a function, bind it to the original store
        if (typeof value === 'function') {
          return value.bind(target.originalStore);
        }
        
        return value;
      }
      
      // Property doesn't exist anywhere
      return undefined;
    },
    
    set: (target, property, value) => {
      // Allow setting properties on extensions
      if (property in target) {
        target[property] = value;
        return true;
      }
      
      // Delegate to original store for unknown properties
      if (target.originalStore && typeof target.originalStore === 'object') {
        target.originalStore[property] = value;
        return true;
      }
      
      return false;
    }
  });
} 