'use client';

import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { ReactNode } from 'react';

interface CTACardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonIcon: ReactNode;
  buttonHref: string;
  buttonColor?: string;
  buttonHoverColor?: string;
  iconColor?: string;
  ariaLabel?: string;
}

export default function CTACard({
  title,
  description,
  buttonText,
  buttonIcon,
  buttonHref,
  buttonColor = '#3B82F6',
  buttonHoverColor,
  iconColor,
  ariaLabel,
}: CTACardProps) {
  return (
    <Card
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: buttonColor,
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px rgba(59, 130, 246, 0.15)`,
        },
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Icon at the top */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            bgcolor: iconColor || `${buttonColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            color: iconColor || buttonColor,
          }}
        >
          {buttonIcon}
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            mb: 2,
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: 3,
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>

        {/* Button */}
        <Button
          variant="contained"
          fullWidth
          href={buttonHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel || buttonText}
          startIcon={buttonIcon}
          sx={{
            bgcolor: buttonColor,
            color: 'white',
            fontWeight: 600,
            py: 1.5,
            fontSize: '0.95rem',
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: buttonHoverColor || buttonColor,
              boxShadow: `0 4px 12px ${buttonColor}40`,
              transform: 'translateY(-2px)',
            },
            '&:focus-visible': {
              outline: `3px solid ${buttonColor}60`,
              outlineOffset: '2px',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
