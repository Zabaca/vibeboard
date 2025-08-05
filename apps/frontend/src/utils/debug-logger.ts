/**
 * Debug Logger Utility
 * Provides multiple ways to capture and display console logs for better debugging
 */

interface LogEntry {
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  data?: any;
  source?: string;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private onScreenEnabled = false;
  private originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  constructor() {
    // Initialize based on localStorage preference
    const savedPreference = localStorage.getItem('debugLoggerEnabled');
    if (savedPreference === 'true') {
      this.enableOnScreenLogging();
    }
  }

  /**
   * Method 1: On-screen debug panel
   */
  enableOnScreenLogging() {
    this.onScreenEnabled = true;
    this.createDebugPanel();
    this.interceptConsole();
    localStorage.setItem('debugLoggerEnabled', 'true');
  }

  disableOnScreenLogging() {
    this.onScreenEnabled = false;
    this.removeDebugPanel();
    this.restoreConsole();
    localStorage.setItem('debugLoggerEnabled', 'false');
  }

  private createDebugPanel() {
    // Remove existing panel if any
    this.removeDebugPanel();

    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        max-height: 300px;
        background: rgba(0, 0, 0, 0.9);
        color: #00ff00;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #00ff00;
        z-index: 10000;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #00ff00;
        ">
          <span style="font-weight: bold;">🔍 Debug Console</span>
          <div>
            <button id="debug-clear" style="
              background: transparent;
              color: #00ff00;
              border: 1px solid #00ff00;
              padding: 2px 8px;
              margin-right: 5px;
              cursor: pointer;
              font-size: 10px;
            ">Clear</button>
            <button id="debug-close" style="
              background: transparent;
              color: #ff0000;
              border: 1px solid #ff0000;
              padding: 2px 8px;
              cursor: pointer;
              font-size: 10px;
            ">Close</button>
          </div>
        </div>
        <div id="debug-logs" style="
          max-height: 230px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        "></div>
      </div>
    `;

    document.body.appendChild(panel);

    // Add event listeners
    document.getElementById('debug-clear')?.addEventListener('click', () => {
      this.clearLogs();
    });

    document.getElementById('debug-close')?.addEventListener('click', () => {
      this.disableOnScreenLogging();
    });

    // Display existing logs
    this.updateDebugPanel();
  }

  private removeDebugPanel() {
    const panel = document.getElementById('debug-panel');
    if (panel) {
      panel.remove();
    }
  }

  private updateDebugPanel() {
    if (!this.onScreenEnabled) return;

    const logsContainer = document.getElementById('debug-logs');
    if (logsContainer) {
      logsContainer.innerHTML = this.logs
        .slice(-20) // Show last 20 logs
        .map((log) => {
          const color = {
            log: '#00ff00',
            error: '#ff0000',
            warn: '#ffff00',
            info: '#00ffff',
            debug: '#ff00ff',
          }[log.level];

          const prefix = {
            log: '📝',
            error: '❌',
            warn: '⚠️',
            info: 'ℹ️',
            debug: '🔧',
          }[log.level];

          return `<div style="color: ${color}; margin-bottom: 4px;">
            ${prefix} [${log.timestamp}] ${log.source ? `[${log.source}]` : ''} ${log.message}
            ${log.data ? `\n   ${JSON.stringify(log.data, null, 2)}` : ''}
          </div>`;
        })
        .join('');

      // Auto-scroll to bottom
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }

  /**
   * Method 2: Copy logs to clipboard
   */
  copyLogsToClipboard() {
    const logsText = this.logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.source ? `[${log.source}]` : ''} ${log.message} ${
            log.data ? JSON.stringify(log.data) : ''
          }`,
      )
      .join('\n');

