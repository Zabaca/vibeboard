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
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CerebrasService from '../services/cerebras.ts';
import ComponentNode, { type ComponentNodeData } from './ComponentNode.tsx';
import GenerationDialog from './GenerationDialog.tsx';
import CodeEditDialog from './CodeEditDialog.tsx';
import ComponentLibrary from './ComponentLibrary.tsx';
import { ImportFromURLDialog } from './ImportFromURLDialog.tsx';
import { type PrebuiltComponent } from '../data/prebuiltComponents.ts';
import { ComponentPipeline } from '../services/ComponentPipeline.ts';
import { getCompiledComponent } from '../data/compiledComponents.generated.ts';
import { storageService } from '../services/StorageService.ts';
import type { UnifiedComponentNode } from '../types/component.types.ts';

// Define nodeTypes outside of component to prevent re-renders
const nodeTypes: Record<string, React.ComponentType<any>> = {
  aiComponent: ComponentNode,
};

const ReactFlowCanvas: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ComponentNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
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
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [cerebrasService] = useState(() => {
    // In production (Netlify), we don't need API key (handled server-side)
    // In development, get from env or localStorage
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
      // Production: API key is handled by Netlify Function
      return new CerebrasService('');
    }
    
    // Development: Get API key from environment variable or prompt user
    const apiKey = import.meta.env.VITE_CEREBRAS_API_KEY || localStorage.getItem('cerebras_api_key') || '';
    if (!apiKey) {
      const key = prompt('Please enter your Cerebras API key:');
      if (key) {
        localStorage.setItem('cerebras_api_key', key);
        return new CerebrasService(key);
      }
    }
    return new CerebrasService(apiKey);
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

  // Add keyboard shortcut for URL import
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+I (or Cmd+Shift+I on Mac) for Import from URL
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setShowURLImport(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // Define handlers first before using them in useEffect
  const handleDeleteComponent = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
  }, [setNodes]);

  // Open the edit dialog when edit button is clicked
  const handleRegenerateComponent = useCallback((nodeId: string, prompt: string, currentCode?: string) => {
    setEditDialog({
      isOpen: true,
      nodeId,
      prompt,
      code: currentCode || '', // Store the current code for comparison
    });
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
  const handleRegenerateWithPrompt = useCallback(async (newPrompt: string) => {
    const { nodeId } = editDialog;
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Generate new component with AI
      const result = await cerebrasService.generateComponent(newPrompt);
      
      if (!result.success || !result.code) {
        throw new Error(result.error || 'Failed to generate component');
      }
      
      // Process the AI-generated component through the pipeline
      const pipelineResult = await componentPipeline.processAIComponent(
        result.code,
        newPrompt,
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
              prompt: newPrompt,
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

  const handleCancelEdit = useCallback(() => {
    setEditDialog({ isOpen: false, nodeId: '', prompt: '', code: '' });
  }, []);

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
    } catch (error) {
      console.error('Failed to export canvas:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to export canvas');
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
      } catch (error) {
        console.error('Failed to import canvas:', error);
        setGenerationError(error instanceof Error ? error.message : 'Failed to import canvas file');
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
            data: {
              ...node.data,
              presentationMode,
              onDelete: handleDeleteComponent,
              onRegenerate: handleRegenerateComponent,
              onDuplicate: handleDuplicateComponent,
              onCompilationComplete: handleCompilationComplete,
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
    if (nodes.length > 0) {
      storageService.saveNodes(nodes).catch(error => {
        console.error('Failed to save nodes:', error);
      });
    }
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
    };

    const viewportCenter = getViewportCenter();
    const newNode: Node<ComponentNodeData> = {
      id: nodeId,
      type: 'aiComponent',
      position: { 
        x: viewportCenter.x + Math.random() * 50 - 25, 
        y: viewportCenter.y + Math.random() * 50 - 25
      },
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

    try {
      const result = await cerebrasService.generateComponent(prompt);
      
      if (!result.success || !result.code) {
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
    } catch (error) {
      console.error('Failed to generate component:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate component');
    } finally {
      setIsGenerating(false);
    }
  }, [cerebrasService, setNodes, presentationMode, handleDeleteComponent, handleRegenerateComponent, componentPipeline, getViewportCenter]);

  return (
    <div className="h-screen w-screen relative" style={{ width: '100vw', height: '100vh', background: '#f8f9fa' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
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
                  onClick={() => setPresentationMode(!presentationMode)}
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

      {showGenerationDialog && (
        <GenerationDialog
          onGenerate={handleGenerateComponent}
          onClose={() => setShowGenerationDialog(false)}
          isGenerating={isGenerating}
        />
      )}

      {/* Code Edit Dialog for Editing/Regeneration */}
      <CodeEditDialog
        isOpen={editDialog.isOpen}
        code={editDialog.code}
        prompt={editDialog.prompt}
        nodeId={editDialog.nodeId}
        onSave={handleSaveCode}
        onRegenerate={handleRegenerateWithPrompt}
        onCancel={handleCancelEdit}
        isGenerating={isGenerating}
        getNodeCode={(nodeId) => {
          const node = nodes.find(n => n.id === nodeId);
          return node?.data?.code || node?.data?.originalCode || '';
        }}
      />

      {/* Component Library Dialog */}
      <ComponentLibrary
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelectComponent={handleAddPrebuiltComponent}
      />

      {/* Import from URL Dialog */}
      <ImportFromURLDialog
        isOpen={showURLImport}
        onClose={() => setShowURLImport(false)}
        onImport={handleAddURLComponent}
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
    </div>
  );
};

export default ReactFlowCanvas;