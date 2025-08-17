import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
const Spreadsheet = () => {
  const [data, setData] = useState([['']]);
  const [selectedCell, setSelectedCell] = useState({
    row: 0,
    col: 0
  });
  const containerRef = useRef(null);
  const parseCSV = text => {
    const rows = text.split('\n').filter(row => row.trim() !== '');
    return rows.map(row => {
      // Handle quoted fields and split by commas
      const fields = [];
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
  };
  const handlePaste = useCallback(e => {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('Text');
    if (!pastedText) return;
    const parsedData = parseCSV(pastedText);
    if (parsedData.length === 0) return;
    const {
      row: startRow,
      col: startCol
    } = selectedCell;
    const newData = [...data];

    // Ensure enough rows exist
    while (newData.length < startRow + parsedData.length) {
      newData.push(Array(newData[0]?.length || 1).fill(''));
    }

    // Ensure enough columns exist
    const maxColsNeeded = startCol + Math.max(...parsedData.map(row => row.length));
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
      row.forEach((cell, colIndex) => {
        newData[startRow + rowIndex][startCol + colIndex] = cell;
      });
    });
    setData(newData);
  }, [data, selectedCell]);
  const handleCellChange = (rowIndex, colIndex, value) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };
  const handleCellFocus = (rowIndex, colIndex) => {
    setSelectedCell({
      row: rowIndex,
      col: colIndex
    });
  };
  const addRow = () => {
    const newRow = Array(data[0].length).fill('');
    setData([...data, newRow]);
  };
  const addColumn = () => {
    setData(data.map(row => [...row, '']));
  };
  const getColumnName = index => {
    let name = '';
    let tempIndex = index;
    while (tempIndex >= 0) {
      name = String.fromCharCode(65 + tempIndex % 26) + name;
      tempIndex = Math.floor(tempIndex / 26) - 1;
    }
    return name;
  };
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('paste', handlePaste);
    return () => container.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Calculate column widths based on content
  const columnWidths = useMemo(() => {
    if (!data.length) return [];
    const widths = Array(data[0].length).fill(100);
    data.forEach(row => {
      row.forEach((cell, index) => {
        const cellLength = cell.toString().length;
        widths[index] = Math.max(widths[index], Math.min(cellLength * 10, 300) // Cap at 300px
        );
      });
    });
    return widths;
  }, [data]);
  return /*#__PURE__*/React.createElement("div", {
    ref: containerRef,
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Segoe UI, Roboto, sans-serif',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 24px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e0e0e0'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      color: '#212529',
      fontSize: '24px',
      fontWeight: '600'
    }
  }, "CSV Spreadsheet"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: '#6c757d',
      marginTop: '6px',
      fontSize: '15px'
    }
  }, "Paste CSV data from clipboard into the spreadsheet below")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '20px',
      backgroundColor: '#ffffff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-block',
      border: '1px solid #dee2e6',
      borderRadius: '6px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      minWidth: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      backgroundColor: '#f8f9fa'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '60px',
      backgroundColor: '#e9ecef',
      borderRight: '1px solid #dee2e6',
      borderBottom: '1px solid #dee2e6'
    }
  }), data[0] && data[0].map((_, colIndex) => /*#__PURE__*/React.createElement("div", {
    key: colIndex,
    style: {
      width: `${columnWidths[colIndex] || 120}px`,
      minWidth: '100px',
      padding: '12px 16px',
      backgroundColor: '#e9ecef',
      borderRight: '1px solid #dee2e6',
      borderBottom: '1px solid #dee2e6',
      textAlign: 'center',
      fontWeight: '600',
      color: '#495057',
      fontSize: '15px'
    }
  }, getColumnName(colIndex))), /*#__PURE__*/React.createElement("button", {
    onClick: addColumn,
    style: {
      width: '50px',
      backgroundColor: '#20c997',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '20px',
      transition: 'background-color 0.2s',
      ':hover': {
        backgroundColor: '#1aa179'
      }
    }
  }, "+")), data.map((row, rowIndex) => /*#__PURE__*/React.createElement("div", {
    key: rowIndex,
    style: {
      display: 'flex',
      borderBottom: rowIndex === data.length - 1 ? 'none' : '1px solid #dee2e6'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '60px',
      padding: '12px 16px',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #dee2e6',
      textAlign: 'center',
      fontWeight: '600',
      color: '#495057',
      fontSize: '15px'
    }
  }, rowIndex + 1), row.map((cell, colIndex) => /*#__PURE__*/React.createElement("input", {
    key: `${rowIndex}-${colIndex}`,
    value: cell,
    onChange: e => handleCellChange(rowIndex, colIndex, e.target.value),
    onFocus: () => handleCellFocus(rowIndex, colIndex),
    style: {
      width: `${columnWidths[colIndex] || 120}px`,
      minWidth: '100px',
      padding: '12px 16px',
      border: 'none',
      borderRight: '1px solid #dee2e6',
      outline: selectedCell.row === rowIndex && selectedCell.col === colIndex ? '2px solid #0d6efd' : '1px solid transparent',
      fontFamily: 'inherit',
      fontSize: '15px',
      color: '#212529',
      backgroundColor: '#ffffff'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      borderTop: '2px solid #495057'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: addRow,
    style: {
      width: '60px',
      height: '48px',
      backgroundColor: '#20c997',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '20px',
      transition: 'background-color 0.2s',
      ':hover': {
        backgroundColor: '#1aa179'
      }
    }
  }, "+")))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 24px',
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #e9ecef',
      color: '#6c757d',
      fontSize: '14px',
      fontWeight: '500'
    }
  }, "Tip: Select a cell and paste (Ctrl+V) CSV data from your clipboard"));
};
export default Spreadsheet;