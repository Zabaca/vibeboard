/**
 * Screenshot utilities for capturing component images
 * Uses dom-to-image for DOM-to-canvas conversion with better rendering quality
 */

import domToImage from 'dom-to-image';

export interface ScreenshotOptions {
  /**
   * Image format preference (WebP with PNG fallback)
   */
  format?: 'webp' | 'png' | 'jpeg';

  /**
   * Image quality (0.0 to 1.0, affects WebP and JPEG)
   */
  quality?: number;

  /**
   * Maximum image dimensions (maintains aspect ratio)
   */
  maxWidth?: number;
  maxHeight?: number;

  /**
   * Background color for transparent elements
   */
  backgroundColor?: string;

  /**
   * Include CSS from external stylesheets
   */
  useCORS?: boolean;

  /**
   * Scale factor for high DPI displays
   */
  scale?: number;

  /**
   * Logging for debugging
   */
  debug?: boolean;
}

export interface ScreenshotResult {
  success: boolean;
  dataUrl?: string;
  format?: 'webp' | 'png' | 'jpeg';
  sizeKB?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  capturedAt: number;
  error?: string;
  processingTime?: number;
}

/**
 * Capture a screenshot of a DOM element
 */
export async function captureElementScreenshot(
  element: HTMLElement,
  options: ScreenshotOptions = {},
): Promise<ScreenshotResult> {
  const startTime = performance.now();

  try {
    const {
      format = 'webp',
      quality = 0.85,
      maxWidth = 2048,
      maxHeight = 2048,
      backgroundColor = '#ffffff',
      useCORS = true,
      scale = 1,
      debug = false,
    } = options;

    if (debug) {
      console.log('🖼️  Starting screenshot capture:', {
        element: element.tagName,
        dimensions: `${element.offsetWidth}x${element.offsetHeight}`,
        options,
      });
    }

    // Check if element is visible
    if (!isElementVisible(element)) {
      return {
        success: false,
        error: 'Element is not visible or has zero dimensions',
        capturedAt: Date.now(),
        processingTime: performance.now() - startTime,
      };
    }

    // Configure dom-to-image options
    const style: Record<string, string> = useCORS
      ? {}
      : {
          // Disable external resources if CORS is not enabled
          'background-image': 'none',
        };

    const domToImageOptions = {
      bgcolor: backgroundColor,
      width: Math.min(element.offsetWidth, maxWidth),
      height: Math.min(element.offsetHeight, maxHeight),
      scale,
      style,
      cacheBust: true, // Prevent cache issues
      imagePlaceholder: backgroundColor, // Fallback for failed images
    };

    // Determine capture method based on format preference
    let dataUrl: string;

    if (format === 'png' || !supportsWebP()) {
      // Use PNG directly from dom-to-image
      dataUrl = await domToImage.toPng(element, domToImageOptions);

      if (debug) {
        console.log('📸 dom-to-image PNG capture complete');
      }

      const result = await processDataUrl(dataUrl, 'png', quality, maxWidth, maxHeight, debug);
      return {
        ...result,
        capturedAt: Date.now(),
        processingTime: performance.now() - startTime,
      };
    } else {
      // For WebP, first get as PNG then convert via canvas
      const pngDataUrl = await domToImage.toPng(element, domToImageOptions);

      if (debug) {
        console.log('📸 dom-to-image PNG capture complete, converting to WebP');
      }

      // Convert PNG to WebP via canvas
      const canvas = await dataUrlToCanvas(pngDataUrl);
      const compressionResult = await compressCanvasImage(canvas, {
        format,
        quality,
        maxWidth,
        maxHeight,
        debug,
      });

      return {
        ...compressionResult,
        capturedAt: Date.now(),
        processingTime: performance.now() - startTime,
      };
    }
  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ Screenshot capture failed:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown screenshot error',
      capturedAt: Date.now(),
      processingTime,
    };
  }
}

/**
 * Compress canvas image with format optimization
 */
export async function compressCanvasImage(
  canvas: HTMLCanvasElement,
  options: {
    format?: 'webp' | 'png' | 'jpeg';
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    debug?: boolean;
  } = {},
): Promise<ScreenshotResult> {
  const {
    format = 'webp',
    quality = 0.85,
    maxWidth = 2048,
    maxHeight = 2048,
    debug = false,
  } = options;

  try {
    // Resize canvas if needed
    const resizedCanvas = await resizeCanvas(canvas, maxWidth, maxHeight);

    // Check WebP support
    const webpSupported = supportsWebP();
    const targetFormat = format === 'webp' && webpSupported ? 'webp' : 'png';

    if (debug && format === 'webp' && !webpSupported) {
      console.warn('⚠️  WebP not supported, falling back to PNG');
    }

    // Convert to blob with compression
    const mimeType = `image/${targetFormat}`;
    const blob = await new Promise<Blob>((resolve, reject) => {
      resizedCanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
        mimeType,
        targetFormat === 'webp' ? quality : undefined,
      );
    });

    // Convert blob to data URL
    const dataUrl = await blobToDataUrl(blob);

    // Calculate file size in KB
    const sizeKB = Math.round(blob.size / 1024);

    return {
      success: true,
      dataUrl,
      format: targetFormat as 'webp' | 'png',
      sizeKB,
      dimensions: {
        width: resizedCanvas.width,
        height: resizedCanvas.height,
      },
      capturedAt: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Compression failed',
      capturedAt: Date.now(),
    };
  }
}

/**
 * Resize canvas while maintaining aspect ratio
 */
export async function resizeCanvas(
  sourceCanvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
): Promise<HTMLCanvasElement> {
  const { width: originalWidth, height: originalHeight } = sourceCanvas;

  // Calculate new dimensions maintaining aspect ratio
  let newWidth = originalWidth;
  let newHeight = originalHeight;

  if (originalWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = (originalHeight * maxWidth) / originalWidth;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = (originalWidth * maxHeight) / originalHeight;
  }

  // If no resizing needed, return original
  if (newWidth === originalWidth && newHeight === originalHeight) {
    return sourceCanvas;
  }

  // Create new canvas with resized dimensions
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = Math.floor(newWidth);
  resizedCanvas.height = Math.floor(newHeight);

  const ctx = resizedCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D rendering context');
  }

  // Use high-quality image scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw resized image
  ctx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);

  return resizedCanvas;
}

/**
 * Check if element is visible and capturable
 */
export function isElementVisible(element: HTMLElement): boolean {
  // Check if element exists and has dimensions
  if (!element || element.offsetWidth === 0 || element.offsetHeight === 0) {
    return false;
  }

  // Check if element is hidden
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  return true;
}

/**
 * Check WebP support
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  try {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    return false;
  }
}

/**
 * Convert blob to data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert data URL to canvas for further processing
 */
export function dataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to load image from data URL'));
    img.src = dataUrl;
  });
}

/**
 * Process data URL for direct use (PNG format)
 */
export async function processDataUrl(
  dataUrl: string,
  format: 'png' | 'webp' | 'jpeg',
  quality: number,
  maxWidth: number,
  maxHeight: number,
  debug: boolean,
): Promise<ScreenshotResult> {
  try {
    // Get image dimensions and size
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    // Calculate file size from data URL
    const base64Data = dataUrl.split(',')[1];
    const sizeKB = Math.round((base64Data.length * 3) / 4 / 1024);

    const dimensions = {
      width: img.width,
      height: img.height,
    };

    // If image is too large, resize it
    if (img.width > maxWidth || img.height > maxHeight) {
      const canvas = await dataUrlToCanvas(dataUrl);
      const resizedCanvas = await resizeCanvas(canvas, maxWidth, maxHeight);

      // Convert back to data URL with compression
      const resizedDataUrl = await new Promise<string>((resolve) => {
        resizedCanvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            }
          },
          `image/${format}`,
          format === 'jpeg' || format === 'webp' ? quality : undefined,
        );
      });

      const resizedSizeKB = Math.round((resizedDataUrl.split(',')[1].length * 3) / 4 / 1024);

      if (debug) {
        console.log('🔄 Resized image:', {
          originalSize: `${img.width}x${img.height}`,
          newSize: `${resizedCanvas.width}x${resizedCanvas.height}`,
          originalSizeKB: sizeKB,
          newSizeKB: resizedSizeKB,
        });
      }

      return {
        success: true,
        dataUrl: resizedDataUrl,
        format: format as 'webp' | 'png' | 'jpeg',
        sizeKB: resizedSizeKB,
        dimensions: {
          width: resizedCanvas.width,
          height: resizedCanvas.height,
        },
        capturedAt: Date.now(),
      };
    }

    return {
      success: true,
      dataUrl,
      format: format as 'webp' | 'png' | 'jpeg',
      sizeKB,
      dimensions,
      capturedAt: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process data URL',
      capturedAt: Date.now(),
    };
  }
}

/**
 * Get optimal screenshot options for different scenarios
 */
export function getOptimalScreenshotOptions(
  scenario: 'component' | 'preview' | 'thumbnail',
): ScreenshotOptions {
  const baseOptions: ScreenshotOptions = {
    backgroundColor: '#ffffff',
    useCORS: true,
    scale: 1,
    debug: false,
  };

  switch (scenario) {
    case 'component':
      return {
        ...baseOptions,
        format: 'webp',
        quality: 0.85,
        maxWidth: 1920,
        maxHeight: 1080,
      };

    case 'preview':
      return {
        ...baseOptions,
        format: 'webp',
        quality: 0.75,
        maxWidth: 800,
        maxHeight: 600,
      };

    case 'thumbnail':
      return {
        ...baseOptions,
        format: 'webp',
        quality: 0.65,
        maxWidth: 300,
        maxHeight: 200,
      };

    default:
      return baseOptions;
  }
}

/**
 * Convert WebP data URL to PNG for clipboard compatibility
 */
