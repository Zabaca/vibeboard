/**
 * Component Manifest - Lightweight metadata for URL-only component loading
 * 
 * This manifest contains only metadata, not the actual component code.
 * All components are loaded on-demand using URL imports for unified architecture:
 * 1. Built-in components - served from /components/ URLs
 * 2. External components - served from CDN URLs
 * 3. User components - served from custom URLs
 */

export type ComponentSource = 'builtin' | 'user' | 'external';
export type ComponentCategory = 'UI' | 'Data' | 'Forms' | 'Charts' | 'Layout' | 'Utility';

export interface ComponentManifestEntry {
  // Identity
  id: string;
  name: string;
  description: string;
  
  // Categorization
  category: ComponentCategory;
  tags: string[];
  source: ComponentSource;
  
  // Loading mechanism (URL-only)
  url: string;  // URL for all components (built-in, external, user)
  
  // Optional metadata
  thumbnail?: string;
  author?: string;
  version?: string;
  size?: number;  // Approximate size in bytes
  dependencies?: string[];  // External dependencies used
}

/**
 * Component manifest - URL-only component loading
 * This keeps the initial bundle small and provides unified architecture
 */
export const componentManifest: ComponentManifestEntry[] = [
  // Built-in UI Components (served from /components/)
  {
    id: 'button-animated',
    name: 'Animated Button',
    description: 'A button with hover animations and click effects',
    category: 'UI',
    tags: ['button', 'animation', 'interactive'],
    source: 'builtin',
    url: '/components/animated-button.js',
    size: 1024,
  },
  {
    id: 'simple-counter',
    name: 'Simple Counter',
    description: 'A counter with increment and decrement buttons',
    category: 'Utility',
    tags: ['counter', 'increment', 'decrement', 'state'],
    source: 'builtin',
    url: '/components/simple-counter.js',
    size: 1024,
  },
  
  // TODO: Create these component files in /public/components/:
  // - profile-card.js
  // - csv-notebook.js  
  // - contact-form.js
  // - bar-chart.js
  // - simple-tabs.js
  // - countdown-timer.js
  // - digital-clock.js
  // - todo-list.js
];

/**
 * Example of how to add external/user components (URL-only)
 */
export const exampleExternalComponents: ComponentManifestEntry[] = [
  {
    id: 'user-component-1',
    name: 'User Weather Widget',
    description: 'Weather widget from external URL',
    category: 'UI',
    tags: ['weather', 'widget', 'external'],
    source: 'external',
    url: 'https://esm.sh/some-weather-widget',
    author: 'External Developer',
  },
  {
    id: 'user-upload-1',
    name: 'Custom Dashboard',
    description: 'User-uploaded dashboard component',
    category: 'Layout',
    tags: ['dashboard', 'custom', 'user'],
    source: 'user',
    url: '/user-components/dashboard.js',  // Could be uploaded to public folder
    author: 'User',
  },
];

/**
 * Get all components for a given category
 */
export function getComponentsByCategory(category: ComponentCategory): ComponentManifestEntry[] {
  return componentManifest.filter(c => c.category === category);
}

/**
 * Get a specific component by ID
 */
export function getComponentById(id: string): ComponentManifestEntry | undefined {
  return componentManifest.find(c => c.id === id);
}

/**
 * Search components by query
 */
export function searchComponents(query: string): ComponentManifestEntry[] {
  const lowerQuery = query.toLowerCase();
  return componentManifest.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.description.toLowerCase().includes(lowerQuery) ||
    c.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Add a user component to the manifest at runtime
 */
export function addUserComponent(component: ComponentManifestEntry): void {
  if (component.source !== 'user' && component.source !== 'external') {
    throw new Error('Only user or external components can be added at runtime');
  }
  if (!component.url) {
    throw new Error('All components must have a URL in the URL-only architecture');
  }
  componentManifest.push(component);
}