/**
 * CSV/TSV Detection Utility
 * Detects if text content is in CSV or TSV format and provides confidence scoring
 * Uses d3-dsv for robust parsing of comma and tab-delimited data
 */

import { csvParseRows, tsvParseRows } from 'd3-dsv';

export interface CSVDetectionResult {
  isCSV: boolean;
  confidence: number;
  rowCount: number;
  columnCount: number;
  delimiter?: ',' | '\t';
  format?: 'CSV' | 'TSV';
  parsedData?: string[][];
  error?: string;
}

interface CSVAnalysis {
  hasDelimiters: boolean;
  hasConsistentColumns: boolean;
  reasonableRatio: boolean;
  emptyRatio: number;
  inconsistentColumns: number;
  totalCells: number;
  avgColumnsPerRow: number;
}

/**
 * Detect if text is in CSV or TSV format with confidence scoring
 */
export function detectCSV(text: string): CSVDetectionResult {
  // Early validation
  if (!text || typeof text !== 'string') {
    return {
      isCSV: false,
      confidence: 0,
      rowCount: 0,
      columnCount: 0,
      error: 'Invalid input: text is required',
    };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return {
      isCSV: false,
      confidence: 0,
      rowCount: 0,
      columnCount: 0,
      error: 'Text is empty',
    };
  }

  // Try both CSV and TSV parsing, return the better result
  const csvResult = tryParseWithDelimiter(trimmed, ',', 'CSV', csvParseRows);
  const tsvResult = tryParseWithDelimiter(trimmed, '\t', 'TSV', tsvParseRows);

  // Return the result with higher confidence
  if (csvResult.confidence >= tsvResult.confidence) {
    return csvResult;
  } else {
    return tsvResult;
  }
}

/**
 * Try parsing with a specific delimiter and return detection result
 */
function tryParseWithDelimiter(
  text: string,
  delimiter: ',' | '\t',
  format: 'CSV' | 'TSV',
  parseFunction: (text: string) => string[][]
): CSVDetectionResult {
  try {
    // Use d3-dsv to parse with the specific delimiter
    const parsedData = parseFunction(text);
    
    if (!parsedData || parsedData.length === 0) {
      return {
        isCSV: false,
        confidence: 0,
        rowCount: 0,
        columnCount: 0,
        delimiter,
        format,
        error: `No valid ${format} data found`,
      };
    }
    
    const rowCount = parsedData.length;
    const columnCount = parsedData[0]?.length || 0;

    // Analyze the parsed data
    const analysis = analyzeCSVData(parsedData);
    
    // Calculate confidence score
    const confidence = calculateConfidence(analysis, rowCount, columnCount);

    // Additional checks for non-CSV content
    const looksLikeCode = isCodeLike(text);
    const looksLikeJSON = isJSONLike(text);
    const isMalformedCSV = detectMalformedCSV(parsedData);
    
    // Determine if it's CSV/TSV based on strict boolean criteria
    const isCSV = passesCSVRequirements(analysis, rowCount, columnCount) && 
                  !looksLikeCode && 
                  !looksLikeJSON && 
                  !isMalformedCSV;

    return {
      isCSV,
      confidence,
      rowCount,
      columnCount,
      delimiter,
      format,
      parsedData: isCSV ? parsedData : undefined,
    };
  } catch (error) {
    return {
      isCSV: false,
      confidence: 0,
      rowCount: 0,
      columnCount: 0,
      delimiter,
      format,
      error: error instanceof Error ? error.message : `Unknown error during ${format} detection`,
    };
  }
}

/**
 * Simple boolean check for CSV format
 */
export function isCSVFormat(text: string): boolean {
  const result = detectCSV(text);
  return result.isCSV;
}


/**
 * Analyze parsed CSV/TSV data for quality metrics
 */
