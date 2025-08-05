# Micro-App Deployment Patterns

## Overview
This document outlines deployment patterns for fullstack micro-apps using bit.dev components with serverless backends.

## Serverless Function Patterns

### 1. Backend-for-Frontend (BFF) Pattern
Each micro-app gets its own dedicated serverless backend that serves as the API layer.

```typescript
// Structure for each micro-app
micro-app/
├── frontend/
│   └── widget.tsx          // UI component
└── api/
    ├── bff.ts             // Main BFF handler
    ├── auth.ts            // Auth middleware
    └── routes/
        ├── data.ts        // GET/POST /api/data
        └── actions.ts     // POST /api/actions
```

**Benefits**:
- Tailored API for each micro-app's needs
- Independent scaling and deployment
- Reduced over-fetching
- Simpler frontend code

### 2. Edge Function Pattern
Deploy compute-heavy or latency-sensitive functions to edge locations.

```typescript
// Edge function example (Cloudflare Workers)
export default {
  async fetch(request: Request) {
    // Run close to users for low latency
    const cache = caches.default;
    const cached = await cache.match(request);
    if (cached) return cached;
    
    // Process request at edge
    const response = await processRequest(request);
    await cache.put(request, response.clone());
    return response;
  }
};
```

**Use Cases**:
- Authentication/authorization
- Request routing
- Response caching
- Data transformation
- A/B testing

### 3. Event-Driven Pattern
Micro-apps communicate through events using serverless functions as handlers.

```typescript
// Event publisher (micro-app A)
await publishEvent({
  type: 'USER_ACTION',
  microApp: 'calendar',
  data: { userId, action: 'event-created' }
});

// Event handler (micro-app B)
export async function handleEvent(event) {
  if (event.type === 'USER_ACTION') {
    await updateDashboard(event.data);
  }
}
```

**Benefits**:
- Loose coupling between micro-apps
- Asynchronous processing
- Easy to add new consumers
- Natural audit trail

## Deployment Strategies

### 1. Monolithic Deployment
All micro-app backends deployed as single serverless app.

```
canvas-backend/
├── api/
│   ├── micro-app-1/
│   ├── micro-app-2/
│   └── micro-app-3/
└── vercel.json    // Single config
```

**Pros**: Simple deployment, shared middleware
**Cons**: All micro-apps redeploy together

### 2. Polyrepo Deployment
Each micro-app in its own repository with independent deployment.

```
org/
├── calendar-micro-app/
│   ├── frontend/
│   ├── api/
│   └── .github/workflows/deploy.yml
├── todo-micro-app/
└── chat-micro-app/
```

**Pros**: Complete independence, different teams
**Cons**: Harder to share code, more overhead

### 3. Monorepo with Independent Deployment
All micro-apps in monorepo but deploy independently.

```
apps/
├── micro-apps/
│   ├── calendar/
│   │   ├── frontend/
│   │   ├── api/
│   │   └── deploy.config.js
│   └── shared/
│       └── auth/
```

**Pros**: Code sharing, independent deployment
**Cons**: More complex CI/CD setup

## Platform-Specific Patterns

### Vercel Deployment
```json
// vercel.json for micro-app
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs18.x",
      "maxDuration": 10
    }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ]
}
```

### Netlify Deployment
```toml
# netlify.toml for micro-app
[build]
  command = "bit build"
  publish = "dist"
  functions = "api"

[functions]
  directory = "api/"
  node_bundler = "esbuild"

[[edge_functions]]
  path = "/api/auth"
  function = "auth"
```

### AWS Lambda Deployment
```typescript
// serverless.yml
service: micro-app-${self:custom.appName}
provider:
  name: aws
  runtime: nodejs18.x
  stage: ${opt:stage, 'prod'}
  
functions:
  bff:
    handler: api/bff.handler
    events:
      - http:
          path: /api/{proxy+}
          method: ANY
```

## Container-Based Alternatives

### When to Consider Containers
- Long-running processes
- WebSocket connections
- Complex dependencies
- Stateful operations

### Container Patterns
```dockerfile
# Dockerfile for micro-app backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

**Deployment Options**:
- Google Cloud Run (serverless containers)
- AWS Fargate (serverless containers)
- Fly.io (edge containers)
- Railway (simple container hosting)

## Hybrid Patterns

### Serverless + Containers
- Use serverless for API endpoints
- Use containers for WebSocket servers
- Example: Chat micro-app with REST API (serverless) + WebSocket (container)

### Edge + Origin
- Use edge functions for auth and routing
- Use origin serverless for business logic
- Example: Authentication at edge, data processing at origin

## Best Practices

### 1. Cold Start Optimization
```typescript
// Keep functions warm
export const keepWarm = async () => {
  // Minimal function to prevent cold starts
  return { status: 'warm' };
};

// Optimize imports
const heavyLib = () => import('heavy-library');
```

### 2. Shared Dependencies
```typescript
// Use layers or shared node_modules
// Layer structure
layers/
├── shared-deps/
│   └── nodejs/
│       └── node_modules/
└── shared-utils/
    └── nodejs/
        └── utils/
```

### 3. Environment Configuration
```typescript
// Centralized config per micro-app
export const config = {
  apiUrl: process.env.API_URL,
  apiKey: process.env.API_KEY,
  features: {
    newFeature: process.env.ENABLE_NEW_FEATURE === 'true'
  }
};
```

### 4. Monitoring and Logging
```typescript
// Structured logging
import { logger } from '@bit/shared.utils.logger';

export async function handler(event) {
  logger.info('Request received', {
    microApp: 'calendar',
    userId: event.userId,
    action: event.action
  });
  
  try {
    const result = await processRequest(event);
    logger.info('Request processed', { success: true });
    return result;
  } catch (error) {
    logger.error('Request failed', { error: error.message });
    throw error;
  }
}
```

## Recommended Architecture

For the bit.dev canvas platform:

1. **Frontend**: Module Federation with CDN deployment
2. **Backend**: Serverless functions (Vercel/Netlify)
3. **Edge**: Authentication and routing (Cloudflare Workers)
4. **Events**: AWS EventBridge or Google Pub/Sub
5. **Storage**: Serverless KV stores (Upstash, Vercel KV)
6. **Monitoring**: Built-in platform monitoring + Sentry

This provides the best balance of:
- Developer experience
- Cost efficiency
- Scalability
- Performance
- Maintainability