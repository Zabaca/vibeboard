# ESM Component Library

This directory contains React components that demonstrate loading UI libraries from published NPM packages via CDN using ESM imports.

## Components

All components use **top-level imports** (production style) to load NPM packages directly from CDN:

### Icon Libraries
- **lucide-icons-demo.js** - Lucide React icons (1000+ icons)
- **lucide-icons-production.js** - Production example with top-level import
- **react-feather-demo.js** - React Feather icons (287 icons)
- **react-icons-demo.js** - Multiple icon sets (Font Awesome, Material Design, etc.)

### UI Components
- **confetti-button.js** - Canvas confetti effects library

## Key Features

- ✅ **Real NPM packages** - All components load actual published packages
- ✅ **Top-level imports** - No dynamic loading, immediate availability
- ✅ **External React** - Uses `?external=react` flag to avoid bundling React
- ✅ **React 19 compatible** - Works with the latest React version
- ✅ **No build step** - Direct ESM imports from CDN

## Import Pattern

All components follow this pattern:
```javascript
import React from 'react';
import * as Icons from 'https://esm.sh/package-name@version?external=react';
```

This ensures:
- Components are available immediately (no loading state needed)
- Better TypeScript support (if using TS)
- Module loaded once at parse time
- Better for production applications