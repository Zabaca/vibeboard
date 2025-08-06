// Stable style objects to prevent recreation on every render
export const codeEditDialogStyles = {
  backdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
  },
  
  dialog: {
    backgroundColor: '#1a1a1a',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '1200px',
    height: '85vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  
  header: {
    padding: '24px 32px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)',
  },
  
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: '-0.5px',
  },
  
  content: {
    flex: 1,
    display: 'flex',
    padding: '24px 32px',
    gap: '0',
    minHeight: 0,
    position: 'relative' as const,
  },
  
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#e5e5e5',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  
  textarea: {
    flex: 1,
    width: '100%',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0d0d0d',
    color: '#e5e5e5',
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    resize: 'none' as const,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  
  textareaFocused: {
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  
  footer: {
    padding: '24px 32px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'linear-gradient(to top, #2a2a2a, #1a1a1a)',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
} as const;