// ESM Loader Wrapper - Use this to load external ES modules dynamically
// This wrapper uses dynamic import() which properly handles ES modules

export default function ESMLoaderWrapper({ moduleUrl }) {
  const [Component, setComponent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Dynamic import of the ES module
        const module = await import(moduleUrl);
        const LoadedComponent = module.default || module;
        
        // Wrap in a component to handle the loaded module
        setComponent(() => LoadedComponent);
      } catch (err) {
        console.error('Failed to load module:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (moduleUrl) {
      loadComponent();
    }
  }, [moduleUrl]);
  
  if (loading) {
    return React.createElement('div', {
      style: { padding: '20px', textAlign: 'center' }
    }, 'Loading component...');
  }
  
  if (error) {
    return React.createElement('div', {
      style: { 
        padding: '20px', 
        color: 'red',
        backgroundColor: '#fee',
        borderRadius: '8px'
      }
    }, `Error loading module: ${error}`);
  }
  
  if (!Component) {
    return React.createElement('div', {
      style: { padding: '20px', color: '#666' }
    }, 'No component loaded');
  }
  
  // Render the loaded component
  return React.createElement(Component);
}