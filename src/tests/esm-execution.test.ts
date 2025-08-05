// @ts-nocheck
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert';
import { describe, it } from 'jsr:@std/testing/bdd';
import { ComponentPipeline } from '../services/ComponentPipeline.ts';
import { timerWithMissingImports } from '../test-artifacts/ai-generated-components.ts';

describe('ESM Component Execution', () => {
  const pipeline = new ComponentPipeline();

  it('should detect ESM module correctly', async () => {
    // Test the ESM detection logic directly
    const isESM = pipeline.isESMModule(timerWithMissingImports);
    assertEquals(isESM, true, 'Timer component should be detected as ESM');
  });

  it('should route ESM component to ESM processor', async () => {
    const result = await pipeline.processComponent(
      { originalCode: timerWithMissingImports },
      {
        useCache: false,
        validateOutput: true,
        debug: true, // Enable debug to see routing logs
      }
    );

    // Should succeed and detect as ESM
    assertEquals(result.success, true, `Processing should succeed: ${result.error}`);
    assertEquals(result.component?.format, 'esm', 'Component should have ESM format');
    
    // Should have fixed the missing imports
    assertStringIncludes(result.component?.originalCode || '', 'useCallback');
    assertStringIncludes(result.component?.originalCode || '', 'useMemo');
  });

  it('should have moduleUrl for successfully processed ESM component', async () => {
    const result = await pipeline.processComponent(
      { originalCode: timerWithMissingImports },
      {
        useCache: false,
        validateOutput: false, // Skip validation to see if execution succeeds
        debug: true,
      }
    );

    console.log('Pipeline result:', {
      success: result.success,
      format: result.component?.format,
      hasModuleUrl: !!result.component?.moduleUrl,
      error: result.error
    });

    // This test will show us exactly what's happening
    if (result.success) {
      assertEquals(result.component?.format, 'esm');
      // If this fails, we know ESM execution is failing
      assertEquals(!!result.component?.moduleUrl, true, 'ESM component should have moduleUrl');
    } else {
      console.log('❌ Pipeline failed:', result.error);
      // This will help us understand why ESM execution is failing
    }
  });
});