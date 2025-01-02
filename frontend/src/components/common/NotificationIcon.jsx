import React from 'react';
import { Tooltip, Box } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export function NotificationIcon({ type, tooltipText }) {
  // Base icon style
  const iconBaseStyle = { 
    fontSize: 16,
    transition: 'transform 0.2s ease'
  };

  const getIcon = () => {
    switch (type) {
      case 'reminder':
        return (
          <NotificationsIcon 
            sx={{ 
              ...iconBaseStyle, 
              color: '#f57c00',
              '&:hover': { transform: 'scale(1.1)' }
            }} 
          />
        );
      case 'email':
        return (
          <EmailIcon 
            sx={{ 
              ...iconBaseStyle, 
              color: '#1976d2',
              '&:hover': { transform: 'scale(1.1)' }
            }} 
          />
        );
      case 'checklist':
        return (
          <CheckCircleIcon 
            sx={{ 
              ...iconBaseStyle, 
              color: '#43a047',
              '&:hover': { transform: 'scale(1.1)' }
            }} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <Tooltip 
      title={tooltipText} 
      arrow
      placement="top"
    >
      <Box sx={{ 
        display: 'inline-flex', 
        alignItems: 'center',
        ml: 0.5,
        cursor: 'pointer',
        p: '2px',
        borderRadius: '50%',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)'
        }
      }}>
        {getIcon()}
      </Box>
    </Tooltip>
  );
} 