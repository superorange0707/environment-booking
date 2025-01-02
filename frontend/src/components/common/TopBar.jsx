import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Box
} from '@mui/material';

export const TopBar = ({ isAdmin, onRoleToggle }) => {
  return (
    <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2
      }}>
        {/* Title */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Environment Booking System
        </Typography>
        
        {/* Control button group */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          flexShrink: 0  // Prevent controls from being compressed
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={isAdmin}
                onChange={onRoleToggle}
                color="default"
                sx={{
                  '& .MuiSwitch-track': {
                    backgroundColor: '#fff'
                  }
                }}
              />
            }
            label={isAdmin ? "Admin Mode" : "User Mode"}
            sx={{
              color: '#fff',
              marginRight: 2
            }}
          />
          <Button 
            color="inherit"
            sx={{
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}; 