function analyzeCSVData(data: string[][]): CSVAnalysis {
  if (!data || data.length === 0) {
    return {
      hasDelimiters: false,
      hasConsistentColumns: false,
      reasonableRatio: false,
      emptyRatio: 1,
      inconsistentColumns: 0,
      totalCells: 0,
      avgColumnsPerRow: 0,
    };
  }

  const rowCount = data.length;
  const columnCounts = data.map(row => row.length);
  const totalCells = columnCounts.reduce((sum, count) => sum + count, 0);
  const avgColumnsPerRow = totalCells / rowCount;
  
  // Check if data has delimiters (multiple columns - basic requirement)
  const hasDelimiters = data.some(row => row.length > 1);

  // Column consistency analysis
  const maxColumns = Math.max(...columnCounts);
  const minColumns = Math.min(...columnCounts);
  const columnVariance = maxColumns - minColumns;
  
  // Strict column consistency - no variance allowed for confidence scoring
  const hasConsistentColumns = columnVariance === 0;
  const inconsistentColumns = columnCounts.filter(count => 
    Math.abs(count - avgColumnsPerRow) > 0.5 // Any row that deviates from average
  ).length;

  // Calculate empty cell ratio
  let emptyCells = 0;
  data.forEach(row => {
    row.forEach(cell => {
      if (!cell || cell.trim() === '') {
        emptyCells++;
      }
    });
  });
  const emptyRatio = totalCells > 0 ? emptyCells / totalCells : 1;

  // Reasonable data ratio (not more than 70% empty)
  const reasonableRatio = emptyRatio < 0.7;

  return {
    hasDelimiters,
    hasConsistentColumns,
    reasonableRatio,
    emptyRatio,
    inconsistentColumns,
    totalCells,
    avgColumnsPerRow,
  };
}

/**
 * Strict boolean check for CSV/TSV requirements
 */
function passesCSVRequirements(analysis: CSVAnalysis, rowCount: number, columnCount: number): boolean {
  // Must have delimiters (multiple columns)
  if (!analysis.hasDelimiters) return false;
  
  // Must have at least 2 columns
  if (columnCount < 2) return false;
  
  // Must have consistent columns (no variance allowed)
  if (!analysis.hasConsistentColumns) return false;
  
  // Must have reasonable data quality (not more than 70% empty)
  if (!analysis.reasonableRatio) return false;
  
  // Size limits
  if (rowCount > 1000 || columnCount > 100) return false;
  
  return true;
}

/**
 * Calculate confidence score based on analysis
 */
