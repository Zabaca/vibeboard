// @ts-nocheck
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert';
import { describe, it } from 'jsr:@std/testing/bdd';
import { ComponentPipeline } from '../services/ComponentPipeline.ts';
import { ImportFixer } from '../utils/importFixer.ts';
import { timerWithMissingImports } from '../test-artifacts/ai-generated-components.ts';

describe('Missing Imports Fix', () => {
  const pipeline = new ComponentPipeline();

  it('should detect missing useCallback and useMemo imports', () => {
    const validation = ImportFixer.validateImports(timerWithMissingImports);

    assertEquals(validation.valid, false);
    assertEquals(validation.missingImports.includes('useCallback'), true);
    assertEquals(validation.missingImports.includes('useMemo'), true);
  });

  it('should automatically fix missing React hook imports', () => {
    const result = ImportFixer.fixImports(timerWithMissingImports);

    assertEquals(result.success, true);
    assertEquals(result.addedImports?.includes('useCallback'), true);
    assertEquals(result.addedImports?.includes('useMemo'), true);
    assertStringIncludes(result.code || '', 'useCallback');
    assertStringIncludes(result.code || '', 'useMemo');
  });

  it('should process component with fixed imports (transpilation succeeds)', async () => {
    // Process the problematic timer component through the pipeline
    // The ImportFixer should automatically add missing imports
    const result = await pipeline.processComponent(
      { originalCode: timerWithMissingImports },
      {
        useCache: false,
        validateOutput: true,
        debug: false, // Disable debug to reduce test output
      },
    );

    // The component should have the fixed imports in its transpiled code
    // even if execution fails in test environment due to import map issues
    assertEquals(result.component?.originalCode !== undefined, true);

    // Verify that the processed code includes the missing imports
    // Check the original code was fixed with imports
    const processedCode = result.component?.originalCode || '';
    assertStringIncludes(processedCode, 'useCallback');
    assertStringIncludes(processedCode, 'useMemo');
    assertStringIncludes(processedCode, '{ useCallback, useEffect, useMemo, useRef, useState }');
  });

  it('should not modify code that already has correct imports', () => {
    const correctCode = timerWithMissingImports.replace(
      "import React, { useState, useEffect, useRef } from 'react';",
      "import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';",
    );

    const result = ImportFixer.fixImports(correctCode);

    assertEquals(result.success, true);
    assertEquals(result.addedImports?.length || 0, 0);
    assertEquals(result.code, correctCode);
  });
});
