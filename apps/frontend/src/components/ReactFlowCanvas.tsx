import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CerebrasService from '../services/cerebras.ts';
import ComponentNode, { type ComponentNodeData } from './ComponentNode.tsx';
import GenerationDialog from './GenerationDialog.tsx';
import CodeEditDialogOptimized from './CodeEditDialogOptimized.tsx';
import ComponentLibrary from './ComponentLibrary.tsx';
import { ImportFromURLDialog } from './ImportFromURLDialog.tsx';
import ImportComponentDialog from './ImportComponentDialog.tsx';
import { type PrebuiltComponent } from '../data/prebuiltComponents.ts';
import { ComponentPipeline } from '../services/ComponentPipeline.ts';
import { getCompiledComponent } from '../data/compiledComponents.generated.ts';
import { storageService } from '../services/StorageService.ts';
import { posthogService } from '../services/posthog.ts';
import type { UnifiedComponentNode, VisionMetadata } from '../types/component.types.ts';
import type { ScreenshotResult } from '../utils/screenshotUtils.ts';
import type { NativeComponentType, NativeComponentNode, ComponentState } from '../types/native-component.types.ts';
import { defaultComponentStates } from '../types/native-component.types.ts';
import ShapeNode from './native/ShapeNode.tsx';
import TextNode from './native/TextNode.tsx';
import StickyNote from './native/StickyNote.tsx';
import NativeComponentsToolbar from './native/NativeComponentsToolbar.tsx';
import NativeComponentContextMenu from './native/NativeComponentContextMenu.tsx';

// Define nodeTypes outside of component to prevent re-renders
const nodeTypes = {
  aiComponent: ComponentNode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shape: ShapeNode as React.ComponentType<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  text: TextNode as React.ComponentType<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sticky: StickyNote as React.ComponentType<any>,
};

