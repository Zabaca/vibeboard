import React, { useState, useEffect, useRef, useCallback } from 'react';

const NotebookDataAnalyzer = () => {
  const [db, setDb] = useState(null);
  const [cells, setCells] = useState([{
    id: 1,
    query: 'SELECT * FROM uploaded_data LIMIT 10',
    results: [],
    loading: false,
    error: null,
    executed: false,
    hasChanges: false,
    tableName: null
  }]);
  const [availableTables, setAvailableTables] = useState(['uploaded_data']);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const fileInputRef = useRef(null);
  const [nextCellId, setNextCellId] = useState(2);
  
  useEffect(() => {
    const initDuckDB = async () => {
      try {
        setGlobalLoading(true);
        const duckdb = await import('https://esm.sh/@duckdb/duckdb-wasm');
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
        const worker = await duckdb.createWorker(bundle.mainWorker);
        const database = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
        await database.instantiate(bundle.mainModule);
        setDb(database);
        setGlobalError(null);
      } catch (err) {
        setGlobalError('Failed to initialize database: ' + err.message);
        console.error(err);
      } finally {
        setGlobalLoading(false);
      }
    };
    initDuckDB();
    return () => {
      if (db) {
        db.terminate();
      }
    };
  }, []);
  
  const loadCSVData = useCallback(async file => {
    if (!db) return;
    try {
      setGlobalLoading(true);
      setGlobalError(null);
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await db.registerFileBuffer(file.name, uint8Array);
      const conn = await db.connect();
      try {
        await conn.query(`
          CREATE OR REPLACE TABLE uploaded_data AS 
          SELECT * FROM read_csv_auto('${file.name}')
        `);
      } catch (autoError) {
        console.log('read_csv_auto failed, trying read_csv...', autoError.message);
        await conn.query(`
          CREATE OR REPLACE TABLE uploaded_data AS 
          SELECT * FROM read_csv('${file.name}', 
            header=true, 
            auto_detect=true,
            ignore_errors=true
          )
        `);
      }
      await conn.close();
      setDataLoaded(true);
      setAvailableTables(['uploaded_data']);
    } catch (err) {
      setGlobalError('Failed to load CSV data: ' + err.message);
      console.error(err);
    } finally {
      setGlobalLoading(false);
    }
  }, [db]);
  
  const executeCell = useCallback(async cellId => {
    if (!db || !dataLoaded) return;
    const cell = cells.find(c => c.id === cellId);
    if (!cell || !cell.query.trim()) return;
    setCells(prev => prev.map(c => c.id === cellId ? {
      ...c,
      loading: true,
      error: null
    } : c));
    let conn = null;
    try {
      conn = await db.connect();
      const autoTableName = `cell_${cellId}_result`;
      const isManualCreate = cell.query.trim().toLowerCase().match(/^\s*(create\s+(table|view))/);
      const queryWithoutComments = cell.query.replace(/--.*$/gm, '').trim().toLowerCase();
      const isSelectQuery = queryWithoutComments.startsWith('select');
      let finalQuery = cell.query;
      let resultTableName = null;
      let previewData = [];
      if (!isManualCreate && isSelectQuery) {
        finalQuery = `CREATE OR REPLACE TABLE ${autoTableName} AS\n${cell.query}`;
        resultTableName = autoTableName;
        await conn.query(finalQuery);
        const previewResult = await conn.query(`SELECT * FROM ${autoTableName} LIMIT 100`);
        previewData = previewResult.toArray().map(row => ({
          ...row
        }));
      } else if (isManualCreate) {
        await conn.query(finalQuery);
        const match = cell.query.match(/create\s+(?:or\s+replace\s+)?(?:table|view)\s+(\w+)/i);
        if (match) {
          resultTableName = match[1];
          try {
            const previewResult = await conn.query(`SELECT * FROM ${resultTableName} LIMIT 100`);
            previewData = previewResult.toArray().map(row => ({
              ...row
            }));
          } catch (previewError) {
            console.log('Could not preview table:', previewError);
            previewData = [];
          }
        }
      } else {
        const result = await conn.query(finalQuery);
        previewData = result.toArray().map(row => ({
          ...row
        }));
      }
      if (resultTableName && !availableTables.includes(resultTableName)) {
        setAvailableTables(prev => [...prev, resultTableName]);
      }
      setCells(prev => prev.map(c => c.id === cellId ? {
        ...c,
        loading: false,
        results: previewData,
        executed: true,
        error: null,
        hasChanges: false,
        tableName: resultTableName
      } : c));
    } catch (err) {
      console.error('Cell execution error:', err);
      setCells(prev => prev.map(c => c.id === cellId ? {
        ...c,
        loading: false,
        error: err.message,
        results: [],
        executed: true,
        hasChanges: false,
        tableName: null
      } : c));
    } finally {
      if (conn) {
        try {
          await conn.close();
        } catch (closeError) {
          console.warn('Error closing connection:', closeError);
        }
      }
    }
  }, [db, cells, dataLoaded, availableTables]);
  
  const updateCellQuery = (cellId, query) => {
    setCells(prev => prev.map(c => c.id === cellId ? {
      ...c,
      query,
      hasChanges: true
    } : c));
  };
  
  const addCell = () => {
    const lastCellWithTable = [...cells].reverse().find(cell => cell.executed && cell.tableName);
    let defaultQuery = '-- New query\nSELECT * FROM uploaded_data';
    if (lastCellWithTable && lastCellWithTable.tableName) {
      defaultQuery = `-- Query building on previous results\nSELECT * FROM ${lastCellWithTable.tableName} LIMIT 10`;
    }
    const newCell = {
      id: nextCellId,
      query: defaultQuery,
      results: [],
      loading: false,
      error: null,
      executed: false,
      hasChanges: false,
      tableName: null
    };
    setCells(prev => [...prev, newCell]);
    setNextCellId(prev => prev + 1);
  };
  
  const deleteCell = cellId => {
    if (cells.length > 1) {
      setCells(prev => prev.filter(c => c.id !== cellId));
    }
  };
  
  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    loadCSVData(file);
  };
  
  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };
  
  const handleKeyDown = (cellId, e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeCell(cellId);
    }
  };
  
  const renderCellResults = (cell) => {
    if (cell.loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          color: '#666'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e0e0e0',
            borderTop: '2px solid #4285f4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '12px'
          }} />
          Executing...
        </div>
      );
    }
    
    if (cell.error) {
      return (
        <div style={{
          padding: '16px',
          color: '#c0392b',
          backgroundColor: '#fdf2f2',
          borderRadius: '6px',
          border: '1px solid #e74c3c',
          fontSize: '14px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}>
          Error: {cell.error}
        </div>
      );
    }
    
    if (!cell.executed || cell.results.length === 0) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#999',
          fontStyle: 'italic'
        }}>
          Press Ctrl+Enter to execute this cell
        </div>
      );
    }
    
    if (cell.results.length === 0) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px'
        }}>
          Query executed successfully. No rows returned.
        </div>
      );
    }
    
    return (
      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#666',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{cell.results.length} rows returned</span>
          {cell.tableName && (
            <span style={{
              backgroundColor: '#27ae60',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500'
            }}>
              Saved as: {cell.tableName}
            </span>
          )}
        </div>
        <div style={{
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#fff'
          }}>
            <thead>
              <tr>
                {Object.keys(cell.results[0]).map(key => (
                  <th key={key} style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #dee2e6',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '13px',
                    position: 'sticky',
                    top: 0
                  }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cell.results.slice(0, 1000).map((row, index) => (
                <tr key={index} style={{
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa'
                }}>
                  {Object.values(row).map((value, cellIndex) => (
                    <td key={cellIndex} style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #e9ecef',
                      color: '#34495e',
                      fontSize: '13px'
                    }}>
                      {value !== null ? String(value) : 'NULL'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      width: '100%',
      height: '100%'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .query-cell {
          transition: all 0.2s ease;
        }
        .query-cell:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
      `}</style>
      
      <div style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e9ecef',
        padding: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}>
          <div>
            <h1 style={{
              margin: '0 0 4px 0',
              color: '#2c3e50',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Data Analysis Notebook
            </h1>
            <p style={{
              margin: 0,
              color: '#7f8c8d',
              fontSize: '14px'
            }}>
              Upload CSV data and build queries that work with previous results
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={triggerFileUpload}
              disabled={globalLoading || !db}
              style={{
                padding: '8px 16px',
                backgroundColor: globalLoading || !db ? '#bdc3c7' : '#8e44ad',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: globalLoading || !db ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              📁 Upload CSV
            </button>
            <button
              onClick={addCell}
              disabled={!dataLoaded}
              style={{
                padding: '8px 16px',
                backgroundColor: !dataLoaded ? '#bdc3c7' : '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: !dataLoaded ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              + Add Cell
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      <div style={{
        width: '100%',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        {globalError && (
          <div style={{
            padding: '16px',
            marginBottom: '20px',
            backgroundColor: '#fdf2f2',
            color: '#c0392b',
            borderRadius: '8px',
            border: '1px solid #e74c3c'
          }}>
            {globalError}
          </div>
        )}
        
        {!dataLoaded && !globalError && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '2px dashed #dee2e6',
            width: '100%'
          }}>
            <h3 style={{
              color: '#7f8c8d',
              marginBottom: '12px'
            }}>
              No data loaded yet
            </h3>
            <p style={{
              color: '#95a5a6',
              marginBottom: '20px'
            }}>
              Upload a CSV file to start analyzing your data
            </p>
            <button
              onClick={triggerFileUpload}
              disabled={globalLoading || !db}
              style={{
                padding: '12px 24px',
                backgroundColor: '#8e44ad',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              📁 Upload CSV File
            </button>
          </div>
        )}
        
        {dataLoaded && cells.map((cell, index) => (
          <div
            key={cell.id}
            className="query-cell"
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e9ecef',
              overflow: 'hidden',
              width: '100%'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e9ecef'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  [{index + 1}]
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#666'
                }}>
                  SQL Query
                </span>
                {cell.tableName && (
                  <span style={{
                    backgroundColor: '#27ae60',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    → {cell.tableName}
                  </span>
                )}
              </div>
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={() => executeCell(cell.id)}
                  disabled={cell.loading || !cell.query.trim()}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: cell.loading || !cell.query.trim() ? '#bdc3c7' : '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: cell.loading || !cell.query.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  ▶ Run
                </button>
                {cells.length > 1 && (
                  <button
                    onClick={() => deleteCell(cell.id)}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            <div style={{
              padding: '20px',
              width: '100%'
            }}>
              <textarea
                value={cell.query}
                onChange={e => updateCellQuery(cell.id, e.target.value)}
                onKeyDown={e => handleKeyDown(cell.id, e)}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '16px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  resize: 'vertical',
                  backgroundColor: '#fafafa',
                  color: '#2c3e50',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your SQL query..."
              />
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#95a5a6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px' }}>
                    💡 Available tables: {availableTables.map((table, idx) => (
                      <span key={table}>
                        <code style={{
                          backgroundColor: table.startsWith('cell_') ? '#e8f5e8' : '#ecf0f1',
                          padding: '1px 4px',
                          borderRadius: '2px',
                          fontSize: '11px',
                          fontWeight: table.startsWith('cell_') ? '600' : 'normal'
                        }}>
                          {table}
                        </code>
                        {idx < availableTables.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#bdc3c7'
                  }}>
                    SELECT queries auto-create tables as cell_{index + 1}_result
                  </div>
                </div>
                <span>
                  <kbd style={{
                    padding: '2px 6px',
                    backgroundColor: '#ecf0f1',
                    borderRadius: '3px'
                  }}>
                    Ctrl+Enter
                  </kbd> to run
                </span>
              </div>
            </div>
            
            <div style={{
              padding: '0 20px 20px',
              width: '100%'
            }}>
              {renderCellResults(cell)}
            </div>
          </div>
        ))}
        
        {dataLoaded && cells.some(cell => cell.executed && cell.tableName) && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            width: '100%'
          }}>
            <button
              onClick={addCell}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3498db',
                color: 'white',
                border: '2px dashed transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.2s',
                width: '100%'
              }}
              onMouseEnter={e => {
                e.target.style.backgroundColor = '#2980b9';
                e.target.style.borderColor = '#3498db';
              }}
              onMouseLeave={e => {
                e.target.style.backgroundColor = '#3498db';
                e.target.style.borderColor = 'transparent';
              }}
            >
              + Add New Query Cell
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotebookDataAnalyzer;