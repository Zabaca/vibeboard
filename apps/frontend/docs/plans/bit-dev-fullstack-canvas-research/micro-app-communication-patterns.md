# Micro-App Communication Patterns

## Overview
This document outlines communication patterns between micro-apps in a canvas-based platform, covering frontend-to-frontend, frontend-to-backend, and backend-to-backend communication.

## Frontend Communication Patterns

### 1. Browser Events (Recommended)
Use native browser CustomEvents for decoupled communication.

```typescript
// Publisher micro-app
export const publishEvent = (eventType: string, data: any) => {
  const event = new CustomEvent(`microapp:${eventType}`, {
    detail: data,
    bubbles: true,
    composed: true
  });
  window.dispatchEvent(event);
};

// Subscriber micro-app
export const subscribeToEvent = (eventType: string, handler: (data: any) => void) => {
  const wrappedHandler = (e: CustomEvent) => handler(e.detail);
  window.addEventListener(`microapp:${eventType}`, wrappedHandler);
  
  // Return cleanup function
  return () => window.removeEventListener(`microapp:${eventType}`, wrappedHandler);
};

// Usage
// Calendar micro-app publishes
publishEvent('date-selected', { date: '2024-01-30' });

// Todo micro-app subscribes
const cleanup = subscribeToEvent('date-selected', (data) => {
  filterTodosByDate(data.date);
});
```

### 2. Shared State Store
Global state management using Zustand or Valtio.

```typescript
// Shared store definition
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface CanvasState {
  selectedMicroApps: string[];
  sharedData: Record<string, any>;
  updateSharedData: (appId: string, data: any) => void;
}

export const useCanvasStore = create<CanvasState>()(
  subscribeWithSelector((set) => ({
    selectedMicroApps: [],
    sharedData: {},
    updateSharedData: (appId, data) =>
      set((state) => ({
        sharedData: { ...state.sharedData, [appId]: data }
      }))
  }))
);

// Micro-app usage
const CalendarWidget = () => {
  const updateSharedData = useCanvasStore((state) => state.updateSharedData);
  
  const handleDateSelect = (date: Date) => {
    updateSharedData('calendar', { selectedDate: date });
  };
};

// Another micro-app subscribes
const TodoWidget = () => {
  const calendarData = useCanvasStore((state) => state.sharedData.calendar);
  
  useEffect(() => {
    if (calendarData?.selectedDate) {
      filterByDate(calendarData.selectedDate);
    }
  }, [calendarData]);
};
```

### 3. PostMessage API (for iframe-based micro-apps)
When micro-apps are in iframes for stronger isolation.

```typescript
// Parent canvas
const sendToMicroApp = (appId: string, message: any) => {
  const iframe = document.getElementById(`microapp-${appId}`) as HTMLIFrameElement;
  iframe.contentWindow?.postMessage(
    { type: 'canvas-message', ...message },
    '*' // Use specific origin in production
  );
};

// Micro-app in iframe
window.addEventListener('message', (event) => {
  if (event.data.type === 'canvas-message') {
    handleCanvasMessage(event.data);
  }
});
```

## Backend Communication Patterns

### 1. Event Bus Pattern
Centralized event bus for backend services.

```typescript
// Event bus service (serverless function)
export async function publishEvent(event: {
  type: string;
  source: string;
  data: any;
}) {
  // Using AWS EventBridge
  await eventBridge.putEvents({
    Entries: [{
      Source: `microapp.${event.source}`,
      DetailType: event.type,
      Detail: JSON.stringify(event.data)
    }]
  }).promise();
}

// Subscriber function
export async function handleCalendarEvent(event: EventBridgeEvent) {
  if (event['detail-type'] === 'calendar.event.created') {
    const data = JSON.parse(event.detail);
    await updateTodoDeadlines(data);
  }
}
```

### 2. HTTP Webhooks
Direct HTTP calls between micro-app backends.

```typescript
// Webhook registration
interface WebhookSubscription {
  microAppId: string;
  eventType: string;
  callbackUrl: string;
}

// Publisher service
export async function triggerWebhooks(eventType: string, data: any) {
  const subscriptions = await getSubscriptions(eventType);
  
  await Promise.allSettled(
    subscriptions.map(sub =>
      fetch(sub.callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MicroApp-Event': eventType,
          'X-MicroApp-Source': process.env.MICROAPP_ID
        },
        body: JSON.stringify(data)
      })
    )
  );
}
```

### 3. Shared Message Queue
Using services like AWS SQS or Google Pub/Sub.

```typescript
// Publisher
import { SQS } from 'aws-sdk';
const sqs = new SQS();

export async function publishToQueue(message: any) {
  await sqs.sendMessage({
    QueueUrl: process.env.SHARED_QUEUE_URL,
    MessageBody: JSON.stringify({
      microAppId: process.env.MICROAPP_ID,
      timestamp: Date.now(),
      ...message
    })
  }).promise();
}

// Consumer
export async function processQueueMessages() {
  const messages = await sqs.receiveMessage({
    QueueUrl: process.env.SHARED_QUEUE_URL,
    MaxNumberOfMessages: 10
  }).promise();
  
  for (const message of messages.Messages || []) {
    const data = JSON.parse(message.Body);
    await handleMessage(data);
    
    // Delete processed message
    await sqs.deleteMessage({
      QueueUrl: process.env.SHARED_QUEUE_URL,
      ReceiptHandle: message.ReceiptHandle
    }).promise();
  }
}
```

