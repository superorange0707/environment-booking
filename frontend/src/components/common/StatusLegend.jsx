import React from 'react';
import { Box, Typography } from '@mui/material';

export function StatusLegend({ sx }) {
  const statuses = [
    { label: 'Ready', color: '#4CAF50', value: 'ready' },
    { label: 'Booked', color: '#2196F3', value: 'booked' },
    { label: 'Requires Attention', color: '#F44336', value: 'requires_attention' }
  ];

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 2, 
        p: 2,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        ...sx 
      }}
    >
      {statuses.map(({ label, color, value }) => (
        <Box 
          key={value} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)'
            }
          }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: 1,
              backgroundColor: color,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500
            }}
          >
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
} 