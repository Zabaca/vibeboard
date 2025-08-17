import { describe, it, expect } from 'vitest';
import {
  detectCSV,
  isCSVFormat,
  validateCSVDetection,
  getDetectionDescription,
  detectCSVWithValidation,
  type CSVDetectionResult,
} from '../utils/csvDetector';

describe('csvDetector', () => {
  describe('detectCSV', () => {
    describe('Valid CSV Detection', () => {
      it('should detect simple CSV with 2 rows and 2 columns', () => {
        const csvText = 'Name,Age\nJohn,25\nJane,30';
        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.6);
        expect(result.rowCount).toBe(3);
        expect(result.columnCount).toBe(2);
        expect(result.parsedData).toEqual([
          ['Name', 'Age'],
          ['John', '25'],
          ['Jane', '30'],
        ]);
      });

      it('should detect CSV with quoted fields containing commas', () => {
        const csvText = 'Name,Description\n"Smith, John","A person"\n"Doe, Jane","Another person"';
        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.6);
        expect(result.parsedData).toEqual([
          ['Name', 'Description'],
          ['Smith, John', 'A person'],
          ['Doe, Jane', 'Another person'],
        ]);
      });

      it('should detect CSV with empty cells', () => {
        const csvText = 'Name,Age,City\nJohn,25,\nJane,,Seattle\n,30,Portland';
        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(true);
        expect(result.parsedData).toEqual([
          ['Name', 'Age', 'City'],
          ['John', '25', ''],
          ['Jane', '', 'Seattle'],
          ['', '30', 'Portland'],
        ]);
      });

      it('should detect CSV with double quotes inside quoted fields', () => {
        const csvText = 'Name,Quote\nJohn,"He said ""Hello"""\nJane,"She said ""Goodbye"""';
        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(true);
        expect(result.parsedData).toEqual([
          ['Name', 'Quote'],
          ['John', 'He said "Hello"'],
          ['Jane', 'She said "Goodbye"'],
        ]);
      });

      it('should detect larger CSV dataset', () => {
        const csvText = `Product,Price,Category,Stock
Laptop,999.99,Electronics,10
Mouse,25.50,Electronics,50
Desk,299.00,Furniture,5
Chair,150.00,Furniture,8
Phone,699.99,Electronics,20`;
        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.8);
        expect(result.rowCount).toBe(6);
        expect(result.columnCount).toBe(4);
      });

      it('should accept single row data as CSV headers', () => {
        const csvText = 'Name,Age';
        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.6);
        expect(result.rowCount).toBe(1);
        expect(result.columnCount).toBe(2);
      });
    });

    describe('Invalid CSV Detection', () => {
      it('should reject text without commas', () => {
        const csvText = 'This is just plain text\nWith multiple lines\nBut no commas';
        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(false);
        expect(result.confidence).toBeLessThan(0.6);
      });


      it('should reject code-like content', () => {
        const csvText = `function test() {
  return "hello, world";
}`;
        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(false);
      });

      it('should reject JSON-like content', () => {
        const csvText = '{"name": "John", "age": 25}';
        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(false);
      });
    });

    describe('Edge Cases', () => {

      it('should handle null/undefined input', () => {
        const result1 = detectCSV(null as any);
        const result2 = detectCSV(undefined as any);

        expect(result1.isCSV).toBe(false);
        expect(result2.isCSV).toBe(false);
        expect(result1.error).toContain('Invalid input');
        expect(result2.error).toContain('Invalid input');
      });

      it('should handle whitespace-only input', () => {
        const result = detectCSV('   \n  \t  \n   ');

        expect(result.isCSV).toBe(false);
        expect(result.error).toContain('empty');
      });

      it('should handle single column data', () => {
        const csvText = 'Name\nJohn\nJane\nBob';
        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(false);
        expect(result.confidence).toBeLessThan(0.6);
      });

      it('should handle very large datasets reasonably', () => {
        // Generate a large CSV (100 rows, 10 columns)
        const headers = Array.from({ length: 10 }, (_, i) => `Col${i + 1}`).join(',');
        const rows = Array.from({ length: 100 }, (_, i) => 
          Array.from({ length: 10 }, (_, j) => `Row${i + 1}Col${j + 1}`).join(',')
        );
        const csvText = [headers, ...rows].join('\n');

        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(true);
        expect(result.rowCount).toBe(101);
        expect(result.columnCount).toBe(10);
        expect(result.confidence).toBeGreaterThan(0.8);
      });
    });

    describe('Confidence Scoring', () => {
      it('should give high confidence to well-formed CSV', () => {
        const csvText = 'Name,Age,City\nJohn,25,NYC\nJane,30,LA\nBob,35,SF';
        const result = detectCSV(csvText);

        expect(result.confidence).toBeGreaterThan(0.8);
      });

      it('should reject CSV with inconsistent columns', () => {
        const csvText = 'Name,Age\nJohn,25,Extra\nJane,30\n,';
        const result = detectCSV(csvText);

        expect(result.isCSV).toBe(false);
        expect(result.confidence).toBeLessThan(0.8);
      });

    });
  });

  describe('isCSVFormat', () => {
    it('should return true for valid CSV', () => {
      const csvText = 'Name,Age\nJohn,25\nJane,30';
      expect(isCSVFormat(csvText)).toBe(true);
    });

    it('should return false for invalid CSV', () => {
      const csvText = 'Just plain text without commas';
      expect(isCSVFormat(csvText)).toBe(false);
    });

    it('should return true for single row', () => {
      const csvText = 'Name,Age';
      expect(isCSVFormat(csvText)).toBe(true);
    });
  });

  describe('validateCSVDetection', () => {
    it('should validate good CSV detection results', () => {
      const result: CSVDetectionResult = {
        isCSV: true,
        confidence: 0.8,
        rowCount: 5,
        columnCount: 3,
        parsedData: [['a', 'b', 'c']],
      };

      expect(validateCSVDetection(result)).toBe(true);
    });

    it('should reject results with low confidence', () => {
      const result: CSVDetectionResult = {
        isCSV: true,
        confidence: 0.4,
        rowCount: 5,
        columnCount: 3,
      };

      expect(validateCSVDetection(result, { minConfidence: 0.6 })).toBe(false);
    });

    it('should reject results that exceed size limits', () => {
      const result: CSVDetectionResult = {
        isCSV: true,
        confidence: 0.8,
        rowCount: 1500,
        columnCount: 3,
      };

      expect(validateCSVDetection(result, { maxRows: 1000 })).toBe(false);
    });

    it('should reject non-CSV results', () => {
      const result: CSVDetectionResult = {
        isCSV: false,
        confidence: 0.3,
        rowCount: 1,
        columnCount: 1,
      };

      expect(validateCSVDetection(result)).toBe(false);
    });
  });

  describe('getDetectionDescription', () => {
    it('should describe successful CSV detection', () => {
      const result: CSVDetectionResult = {
        isCSV: true,
        confidence: 0.85,
        rowCount: 5,
        columnCount: 3,
      };

      const description = getDetectionDescription(result);
      expect(description).toContain('CSV detected');
      expect(description).toContain('5 rows');
      expect(description).toContain('3 columns');
      expect(description).toContain('85%');
    });

    it('should describe failed detection with error', () => {
      const result: CSVDetectionResult = {
        isCSV: false,
        confidence: 0,
        rowCount: 0,
        columnCount: 0,
        error: 'No commas found',
      };

      const description = getDetectionDescription(result);
      expect(description).toContain('Not CSV');
      expect(description).toContain('No commas found');
    });

    it('should describe failed detection with confidence', () => {
      const result: CSVDetectionResult = {
        isCSV: false,
        confidence: 0.4,
        rowCount: 2,
        columnCount: 1,
      };

      const description = getDetectionDescription(result);
      expect(description).toContain('Not CSV');
      expect(description).toContain('40%');
    });
  });

  describe('detectCSVWithValidation', () => {

    it('should respect max empty ratio', () => {
      const csvText = 'Name,Age\n,\n,\n,'; // High empty ratio
      const result = detectCSVWithValidation(csvText, { maxEmptyRatio: 0.3 });

      expect(result.isCSV).toBe(false); // Should reject due to high empty ratio
    });

    it('should pass with good headers', () => {
      const csvText = 'Name,Age,City\nJohn,25,NYC\nJane,30,LA';
      const result = detectCSVWithValidation(csvText, { requireHeaders: true });

      expect(result.isCSV).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Real-world CSV Examples', () => {
    it('should handle typical spreadsheet export', () => {
      const csvText = `"First Name","Last Name","Email","Phone"
"John","Doe","john.doe@email.com","555-1234"
"Jane","Smith","jane.smith@email.com","555-5678"
"Bob","Johnson","bob.johnson@email.com","555-9012"`;

      const result = detectCSV(csvText);
      expect(result.isCSV).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.rowCount).toBe(4);
      expect(result.columnCount).toBe(4);
    });

    it('should handle financial data', () => {
      const csvText = `Date,Amount,Description,Category
2024-01-15,-45.67,"Coffee Shop","Food & Dining"
2024-01-16,2500.00,"Salary Deposit","Income"
2024-01-17,-89.23,"Gas Station","Transportation"`;

      const result = detectCSV(csvText);
      expect(result.isCSV).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle scientific data', () => {
      const csvText = `Temperature,Pressure,Humidity,Reading_ID
22.5,1013.25,65.2,1001
23.1,1012.8,67.5,1002
21.9,1014.1,63.8,1003`;

      const result = detectCSV(csvText);
      expect(result.isCSV).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should reject malformed data that looks like CSV', () => {
      const csvText = `Name, Age, City
John 25 NYC
Jane 30 LA`; // Spaces instead of commas in data rows

      const result = detectCSV(csvText);
      expect(result.isCSV).toBe(false);
    });
  });
});