function calculateConfidence(analysis: CSVAnalysis, rowCount: number, columnCount: number): number {
  let score = 0;

  // Basic requirements (30% of score)
  if (analysis.hasDelimiters) score += 0.30;

  // Column consistency (25% of score) - be more strict
  if (analysis.hasConsistentColumns) {
    score += 0.25;
  } else {
    // Heavily penalize inconsistent columns
    const consistencyRatio = Math.max(0, 1 - (analysis.inconsistentColumns / rowCount));
    score += 0.25 * consistencyRatio * 0.2; // Very aggressive penalty for inconsistency
    
    // Additional penalty for any column variance at all
    score -= 0.05;
  }

  // Data quality (25% of score)
  if (analysis.reasonableRatio) {
    score += 0.25;
  } else {
    // Partial credit based on empty ratio
    const dataQuality = Math.max(0, (1 - analysis.emptyRatio) * 0.25);
    score += dataQuality;
  }

  // Size reasonableness (10% of score)
  const sizeScore = getSizeScore(rowCount, columnCount);
  score += sizeScore * 0.1;

  // Structure bonus (10% of score)
  const structureScore = getStructureScore(analysis, rowCount, columnCount);
  score += structureScore * 0.1;

  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Score based on reasonable size limits
 */
function getSizeScore(rowCount: number, columnCount: number): number {
  // Ideal range: 2-1000 rows, 2-50 columns
  let score = 1;

  // Row count scoring
  if (rowCount < 2) {
    score *= 0; // Must have at least 2 rows
  } else if (rowCount > 1000) {
    score *= 0.5; // Penalty for very large data
  }

  // Column count scoring  
  if (columnCount < 2) {
    score *= 0.3; // Heavy penalty for single column
  } else if (columnCount > 50) {
    score *= 0.7; // Moderate penalty for too many columns
  }

  return score;
}

/**
 * Score based on data structure patterns
 */
function getStructureScore(analysis: CSVAnalysis, rowCount: number, columnCount: number): number {
  let score = 0;

  // Bonus for good column count
  if (columnCount >= 2 && columnCount <= 20) {
    score += 0.4;
  }

  // Bonus for good row count
  if (rowCount >= 3 && rowCount <= 100) {
    score += 0.3;
  }

  // Bonus for low empty ratio
  if (analysis.emptyRatio < 0.3) {
    score += 0.3;
  }

  return Math.min(1, score);
}

/**
 * Validate CSV detection result for additional safety checks
 */
export function validateCSVDetection(result: CSVDetectionResult, options?: {
  maxRows?: number;
  maxColumns?: number;
  minConfidence?: number;
}): boolean {
  const {
    maxRows = 1000,
    maxColumns = 100,
    minConfidence = 0.6,
  } = options || {};

  if (!result.isCSV) {
    return false;
  }

  // Check size limits
  if (result.rowCount > maxRows || result.columnCount > maxColumns) {
    return false;
  }

  // Check confidence threshold
  if (result.confidence < minConfidence) {
    return false;
  }

  return true;
}

/**
 * Get human-readable description of detection result
 */
export function getDetectionDescription(result: CSVDetectionResult): string {
  const formatName = result.format || 'CSV';
  
  if (!result.isCSV) {
    if (result.error) {
      return `Not ${formatName}: ${result.error}`;
    }
    if (result.confidence > 0) {
      return `Not ${formatName} (confidence: ${(result.confidence * 100).toFixed(0)}%)`;
    }
    return `Not recognized as ${formatName} format`;
  }

  const confidence = (result.confidence * 100).toFixed(0);
  return `${formatName} detected (${result.rowCount} rows, ${result.columnCount} columns, ${confidence}% confidence)`;
}

/**
 * Check if text looks like code or programming content
 */
function isCodeLike(text: string): boolean {
  const codePatterns = [
    /function\s+\w+\s*\(/,     // Function declarations
    /\breturn\s+/,            // Return statements
    /\bif\s*\(/,              // If statements
    /\bfor\s*\(/,             // For loops
    /\bwhile\s*\(/,           // While loops
    /\bclass\s+\w+/,          // Class declarations
    /\bconst\s+\w+\s*=/,      // Const declarations
    /\blet\s+\w+\s*=/,        // Let declarations
    /\bvar\s+\w+\s*=/,        // Var declarations
    /\/\*[\s\S]*?\*\//,       // Multi-line comments
    /\/\/.*$/m,               // Single-line comments
    /\bimport\s+/,            // Import statements
    /\bexport\s+/,            // Export statements
  ];
  
  return codePatterns.some(pattern => pattern.test(text));
}

/**
 * Check if text looks like JSON
 */
function isJSONLike(text: string): boolean {
  const trimmed = text.trim();
  
  // Must start and end with braces or brackets
  if (!((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']')))) {
    return false;
  }
  
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect malformed CSV where header has commas but data doesn't
 */
function detectMalformedCSV(data: string[][]): boolean {
  if (data.length < 2) return false;
  
  const headerColumnCount = data[0].length;
  
  // Check if header has multiple columns but subsequent rows have very few
  if (headerColumnCount > 1) {
    // Count how many data rows have significantly fewer columns than header
    const malformedRows = data.slice(1).filter(row => {
      // If row has only 1 column but header has multiple, it might be malformed
      // (like spaces instead of commas)
      return row.length === 1 && headerColumnCount > 1;
    });
    
    // If more than 50% of data rows are malformed, consider it malformed CSV
    return malformedRows.length > data.slice(1).length * 0.5;
  }
  
  return false;
}

/**
 * Enhanced CSV detection with additional format validation
 */
export function detectCSVWithValidation(text: string, options?: {
  requireHeaders?: boolean;
  maxEmptyRatio?: number;
  strictMode?: boolean;
}): CSVDetectionResult {
  const basicResult = detectCSV(text);
  
  if (!basicResult.isCSV || !basicResult.parsedData) {
    return basicResult;
  }

  const {
    requireHeaders = false,
    maxEmptyRatio = 0.5,
    strictMode = false,
  } = options || {};

  let adjustedConfidence = basicResult.confidence;
  const issues: string[] = [];

  // Additional validations
  if (requireHeaders) {
    const firstRow = basicResult.parsedData[0];
    const hasHeaders = firstRow.every(cell => 
      cell && cell.trim() !== '' && isNaN(Number(cell))
    );
    
    if (!hasHeaders) {
      adjustedConfidence *= 0.8;
      issues.push('Missing clear headers');
    }
  }

  // Empty ratio check
  const analysis = analyzeCSVData(basicResult.parsedData);
  if (analysis.emptyRatio > maxEmptyRatio) {
    adjustedConfidence *= 0.7;
    issues.push(`High empty ratio: ${(analysis.emptyRatio * 100).toFixed(0)}%`);
  }

  // Strict mode additional checks
  if (strictMode) {
    // Must have at least 3 rows in strict mode
    if (basicResult.rowCount < 3) {
      adjustedConfidence *= 0.6;
      issues.push('Insufficient rows for strict mode');
    }

    // Must have consistent columns in strict mode
    if (!analysis.hasConsistentColumns) {
      adjustedConfidence *= 0.5;
      issues.push('Inconsistent column count');
    }
  }

  // Final decision with adjusted confidence
  const finalIsCSV = adjustedConfidence >= 0.6;

  return {
    ...basicResult,
    isCSV: finalIsCSV,
    confidence: adjustedConfidence,
    error: !finalIsCSV && issues.length > 0 ? issues.join('; ') : basicResult.error,
  };
}