const ReactFlowCanvas: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ComponentNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [editDialog, setEditDialog] = useState<{ isOpen: boolean; nodeId: string; prompt: string; code: string }>({
    isOpen: false,
    nodeId: '',
    prompt: '',
    code: '',
  });
  const [showLibrary, setShowLibrary] = useState(false);
  const [showURLImport, setShowURLImport] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
    nodeType: NativeComponentType;
  } | null>(null);
  const reactFlowInstance = useRef<ReactFlowInstance<Node<ComponentNodeData>, Edge> | null>(null);
  
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;
  
  const [cerebrasService] = useState(() => {
    // In production (Netlify), we don't need API key (handled server-side)
    // In development, get from env or localStorage
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    
    if (isProduction) {
      // Production: API key is handled by Netlify Function
      return new CerebrasService('', true); // Enable vision
    }
    
    // Development: Get API key from environment variable or prompt user
    const apiKey = import.meta.env.VITE_CEREBRAS_API_KEY || localStorage.getItem('cerebras_api_key') || '';
    if (!apiKey) {
      const key = prompt('Please enter your Cerebras API key:');
      if (key) {
        localStorage.setItem('cerebras_api_key', key);
        return new CerebrasService(key, true); // Enable vision
      }
    }
    return new CerebrasService(apiKey, true); // Enable vision
  });

  // Initialize the component pipeline for processing components
  const [componentPipeline] = useState(() => new ComponentPipeline());

  // Helper function to get the center of the current viewport
  const getViewportCenter = useCallback(() => {
    if (reactFlowInstance.current) {
      const { x, y, zoom } = reactFlowInstance.current.getViewport();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate the center position in flow coordinates
      const centerX = (-x + viewportWidth / 2) / zoom;
      const centerY = (-y + viewportHeight / 2) / zoom;
      
      return { x: centerX - 200, y: centerY - 200 }; // Offset by half the default node size
    }
    // Fallback to default position
    return { x: 250, y: 250 };
  }, []);

  // Handle compilation completion from GeneratedApp components
  const handleCompilationComplete = useCallback((nodeId: string, compiledCode: string, hash: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              compiledCode,
              compiledHash: hash,
              compiledAt: Date.now(),
              compilerVersion: '1.0.0',
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Handle screenshot capture from ComponentNode
  const handleScreenshotCapture = useCallback((nodeId: string, result: ScreenshotResult) => {
    console.log('📸 Screenshot captured for node:', nodeId, result);
    
    if (!result.success) {
      console.error('Failed to capture screenshot:', result.error);
      return;
    }

    // Update the node's vision metadata with the screenshot
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const nodeData = node.data as ComponentNodeData;
          
          // Create vision metadata structure with version tracking
          const visionMetadata: VisionMetadata = {
            screenshot: {
              dataUrl: result.dataUrl || '',
              format: result.format || 'png',
              capturedAt: result.capturedAt,
              sizeKB: result.sizeKB || 0,
              dimensions: result.dimensions,
            },
            // Vision analysis will be added later when edit modal triggers analysis
            visionAnalysis: nodeData.metadata?.vision?.visionAnalysis,
            version: 1, // Initialize version for new vision data
            lastUpdated: Date.now(),
          };
          
          return {
            ...node,
            data: {
              ...nodeData,
              metadata: {
                ...nodeData.metadata,
                vision: visionMetadata,
              },
            },
          };
        }
        return node;
      })
    );
    
    // Save to storage after updating
    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        const nodeData = node.data as ComponentNodeData;
        return {
          ...node,
          data: {
            ...nodeData,
            metadata: {
              ...nodeData.metadata,
              vision: {
                screenshot: {
                  dataUrl: result.dataUrl || '',
                  format: result.format || 'png',
                  capturedAt: result.capturedAt,
                  sizeKB: result.sizeKB || 0,
                  dimensions: result.dimensions,
                },
                visionAnalysis: nodeData.metadata?.vision?.visionAnalysis,
              },
            },
          },
        };
      }
      return node;
    });
    
    storageService.saveNodes(updatedNodes);
    storageService.saveEdges(edges);
    posthogService.track('screenshot_captured', { nodeId });
  }, [setNodes, nodes, edges]);


  // Define handlers first before using them in useEffect
  const handleDeleteComponent = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    posthogService.trackComponentInteraction('delete', nodeId);
  }, [setNodes]);

  // Open the edit dialog when edit button is clicked
  const handleRegenerateComponent = useCallback((nodeId: string, prompt: string, currentCode?: string) => {
    setEditDialog({
      isOpen: true,
      nodeId,
      prompt,
      code: currentCode || '', // Store the current code for comparison
    });
    posthogService.trackComponentInteraction('edit', nodeId);
  }, []);

  // Duplicate a component node
  const handleDuplicateComponent = useCallback((nodeData: ComponentNodeData) => {
    // Create a new node with the same data but new ID and position
    const newNodeId = `node-${Date.now()}`;
    const viewportCenter = getViewportCenter();
    const newNode: Node<ComponentNodeData> = {
      id: newNodeId,
      type: 'aiComponent',
      // Place at viewport center with small random offset to avoid exact overlap
      position: { 
        x: viewportCenter.x + Math.random() * 50 - 25, 
        y: viewportCenter.y + Math.random() * 50 - 25
      },
      width: 400,
      height: 400,
      style: {
        width: 400,
        height: 400,
      },
      data: {
        ...nodeData,
        id: newNodeId,
        presentationMode,
        onDelete: handleDeleteComponent,
        onRegenerate: handleRegenerateComponent,
        onDuplicate: handleDuplicateComponent,
        onCompilationComplete: handleCompilationComplete,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    posthogService.trackComponentInteraction('duplicate', nodeData.id);
  }, [setNodes, presentationMode, handleDeleteComponent, handleRegenerateComponent, handleCompilationComplete, getViewportCenter]);

  // Save manually edited code
  const handleSaveCode = useCallback(async (newCode: string) => {
    const { nodeId } = editDialog;
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Process the manually edited code through the pipeline
      const pipelineResult = await componentPipeline.processComponent(
        {
          originalCode: newCode,
          source: 'ai-generated',
        },
        {
          useCache: true,
          validateOutput: true,
          forceRecompile: true,
          debug: false,
        }
      );
      
      if (!pipelineResult.success || !pipelineResult.component) {
        throw new Error(pipelineResult.error || 'Failed to process edited code');
      }
      
      const processedComponent = pipelineResult.component;
      
      // Update node with the new code
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const updatedData: ComponentNodeData = {
              ...processedComponent,
              id: nodeId,
              // Keep the callback functions and prompt from the existing node
              presentationMode,
              onDelete: node.data.onDelete,
              onRegenerate: node.data.onRegenerate,
              onDuplicate: node.data.onDuplicate,
              onCompilationComplete: node.data.onCompilationComplete,
              // Legacy compatibility fields
              code: processedComponent.compiledCode || processedComponent.originalCode,
              prompt: node.data.prompt || editDialog.prompt,
              generationTime: node.data.generationTime || 0,
            };
            return {
              ...node,
              data: updatedData,
            };
          }
          return node;
        })
      );
      
      // Close dialog and reset state
      setEditDialog({ isOpen: false, nodeId: '', prompt: '', code: '' });
      console.log('✅ Component code saved successfully');
    } catch (error) {
      console.error('Failed to save component code:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to save component code');
    } finally {
      setIsGenerating(false);
    }
  }, [editDialog, setNodes, componentPipeline, presentationMode]);

  // Regenerate component with new prompt
  const handleRegenerateWithPrompt = useCallback(async (refinementPrompt: string, currentCode: string, screenshotDataUrl?: string) => {
    const { nodeId, prompt: originalPrompt } = editDialog;
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Create basic prompt - vision analysis will be handled by backend
      const combinedPrompt = `Original request: ${originalPrompt}\n\nCurrent code:\n\`\`\`javascript\n${currentCode}\n\`\`\`\n\nRequested adjustments: ${refinementPrompt}`;
      
      // Log if we have screenshot data to send to backend
      if (screenshotDataUrl) {
        console.log('✨ Screenshot available for backend vision analysis');
      }
      
      // Generate new component with AI - backend will handle vision analysis if screenshot is provided
      const result = await cerebrasService.generateComponent(combinedPrompt, screenshotDataUrl);
      
      if (!result.success || !result.code) {
        throw new Error(result.error || 'Failed to generate component');
      }
      
      // Process the AI-generated component through the pipeline
      const pipelineResult = await componentPipeline.processAIComponent(
        result.code,
        originalPrompt, // Keep the original prompt for the component metadata
        result.generationTime || 0,
        {
          useCache: true,
          validateOutput: true,
          forceRecompile: true,
          debug: false,
        }
      );
      
      if (!pipelineResult.success || !pipelineResult.component) {
        throw new Error(pipelineResult.error || 'Failed to process regenerated component');
      }
      
      const processedComponent = pipelineResult.component;
      
      // Update node with the new regenerated component
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const updatedData: ComponentNodeData = {
              ...processedComponent,
              id: nodeId,
              // Keep the callback functions from the existing node
              presentationMode,
              onDelete: node.data.onDelete,
              onRegenerate: node.data.onRegenerate,
              onDuplicate: node.data.onDuplicate,
              onCompilationComplete: node.data.onCompilationComplete,
              // Legacy compatibility fields
              code: processedComponent.compiledCode || processedComponent.originalCode,
              prompt: originalPrompt, // Keep the original prompt
              generationTime: result.generationTime || 0,
            };
            return {
              ...node,
              data: updatedData,
            };
          }
          return node;
        })
      );
      
      // Close dialog and reset state
      setEditDialog({ isOpen: false, nodeId: '', prompt: '', code: '' });
      console.log('✅ Component regenerated successfully with AI');
    } catch (error) {
      console.error('Failed to regenerate component:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to regenerate component');
    } finally {
      setIsGenerating(false);
    }
  }, [editDialog, cerebrasService, setNodes, componentPipeline, presentationMode]);

  // Get component element for screenshot capture
  const getComponentElement = useCallback((nodeId: string): HTMLElement | null => {
    // Find the component element in the React Flow canvas
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
    if (!nodeElement) {
      console.warn(`Node element not found for ID: ${nodeId}`);
      return null;
    }
    
    // Look for the component content within the node
    const componentContent = nodeElement.querySelector('[data-component-content]') as HTMLElement;
    if (componentContent) {
      return componentContent;
    }
    
    // Fallback to the entire node element
    return nodeElement as HTMLElement;
  }, []);

  // Vision analysis completion will be handled when backend returns updated metadata

  const handleCancelEdit = useCallback(() => {
    setEditDialog({ isOpen: false, nodeId: '', prompt: '', code: '' });
  }, []);

  // Handle native component creation
  const handleCreateNativeComponent = useCallback((type: NativeComponentType, subType?: string) => {
    const nodeId = `${type}-${Date.now()}`;
    const viewportCenter = getViewportCenter();
    
    // Create the native component state based on type
    const defaultState = { ...defaultComponentStates[type] };
    if (type === 'shape' && subType) {
      defaultState.shapeType = subType as 'rectangle' | 'triangle' | 'square';
    }
    
    // Create native component node data
    const nativeNodeData: NativeComponentNode = {
      id: nodeId,
      componentType: 'native',
      nativeType: type,
      state: defaultState,
      source: 'native',
      originalCode: '',
      compiledCode: undefined,
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} component`,
    };
    
    // Create the node with handler functions
    const newNode: Node = {
      id: nodeId,
      type,
      position: viewportCenter,
      width: type === 'sticky' ? 200 : 150,
      height: type === 'sticky' ? 200 : 150,
      style: {
        width: type === 'sticky' ? 200 : 150,
        height: type === 'sticky' ? 200 : 150,
      },
      data: {
        ...nativeNodeData,
        presentationMode,
        onDelete: handleDeleteComponent,
        onUpdateState: handleNativeComponentStateUpdate,
      },
    };
    
    setNodes((nds) => [...nds, newNode as Node<ComponentNodeData>]);
    posthogService.trackComponentInteraction('edit', nodeId);
  }, [setNodes, presentationMode, handleDeleteComponent, getViewportCenter]);

  // Use ref to prevent getNodeCode from changing on every render
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  
  // Memoized function to get node code - prevents re-renders of CodeEditDialog
  const getNodeCode = useCallback((nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    return node?.data?.code || node?.data?.originalCode || '';
  }, []); // No dependencies - function reference never changes

  // Handle right-click on nodes to show context menu
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    
    // Only show context menu for native components
    if (node.type && ['shape', 'text', 'sticky'].includes(node.type)) {
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeType: node.type as NativeComponentType,
      });
    }
  }, []);

  // Handle duplicate for any node type
  const handleDuplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId);
    if (!nodeToDuplicate) return;

    const newNodeId = `${nodeToDuplicate.type}-${Date.now()}`;
    const newNode: Node<ComponentNodeData> = {
      ...nodeToDuplicate,
      id: newNodeId,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
      data: {
        ...nodeToDuplicate.data,
        id: newNodeId,
      } as ComponentNodeData,
    };

    setNodes((nds) => [...nds, newNode]);
    posthogService.trackComponentInteraction('duplicate', nodeId);
  }, [nodes, setNodes]);

  // Handle bring to front
  const handleBringToFront = useCallback((nodeId: string) => {
    setNodes((nds) => {
      const nodeIndex = nds.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) return nds;
      
      const newNodes = [...nds];
      const [node] = newNodes.splice(nodeIndex, 1);
      newNodes.push(node);
      return newNodes;
    });
  }, [setNodes]);

  // Handle send to back
  const handleSendToBack = useCallback((nodeId: string) => {
    setNodes((nds) => {
      const nodeIndex = nds.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) return nds;
      
      const newNodes = [...nds];
      const [node] = newNodes.splice(nodeIndex, 1);
      newNodes.unshift(node);
      return newNodes;
    });
  }, [setNodes]);

  // Handle native component state updates
  const handleNativeComponentStateUpdate = useCallback((nodeId: string, newState: ComponentState) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId && n.data) {
          return {
            ...n,
            data: {
              ...n.data,
              state: newState,
            },
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }
      
      // URL import shortcut (only in development)
      if (isDevelopment && (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setShowURLImport(true);
        return;
      }
      
      // Import component shortcut (Ctrl+Shift+P)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowImportDialog(true);
        return;
      }
      
      // Native component shortcuts (single key press)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 't':
            e.preventDefault();
            handleCreateNativeComponent('text');
            break;
          case 's':
            e.preventDefault();
            handleCreateNativeComponent('sticky');
            break;
          case 'r':
            e.preventDefault();
            handleCreateNativeComponent('shape', 'rectangle');
            break;
          case 'q':
            e.preventDefault();
            handleCreateNativeComponent('shape', 'square');
            break;
          case 'g':
            e.preventDefault();
            handleCreateNativeComponent('shape', 'triangle');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDevelopment, handleCreateNativeComponent]);

  // Export canvas to JSON file
  const handleExportCanvas = useCallback(async () => {
    try {
      const canvasData = await storageService.exportCanvas(nodes, edges);
      const dataStr = JSON.stringify(canvasData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-whiteboard-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('✅ Canvas exported successfully');
      posthogService.trackCanvasAction('export');
    } catch (error) {
      console.error('Failed to export canvas:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to export canvas');
      posthogService.trackError('canvas_export_failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }, [nodes, edges]);

  // Import canvas from JSON file
  const handleImportCanvas = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const canvasData = JSON.parse(content);
        
        // Use StorageService to handle import with validation and migration
        const { nodes: importedNodes, edges: importedEdges } = await storageService.importCanvas(canvasData);

        // Restore nodes with callbacks 
        const restoredNodes = importedNodes.map((node) => ({
          ...node,
          // Ensure width/height are set
          width: node.width || 400,
          height: node.height || 400,
          style: {
            ...node.style,
            width: node.style?.width || 400,
            height: node.style?.height || 400,
          },
          data: {
            ...node.data,
            presentationMode,
            onDelete: handleDeleteComponent,
            onRegenerate: handleRegenerateComponent,
            onDuplicate: handleDuplicateComponent,
            onCompilationComplete: handleCompilationComplete,
          } as ComponentNodeData,
        }));

        setNodes(restoredNodes);
        setEdges(importedEdges);
        
        // Save using StorageService
        await storageService.saveNodes(restoredNodes);
        await storageService.saveEdges(importedEdges);
        
        console.log(`✅ Imported ${restoredNodes.length} nodes and ${importedEdges.length} edges`);
        posthogService.trackCanvasAction('import');
      } catch (error) {
        console.error('Failed to import canvas:', error);
        setGenerationError(error instanceof Error ? error.message : 'Failed to import canvas file');
        posthogService.trackError('canvas_import_failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be imported again
    event.target.value = '';
  }, [setNodes, setEdges, presentationMode, handleDeleteComponent, handleRegenerateComponent]);

  // Load saved nodes from storage on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [savedNodes, savedEdges] = await Promise.all([
          storageService.loadNodes(),
          storageService.loadEdges(),
        ]);

        if (savedNodes.length > 0) {
          // Attach callbacks to loaded nodes
          const validNodes = savedNodes.map((node) => ({
            ...node,
            // Ensure width/height are set
            width: node.width || 400,
            height: node.height || 400,
            style: {
              ...node.style,
              width: node.style?.width || 400,
              height: node.style?.height || 400,
            },
            data: {
              ...node.data,
              presentationMode,
              onDelete: handleDeleteComponent,
              // Add native component specific callbacks
              ...(node.type && ['shape', 'text', 'sticky'].includes(node.type) ? {
                onUpdateState: handleNativeComponentStateUpdate,
              } : {
                // AI component specific callbacks
                onRegenerate: handleRegenerateComponent,
                onDuplicate: handleDuplicateComponent,
                onCompilationComplete: handleCompilationComplete,
                onCaptureScreenshot: handleScreenshotCapture,
              }),
            } as ComponentNodeData,
          }));
          setNodes(validNodes);
        }

        if (savedEdges.length > 0) {
          setEdges(savedEdges);
        }

        console.log(`✅ Loaded ${savedNodes.length} nodes and ${savedEdges.length} edges from storage`);
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    };

    loadStoredData();
    
    // Initialize automatic cleanup scheduling
    storageService.scheduleAutomaticCleanup();
    
    // Warm up cache with library components in background
    componentPipeline.warmCacheWithLibraryComponents();
  }, [setNodes, setEdges, handleDeleteComponent, handleRegenerateComponent, presentationMode, handleDuplicateComponent, handleCompilationComplete]);

  // Update all nodes when presentation mode changes (throttled to reduce renders)
  useEffect(() => {
    const timer = setTimeout(() => {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            presentationMode,
          },
        }))
      );
    }, 50); // Small delay to batch updates

    return () => clearTimeout(timer);
  }, [presentationMode, setNodes]);

  // Save nodes and edges to storage whenever they change
  useEffect(() => {
    // Debounce the save to avoid too frequent saves
    const timeoutId = setTimeout(() => {
      if (nodes.length > 0) {
        storageService.saveNodes(nodes).catch(error => {
          console.error('Failed to save nodes:', error);
        });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [nodes]);

  useEffect(() => {
    if (edges.length > 0) {
      storageService.saveEdges(edges).catch(error => {
        console.error('Failed to save edges:', error);
      });
    }
  }, [edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const handleGenerateClick = useCallback(() => {
    setShowGenerationDialog(true);
  }, []);

  const handleAddURLComponent = useCallback(async (component: UnifiedComponentNode) => {
    // Create a new node with the imported component
    const nodeId = `node-${Date.now()}`;
    
    const nodeData: ComponentNodeData = {
      ...component,
      id: nodeId,
      // Legacy compatibility fields
      code: component.compiledCode || component.originalCode,
      prompt: component.description || component.name || 'Imported from URL',
      generationTime: 0,
      presentationMode,
      onDelete: handleDeleteComponent,
      onRegenerate: handleRegenerateComponent,
      onDuplicate: handleDuplicateComponent,
      onCompilationComplete: handleCompilationComplete,
      onCaptureScreenshot: handleScreenshotCapture,
    };

    const viewportCenter = getViewportCenter();
    const newNode: Node<ComponentNodeData> = {
      id: nodeId,
      type: 'aiComponent',
      position: { 
        x: viewportCenter.x + Math.random() * 50 - 25, 
        y: viewportCenter.y + Math.random() * 50 - 25
      },
      width: 400,
      height: 400,
      // Add style for proper sizing - this fixes draggability
      style: {
        width: 400,
        height: 400,
      },
      data: nodeData,
    };

    setNodes((prevNodes) => [...prevNodes, newNode]);
    
    // Show success message
    console.log(`✅ Imported component from URL: ${component.sourceUrl}`);
  }, [presentationMode, handleDeleteComponent, handleRegenerateComponent, handleCompilationComplete, setNodes, getViewportCenter]);

  const handleAddPrebuiltComponent = useCallback(async (component: PrebuiltComponent) => {
    // Check for pre-compiled version first
    const compiled = getCompiledComponent(component.id);
    
    let nodeData: ComponentNodeData;
    
    if (compiled) {
      // Use pre-compiled component directly
      console.log(`✅ Using pre-compiled component: ${component.name}`);
      nodeData = {
        ...compiled,
        id: `node-${Date.now()}`,
        // Legacy compatibility fields
        code: compiled.compiledCode,
        prompt: compiled.name || component.name,
        generationTime: 0,
        presentationMode,
        onDelete: handleDeleteComponent,
        onRegenerate: handleRegenerateComponent,
        onDuplicate: handleDuplicateComponent,
        onCompilationComplete: handleCompilationComplete,
      };
    } else {
      // Fallback: compile at runtime using pipeline
      console.log(`⚙️ Compiling component at runtime: ${component.name}`);
      const result = await componentPipeline.processLibraryComponent(component, {
        useCache: true,
        validateOutput: true,
      });
      
      if (!result.success || !result.component) {
        console.error(`Failed to process component: ${result.error}`);
        setGenerationError(result.error || 'Failed to process component');
        return;
      }
      
      nodeData = {
        ...result.component,
        id: `node-${Date.now()}`,
        // Legacy compatibility fields
        code: result.component.compiledCode || result.component.originalCode,
        prompt: result.component.name || component.name,
        generationTime: 0,
        presentationMode,
        onDelete: handleDeleteComponent,
        onRegenerate: handleRegenerateComponent,
        onDuplicate: handleDuplicateComponent,
        onCompilationComplete: handleCompilationComplete,
      };
    }
    
    // Create a new node with the processed component
    const viewportCenter = getViewportCenter();
    const newNode: Node<ComponentNodeData> = {
      id: nodeData.id,
      type: 'aiComponent',
      position: { 
        x: viewportCenter.x + Math.random() * 50 - 25,
        y: viewportCenter.y + Math.random() * 50 - 25
      },
      width: 400,
      height: 400,
      style: {
        width: 400,
        height: 400,
      },
      data: nodeData,
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, presentationMode, handleDeleteComponent, handleRegenerateComponent, componentPipeline, setGenerationError, getViewportCenter]);

  const handleGenerateComponent = useCallback(async (prompt: string) => {
    setCurrentPrompt(prompt);
    setGenerationError(null);
    setIsGenerating(true);
    setShowGenerationDialog(false);

    const startTime = performance.now();

    try {
      const result = await cerebrasService.generateComponent(prompt);
      
      if (!result.success || !result.code) {
        posthogService.trackComponentGeneration(prompt, false);
        throw new Error(result.error || 'Failed to generate component');
      }
      
      // Process the AI-generated component through the pipeline
      const pipelineResult = await componentPipeline.processAIComponent(
        result.code,
        prompt,
        result.generationTime || 0,
        {
          useCache: true,
          validateOutput: true,
          debug: false, // Disable debug mode to reduce CPU usage
        }
      );
      
      if (!pipelineResult.success || !pipelineResult.component) {
        throw new Error(pipelineResult.error || 'Failed to process generated component');
      }
      
      const processedComponent = pipelineResult.component;
      
      // Create a new node with the processed component
      const nodeId = `node-${Date.now()}`;
      const viewportCenter = getViewportCenter();
      const newNode: Node<ComponentNodeData> = {
        id: nodeId,
        type: 'aiComponent',
        position: viewportCenter,
        width: 400,
        height: 400,
        // Good default size, but user can resize freely
        style: {
          width: 400,
          height: 400,
        },
        data: {
          ...processedComponent,
          id: nodeId,
          // Use compiled code if available, otherwise original
          code: processedComponent.compiledCode || processedComponent.originalCode,
          prompt: prompt,
          generationTime: result.generationTime || 0,
          presentationMode,
          onDelete: handleDeleteComponent,
          onRegenerate: handleRegenerateComponent,
          onCompilationComplete: handleCompilationComplete,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      
      // Track successful generation
      const generationTime = performance.now() - startTime;
      posthogService.trackComponentGeneration(prompt, true, generationTime);
    } catch (error) {
      console.error('Failed to generate component:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate component');
      posthogService.trackError('component_generation_failed', { 
        prompt, 
        error: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setIsGenerating(false);
    }
  }, [cerebrasService, setNodes, presentationMode, handleDeleteComponent, handleRegenerateComponent, componentPipeline, getViewportCenter]);

  const handleImportComponent = useCallback(async (code: string, description?: string) => {
    setGenerationError(null);
    setIsGenerating(true);
    setShowImportDialog(false);

    const startTime = performance.now();

    try {
      // Process the imported component through the same pipeline as AI-generated components
      const pipelineResult = await componentPipeline.processComponent(
        {
          originalCode: code,
          description: description || 'Imported component',
          source: 'ai-generated', // Use ai-generated to ensure same processing path
          format: 'jsx', // Will be auto-detected by the pipeline
        },
        {
          useCache: true,
          validateOutput: true,
          debug: false,
        }
      );
      
      if (!pipelineResult.success || !pipelineResult.component) {
        throw new Error(pipelineResult.error || 'Failed to process imported component');
      }
      
      const processedComponent = pipelineResult.component;
      
      // Create a new node with the processed component
      const nodeId = `node-${Date.now()}`;
      const viewportCenter = getViewportCenter();
      const newNode: Node<ComponentNodeData> = {
        id: nodeId,
        type: 'aiComponent',
        position: viewportCenter,
        width: 400,
        height: 400,
        style: {
          width: 400,
          height: 400,
        },
        data: {
          ...processedComponent,
          id: nodeId,
          // Use compiled code if available, otherwise original
          code: processedComponent.compiledCode || processedComponent.originalCode,
          prompt: description || 'Imported component',
          generationTime: 0, // No generation time for imports
          presentationMode,
          onDelete: handleDeleteComponent,
          onRegenerate: handleRegenerateComponent,
          onCompilationComplete: handleCompilationComplete,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      
      // Track successful import
      const processingTime = performance.now() - startTime;
      posthogService.trackComponentGeneration(
        description || 'Imported component', 
        true, 
        processingTime
      );
    } catch (error) {
      console.error('Failed to import component:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to import component');
      posthogService.trackError('component_import_failed', { 
        description: description || 'Imported component',
        error: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setIsGenerating(false);
    }
  }, [setNodes, presentationMode, handleDeleteComponent, handleRegenerateComponent, componentPipeline, getViewportCenter]);

  const handleImportClick = useCallback(() => {
    setShowImportDialog(true);
  }, []);

  return (
    <div className="h-screen w-screen relative" style={{ width: '100vw', height: '100vh', background: '#f8f9fa' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeContextMenu={handleNodeContextMenu}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        onInit={(instance) => { reactFlowInstance.current = instance; }}
      >
        <Background color="#aaa" gap={16} />
        {!presentationMode && <Controls />}
        {!presentationMode && (
          <MiniMap 
            nodeStrokeColor={() => '#6366f1'}
            nodeColor={() => '#fff'}
            nodeBorderRadius={8}
          />
        )}
        
        <Panel position="top-left">
          <div 
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              minWidth: '380px',
              color: 'white',
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '12px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}>
                  🎨
                </div>
                <div>
                  <h2 style={{ 
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '700',
                    letterSpacing: '-0.5px',
                  }}>
                    AI Whiteboard
                  </h2>
                  <p style={{ 
                    margin: 0,
                    fontSize: '11px',
                    opacity: 0.9,
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    Made by Zabaca
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowLibrary(true)}
                  style={{
                    backgroundColor: 'white',
                    color: '#6366f1',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  title="Choose from pre-built components"
                >
                  <span>📚</span>
                  Library
                </button>
                
                <button
                  onClick={handleImportClick}
                  disabled={isGenerating}
                  style={{
                    backgroundColor: isGenerating ? 'rgba(255,255,255,0.2)' : 'white',
                    color: isGenerating ? 'white' : '#6366f1',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isGenerating) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isGenerating) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }
                  }}
                  title="Import component from code (Ctrl+Shift+P)"
                >
                  <span>📥</span>
                  Import Code
                </button>
                
                {isDevelopment && (
                  <button
                    onClick={() => setShowURLImport(true)}
                    style={{
                      backgroundColor: 'white',
                      color: '#6366f1',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    title="Import component from URL (Ctrl+Shift+I)"
                  >
                    <span>🔗</span>
                    Import URL
                  </button>
                )}
                
                <button
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  style={{
                  backgroundColor: isGenerating ? 'rgba(255,255,255,0.2)' : 'white',
                  color: isGenerating ? 'white' : '#6366f1',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGenerating) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
              >
                {isGenerating ? (
                  <>
                    <span style={{ 
                      display: 'inline-block',
                      animation: 'spin 1s linear infinite',
                    }}>⚡</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate Component
                  </>
                )}
              </button>
              </div>
            </div>
            
            <div style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    setPresentationMode(!presentationMode);
                    if (!presentationMode) {
                      posthogService.trackCanvasAction('present');
                    }
                  }}
                  style={{
                    background: presentationMode ? 'white' : 'rgba(255,255,255,0.2)',
                    color: presentationMode ? '#6366f1' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  title={presentationMode ? 'Exit presentation mode' : 'Enter presentation mode'}
                >
                  <span>{presentationMode ? '👁️' : '🎨'}</span>
                  {presentationMode ? 'Presentation Mode' : 'Edit Mode'}
                </button>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>
                  {presentationMode ? 'Boundaries hidden' : 'Full controls'}
                </span>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '13px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '16px' }}>📦</span>
                  <span style={{ fontWeight: '600' }}>
                    {nodes.length} {nodes.length === 1 ? 'Component' : 'Components'}
                  </span>
                </div>
                {nodes.length > 0 && (
                  <>
                    <div style={{ 
                      width: '1px', 
                      height: '16px', 
                      background: 'rgba(255,255,255,0.3)' 
                    }} />
                    <button
                      onClick={handleExportCanvas}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        opacity: 0.8,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title="Export canvas to JSON file"
                    >
                      <span style={{ fontSize: '14px' }}>💾</span>
                      Export
                    </button>
                  </>
                )}
                <div style={{ 
                  width: '1px', 
                  height: '16px', 
                  background: 'rgba(255,255,255,0.3)' 
                }} />
                <label
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '12px',
                    cursor: 'pointer',
                    opacity: 0.8,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                    e.currentTarget.style.background = 'transparent';
                  }}
                  title="Import canvas from JSON file"
                >
                  <span style={{ fontSize: '14px' }}>📂</span>
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportCanvas}
                    style={{ display: 'none' }}
                  />
                </label>
                {nodes.length > 0 && (
                  <>
                    <div style={{ 
                      width: '1px', 
                      height: '16px', 
                      background: 'rgba(255,255,255,0.3)' 
                    }} />
                    <button
                      onClick={() => {
                        if (confirm('Clear all components from the canvas?')) {
                          setNodes([]);
                          setEdges([]);
                          storageService.clearAllStorage();
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        opacity: 0.8,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Clear All
                    </button>
                    <div style={{ 
                      width: '1px', 
                      height: '16px', 
                      background: 'rgba(255,255,255,0.3)' 
                    }} />
                    <button
                      onClick={async () => {
                        try {
                          await storageService.forceCleanup();
                          console.log('✅ Storage cleanup completed');
                        } catch (error) {
                          console.error('Storage cleanup failed:', error);
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        opacity: 0.8,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title={`Storage Cleanup - ${storageService.getStorageUsageSummary().recommendation}`}
                    >
                      🧹 Cleanup
                    </button>
                  </>
                )}
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '11px',
                opacity: 0.9,
              }}>
                <span>💡</span>
                <span>Drag header to move • 📋 Copy • 🔄 Regenerate • 🗑️ Delete</span>
              </div>
            </div>
            
            {generationError && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
                fontSize: '13px',
              }}>
                <strong>Error:</strong> {generationError}
              </div>
            )}
          </div>
        </Panel>
      </ReactFlow>

      {/* Native Components Toolbar - Outside ReactFlow for fixed positioning */}
      <NativeComponentsToolbar 
        onCreateComponent={handleCreateNativeComponent}
        isCreating={isGenerating}
      />

      {showGenerationDialog && (
        <GenerationDialog
          onGenerate={handleGenerateComponent}
          onClose={() => setShowGenerationDialog(false)}
          isGenerating={isGenerating}
        />
      )}

      {/* Code Edit Dialog for Editing/Regeneration */}
      <CodeEditDialogOptimized
        isOpen={editDialog.isOpen}
        code={editDialog.code}
        prompt={editDialog.prompt}
        nodeId={editDialog.nodeId}
        onSave={handleSaveCode}
        onRegenerate={handleRegenerateWithPrompt}
        onCancel={handleCancelEdit}
        isGenerating={isGenerating}
        getNodeCode={getNodeCode}
        getComponentElement={getComponentElement}
        visionMetadata={editDialog.nodeId ? 
          nodes.find(n => n.id === editDialog.nodeId)?.data?.metadata?.vision : undefined
        }
      />

      {/* Component Library Dialog */}
      <ComponentLibrary
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelectComponent={handleAddPrebuiltComponent}
      />

      {/* Import from URL Dialog - Only in development */}
      {isDevelopment && (
        <ImportFromURLDialog
          isOpen={showURLImport}
          onClose={() => setShowURLImport(false)}
          onImport={handleAddURLComponent}
        />
      )}

      {/* Import Component Dialog */}
      <ImportComponentDialog
        isOpen={showImportDialog}
        onImport={handleImportComponent}
        onCancel={() => setShowImportDialog(false)}
        isProcessing={isGenerating}
      />

      {/* Global Loading Overlay */}
      {isGenerating && !showGenerationDialog && !editDialog.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            minWidth: '320px',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '4px solid #e5e7eb',
              }}></div>
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '4px solid transparent',
                borderTopColor: '#6366f1',
                animation: 'spin 1s linear infinite',
              }}></div>
              <div style={{
                position: 'absolute',
                inset: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                ⚡
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px',
              }}>
                Generating Component
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '4px',
              }}>
                Made by Zabaca
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9ca3af',
                fontStyle: 'italic',
              }}>
                "{currentPrompt}"
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '4px',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#6366f1',
                animation: 'pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}></div>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#6366f1',
                animation: 'pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                animationDelay: '0.2s',
              }}></div>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#6366f1',
                animation: 'pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                animationDelay: '0.4s',
              }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Native Component Context Menu */}
      {contextMenu && (
        <NativeComponentContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeType={contextMenu.nodeType}
          onClose={() => setContextMenu(null)}
          onDelete={handleDeleteComponent}
          onDuplicate={handleDuplicateNode}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
        />
      )}
    </div>
  );
};

export default ReactFlowCanvas;