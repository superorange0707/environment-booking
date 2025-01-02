import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Button, Typography } from '@mui/material';

export function Navigation() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Environment Booking System
        </Typography>
        <Button color="inherit" component={Link} to="/">
          Calendar
        </Button>
        <Button color="inherit" component={Link} to="/admin">
          Admin Dashboard
        </Button>
      </Toolbar>
    </AppBar>
  );
} 