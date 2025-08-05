# Vibeboard

An AI-powered visual canvas platform for creating interactive component-based interfaces.

## Overview

Vibeboard is a next-generation whiteboard platform built as a monorepo that combines:
- 🎨 Visual canvas with drag-and-drop interface
- 🤖 AI-powered component generation
- 📦 Dynamic component loading with ESM-first architecture
- 🔧 Bit.dev integration for component management
- ⚡ Real-time preview and editing
- 🏗️ Monorepo architecture for scalable development

## Features

- **AI Component Generation**: Generate React components using natural language prompts with Cerebras AI
- **Visual Canvas**: ReactFlow-based node system for visual programming
- **Component Library**: Pre-built components ready to use (UI, Data, Forms, Charts, Layout, Utility)
- **ESM Architecture**: Modern ES modules with import maps for React singleton management
- **Live Preview**: See components render in real-time
- **URL Import**: Import ES modules directly from CDNs (esm.sh, unpkg, skypack)
- **Persistent Storage**: Auto-save to localStorage with export/import capabilities
- **Presentation Mode**: Toggle between edit and clean presentation views

## Project Structure

```
vibeboard/
├── apps/
│   ├── frontend/          # React frontend application
│   └── backend/           # (Future) Backend services
├── packages/              # Shared packages
│   └── shared/           # (Future) Shared utilities
├── pnpm-workspace.yaml   # PNPM workspace configuration
└── package.json          # Root monorepo package.json
```

## Getting Started

### Prerequisites

- Node.js 16+ (recommended: 20+)
- pnpm 8+ (install with `npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone [repository-url] vibeboard
cd vibeboard

# Install all dependencies
pnpm install

# Start the frontend development server
pnpm dev

# Or start specific apps
pnpm --filter frontend dev
```

The frontend will be available at http://localhost:5173

### Environment Setup

Create a `.env.local` file in the frontend app for your Cerebras API key (optional - will prompt if not set):

```bash
echo "VITE_CEREBRAS_API_KEY=your-api-key-here" > apps/frontend/.env.local
```

### Build

```bash
# Build all apps
pnpm build:all

# Build frontend only
pnpm build

# Preview frontend production build
pnpm preview
```

### Monorepo Commands

```bash
# Run command in specific app
pnpm --filter frontend <command>
pnpm --filter backend <command>

# Run command in all apps
pnpm -r <command>

# Run parallel dev servers (when backend is added)
pnpm dev:all
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript
- **Canvas**: React Flow (@xyflow/react)
- **AI**: Cerebras API (Llama models for fast generation)
- **Module System**: Native ES modules with browser import maps
- **Transpilation**: Babel standalone for runtime JSX compilation
- **Build**: Vite
- **Component Management**: Bit.dev (in progress)

### Key Architectural Features

1. **ESM-First Design**
   - All components are ES modules
   - Native browser import maps handle React singleton
   - Direct CDN imports without bundling

2. **React Singleton Pattern**
   - Prevents "Invalid Hook Call" errors
   - Import maps redirect all React imports to shim modules
   - Shims return the application's React instance

3. **Unified Component Pipeline**
   - Supports multiple component sources (AI, library, URL)
   - Smart caching with hash-based change detection
   - Automatic import fixing for missing React hooks

## Component Development

Components can be created through:

1. **AI Generation**: Natural language → Cerebras AI → React component
2. **Pre-built Library**: Choose from categorized components in `/public/components/`
3. **URL Import**: Import ES modules directly from CDN URLs
4. **Bit.dev Publishing**: Component management and versioning (coming soon)

### Component Structure

```javascript
// Standard ESM component format
import React, { useState } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

## Deployment

### Netlify Deployment

1. Connect repository to Netlify
2. Configure build settings:
   - Base directory: `apps/frontend`
   - Build command: `pnpm build`
   - Publish directory: `apps/frontend/dist`
   - Functions directory: `apps/frontend/netlify/functions`
3. Set environment variables:
   - `CEREBRAS_API_KEY`: Your Cerebras API key
   - `NODE_VERSION`: 20

### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build frontend
pnpm build

# Deploy from frontend directory
cd apps/frontend
netlify deploy --dir=dist --prod
```

## Contributing

We welcome contributions! Please see our contributing guidelines for:
- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 📧 Email: [support email]
- 🐛 Issues: [GitHub Issues](https://github.com/[org]/vibeboard/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/[org]/vibeboard/discussions)

---

Built with ❤️ by the Vibeboard Team