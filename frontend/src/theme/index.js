import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
      light: '#333333',
    },
    secondary: {
      main: '#0071e3',
    },
    background: {
      default: '#f5f5f7',
      paper: '#ffffff',
    }
  },
  shape: {
    borderRadius: 16
  },
  shadows: [
    'none',
    '0px 2px 8px rgba(0,0,0,0.05)',
    '0px 4px 16px rgba(0,0,0,0.08)',
    // ... other shadow levels
  ],
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 20px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          overflow: 'hidden'
        }
      }
    }
  }
}); 