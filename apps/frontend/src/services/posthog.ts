import posthog from 'posthog-js';

class PostHogService {
  private initialized = false;

  init() {
    // Only initialize in production or if explicitly enabled in development
    const shouldInitialize = import.meta.env.PROD || import.meta.env.VITE_ENABLE_POSTHOG_DEV === 'true';
    
    if (!shouldInitialize) {
      console.log('📊 PostHog analytics disabled in development');
      return;
    }

    const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
    const apiHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

    if (!apiKey || !apiHost) {
      console.warn('PostHog configuration missing');
      return;
    }

    if (this.initialized) {
      return;
    }

    try {
      posthog.init(apiKey, {
        api_host: apiHost,
        // Capture pageviews automatically
        capture_pageview: true,
        // Capture page leaves (useful for engagement metrics)
        capture_pageleave: true,
        // Enable session recording with sample rate
        // Only record 10% of sessions to manage costs
        session_recording: {
          maskAllInputs: true,
        },
        // Enable automatic capture of clicks, form submissions, etc.
        autocapture: {
          dom_event_allowlist: ['click', 'submit', 'change'],
          element_allowlist: ['button', 'input', 'select', 'textarea', 'a'],
        },
        // Respect Do Not Track
        respect_dnt: true,
        // Load toolbar in development
        loaded: () => {
          if (import.meta.env.DEV) {
            console.log('📊 PostHog initialized successfully');
          }
        },
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  // Track custom events
  track(event: string, properties?: Record<string, unknown>) {
    if (this.initialized) {
      posthog.capture(event, properties);
    }
  }

  // Identify user
  identify(userId: string, properties?: Record<string, unknown>) {
    if (this.initialized) {
      posthog.identify(userId, properties);
    }
  }

  // Track component generation
  trackComponentGeneration(prompt: string, success: boolean, generationTime?: number) {
    this.track('component_generated', {
      prompt_length: prompt.length,
      success,
      generation_time: generationTime,
      timestamp: new Date().toISOString(),
    });
  }

  // Track component interaction
  trackComponentInteraction(action: 'edit' | 'delete' | 'duplicate' | 'regenerate', componentId: string) {
    this.track('component_interaction', {
      action,
      component_id: componentId,
      timestamp: new Date().toISOString(),
    });
  }

  // Track canvas actions
  trackCanvasAction(action: 'export' | 'import' | 'clear' | 'present') {
    this.track('canvas_action', {
      action,
      timestamp: new Date().toISOString(),
    });
  }

  // Track errors
  trackError(error: string, context?: Record<string, unknown>) {
    this.track('error_occurred', {
      error_message: error,
      ...context,
      timestamp: new Date().toISOString(),
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: 'library' | 'url_import' | 'code_edit' | 'resize') {
    this.track('feature_used', {
      feature,
      timestamp: new Date().toISOString(),
    });
  }

  // Set user properties
  setUserProperties(properties: Record<string, unknown>) {
    if (this.initialized) {
      posthog.people.set(properties);
    }
  }

  // Reset user (e.g., on logout)
  reset() {
    if (this.initialized) {
      posthog.reset();
    }
  }
}

// Export singleton instance
export const posthogService = new PostHogService();