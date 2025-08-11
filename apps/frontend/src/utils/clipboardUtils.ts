/**
 * Clipboard utilities for paste functionality
 * Handles both image and text paste detection and processing
 */

// Result interface from the plan
export interface ClipboardResult {
  success: boolean;
  type: 'text' | 'image' | 'unsupported';
  data?: string; // Text content or image data URL
  format?: string; // MIME type or text format
  metadata?: {
    sizeKB?: number;
    dimensions?: { width: number; height: number };
  };
  error?: string;
}

// Configuration constants
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/**
 * Check if clipboard API is supported
 */
export function isClipboardSupported(): boolean {
  return (
    'navigator' in globalThis &&
    'clipboard' in navigator &&
    typeof navigator.clipboard.read === 'function'
  );
}

/**
 * Read clipboard content and detect format
 */
export async function readClipboard(): Promise<ClipboardResult> {
  if (!isClipboardSupported()) {
    return {
      success: false,
      type: 'unsupported',
      error: 'Clipboard API not supported in this browser',
    };
  }

  try {
    // Request clipboard permission if needed
    const permission = await navigator.permissions.query({
      name: 'clipboard-read' as PermissionName,
    });

    if (permission.state === 'denied') {
      return {
        success: false,
        type: 'unsupported',
        error: 'Clipboard access denied',
      };
    }

    // Read clipboard items
    const clipboardItems = await navigator.clipboard.read();

    if (clipboardItems.length === 0) {
      return {
        success: false,
        type: 'unsupported',
        error: 'Clipboard is empty',
      };
    }

    const clipboardItem = clipboardItems[0];

    // Check for image content first
    for (const type of clipboardItem.types) {
      if (SUPPORTED_IMAGE_TYPES.includes(type)) {
        return await processImageFromClipboard(clipboardItem, type);
      }
    }

    // Check for text content
    if (clipboardItem.types.includes('text/plain')) {
      return await processTextFromClipboard(clipboardItem);
    }

    // Check for HTML content
    if (clipboardItem.types.includes('text/html')) {
      return await processHtmlFromClipboard(clipboardItem);
    }

    // Provide specific error message based on available types
    const availableTypes = clipboardItem.types.join(', ');
    let errorMessage = 'Unsupported clipboard format';

    if (availableTypes.includes('text/')) {
      errorMessage = 'Text format not supported. Try copying plain text or formatted content.';
    } else if (availableTypes.includes('image/')) {
      errorMessage = `Image format not supported. Supported formats: PNG, JPEG, WebP, GIF. Found: ${availableTypes}`;
    } else {
      errorMessage = `Cannot paste this content type. Available types: ${availableTypes}`;
    }

    return {
      success: false,
      type: 'unsupported',
      error: errorMessage,
    };
  } catch (error) {
    console.error('Failed to read clipboard:', error);

    // Provide specific error messages based on error type
    let errorMessage = 'Unknown clipboard error';

    if (error instanceof Error) {
      if (error.message.includes('permission') || error.message.includes('denied')) {
        errorMessage = 'Clipboard access denied. Please allow clipboard permissions and try again.';
      } else if (
        error.message.includes('not supported') ||
        error.message.includes('not available')
      ) {
        errorMessage =
          'Clipboard API not available. Try using a modern browser or enable clipboard access.';
      } else if (error.message.includes('insecure') || error.message.includes('https')) {
        errorMessage = 'Clipboard access requires HTTPS. Please use a secure connection.';
      } else {
        errorMessage = error.message;
      }
    }

    // Fallback to text-only clipboard access
    if (navigator.clipboard?.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text.trim()) {
          return {
            success: true,
            type: 'text',
            data: text,
            format: 'plain',
          };
        }
      } catch (textError) {
        console.error('Text fallback also failed:', textError);
        // Update error message if text fallback also fails
        if (textError instanceof Error) {
          errorMessage = `${errorMessage} (Text fallback also failed: ${textError.message})`;
        }
      }
    }

    return {
      success: false,
      type: 'unsupported',
      error: errorMessage,
    };
  }
}

/**
 * Process image data from clipboard
 */
