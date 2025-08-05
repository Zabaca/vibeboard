# AI Whiteboard POC

An interactive whiteboard application that generates React components using AI (Cerebras) and arranges them on a visual canvas powered by React Flow. The app features an ESM-first architecture with native browser import maps for seamless component execution.

## Features

- 🤖 **AI Component Generation** - Generate React components from natural language prompts using Cerebras AI
- 🎨 **Visual Canvas** - Drag, drop, and resize components on a React Flow canvas
- 📚 **Component Library** - Pre-built components organized by category (UI, Data, Forms, Charts, Layout, Utility)
- 🔗 **URL Import** - Import ES modules directly from CDNs (esm.sh, unpkg, skypack)
- 🚀 **ESM-First Architecture** - Native ES modules with import maps for React singleton
- 👁️ **Presentation Mode** - Toggle between edit and clean presentation views
- 📋 **Code Operations** - Copy code, regenerate with edited prompts, delete components
- 💾 **Persistent State** - Auto-save to localStorage with export/import capabilities
- ⚡ **Fast Generation** - Sub-5-second component generation with Cerebras AI
- 🔧 **Smart Transpilation** - Automatic JSX to JS conversion with import fixing
- 🧹 **Storage Management** - Automatic cleanup and optimization of cached components

## Local Development

### Prerequisites
- Node.js 20+
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your Cerebras API key (optional - will prompt if not set):
```bash
# Create .env.local file
echo "VITE_CEREBRAS_API_KEY=your-api-key-here" > .env.local
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:5173

## Production Deployment (Netlify)

### Prerequisites
- A Netlify account
- A Cerebras API key

### Deployment Steps

1. **Fork/Clone this repository**

2. **Connect to Netlify:**
   - Log in to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub account and select this repository

3. **Configure Build Settings:**
   - Base directory: `apps/ai-whiteboard-poc`
   - Build command: `npm run build`
   - Publish directory: `apps/ai-whiteboard-poc/dist`
   - Functions directory: `apps/ai-whiteboard-poc/netlify/functions`

4. **Set Environment Variables:**
   In Netlify dashboard → Site settings → Environment variables:
   ```
   CEREBRAS_API_KEY = your-cerebras-api-key
   NODE_VERSION = 20
   ```

5. **Deploy:**
   - Click "Deploy site"
   - Your app will be available at `https://your-site-name.netlify.app`

### Manual Deployment

If you prefer to deploy manually using Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build the project
npm run build

# Deploy to Netlify
netlify deploy --dir=dist --prod
```

## Environment Variables

### Development
- `VITE_CEREBRAS_API_KEY` - Your Cerebras API key (optional, will prompt if not set)

### Production (Netlify)
- `CEREBRAS_API_KEY` - Your Cerebras API key (required)
- `NODE_VERSION` - Node.js version (set to 20)

## Architecture

### Tech Stack
- **Frontend:** React 19 + TypeScript
- **Canvas:** React Flow (@xyflow/react) - Replaced Excalidraw for better component integration
- **AI:** Cerebras API (Llama models for fast generation)
- **Module System:** Native ES modules with browser import maps
- **Transpilation:** Babel standalone for runtime JSX compilation
- **Build:** Vite
- **Deployment:** Netlify with Edge Functions

### Key Architectural Decisions

1. **ESM-First Design:**
   - All components are ES modules (no UMD/CommonJS)
   - Native browser import maps handle React singleton
   - Direct CDN imports without bundling

2. **React Singleton Pattern:**
   - Import maps redirect all React imports to shim modules
   - Shims return the application's React instance (window.React)
   - Prevents "Invalid Hook Call" errors from multiple React instances

3. **Component Pipeline:**
   - Unified processing for AI-generated, library, and URL-imported components
   - Smart caching with hash-based change detection
   - Automatic import fixing for missing React hooks

4. **Storage Strategy:**
   - Components cached in localStorage with size limits
   - Automatic cleanup of old/unused components
   - Export/import for sharing canvas configurations

## Troubleshooting

### Component Execution Issues
- **"Invalid Hook Call" Error**: Check browser console for multiple React instances
- **Import Errors**: Ensure import maps are properly configured in `index.html`
- **ESM Module Errors**: Verify the component uses standard ES module syntax

### CORS Issues
- In development: Vite proxy handles this automatically
- In production: Netlify Function acts as proxy
- For URL imports: Some CDNs may have CORS restrictions

### API Key Issues
- Development: Check `.env.local` file or localStorage
- Production: Verify `CEREBRAS_API_KEY` is set in Netlify environment variables
- The app will prompt for API key if not found

### Build Issues
- Ensure Node.js version is 20+
- Clear cache: `rm -rf node_modules dist && npm install`
- Check TypeScript: `npm run typecheck`
- Clear browser cache if components aren't updating

### Performance Issues
- Use the 🧹 Cleanup button to clear old cached components
- Export and reimport canvas if localStorage is full
- Disable debug mode in production for better performance

## License

MIT
