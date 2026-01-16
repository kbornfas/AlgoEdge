'use client';

import { Box } from '@mui/material';

/**
 * Subtle Trading Background for Auth Pages
 * A lighter version of the landing page background
 */
const AuthBackground = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Dark base */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: '#0a0f1a',
        }}
      />

      {/* Subtle trading chart background - very faded */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url('https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.15,
        }}
      />

      {/* Heavy dark overlay for form readability */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(ellipse at center, 
              rgba(10, 15, 26, 0.85) 0%,
              rgba(10, 15, 26, 0.95) 100%
            )
          `,
        }}
      />

      {/* Subtle green glow - top left */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Subtle green glow - bottom right */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Subtle line chart overlay */}
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          top: '30%',
          left: 0,
          width: '100%',
          height: '40%',
          opacity: 0.08,
        }}
        viewBox="0 0 1920 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="authLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,200 C100,180 200,220 300,160 S500,200 600,140 S800,180 900,120 S1100,160 1200,100 S1400,140 1500,180 S1700,120 1800,160 L1920,140"
          fill="none"
          stroke="url(#authLineGradient)"
          strokeWidth="2"
        />
      </Box>
    </Box>
  );
};

export default AuthBackground;