async function processImageFromClipboard(
  clipboardItem: ClipboardItem,
  mimeType: string,
): Promise<ClipboardResult> {
  try {
    const blob = await clipboardItem.getType(mimeType);

    // Validate image size
    if (blob.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        success: false,
        type: 'image',
        error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB`,
      };
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(blob);

    // Convert to data URL
    const dataUrl = await blobToDataUrl(blob);

    return {
      success: true,
      type: 'image',
      data: dataUrl,
      format: mimeType,
      metadata: {
        sizeKB: Math.round(blob.size / 1024),
        dimensions,
      },
    };
  } catch (error) {
    console.error('Failed to process image from clipboard:', error);
    return {
      success: false,
      type: 'image',
      error: error instanceof Error ? error.message : 'Failed to process image',
    };
  }
}

/**
 * Process plain text from clipboard
 */
async function processTextFromClipboard(clipboardItem: ClipboardItem): Promise<ClipboardResult> {
  try {
    const blob = await clipboardItem.getType('text/plain');
    const text = await blob.text();

    if (!text.trim()) {
      return {
        success: false,
        type: 'text',
        error: 'Clipboard text is empty',
      };
    }

    // Detect text format
    const format = detectTextFormat(text);

    return {
      success: true,
      type: 'text',
      data: text,
      format,
    };
  } catch (error) {
    console.error('Failed to process text from clipboard:', error);
    return {
      success: false,
      type: 'text',
      error: error instanceof Error ? error.message : 'Failed to process text',
    };
  }
}

/**
 * Process HTML content from clipboard
 */
async function processHtmlFromClipboard(clipboardItem: ClipboardItem): Promise<ClipboardResult> {
  try {
    const blob = await clipboardItem.getType('text/html');
    const html = await blob.text();

    if (!html.trim()) {
      return {
        success: false,
        type: 'text',
        error: 'Clipboard HTML is empty',
      };
    }

    // Extract plain text from HTML for simplicity
    // In the future, we could support rich text formatting
    const plainText = stripHtmlTags(html);

    return {
      success: true,
      type: 'text',
      data: plainText,
      format: 'html-derived',
    };
  } catch (error) {
    console.error('Failed to process HTML from clipboard:', error);
    return {
      success: false,
      type: 'text',
      error: error instanceof Error ? error.message : 'Failed to process HTML',
    };
  }
}

/**
 * Detect text format based on content patterns
 */
export function detectTextFormat(text: string): string {
  const trimmed = text.trim();

  // Check for code patterns
  if (isCodeLike(trimmed)) {
    return 'code';
  }

  // Check for JSON
  if (isJsonLike(trimmed)) {
    return 'json';
  }

  // Check for markdown patterns
  if (isMarkdownLike(trimmed)) {
    return 'markdown';
  }

  // Check for URL
  if (isUrlLike(trimmed)) {
    return 'url';
  }

  // Default to plain text
  return 'plain';
}

/**
 * Check if text looks like code
 */
function isCodeLike(text: string): boolean {
  const codePatterns = [
    /^import\s+/m, // ES6 imports
    /^function\s+\w+\s*\(/m, // Function declarations
    /^(const|let|var)\s+\w+\s*=/m, // Variable declarations
    /^\s*(if|for|while|switch)\s*\(/m, // Control structures
    /^class\s+\w+/m, // Class declarations
    /^\s*\/\*[\s\S]*?\*\//, // Multi-line comments
    /^\s*\/\/.*$/m, // Single-line comments
    /^<\w+.*>.*<\/\w+>$/s, // HTML-like tags
    /^\s*\{[\s\S]*\}\s*$/, // JSON-like objects
    /^\s*\[[\s\S]*\]\s*$/, // Arrays
    /console\.log\(/, // Console statements
    /return\s+/, // Return statements
  ];

  // Check for indentation patterns (tabs or multiple spaces)
  const hasIndentation = /^[ \t]{2,}/m.test(text);

  // Check for semicolons at line endings
  const hasSemicolons = /;$/m.test(text);

  // Check for curly braces
  const hasBraces = /[{}]/.test(text);

  // If multiple code indicators are present
  const patternMatches = codePatterns.filter((pattern) => pattern.test(text)).length;
  const structuralIndicators = [hasIndentation, hasSemicolons, hasBraces].filter(Boolean).length;

  return patternMatches >= 1 || (patternMatches >= 1 && structuralIndicators >= 1);
}

/**
 * Check if text looks like JSON
 */
function isJsonLike(text: string): boolean {
  const trimmed = text.trim();

  // Must start with { or [
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return false;
  }

  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if text looks like Markdown
 */
function isMarkdownLike(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s+/m, // Headers
    /^\*\s+/m, // Unordered lists
    /^\d+\.\s+/m, // Ordered lists
    /\*\*.*\*\*/, // Bold text
    /\*.*\*/, // Italic text
    /`.*`/, // Inline code
    /^```/m, // Code blocks
    /^\|.*\|/m, // Tables
    /\[.*\]\(.*\)/, // Links
    /^>/m, // Blockquotes
  ];

  const matches = markdownPatterns.filter((pattern) => pattern.test(text)).length;
  return matches >= 2; // Require multiple markdown indicators
}

/**
 * Check if text looks like a URL
 */
function isUrlLike(text: string): boolean {
  const trimmed = text.trim();

  // Single line and looks like URL
  if (trimmed.includes('\n')) {
    return false;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Strip HTML tags to get plain text
 */
function stripHtmlTags(html: string): string {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Get plain text content
  return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Get image dimensions from blob
 */
function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for dimension calculation'));
    };

    img.src = url;
  });
}