async function convertWebPToPngForClipboard(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Convert to PNG data URL
      const pngDataUrl = canvas.toDataURL('image/png');
      resolve(pngDataUrl);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Copy screenshot to clipboard
 */
export async function copyScreenshotToClipboard(dataUrl: string): Promise<boolean> {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard || !navigator.clipboard.write) {
      console.warn('Clipboard API not available');
      return false;
    }

    let finalDataUrl = dataUrl;

    // Convert WebP to PNG for clipboard compatibility
    if (dataUrl.startsWith('data:image/webp')) {
      console.log('🔄 Converting WebP to PNG for clipboard compatibility');
      finalDataUrl = await convertWebPToPngForClipboard(dataUrl);
    }

    // Convert data URL to blob
    const response = await fetch(finalDataUrl);
    const blob = await response.blob();

    // Ensure we're using a clipboard-supported format
    const supportedType = blob.type === 'image/png' ? 'image/png' : 'image/png';

    // Create clipboard item with PNG
    const clipboardItem = new ClipboardItem({
      [supportedType]: blob,
    });

    // Write to clipboard
    await navigator.clipboard.write([clipboardItem]);
    console.log('✅ Screenshot copied to clipboard as PNG');
    return true;
  } catch (error) {
    console.error('❌ Failed to copy screenshot to clipboard:', error);

    // Fallback: try to copy the data URL as text (less useful but something)
    try {
      await navigator.clipboard.writeText(dataUrl);
      console.log('📋 Screenshot data URL copied to clipboard as fallback');
      return true;
    } catch (fallbackError) {
      console.error('❌ Fallback clipboard copy also failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Show browser notification for screenshot actions
 */
export function showScreenshotNotification(
  title: string,
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
): void {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.log(`📢 ${title}: ${message}`);
    return;
  }

  // Check permission
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: message,
      icon: type === 'success' ? '✅' : type === 'error' ? '❌' : '📸',
      tag: 'vibeboard-screenshot',
    });

    // Auto close after 3 seconds
    setTimeout(() => notification.close(), 3000);
  } else if (Notification.permission !== 'denied') {
    // Request permission
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        showScreenshotNotification(title, message, type);
      }
    });
  }
}

/**
 * Alternative screenshot method using browser's native screen capture
 */
export async function captureScreenUsingDisplayMedia(): Promise<ScreenshotResult> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Screen capture not supported in this browser');
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);

          // Stop the stream
          stream.getTracks().forEach((track) => track.stop());

          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  success: true,
                  dataUrl: reader.result as string,
                  format: 'png',
                  sizeKB: Math.round(blob.size / 1024),
                  dimensions: {
                    width: canvas.width,
                    height: canvas.height,
                  },
                  capturedAt: Date.now(),
                });
              };
              reader.readAsDataURL(blob);
            } else {
              resolve({
                success: false,
                error: 'Failed to create blob from canvas',
                capturedAt: Date.now(),
              });
            }
          }, 'image/png');
        }
      };
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Screen capture failed',
      capturedAt: Date.now(),
    };
  }
}

/**
 * Enhanced capture with automatic clipboard copy
 */
export async function captureAndCopyToClipboard(
  element: HTMLElement,
  options: ScreenshotOptions = {},
): Promise<ScreenshotResult & { copiedToClipboard?: boolean }> {
  // Try dom-to-image first
  let result = await captureElementScreenshot(element, options);

  // If dom-to-image fails or produces tiny images, suggest screen capture
  if (!result.success || (result.sizeKB && result.sizeKB < 2)) {
    console.warn('🔄 dom-to-image produced poor results, offering screen capture alternative');

    showScreenshotNotification(
      'Screenshot Quality Issue',
      'Click here to try screen capture instead',
      'info',
    );

    // Try screen capture as fallback
    try {
      result = await captureScreenUsingDisplayMedia();
      if (result.success) {
        console.log('✅ Screen capture worked as fallback');
      }
    } catch (screenError) {
      console.log('Screen capture also failed:', screenError);
    }
  }

  if (result.success && result.dataUrl) {
    const copied = await copyScreenshotToClipboard(result.dataUrl);

    // Show notification
    if (copied) {
      showScreenshotNotification(
        'Screenshot Captured',
        `Image copied to clipboard (${result.sizeKB}KB)`,
        'success',
      );
    } else {
      showScreenshotNotification(
        'Screenshot Captured',
        `Image saved but clipboard copy failed (${result.sizeKB}KB)`,
        'info',
      );
    }

    return {
      ...result,
      copiedToClipboard: copied,
    };
  }

  return result;
}

/**
 * Cleanup function for data URLs to prevent memory leaks
 */
export function revokeDataUrl(dataUrl: string): void {
  // Data URLs don't need cleanup like blob URLs
  // But we can validate and log for debugging
  if (dataUrl.startsWith('blob:')) {
    URL.revokeObjectURL(dataUrl);
  }
}
