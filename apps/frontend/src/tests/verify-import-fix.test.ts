// @ts-nocheck
import { assertEquals } from 'jsr:@std/assert';
import { describe, it } from 'jsr:@std/testing/bdd';
import { ImportFixer } from '../utils/importFixer.ts';
import { timerWithMissingImports } from '../test-artifacts/ai-generated-components.ts';

describe('Import Fix Verification', () => {
  it('should fix missing imports and return correct code', () => {
    const result = ImportFixer.fixImports(timerWithMissingImports);

    // Verify the fix was successful
    assertEquals(result.success, true);

    // Verify that useCallback and useMemo were added
    assertEquals(result.addedImports?.includes('useCallback'), true);
    assertEquals(result.addedImports?.includes('useMemo'), true);

    // Verify the resulting code has the correct imports
    const expectedImports = '{ useCallback, useEffect, useMemo, useRef, useState }';
    assertEquals(result.code?.includes(expectedImports), true);

    console.log('✅ Import fixing works correctly');
    console.log('Added imports:', result.addedImports);
  });
});
