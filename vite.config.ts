import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure public directory is served correctly for shims
  publicDir: 'public',
  server: {
    proxy: {
      '/api/cerebras': {
        target: 'https://api.cerebras.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cerebras/, ''),
      },
      '/proxy/unpkg': {
        target: 'https://unpkg.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy\/unpkg/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Ensure proper headers for unpkg
            proxyReq.setHeader('Accept', 'application/javascript, text/javascript, */*');
          });
          proxy.on('proxyRes', (proxyRes) => {
            // Add CORS headers
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, OPTIONS';
          });
        },
      },
      '/proxy/skypack': {
        target: 'https://cdn.skypack.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/skypack/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
          });
        },
      },
      '/proxy/jsdelivr': {
        target: 'https://cdn.jsdelivr.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/jsdelivr/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
          });
        },
      },
    },
  },
  build: {
    // Ensure shims are copied to dist
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
    // Don't minify for easier debugging
    minify: false,
  },
  // Optimize deps to exclude our shims from pre-bundling
  optimizeDeps: {
    exclude: [
      '/shims/react.js',
      '/shims/react-dom.js',
      '/shims/react-jsx-runtime.js',
    ],
  },
});
