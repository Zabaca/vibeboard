#!/usr/bin/env node

/**
 * Simple build-time script to pre-compile library components
 * This improves runtime performance by avoiding transpilation on first use
 */

import * as Babel from '@babel/standalone';
import { prebuiltComponents } from '../src/data/prebuiltComponents.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function compileComponents() {
  console.log('🔧 Compiling library components for optimal performance...\n');
  
  const compiledComponents = [];
  const errors = [];
  const startTime = Date.now();
  
  for (const component of prebuiltComponents) {
    process.stdout.write(`  Compiling ${component.name}...`);
    
    try {
      // Transpile JSX to JavaScript
      const result = Babel.transform(component.code, {
        presets: ['react'],
        filename: 'component.jsx',
      });
      
      if (!result.code) {
        throw new Error('Babel transformation returned no code');
      }
      
      // Create compiled component with all required fields
      const compiled = {
        id: component.id,
        name: component.name,
        description: component.description,
        originalCode: component.code,
        compiledCode: result.code,
        originalHash: hashCode(component.code),
        compiledHash: hashCode(result.code),
        compiledAt: Date.now(),
        source: 'library',
        format: 'jsx',
        compilerVersion: '1.0.0',
        metadata: {
          category: component.category,
          tags: component.tags,
          author: component.author,
          version: component.version,
          thumbnail: component.thumbnail,
        },
        buildTime: Date.now(),
        buildVersion: '1.0.0',
      };
      
      compiledComponents.push(compiled);
      console.log(' ✅');
    } catch (error) {
      console.log(' ❌');
      errors.push({ 
        name: component.name, 
        error: error.message || String(error) 
      });
    }
  }
  
  const endTime = Date.now();
  const compilationTime = endTime - startTime;
  
  console.log(`\n✨ Compilation complete!`);
  console.log(`  - Compiled: ${compiledComponents.length}/${prebuiltComponents.length} components`);
  console.log(`  - Time: ${compilationTime}ms`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    for (const error of errors) {
      console.log(`  - ${error.name}: ${error.error}`);
    }
  }
  
  // Generate the output file
  const outputPath = path.join(__dirname, '../src/data/compiledComponents.generated.ts');
  const output = generateOutputFile(compiledComponents, compilationTime);
  
  try {
    fs.writeFileSync(outputPath, output);
    console.log(`\n📝 Generated compiledComponents.generated.ts`);
  } catch (error) {
    console.error(`\n❌ Failed to write output file:`, error);
    process.exit(1);
  }
  
  // Exit with error code if any components failed
  if (errors.length > 0) {
    process.exit(1);
  }
}

function generateOutputFile(components, compilationTime) {
  const timestamp = new Date().toISOString();
  
  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 * 
 * This file contains pre-compiled library components for optimal performance.
 * Generated: ${timestamp}
 * Components: ${components.length}
 * Compilation time: ${compilationTime}ms
 * 
 * To regenerate: npm run compile:components
 */

import type { UnifiedComponentNode } from '../types/component.types.ts';

export interface CompiledComponent extends UnifiedComponentNode {
  buildTime: number;
  buildVersion: string;
}

export const COMPILER_VERSION = '1.0.0';
export const BUILD_TIME = ${Date.now()};
export const COMPONENT_COUNT = ${components.length};

/**
 * Pre-compiled library components
 * These components have been transpiled at build time for optimal performance
 */
export const compiledComponents: CompiledComponent[] = ${JSON.stringify(components, null, 2)};

/**
 * Map for quick component lookup by ID
 */
export const compiledComponentsMap = new Map<string, CompiledComponent>(
  compiledComponents.map(c => [c.id, c])
);

/**
 * Get a compiled component by ID
 */
export function getCompiledComponent(id: string): CompiledComponent | undefined {
  return compiledComponentsMap.get(id);
}

/**
 * Get all compiled components for a category
 */
export function getComponentsByCategory(category: string): CompiledComponent[] {
  return compiledComponents.filter(c => c.metadata?.category === category);
}

/**
 * Check if a component needs recompilation
 */
export function needsRecompilation(component: CompiledComponent, currentCode: string): boolean {
  return hashCode(currentCode) !== component.originalHash;
}

/**
 * Simple hash function for change detection
 */
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Build metadata
 */
export const buildMetadata = {
  timestamp: '${timestamp}',
  compilationTime: ${compilationTime},
  componentCount: ${components.length},
  compilerVersion: COMPILER_VERSION,
  successRate: ${((components.length / prebuiltComponents.length) * 100).toFixed(2)}
};
`;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Run the compilation
compileComponents();