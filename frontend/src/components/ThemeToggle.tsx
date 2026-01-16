'use client';

import { IconButton, Tooltip } from '@mui/material';
import { Sun, Moon } from 'lucide-react';
import { useThemeMode } from '@/context/ThemeContext';

interface ThemeToggleProps {
  size?: number;
}

export default function ThemeToggle({ size = 20 }: ThemeToggleProps) {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={toggleTheme}
        sx={{
          color: mode === 'dark' ? '#F59E0B' : '#1E293B',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(30, 41, 59, 0.1)',
            transform: 'rotate(15deg)',
          },
        }}
      >
        {mode === 'dark' ? (
          <Moon size={size} />
        ) : (
          <Sun size={size} />
        )}
      </IconButton>
    </Tooltip>
  );
}