/**
 * Convert blob to data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };

    reader.onerror = () => reject(reader.error || new Error('FileReader error'));

    reader.readAsDataURL(blob);
  });
}

/**
 * Validate image format and size
 */
export function validateImageData(
  dataUrl: string,
  maxSizeMB: number = MAX_IMAGE_SIZE_MB,
): {
  valid: boolean;
  error?: string;
  format?: string;
  sizeKB?: number;
} {
  try {
    // Extract MIME type from data URL
    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    if (!mimeMatch) {
      return {
        valid: false,
        error: 'Invalid data URL format',
      };
    }

    const mimeType = mimeMatch[1];

    // Check if format is supported
    if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
      return {
        valid: false,
        error: `Unsupported image format: ${mimeType}`,
      };
    }

    // Calculate approximate size from base64
    const base64Data = dataUrl.split(',')[1];
    const sizeBytes = (base64Data.length * 3) / 4;
    const sizeKB = Math.round(sizeBytes / 1024);
    const sizeMB = sizeBytes / (1024 * 1024);

    if (sizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `Image too large: ${sizeMB.toFixed(1)}MB (max: ${maxSizeMB}MB)`,
        format: mimeType,
        sizeKB,
      };
    }

    return {
      valid: true,
      format: mimeType,
      sizeKB,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Image validation failed',
    };
  }
}

/**
 * Format text for display in TextNode based on detected format
 */
export function formatTextForDisplay(text: string, detectedFormat: string): string {
  switch (detectedFormat) {
    case 'code':
    case 'json':
      // Preserve formatting for code
      return text;

    case 'markdown':
      // For now, just return as-is (could be enhanced with markdown parsing)
      return text;

    case 'url':
      // Return the URL as-is
      return text;

    case 'html-derived':
      // Already converted to plain text
      return text;

    default:
      // Plain text - normalize line endings
      return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }
}

/**
 * Get user-friendly format name for display
 */
export function getFormatDisplayName(format: string): string {
  const formatNames: Record<string, string> = {
    plain: 'Plain Text',
    code: 'Code',
    json: 'JSON',
    markdown: 'Markdown',
    url: 'URL',
    'html-derived': 'Rich Text',
    'image/png': 'PNG Image',
    'image/jpeg': 'JPEG Image',
    'image/webp': 'WebP Image',
    'image/gif': 'GIF Image',
  };

  return formatNames[format] || format;
}

/**
 * Check if current browser/context allows clipboard access
 */
export function canAccessClipboard(): boolean {
  // Must be in secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    return false;
  }

  // Must have clipboard API
  if (!navigator.clipboard) {
    return false;
  }

  return true;
}

/**
 * Show clipboard permission prompt to user
 */
export async function requestClipboardPermission(): Promise<boolean> {
  if (!navigator.permissions) {
    return canAccessClipboard();
  }

  try {
    const permission = await navigator.permissions.query({
      name: 'clipboard-read' as PermissionName,
    });
    return permission.state === 'granted' || permission.state === 'prompt';
  } catch {
    // Fallback to basic capability check
    return canAccessClipboard();
  }
}