## Global State Management

### 1. Canvas State Architecture
```typescript
// Canvas global state structure
interface CanvasGlobalState {
  // Canvas layout
  layout: {
    widgets: Array<{
      id: string;
      microAppId: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }>;
  };
  
  // User context
  user: {
    id: string;
    preferences: Record<string, any>;
  };
  
  // Shared app state
  apps: Record<string, {
    loaded: boolean;
    config: any;
    publicState: any; // State that app exposes
  }>;
  
  // Communication
  events: Array<{
    id: string;
    type: string;
    source: string;
    timestamp: number;
    data: any;
  }>;
}
```

### 2. State Synchronization
```typescript
// Real-time state sync using WebSocket
class CanvasStateSync {
  private ws: WebSocket;
  private state: CanvasGlobalState;
  
  connect() {
    this.ws = new WebSocket(process.env.SYNC_SERVER_URL);
    
    this.ws.on('message', (data) => {
      const update = JSON.parse(data);
      this.applyStateUpdate(update);
    });
  }
  
  updateState(path: string, value: any) {
    // Local update
    this.state = updatePath(this.state, path, value);
    
    // Broadcast to other clients
    this.ws.send(JSON.stringify({
      type: 'state-update',
      path,
      value,
      timestamp: Date.now()
    }));
  }
}
```

### 3. State Persistence
```typescript
// Serverless function for state persistence
export async function saveCanvasState(userId: string, state: CanvasGlobalState) {
  // Using Vercel KV or Upstash Redis
  await kv.set(`canvas:${userId}`, JSON.stringify(state), {
    ex: 86400 // 24 hour expiry
  });
}

export async function loadCanvasState(userId: string): Promise<CanvasGlobalState> {
  const saved = await kv.get(`canvas:${userId}`);
  return saved ? JSON.parse(saved) : getDefaultState();
}
```

## Service Mesh Patterns (Advanced)

### 1. API Gateway Pattern
Single entry point for all micro-app backend communication.

```typescript
// API Gateway configuration
export const routes = {
  '/api/calendar/*': 'https://calendar-service.vercel.app',
  '/api/todo/*': 'https://todo-service.vercel.app',
  '/api/chat/*': 'https://chat-service.vercel.app'
};

export async function handler(req: Request) {
  const path = new URL(req.url).pathname;
  const target = findTargetService(path);
  
  if (!target) {
    return new Response('Not Found', { status: 404 });
  }
  
  // Add authentication headers
  const headers = new Headers(req.headers);
  headers.set('X-User-Id', await getUserId(req));
  
  // Forward request
  return fetch(target + path, {
    method: req.method,
    headers,
    body: req.body
  });
}
```

### 2. Service Discovery
Dynamic service discovery for micro-apps.

```typescript
// Service registry
interface ServiceRegistry {
  [microAppId: string]: {
    url: string;
    version: string;
    health: string;
    endpoints: string[];
  };
}

// Service discovery client
class ServiceDiscovery {
  private registry: ServiceRegistry = {};
  
  async discover(microAppId: string) {
    // Check cache
    if (this.registry[microAppId]) {
      return this.registry[microAppId];
    }
    
    // Fetch from registry service
    const response = await fetch(`${REGISTRY_URL}/services/${microAppId}`);
    const service = await response.json();
    
    this.registry[microAppId] = service;
    return service;
  }
  
  async callService(microAppId: string, endpoint: string, data: any) {
    const service = await this.discover(microAppId);
    return fetch(`${service.url}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
```

## Best Practices

### 1. Event Naming Conventions
```typescript
// Format: source.entity.action
const EVENT_TYPES = {
  CALENDAR_EVENT_CREATED: 'calendar.event.created',
  TODO_ITEM_COMPLETED: 'todo.item.completed',
  CHAT_MESSAGE_SENT: 'chat.message.sent'
};
```

### 2. Error Handling
```typescript
// Graceful degradation
const safePublish = async (event: any) => {
  try {
    await publishEvent(event);
  } catch (error) {
    console.error('Event publish failed:', error);
    // Store for retry
    await storeFailedEvent(event);
  }
};
```

### 3. Rate Limiting
```typescript
// Prevent event flooding
const rateLimiter = new Map<string, number>();

export const throttledPublish = (event: any) => {
  const key = `${event.source}:${event.type}`;
  const lastPublish = rateLimiter.get(key) || 0;
  
  if (Date.now() - lastPublish < 100) { // 100ms throttle
    return;
  }
  
  rateLimiter.set(key, Date.now());
  publishEvent(event);
};
```

### 4. Security
```typescript
// Validate event sources
const validateEventSource = (event: any) => {
  const allowedSources = process.env.ALLOWED_MICROAPPS?.split(',') || [];
  if (!allowedSources.includes(event.source)) {
    throw new Error('Unauthorized event source');
  }
};
```

## Recommended Architecture

For the canvas platform:

1. **Frontend**: Browser Events + Shared Zustand Store
2. **Backend**: Event Bus (AWS EventBridge or Google Pub/Sub)
3. **State**: Global state with WebSocket sync
4. **Security**: API Gateway with authentication
5. **Monitoring**: Event tracking and visualization

This provides:
- Loose coupling between micro-apps
- Real-time updates
- Scalable architecture
- Good developer experience
- Easy debugging and monitoring