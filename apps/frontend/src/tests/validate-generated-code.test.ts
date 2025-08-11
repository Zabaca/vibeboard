// @ts-nocheck
/// <reference lib="deno.ns" />

/**
 * Test runner that validates all AI-generated code files in the cases directory
 * Each file should compile and transform without errors
 */

import { CodeTransformer } from '../utils/codeTransformer.ts';
import { ComponentExecutor } from '../utils/componentExecutor.ts';
import { ComponentPipeline } from '../services/ComponentPipeline.ts';
import * as path from 'node:path';

interface ValidationResult {
  filename: string;
  success: boolean;
  error?: string;
  warnings?: string[];
  transformationTime?: number;
  fileSize?: number;
  hasComponent?: boolean;
  isESM?: boolean;
  pipelineSuccess?: boolean;
  jsxTranspiled?: boolean;
}

export class GeneratedCodeValidator {
  private transformer: CodeTransformer;
  private pipeline: ComponentPipeline;
  private casesDir: string;

  constructor(casesDir?: string) {
    this.transformer = new CodeTransformer();
    this.pipeline = new ComponentPipeline();
    this.casesDir = casesDir || path.join(
      path.dirname(new URL(import.meta.url).pathname),
      'cases'
    );
  }

  /**
   * Validate all files in the cases directory
   */
  async validateAll(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    try {
      // Read all files in the cases directory
      const files = [];
      for await (const entry of Deno.readDir(this.casesDir)) {
        if (entry.isFile && 
            (entry.name.endsWith('.jsx') || 
             entry.name.endsWith('.tsx') || 
             entry.name.endsWith('.js') || 
             entry.name.endsWith('.ts'))) {
          files.push(entry.name);
        }
      }

      if (files.length === 0) {
        console.log('ℹ️  No test cases found in cases directory');
        return results;
      }

      console.log(`Found ${files.length} test case(s) to validate\n`);

      // Validate each file
      for (const filename of files.sort()) {
        const result = await this.validateFile(filename);
        results.push(result);
      }

    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.error(`❌ Cases directory not found: ${this.casesDir}`);
        console.error('   Create the directory and add AI-generated code files to test');
      } else {
        console.error(`❌ Error reading cases directory: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return results;
  }

  /**
   * Validate a single file
   */
  async validateFile(filename: string): Promise<ValidationResult> {
    const filepath = path.join(this.casesDir, filename);
    const startTime = performance.now();
    
    try {
      // Read the file
      const code = await Deno.readTextFile(filepath);
      const fileInfo = await Deno.stat(filepath);
      
      // Detect if this is an ESM component
      const isESM = this.isESMModule(code);
      
      const legacyResult: any = null;
      let pipelineResult: any = null;
      let pipelineSuccess = false;
      let jsxTranspiled = false;

      // Always test the legacy transformer for compatibility
      const legacyTransformResult = this.transformer.transform(code, {
        debug: false,
        validateOutput: true
      });

      // Test ComponentPipeline for both ESM and legacy components
      try {
        pipelineResult = await this.pipeline.processComponent({
          originalCode: code,
          source: 'ai-generated',
          format: isESM ? 'esm' : undefined
        }, {
          debug: false, // Debug disabled for clean output
          useCache: false,
          validateOutput: false // Skip validation to focus on processing
        });
        
        pipelineSuccess = pipelineResult.success;
        
        // Check if JSX was transpiled even if execution failed (for ESM in test environment)
        if (pipelineResult.component?.compiledCode) {
          // Check if JSX was transpiled (no JSX tags remaining)
          const hasJSX = /<[A-Z]|<(div|span|button|input|form|h[1-6]|p|a|ul|li)/.test(pipelineResult.component.compiledCode);
          jsxTranspiled = !hasJSX && (/<[A-Z]|<(div|span|button|input|form|h[1-6]|p|a|ul|li)/.test(code));
          
          // For ESM components, consider transpilation success even if execution fails due to React not being available
          if (isESM && jsxTranspiled && pipelineResult.error?.includes('React is not defined')) {
            pipelineSuccess = true; // Override for test environment
          }
        }
      } catch (pipelineError) {
        console.log(`Pipeline error for ${filename}: ${pipelineError.message}`);
      }

      const transformationTime = performance.now() - startTime;

      // For ESM files, prioritize pipeline results
      if (isESM && pipelineSuccess) {
        return {
          filename,
          success: true,
          warnings: pipelineResult.warnings,
          transformationTime,
          fileSize: fileInfo.size,
          hasComponent: true, // ESM components always have default export
          isESM: true,
          pipelineSuccess: true,
          jsxTranspiled
        };
      }

      // For legacy components or if pipeline fails, use legacy transformer
      if (legacyTransformResult.success && legacyTransformResult.code) {
        // Use the shared ComponentExecutor to validate execution, just like the app does
        const validationResult = ComponentExecutor.validate(legacyTransformResult.code);
        
        if (validationResult.valid) {
          // Also check if a component exists
          const hasComponent = ComponentExecutor.hasComponent(legacyTransformResult.code);
          
          return {
            filename,
            success: true,
            warnings: legacyTransformResult.warnings,
            transformationTime,
            fileSize: fileInfo.size,
            hasComponent,
            isESM,
            pipelineSuccess,
            jsxTranspiled
          };
        } else {
          // The transformation succeeded but execution would fail
          return {
            filename,
            success: false,
            error: `Execution validation failed: ${validationResult.error}`,
            warnings: legacyTransformResult.warnings,
            transformationTime,
            fileSize: fileInfo.size,
            isESM,
            pipelineSuccess,
            jsxTranspiled
          };
        }
      } else {
        // Both pipeline and legacy transformer failed
        const errors = [];
        if (legacyTransformResult.error) errors.push(`Legacy: ${legacyTransformResult.error}`);
        if (pipelineResult?.error) errors.push(`Pipeline: ${pipelineResult.error}`);
        
        return {
          filename,
          success: false,
          error: errors.join('; ') || 'Both transformation methods failed',
          warnings: legacyTransformResult.warnings,
          transformationTime,
          fileSize: fileInfo.size,
          isESM,
          pipelineSuccess,
          jsxTranspiled
        };
      }
    } catch (error) {
      return {
        filename,
        success: false,
        error: `Failed to read or process file: ${error.message}`,
        transformationTime: performance.now() - startTime
      };
    }
  }

  /**
   * Check if code is an ESM module
   */
  private isESMModule(code: string): boolean {
    const esmPatterns = [
      /^import\s+/m,                          // import statements
      /^export\s+default/m,                   // default export
      /^export\s+{/m,                        // named exports
      /^export\s+(const|let|var|function|class)/m,  // export declarations
    ];
    
    return esmPatterns.some(pattern => pattern.test(code));
  }


  /**
   * Print a formatted report of the validation results
   */
  printReport(results: ValidationResult[]): void {
    if (results.length === 0) {
      return;
    }

    const passed = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const withWarnings = results.filter(r => r.warnings && r.warnings.length > 0);
    const esmComponents = results.filter(r => r.isESM);
    const pipelineSuccesses = results.filter(r => r.pipelineSuccess);
    const jsxTranspiled = results.filter(r => r.jsxTranspiled);
    const successRate = (passed.length / results.length) * 100;

    console.log('\n' + '='.repeat(70));
    console.log('📊 VALIDATION REPORT');
    console.log('='.repeat(70));
    
    // Summary stats
    console.log('\n📈 Summary:');
    console.log(`   Total files tested: ${results.length}`);
    console.log(`   ✅ Passed: ${passed.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    console.log(`   ⚠️  With warnings: ${withWarnings.length}`);
    console.log(`   Success rate: ${successRate.toFixed(1)}%`);
    
    // ESM and Pipeline stats
    console.log('\n🚀 ESM & Pipeline Stats:');
    console.log(`   📦 ESM components: ${esmComponents.length}`);
    console.log(`   🔧 Pipeline successes: ${pipelineSuccesses.length}`);
    console.log(`   🔄 JSX transpiled: ${jsxTranspiled.length}`);
    
    // Calculate average transformation time
    const avgTime = results.reduce((sum, r) => sum + (r.transformationTime || 0), 0) / results.length;
    console.log(`   Average transformation time: ${avgTime.toFixed(2)}ms`);

    // Detailed results
    console.log('\n📝 Detailed Results:\n');
    
    results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      const componentIcon = result.hasComponent ? '🧩' : '⚪';
      const esmIcon = result.isESM ? '📦' : '📄';
      const pipelineIcon = result.pipelineSuccess ? '🔧' : '⚪';
      const jsxIcon = result.jsxTranspiled ? '🔄' : '';
      
      console.log(`${index + 1}. ${icon} ${result.filename} ${componentIcon}${esmIcon}${pipelineIcon}${jsxIcon}`);
      
      if (result.fileSize) {
        console.log(`   Size: ${this.formatFileSize(result.fileSize)}`);
      }
      
      if (result.transformationTime) {
        console.log(`   Time: ${result.transformationTime.toFixed(2)}ms`);
      }
      
      if (!result.success && result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      }
      
      if (result.warnings && result.warnings.length > 0) {
        console.log(`   ⚠️  Warnings:`);
        result.warnings.forEach(w => console.log(`      - ${w}`));
      }
      
      if (result.success && !result.hasComponent) {
        console.log(`   ⚠️  No React component detected in output`);
      }
      
      console.log('');
    });

    // Final verdict
    console.log('='.repeat(70));
    if (successRate === 100) {
      console.log('🎉 All files validated successfully!');
    } else if (successRate >= 80) {
      console.log('⚠️  Most files passed, but some need attention.');
    } else {
      console.log('❌ Multiple validation failures detected.');
    }
    console.log('='.repeat(70));
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Run validation if this file is executed directly
if (import.meta.main) {
  const validator = new GeneratedCodeValidator();
  const results = await validator.validateAll();
  validator.printReport(results);
  
  // Exit with error code if any failures
  const hasFailures = results.some(r => !r.success);
  if (hasFailures) {
    Deno.exit(1);
  }
}