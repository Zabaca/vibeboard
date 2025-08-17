import { Handle, type NodeProps, NodeResizer, Position } from '@xyflow/react';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ComponentState } from '../../types/native-component.types.ts';

interface CSVSpreadsheetNodeData {
  // Native component fields
  componentType: 'native';
  nativeType: 'csv';
  state: ComponentState;
  source: 'native';
  id: string;

  // UI-specific fields
  presentationMode?: boolean;
  onDelete?: (nodeId: string) => void;
  onUpdateState?: (nodeId: string, newState: ComponentState) => void;

  // Index signature for React Flow compatibility
  [key: string]: unknown;
}

interface CSVSpreadsheetNodeProps extends NodeProps {
  data: CSVSpreadsheetNodeData;
}

interface CSVParseResult {
  success: boolean;
  data?: string[][];
  error?: string;
}

const CSVSpreadsheet = ({ id, data, selected = false }: CSVSpreadsheetNodeProps) => {
  const { state, presentationMode, onDelete, onUpdateState } = data;
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize CSV data from state or default
  const csvData = state.csvData || [['']];
  const selectedCell = state.selectedCell || { row: 0, col: 0 };
  const readonly = state.readonly || false;
  const maxRows = state.maxRows || 100;
  const maxColumns = state.maxColumns || 26;
  const showHeaders = state.showHeaders !== false; // Default to true

  // Parse CSV text into 2D array
  const parseCSV = useCallback((text: string): CSVParseResult => {
    try {
      const rows = text.split('\n').filter(row => row.trim() !== '');
      if (rows.length === 0) {
        return { success: false, error: 'Empty CSV data' };
      }

      const parsedData = rows.map(row => {
        const fields: string[] = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            if (inQuotes && row[i + 1] === '"') {
              // Double quotes inside quoted field - treat as single quote
              currentField += '"';
              i++; // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // End of field
            fields.push(currentField);
            currentField = '';
          } else {
            currentField += char;
          }
        }

        // Push last field
        fields.push(currentField);
        return fields;
      });

      return { success: true, data: parsedData };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to parse CSV' 
      };
    }
  }, []);

  // Handle paste events within the spreadsheet
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (readonly || state.locked) return;
    
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const pastedText = clipboardData.getData('Text');
    
    if (!pastedText) return;

    const parseResult = parseCSV(pastedText);
    if (!parseResult.success || !parseResult.data) {
      console.warn('Failed to parse pasted CSV:', parseResult.error);
      return;
    }

    const parsedData = parseResult.data;
    const { row: startRow, col: startCol } = selectedCell;
    const newData = [...csvData];

    // Ensure enough rows exist
    while (newData.length < startRow + parsedData.length && newData.length < maxRows) {
      newData.push(Array(newData[0]?.length || 1).fill(''));
    }

    // Ensure enough columns exist
    const maxColsNeeded = Math.min(
      startCol + Math.max(...parsedData.map(row => row.length)),
      maxColumns
    );
    const currentCols = newData[0].length;
    
    if (maxColsNeeded > currentCols) {
      const colsToAdd = maxColsNeeded - currentCols;
      newData.forEach(row => {
        for (let i = 0; i < colsToAdd; i++) {
          row.push('');
        }
      });
    }

    // Paste data starting at selected cell
    parsedData.forEach((row, rowIndex) => {
      if (startRow + rowIndex >= maxRows) return;
      
      row.forEach((cell, colIndex) => {
        if (startCol + colIndex >= maxColumns) return;
        if (newData[startRow + rowIndex]) {
          newData[startRow + rowIndex][startCol + colIndex] = cell;
        }
      });
    });

    // Update state
    if (onUpdateState) {
      onUpdateState(id, { ...state, csvData: newData });
    }
  }, [csvData, selectedCell, readonly, state.locked, maxRows, maxColumns, parseCSV, onUpdateState, id, state]);

  // Handle cell value changes
  const handleCellChange = useCallback((rowIndex: number, colIndex: number, value: string) => {
    if (readonly || state.locked) return;

    const newData = [...csvData];
    if (newData[rowIndex]) {
      newData[rowIndex][colIndex] = value;
      
      if (onUpdateState) {
        onUpdateState(id, { ...state, csvData: newData });
      }
    }
  }, [csvData, readonly, state.locked, onUpdateState, id, state]);

  // Handle cell focus (selection)
  const handleCellFocus = useCallback((rowIndex: number, colIndex: number) => {
    if (onUpdateState) {
      onUpdateState(id, { 
        ...state, 
        selectedCell: { row: rowIndex, col: colIndex } 
      });
    }
  }, [onUpdateState, id, state]);

  // Add new row
  const addRow = useCallback(() => {
    if (readonly || state.locked || csvData.length >= maxRows) return;

    const newRow = Array(csvData[0]?.length || 1).fill('');
    const newData = [...csvData, newRow];
    
    if (onUpdateState) {
      onUpdateState(id, { ...state, csvData: newData });
    }
  }, [csvData, readonly, state.locked, maxRows, onUpdateState, id, state]);

  // Add new column
  const addColumn = useCallback(() => {
    if (readonly || state.locked || (csvData[0]?.length || 0) >= maxColumns) return;

    const newData = csvData.map(row => [...row, '']);
    
    if (onUpdateState) {
      onUpdateState(id, { ...state, csvData: newData });
    }
  }, [csvData, readonly, state.locked, maxColumns, onUpdateState, id, state]);

  // Generate column name (A, B, C, ... Z, AA, AB, etc.)
  const getColumnName = useCallback((index: number): string => {
    let name = '';
    let tempIndex = index;
    while (tempIndex >= 0) {
      name = String.fromCharCode(65 + (tempIndex % 26)) + name;
      tempIndex = Math.floor(tempIndex / 26) - 1;
    }
    return name;
  }, []);

  // Calculate dynamic column widths based on content
  const columnWidths = useMemo(() => {
    if (!csvData.length) return [];
    
    const widths = Array(csvData[0].length).fill(100);
    csvData.forEach(row => {
      row.forEach((cell, index) => {
        const cellLength = cell.toString().length;
        widths[index] = Math.max(
          widths[index], 
          Math.min(cellLength * 10 + 20, 300) // Cap at 300px
        );
      });
    });
    return widths;
  }, [csvData]);

  // Set up paste event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePasteEvent = (e: ClipboardEvent) => {
      // Convert to React event
      const reactEvent = {
        preventDefault: () => e.preventDefault(),
        clipboardData: e.clipboardData,
      } as React.ClipboardEvent;
      
      handlePaste(reactEvent);
    };

    container.addEventListener('paste', handlePasteEvent);
    return () => container.removeEventListener('paste', handlePasteEvent);
  }, [handlePaste]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minWidth: '300px',
        minHeight: '200px',
        position: 'relative',
        cursor: state.locked ? 'not-allowed' : 'move',
        background: '#f8f9fa',
        fontFamily: 'Segoe UI, Roboto, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Node Resizer - only show if not locked */}
      {!state.locked && (
        <NodeResizer
          minWidth={300}
          minHeight={200}
          isVisible={selected && !(presentationMode as boolean)}
          handleStyle={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#6366f1',
            border: '2px solid white',
          }}
          lineStyle={{
            stroke: '#6366f1',
            strokeWidth: 2,
            strokeDasharray: '5 5',
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: '#212529',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            CSV Spreadsheet
          </h1>
          <p
            style={{
              color: '#6c757d',
              marginTop: '4px',
              fontSize: '13px',
              margin: 0,
            }}
          >
            {readonly ? 'Read-only view' : 'Click cells to edit, paste CSV data (Ctrl+V)'}
          </p>
        </div>
        
        {/* Row/Column info */}
        <div
          style={{
            fontSize: '12px',
            color: '#6c757d',
          }}
        >
          {csvData.length} rows × {csvData[0]?.length || 0} columns
        </div>
      </div>

      {/* Spreadsheet content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          backgroundColor: '#ffffff',
          height: 'calc(100% - 80px)',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            minWidth: '100%',
          }}
        >
          {/* Column headers */}
          {showHeaders && (
            <div
              style={{
                display: 'flex',
                backgroundColor: '#f8f9fa',
              }}
            >
              {/* Row header corner */}
              <div
                style={{
                  width: '50px',
                  backgroundColor: '#e9ecef',
                  borderRight: '1px solid #dee2e6',
                  borderBottom: '1px solid #dee2e6',
                }}
              />
              
              {/* Column headers */}
              {csvData[0] && csvData[0].map((_, colIndex) => (
                <div
                  key={colIndex}
                  style={{
                    width: `${columnWidths[colIndex] || 120}px`,
                    minWidth: '80px',
                    padding: '8px 12px',
                    backgroundColor: '#e9ecef',
                    borderRight: '1px solid #dee2e6',
                    borderBottom: '1px solid #dee2e6',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '14px',
                  }}
                >
                  {getColumnName(colIndex)}
                </div>
              ))}
              
              {/* Add column button */}
              {!readonly && !state.locked && (csvData[0]?.length || 0) < maxColumns && (
                <button
                  type="button"
                  onClick={addColumn}
                  style={{
                    width: '40px',
                    backgroundColor: '#20c997',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    transition: 'background-color 0.2s',
                  }}
                  title="Add column"
                >
                  +
                </button>
              )}
            </div>
          )}

          {/* Data rows */}
          {csvData.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: 'flex',
                borderBottom: rowIndex === csvData.length - 1 ? 'none' : '1px solid #dee2e6',
              }}
            >
              {/* Row header */}
              {showHeaders && (
                <div
                  style={{
                    width: '50px',
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRight: '1px solid #dee2e6',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#495057',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {rowIndex + 1}
                </div>
              )}
              
              {/* Data cells */}
              {row.map((cell, colIndex) => (
                <input
                  key={`${rowIndex}-${colIndex}`}
                  value={cell}
                  onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                  onFocus={() => handleCellFocus(rowIndex, colIndex)}
                  disabled={readonly || state.locked}
                  className="nodrag"
                  style={{
                    width: `${columnWidths[colIndex] || 120}px`,
                    minWidth: '80px',
                    padding: '8px 12px',
                    border: 'none',
                    borderRight: '1px solid #dee2e6',
                    outline: selectedCell.row === rowIndex && selectedCell.col === colIndex 
                      ? '2px solid #0d6efd' 
                      : '1px solid transparent',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    color: '#212529',
                    backgroundColor: readonly || state.locked ? '#f8f9fa' : '#ffffff',
                    cursor: readonly || state.locked ? 'default' : 'text',
                  }}
                />
              ))}
            </div>
          ))}

          {/* Add row button */}
          {!readonly && !state.locked && csvData.length < maxRows && (
            <div
              style={{
                display: 'flex',
                borderTop: '2px solid #495057',
              }}
            >
              <button
                type="button"
                onClick={addRow}
                style={{
                  width: showHeaders ? '50px' : '100%',
                  height: '40px',
                  backgroundColor: '#20c997',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  transition: 'background-color 0.2s',
                }}
                title="Add row"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Control buttons - only show if not in presentation mode and not locked */}
      {!(presentationMode || state.locked) && selected && (
        <div
          className="nodrag"
          style={{
            position: 'absolute',
            top: '-36px',
            right: '0',
            display: 'flex',
            gap: '4px',
            background: 'white',
            padding: '4px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* Lock button */}
          <button
            type="button"
            onClick={() => onUpdateState?.(id, { ...state, locked: true })}
            style={{
              background: 'transparent',
              color: '#6b7280',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
            }}
            title="Lock spreadsheet"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </button>

          {/* Delete button */}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(id)}
              style={{
                background: 'transparent',
                color: '#ef4444',
                border: 'none',
                borderRadius: '4px',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
              }}
              title="Delete spreadsheet"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Unlock indicator for locked spreadsheet */}
      {state.locked && !presentationMode && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '4px',
            padding: '2px',
            cursor: 'pointer',
          }}
          onClick={() => onUpdateState?.(id, { ...state, locked: false })}
          title="Click to unlock"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
          >
            <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
      )}

      {/* Connection handles */}
      {!presentationMode && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            style={{
              width: '8px',
              height: '8px',
              background: '#6366f1',
              border: '2px solid white',
              visibility: selected ? 'visible' : 'hidden',
            }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            style={{
              width: '8px',
              height: '8px',
              background: '#6366f1',
              border: '2px solid white',
              visibility: selected ? 'visible' : 'hidden',
            }}
          />
        </>
      )}

      {/* Footer tip */}
      <div
        style={{
          position: 'absolute',
          bottom: '4px',
          left: '16px',
          right: '16px',
          color: '#6c757d',
          fontSize: '12px',
          fontWeight: '500',
          textAlign: 'center',
        }}
      >
        {readonly || state.locked 
          ? 'Spreadsheet is read-only' 
          : 'Click cells to edit • Paste CSV data (Ctrl+V)'
        }
      </div>
    </div>
  );
};

export default memo(CSVSpreadsheet);