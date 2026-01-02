import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Define a basic Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // A shade of blue
    },
    secondary: {
      main: '#dc004e', // A shade of red/pink
    },
    // You can customize more palette properties, typography, etc.
  },
  typography: {
    button: {
      textTransform: 'none', // Prevent uppercase transformation for buttons
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* CssBaseline for a consistent CSS baseline */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