    navigator.clipboard.writeText(logsText).then(() => {
      this.log('Logs copied to clipboard!', undefined, 'DebugLogger');
    });
  }

  /**
   * Method 3: Download logs as file
   */
  downloadLogs() {
    const logsText = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logsText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Method 4: Send logs to webhook (for remote debugging)
   */
  async sendToWebhook(webhookUrl: string) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          logs: this.logs,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
      this.log('Logs sent to webhook successfully', undefined, 'DebugLogger');
    } catch (error) {
      this.error('Failed to send logs to webhook', error, 'DebugLogger');
    }
  }

  /**
   * Core logging methods
   */
  private addLog(level: LogEntry['level'], message: string, data?: any, source?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toTimeString().split(' ')[0],
      level,
      message,
      data,
      source,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Update on-screen panel if enabled
    this.updateDebugPanel();

    // Also call original console method
    const originalMethod = this.originalConsole[level];
    if (data !== undefined) {
      originalMethod(`[${source || 'App'}]`, message, data);
    } else {
      originalMethod(`[${source || 'App'}]`, message);
    }
  }

  log(message: string, data?: any, source?: string) {
    this.addLog('log', message, data, source);
  }

  error(message: string, data?: any, source?: string) {
    this.addLog('error', message, data, source);
  }

  warn(message: string, data?: any, source?: string) {
    this.addLog('warn', message, data, source);
  }

  info(message: string, data?: any, source?: string) {
    this.addLog('info', message, data, source);
  }

  debug(message: string, data?: any, source?: string) {
    this.addLog('debug', message, data, source);
  }

  /**
   * Intercept console methods
   */
  private interceptConsole() {
    console.log = (...args) => {
      this.addLog('log', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '));
    };

    console.error = (...args) => {
      this.addLog('error', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '));
    };

    console.warn = (...args) => {
      this.addLog('warn', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '));
    };

    console.info = (...args) => {
      this.addLog('info', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '));
    };

    console.debug = (...args) => {
      this.addLog('debug', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '));
    };
  }

  private restoreConsole() {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
  }

  clearLogs() {
    this.logs = [];
    this.updateDebugPanel();
  }

  getLogs() {
    return [...this.logs];
  }

  /**
   * Method 5: Export logs as markdown for sharing
   */
  exportAsMarkdown(): string {
    let markdown = '# Debug Logs\n\n';
    markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
    markdown += `**URL:** ${window.location.href}\n\n`;
    markdown += '## Logs\n\n';

    this.logs.forEach((log) => {
      const emoji = {
        log: '📝',
        error: '❌',
        warn: '⚠️',
        info: 'ℹ️',
        debug: '🔧',
      }[log.level];

      markdown += `### ${emoji} ${log.timestamp} - ${log.level.toUpperCase()}\n`;
      if (log.source) markdown += `**Source:** ${log.source}\n\n`;
      markdown += `${log.message}\n`;
      if (log.data) {
        markdown += '\n```json\n';
        markdown += JSON.stringify(log.data, null, 2);
        markdown += '\n```\n';
      }
      markdown += '\n---\n\n';
    });

    return markdown;
  }
}

// Create singleton instance
const debugLogger = new DebugLogger();

// Export for use in components
export default debugLogger;

// Also expose globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugLogger = debugLogger;
  (window as any).debug = {
    enable: () => debugLogger.enableOnScreenLogging(),
    disable: () => debugLogger.disableOnScreenLogging(),
    copy: () => debugLogger.copyLogsToClipboard(),
    download: () => debugLogger.downloadLogs(),
    clear: () => debugLogger.clearLogs(),
    logs: () => debugLogger.getLogs(),
    markdown: () => {
      const md = debugLogger.exportAsMarkdown();
      console.log(md);
      navigator.clipboard.writeText(md);
      console.log('Markdown logs copied to clipboard!');
    },
  };

  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D to toggle debug panel
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      if (localStorage.getItem('debugLoggerEnabled') === 'true') {
        debugLogger.disableOnScreenLogging();
      } else {
        debugLogger.enableOnScreenLogging();
      }
    }

    // Ctrl+Shift+C to copy logs
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      debugLogger.copyLogsToClipboard();
    }
  });

  console.log('🚀 Debug Logger initialized! Commands:');
  console.log('  window.debug.enable() - Show debug panel');
  console.log('  window.debug.disable() - Hide debug panel');
  console.log('  window.debug.copy() - Copy logs to clipboard');
  console.log('  window.debug.download() - Download logs as JSON');
  console.log('  window.debug.markdown() - Copy logs as markdown');
  console.log('  Ctrl+Shift+D - Toggle debug panel');
  console.log('  Ctrl+Shift+C - Copy logs to clipboard');
}
