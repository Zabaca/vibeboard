/**
 * Native component type definitions for whiteboard components
 * These are built-in drawing components like shapes, text, and sticky notes
 */

import type { UnifiedComponentNode } from './component.types.ts';

/**
 * Types of native components available in the whiteboard
 */
export type NativeComponentType = 'shape' | 'text' | 'sticky';

/**
 * State interface for native component-specific properties
 */
export interface ComponentState {
  // Common state for all native components
  locked?: boolean;
  layer?: number;
  
  // Shape-specific state
  shapeType?: 'rectangle' | 'triangle' | 'square';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  
  // Text-specific state
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  
  // Sticky-specific state
  stickyColor?: 'yellow' | 'pink' | 'blue' | 'green';
  padding?: number;
}

/**
 * Native component node structure
 * Extends UnifiedComponentNode with native-specific properties
 */
export interface NativeComponentNode extends Omit<UnifiedComponentNode, 'originalCode' | 'compiledCode' | 'source'> {
  // Override component type to be native
  componentType: 'native';
  
  // Type of native component
  nativeType: NativeComponentType;
  
  // Component-specific state
  state: ComponentState;
  
  // Native components have a different source
  source: 'native';
  
  // Native components don't need code fields
  originalCode: '';
  compiledCode?: undefined;
  
  // No compilation-related fields
  compiledHash?: undefined;
  compiledAt?: undefined;
  compilerVersion?: undefined;
}

/**
 * Helper type guard to check if a node is a native component
 */
export function isNativeComponentNode(node: UnifiedComponentNode | NativeComponentNode): node is NativeComponentNode {
  return 'componentType' in node && node.componentType === 'native';
}

/**
 * Default state values for different native component types
 */
export const defaultComponentStates: Record<NativeComponentType, ComponentState> = {
  shape: {
    shapeType: 'rectangle',
    fillColor: '#ffffff',
    strokeColor: '#6366f1',
    strokeWidth: 2,
    locked: false,
    layer: 0,
  },
  text: {
    text: 'Text',
    fontSize: 16,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '400',
    textAlign: 'left',
    textColor: '#111827',
    locked: false,
    layer: 0,
  },
  sticky: {
    stickyColor: 'yellow',
    text: '',
    fontSize: 14,
    fontFamily: 'Inter, system-ui, sans-serif',
    textColor: '#111827',
    padding: 16,
    locked: false,
    layer: 0,
  },
};