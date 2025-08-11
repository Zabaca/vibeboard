import type { URLImportOptions, UnifiedComponentNode } from '../types/component.types.ts';

/**
 * URLImportService
 *
 * Service for importing React components from external URLs
 * Supports various CDN providers and GitHub sources
 */
export class URLImportService {
  private trustedDomains: string[] = [
    // ESM CDNs
    'esm.sh',
    'cdn.skypack.dev',
    'unpkg.com',
    'jsdelivr.net',
    'cdnjs.cloudflare.com',

    // GitHub
    'raw.githubusercontent.com',
    'gist.githubusercontent.com',

    // Development CDNs
    'localhost',
    '127.0.0.1',
  ];

  private urlCache: Map<string, { code: string; timestamp: number; etag?: string }> = new Map();
  private cacheMaxAge = 3600000; // 1 hour

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Import a component from a URL
   */
  async importFromURL(
    url: string,
    options: URLImportOptions = {},
  ): Promise<{
    success: boolean;
    component?: Partial<UnifiedComponentNode>;
    error?: string;
    tempCode?: string;
    tempEtag?: string;
  }> {
    try {
      // Validate URL
      const validation = this.validateURL(url, options);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Check cache first
      if (options.useCache !== false) {
        const cached = this.getFromCache(url);
        if (cached) {
          console.log('✅ Using cached component from URL:', url);
          // Create component but don't return yet - we'll validate it works
          const component = this.createComponentFromCode(cached.code, url);
          return {
            success: true,
            component,
          };
        }
      }

      // Fetch component code
      const fetchResult = await this.fetchComponent(url, options);
      if (!fetchResult.success) {
        return { success: false, error: fetchResult.error };
      }

      // Create component node (but don't cache yet)
      const component = this.createComponentFromCode(fetchResult.code!, url);

      // Return fetch result separately - will cache after successful processing
      return {
        success: true,
        component,
        tempCode: fetchResult.code,
        tempEtag: fetchResult.etag,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('URL import error:', errorMessage);

      // Clear cache for this URL on error
      this.removeFromCache(url);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Cache successful import (to be called after processing succeeds)
   */
  cacheSuccessfulImport(url: string, code: string, etag?: string): void {
    this.addToCache(url, code, etag);
    console.log('✅ Cached successful import:', url);
  }

  /**
   * Remove specific URL from cache
   */
  removeFromCache(url: string): void {
    if (this.urlCache.has(url)) {
      this.urlCache.delete(url);
      this.saveCacheToStorage();
      console.log('🗑️ Removed from cache due to error:', url);
    }
  }

  /**
   * Validate a URL for import
   */
  private validateURL(url: string, options: URLImportOptions): { valid: boolean; error?: string } {
    try {
      const parsed = new URL(url);

      // Check HTTPS requirement
      if (
        options.requireHTTPS !== false &&
        parsed.protocol !== 'https:' &&
        !this.isLocalhost(parsed)
      ) {
        return { valid: false, error: 'URL must use HTTPS for security' };
      }

      // Check against allowed domains
      const allowedDomains = options.allowedDomains || this.trustedDomains;
      const hostname = parsed.hostname;

      const isAllowed = allowedDomains.some((domain) => {
        return hostname === domain || hostname.endsWith(`.${domain}`);
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: `Domain ${hostname} is not in the allowed list. Allowed domains: ${allowedDomains.join(', ')}`,
        };
      }

      // Check file extension for supported formats
      const pathname = parsed.pathname.toLowerCase();
      const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.esm.js'];
      const hasValidExtension = supportedExtensions.some((ext) => pathname.endsWith(ext));

      if (!hasValidExtension && !pathname.includes('esm.sh') && !pathname.includes('skypack')) {
        console.warn(`URL ${url} may not contain a valid JavaScript module`);
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Check if URL is localhost
   */
  private isLocalhost(url: URL): boolean {
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
  }

  /**
   * Convert URL to use proxy in development
   */
  private getProxiedUrl(url: string): string {
    // Only use proxy in development
    const isDevelopment =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isDevelopment) {
      return url;
    }

    try {
      const urlObj = new URL(url);

      // Proxy unpkg.com through our Vite proxy
      if (urlObj.hostname === 'unpkg.com') {
        const path = urlObj.pathname + urlObj.search;
        return `/proxy/unpkg${path}`;
      }

      // Proxy other CDNs if needed
      if (urlObj.hostname === 'cdn.skypack.dev') {
        const path = urlObj.pathname + urlObj.search;
        return `/proxy/skypack${path}`;
      }

      if (urlObj.hostname === 'jsdelivr.net' || urlObj.hostname === 'cdn.jsdelivr.net') {
        const path = urlObj.pathname + urlObj.search;
        return `/proxy/jsdelivr${path}`;
      }

      // ESM.sh and GitHub usually work without proxy due to proper CORS headers
      return url;
    } catch {
      return url;
    }
  }

  /**
   * Fetch component code from URL
   */
  private async fetchComponent(
    url: string,
    options: URLImportOptions,
  ): Promise<{ success: boolean; code?: string; etag?: string; error?: string }> {
    try {
      const controller = new AbortController();
      const timeout = options.timeout || 10000; // 10 seconds default

      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Use proxied URL in development to avoid CORS
      const fetchUrl = this.getProxiedUrl(url);
      console.log(`Fetching from: ${fetchUrl} (original: ${url})`);

      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/javascript, text/javascript, text/plain',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch component: ${response.status} ${response.statusText}`,
        };
      }

      const code = await response.text();
      const etag = response.headers.get('etag') || undefined;

      // Validate that we got actual code
      if (!code || code.trim().length === 0) {
        return { success: false, error: 'Received empty response from URL' };
      }

      // Basic validation that it looks like JavaScript/React code
      if (!this.looksLikeCode(code, url)) {
        return {
          success: false,
          error: 'Response does not appear to be valid JavaScript/React code',
        };
      }

      return { success: true, code, etag };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Request timeout' };
        }
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to fetch component' };
    }
  }

  /**
   * Basic validation that content looks like code
   */
  private looksLikeCode(code: string, url?: string): boolean {
    // First check if it's obviously not code
    if (code.includes('<!DOCTYPE') || code.includes('<html')) {
      return false; // It's HTML, not JavaScript
    }

    // For ESM modules from CDNs, be more lenient
    // They often have minified code that doesn't match typical patterns
    if (
      url &&
      (url.includes('esm.sh') || url.includes('skypack.dev') || url.includes('jsdelivr'))
    ) {
      // For known CDNs, just check it's not obviously wrong
      return !code.includes('404') && !code.includes('Not Found') && code.length > 50;
    }

    // Check for common patterns in JavaScript/React code
    const patterns = [
      /function\s+\w+/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /export\s+(default|{)/,
      /import\s+.+\s+from/,
      /class\s+\w+/,
      /=>\s*{/,
      /React\./,
      /<[A-Z]\w*/, // JSX component
      /\w+\s*:\s*function/, // Object methods
      /\w+\s*\(\s*\)/, // Function calls
    ];

    return patterns.some((pattern) => pattern.test(code));
  }

  /**
   * Create a UnifiedComponentNode from fetched code
   */
  private createComponentFromCode(code: string, url: string): Partial<UnifiedComponentNode> {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'component';
    const name = filename.replace(/\.(jsx?|tsx?|mjs|esm\.js)$/, '');

    // Detect format from content and extension
    // Default to JSX for local files unless they explicitly have ESM exports
    let format: 'esm' | 'jsx' | 'tsx' = 'jsx';

    // Only mark as ESM if it has actual ES module exports (not just 'export' in comments)
    if (code.match(/^export\s+(default|{|const|let|var|function|class)/m)) {
      format = 'esm';
    } else if (pathname.endsWith('.tsx') || code.includes(': React.FC')) {
      format = 'tsx';
    }

    // Extract metadata from URL
    const metadata: any = {
      sourceUrl: url,
      lastFetched: Date.now(),
    };

    // CDN-specific metadata extraction
    if (urlObj.hostname === 'esm.sh') {
      const match = pathname.match(/\/([^@]+)@([^/]+)/);
      if (match) {
        metadata.packageName = match[1];
        metadata.packageVersion = match[2];
        metadata.cdnProvider = 'esm.sh';
      }
    } else if (urlObj.hostname === 'cdn.skypack.dev') {
      const match = pathname.match(/\/([^@]+)@([^/]+)/);
      if (match) {
        metadata.packageName = match[1];
        metadata.packageVersion = match[2];
        metadata.cdnProvider = 'skypack';
      }
    } else if (urlObj.hostname === 'unpkg.com') {
      const match = pathname.match(/\/([^@]+)@([^/]+)/);
      if (match) {
        metadata.packageName = match[1];
        metadata.packageVersion = match[2];
        metadata.cdnProvider = 'unpkg';
      }
    } else if (urlObj.hostname === 'raw.githubusercontent.com') {
      const match = pathname.match(/\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)/);
      if (match) {
        metadata.cdnProvider = 'github';
        metadata.author = match[1];
        metadata.repo = match[2];
        metadata.branch = match[3];
        metadata.filepath = match[4];
      }
    }

    return {
      name,
      description: `Imported from ${url}`,
      originalCode: code,
      source: 'url-import',
      format,
      sourceUrl: url,
      metadata,
    };
  }

  /**
   * Get from cache
   */
  private getFromCache(url: string): { code: string; timestamp: number } | null {
    const cached = this.urlCache.get(url);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.cacheMaxAge) {
        return cached;
      }
      // Remove expired entry
      this.urlCache.delete(url);
    }
    return null;
  }

  /**
   * Add to cache
   */
  private addToCache(url: string, code: string, etag?: string): void {
    this.urlCache.set(url, {
      code,
      timestamp: Date.now(),
      etag,
    });
    this.saveCacheToStorage();

    // Limit cache size
    if (this.urlCache.size > 50) {
      // Remove oldest entries
      const entries = Array.from(this.urlCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < 10; i++) {
        this.urlCache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('urlImportCache');
      if (stored) {
        const data = JSON.parse(stored);
        this.urlCache = new Map(data.entries);
      }
    } catch (error) {
      console.warn('Failed to load URL cache from storage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const data = {
        entries: Array.from(this.urlCache.entries()),
      };
      localStorage.setItem('urlImportCache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save URL cache to storage:', error);
      if (error instanceof DOMException && error.code === 22) {
        // Storage full, clear old entries
        this.clearCache();
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.urlCache.clear();
    localStorage.removeItem('urlImportCache');
  }

  /**
   * Get trusted domains list
   */
  getTrustedDomains(): string[] {
    return [...this.trustedDomains];
  }

  /**
   * Add a trusted domain
   */
  addTrustedDomain(domain: string): void {
    if (!this.trustedDomains.includes(domain)) {
      this.trustedDomains.push(domain);
    }
  }

  /**
   * Remove a trusted domain
   */
  removeTrustedDomain(domain: string): void {
    const index = this.trustedDomains.indexOf(domain);
    if (index > -1) {
      this.trustedDomains.splice(index, 1);
    }
  }
}
