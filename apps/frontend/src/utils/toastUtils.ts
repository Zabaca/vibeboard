/**
 * Simple toast notification utility for paste operations and other UI feedback
 */

export interface ToastOptions {
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

let toastContainer: HTMLDivElement | null = null;
let toastCounter = 0;

/**
 * Initialize or get the toast container
 */
function getToastContainer(): HTMLDivElement {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
    max-width: 350px;
  `;

  document.body.appendChild(toastContainer);
  return toastContainer;
}

/**
 * Get icon for toast type
 */
function getToastIcon(type: ToastOptions['type']): string {
  switch (type) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
    default:
      return 'ℹ️';
  }
}

/**
 * Get colors for toast type
 */
function getToastColors(type: ToastOptions['type']): { bg: string; border: string; text: string } {
  switch (type) {
    case 'success':
      return { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#15803d' };
    case 'error':
      return { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#dc2626' };
    case 'warning':
      return { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#d97706' };
    case 'info':
    default:
      return { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#2563eb' };
  }
}

/**
 * Show a toast notification
 */
export function showToast(message: string, options: ToastOptions = {}): void {
  const { type = 'info', duration = 3000 } = options;

  const container = getToastContainer();
  const toastId = `toast-${++toastCounter}`;
  const colors = getToastColors(type);
  const icon = getToastIcon(type);

  // Create toast element
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: ${colors.bg};
    border: 1px solid ${colors.border};
    border-left: 4px solid ${colors.border};
    border-radius: 8px;
    color: ${colors.text};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    pointer-events: auto;
    cursor: pointer;
    min-height: 48px;
    position: relative;
  `;

  // Toast content
  toast.innerHTML = `
    <span style="font-size: 16px; flex-shrink: 0;" aria-hidden="true">${icon}</span>
    <span style="flex: 1;">${message}</span>
    <button style="
      background: none;
      border: none;
      color: ${colors.text};
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      margin: 0;
      opacity: 0.6;
      transition: opacity 0.2s ease;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    " title="Dismiss notification" aria-label="Dismiss notification">×</button>
  `;

  // Add close functionality
  const closeButton = toast.querySelector('button');
  const closeToast = () => {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }

      // Remove container if empty
      if (container.children.length === 0) {
        container.remove();
        toastContainer = null;
      }
    }, 300);
  };

  if (closeButton) {
    closeButton.addEventListener('click', closeToast);
    closeButton.addEventListener('mouseenter', (e) => {
      (e.target as HTMLElement).style.opacity = '1';
    });
    closeButton.addEventListener('mouseleave', (e) => {
      (e.target as HTMLElement).style.opacity = '0.6';
    });
  }

  // Add click-to-dismiss on toast itself
  toast.addEventListener('click', (e) => {
    if (e.target !== closeButton) {
      closeToast();
    }
  });

  // Add toast to container
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });

  // Auto dismiss
  if (duration > 0) {
    setTimeout(closeToast, duration);
  }
}

/**
 * Show success toast for paste operations
 */
export function showPasteSuccessToast(type: 'text' | 'image', format?: string): void {
  const formatText = format ? ` (${format})` : '';
  const icon = type === 'image' ? '🖼️' : '📝';
  const typeText = type === 'image' ? 'Image' : 'Text';

  showToast(`${icon} ${typeText} pasted successfully${formatText}`, {
    type: 'success',
    duration: 3000,
  });
}

/**
 * Show error toast for paste operations
 */
export function showPasteErrorToast(error: string): void {
  // Determine appropriate icon and message based on error type
  let icon = '📋';
  let title = 'Paste failed';
  let duration = 5000;

  if (error.includes('permission') || error.includes('denied')) {
    icon = '🔒';
    title = 'Permission required';
    duration = 7000; // Longer for permission errors
  } else if (error.includes('not supported') || error.includes('not available')) {
    icon = '🚫';
    title = 'Not supported';
  } else if (error.includes('format') || error.includes('Supported formats')) {
    icon = '📄';
    title = 'Format not supported';
  } else if (error.includes('too large') || error.includes('size')) {
    icon = '📏';
    title = 'File too large';
  }

  showToast(`${icon} ${title}: ${error}`, { type: 'error', duration });
}

/**
 * Show permission help toast
 */
export function showClipboardPermissionToast(): void {
  showToast(
    '🔒 To enable paste: Allow clipboard access in browser settings, then click the canvas and try again',
    { type: 'warning', duration: 8000 },
  );
}

/**
 * Show format help toast
 */
export function showSupportedFormatsToast(): void {
  showToast('📄 Supported formats: Text (any), Images (PNG, JPEG, WebP, GIF)', {
    type: 'info',
    duration: 6000,
  });
}

/**
 * Show info toast for paste hints
 */
export function showPasteHintToast(): void {
  showToast('💡 Click on the canvas and press Ctrl+V to paste images or text', {
    type: 'info',
    duration: 4000,
  });
}

/**
 * Clear all toasts
 */
export function clearAllToasts(): void {
  if (toastContainer) {
    toastContainer.remove();
    toastContainer = null;
  }
}
