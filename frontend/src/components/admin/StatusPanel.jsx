import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Card,
  CardContent,
  useTheme,
  LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BuildIcon from '@mui/icons-material/Build';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { environmentService } from '../../services/api';

// Environment colors mapping
const environmentColors = {
  1: '#4CAF50', // Green
  2: '#2196F3', // Blue
  3: '#9C27B0', // Purple
  4: '#FF9800', // Orange
  5: '#E91E63', // Pink
  6: '#00BCD4', // Cyan
  7: '#FF5722', // Deep Orange
  8: '#8BC34A'  // Light Green
};

// Add status toggle button component
const StatusToggleButton = ({ env, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  // Use current manual_status or status to determine button display
  const isInMaintenance = env.manual_status === 'Maintenance' || env.status === 'Maintenance';

  const handleStatusChange = async () => {
    setLoading(true);
    try {
      const newStatus = isInMaintenance ? 'Ready' : 'Maintenance';
      await onStatusChange(env.environment_id, newStatus);
    } catch (error) {
      console.error('Error changing status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Chip
      size="small"
      label={isInMaintenance ? 'Set Ready' : 'Set Maintenance'}
      onClick={handleStatusChange}
      disabled={loading}
      sx={{
        height: '24px',
        minWidth: '90px',
        fontSize: '0.75rem',
        backgroundColor: isInMaintenance
          ? '#4caf5020'
          : '#f4433620',
        color: isInMaintenance
          ? '#4caf50'
          : '#f44336',
        '&:hover': {
          backgroundColor: isInMaintenance
            ? '#4caf5030'
            : '#f4433630',
        }
      }}
    />
  );
};

export const StatusPanel = ({ environments, bookings, users }) => {
  const theme = useTheme();
  const [environmentStatus, setEnvironmentStatus] = useState({});

  // Fetch environment status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await environmentService.getAllEnvironments();
        // Create a mapping of environment_id to status
        const statusMap = status.reduce((acc, item) => {
          acc[item.environment_id] = item.status;
          return acc;
        }, {});
        setEnvironmentStatus(statusMap);
      } catch (error) {
        console.error('Failed to fetch environment status:', error);
      }
    };

    fetchStatus();
    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchStatus, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Merge environment data with status data
  const enrichedEnvironments = environments.map(env => {
    const statusInfo = environmentStatus[env.environment_id];
    return {
      ...env,
      status: statusInfo || env.status // Fallback to original status if not found in view
    };
  });

  // Get pilot environments
  const pilotEnvironments = enrichedEnvironments.filter(env => env.type === 'pilot');
  const totalEnvironments = pilotEnvironments.length;

  // Calculate environment status counts
  const calculateStatusCounts = () => {
    return pilotEnvironments.reduce((acc, env) => {
      const status = env.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {
      Ready: 0,
      Booked: 0,
      'Requires Attention': 0
    });
  };

  // Get current active booking count (directly from environment status)
  const getCurrentBookingsCount = () => {
    return pilotEnvironments.filter(env => env.status === 'Booked').length;
  };

  const statusCounts = calculateStatusCounts();
  const currentBookingsCount = getCurrentBookingsCount();
  const utilizationRate = (statusCounts['Booked'] / totalEnvironments) * 100;

  // Status configuration for icons and colors
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Ready':
        return {
          color: '#4CAF50', // Green
          icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
        };
      case 'Booked':
        return {
          color: '#2196F3', // Blue
          icon: <AccessTimeIcon sx={{ fontSize: 16 }} />
        };
      case 'Requires Attention':
        return {
          color: '#FF9800', // Orange
          icon: <BuildIcon sx={{ fontSize: 16 }} />
        };
      default:
        return {
          color: '#757575', // Grey
          icon: <BuildIcon sx={{ fontSize: 16 }} />
        };
    }
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Environment Overview Card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a649 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircleIcon />
                <Typography variant="h6">Environment Overview</Typography>
              </Box>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {statusCounts['Ready'] || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Ready
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {statusCounts['Booked'] || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Booked
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {statusCounts['Requires Attention'] || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Attention
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Bookings Card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #2196F3 0%, #1e88e5 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EventAvailableIcon />
                <Typography variant="h6">Current Bookings</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1, fontWeight: 600 }}>
                {currentBookingsCount}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Active reservations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Utilization Rate Card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #FF9800 0%, #f57c00 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTimeIcon />
                <Typography variant="h6">Utilization Rate</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 1, fontWeight: 600 }}>
                {Math.round(utilizationRate)}%
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={utilizationRate}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white',
                      borderRadius: 4
                    }
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                  {statusCounts['Booked']} of {totalEnvironments} environments in use
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Environment Cards */}
      <Grid container spacing={2}>
        {pilotEnvironments.map(env => {
          const statusConfig = getStatusConfig(env.status);
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={env.environment_id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  borderLeft: `4px solid ${environmentColors[env.environment_id] || '#757575'}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      {env.name}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      flexDirection: 'column',  // Change to vertical arrangement
                      gap: 1  // Add spacing
                    }}>
                      <Chip
                        size="medium"  // Change to medium size
                        icon={statusConfig.icon}
                        label={env.status}
                        sx={{
                          backgroundColor: `${statusConfig.color}15`,
                          color: statusConfig.color,
                          height: '32px',  // Increase height
                          minWidth: '100px',  // Set minimum width
                          '& .MuiChip-icon': {
                            color: statusConfig.color
                          }
                        }}
                      />
                      <StatusToggleButton 
                        env={env}
                        onStatusChange={async (envId, newStatus) => {
                          try {
                            // Update status
                            await environmentService.updateEnvironmentStatus(envId, { manual_status: newStatus });
                            
                            // Refresh environment status immediately
                            const status = await environmentService.getAllEnvironments();
                            const statusMap = status.reduce((acc, item) => {
                              acc[item.environment_id] = item.status;
                              return acc;
                            }, {});
                            setEnvironmentStatus(statusMap);
                            
                            // Optional: Add a success toast
                            // toast.success('Status updated successfully');
                          } catch (error) {
                            console.error('Error updating status:', error);
                            // Optional: Add an error toast
                            // toast.error('Failed to update status');
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  {env.status === 'Booked' && env.current_booking && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Purpose: {env.current_booking.purpose}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        User: {users.find(u => u.user_id === env.current_booking.user_id)?.username}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}; 