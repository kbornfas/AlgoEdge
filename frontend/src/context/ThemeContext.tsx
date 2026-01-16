'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

// Brand colors
const BRAND_GREEN = '#10B981';
const BRAND_GREEN_LIGHT = '#34D399';
const BRAND_GREEN_DARK = '#059669';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setMode(savedMode);
    }
    setMounted(true);
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('themeMode', mode);
    }
  }, [mode, mounted]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: BRAND_GREEN,
            light: BRAND_GREEN_LIGHT,
            dark: BRAND_GREEN_DARK,
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: '#8B5CF6',
            light: '#A78BFA',
            dark: '#7C3AED',
            contrastText: '#FFFFFF',
          },
          success: {
            main: BRAND_GREEN,
            light: BRAND_GREEN_LIGHT,
            dark: BRAND_GREEN_DARK,
          },
          error: {
            main: '#EF4444',
            light: '#F87171',
            dark: '#DC2626',
          },
          warning: {
            main: '#F59E0B',
            light: '#FBBF24',
            dark: '#D97706',
          },
          info: {
            main: '#06B6D4',
            light: '#22D3EE',
            dark: '#0891B2',
          },
          background: {
            default: mode === 'dark' ? '#000000' : '#F8FAFC',
            paper: mode === 'dark' ? '#0a0a0a' : '#FFFFFF',
          },
          text: {
            primary: mode === 'dark' ? '#F1F5F9' : '#1E293B',
            secondary: mode === 'dark' ? '#94A3B8' : '#64748B',
          },
          divider: mode === 'dark' ? '#1a1a1a' : '#E2E8F0',
        },
        typography: {
          fontFamily: [
            'Inter',
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'Roboto',
            'Helvetica Neue',
            'Arial',
            'sans-serif',
          ].join(','),
          h1: { fontWeight: 700, fontSize: '2.5rem' },
          h2: { fontWeight: 600, fontSize: '2rem' },
          h3: { fontWeight: 600, fontSize: '1.75rem' },
          h4: { fontWeight: 600, fontSize: '1.5rem' },
          h5: { fontWeight: 600, fontSize: '1.25rem' },
          h6: { fontWeight: 600, fontSize: '1rem' },
          button: { textTransform: 'none', fontWeight: 600 },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: '0.95rem',
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: `0 4px 12px rgba(16, 185, 129, 0.3)`,
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                borderRadius: 16,
                border: mode === 'dark' ? '1px solid #1a1a1a' : '1px solid #E2E8F0',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
        },
      }),
    [mode]
  );

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
