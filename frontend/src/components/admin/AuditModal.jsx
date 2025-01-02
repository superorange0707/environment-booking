import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export function AuditModal({ 
  open, 
  onClose, 
  environments, 
  selectedEnvironmentId,
  bookings,
  users,
  isFullView 
}) {
  const [filterEnvironmentId, setFilterEnvironmentId] = useState(selectedEnvironmentId || 'all');

  // Add environment color mapping
  const environmentColors = {
    1: '#4CAF50',
    2: '#2196F3',
    3: '#9C27B0',
    4: '#FF9800',
    5: '#E91E63',
    6: '#00BCD4',
    7: '#FF5722',
    8: '#8BC34A'
  };

  const getBookingStatus = (booking) => {
    const now = new Date();
    const endDate = new Date(booking.end_date);
    const startDate = new Date(booking.start_date);
    
    if (now > endDate) {
      return 'Completed';
    } else if (now < startDate) {
      return 'Upcoming';
    } else {
      return 'In Progress';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Typography variant="h6">
            {isFullView ? 'All Audit Logs' : 'Environment Audit Log'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Environment Filter - Only show in full view */}
        {isFullView && (
          <FormControl 
            fullWidth 
            size="small" 
            sx={{ mb: 3 }}
          >
            <InputLabel>Filter by Environment</InputLabel>
            <Select
              value={filterEnvironmentId}
              label="Filter by Environment"
              onChange={(e) => setFilterEnvironmentId(e.target.value)}
            >
              <MenuItem value="all">All Environments</MenuItem>
              {environments
                .filter(env => env.type === 'pilot')
                .map(env => (
                  <MenuItem 
                    key={env.environment_id} 
                    value={env.environment_id}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1 
                    }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: environmentColors[env.environment_id],
                          flexShrink: 0
                        }}
                      />
                      {env.name}
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

        {/* Audit Log List */}
        <List>
          {bookings
            .filter(booking => {
              if (!isFullView) {
                return booking.environment_id === selectedEnvironmentId;
              }
              return filterEnvironmentId === 'all' || booking.environment_id === filterEnvironmentId;
            })
            .map((booking, index) => {
              const environment = environments.find(
                env => env.environment_id === booking.environment_id
              );
              const user = users.find(
                u => u.user_id === booking.user_id
              );
              const bookingStatus = getBookingStatus(booking);

              return (
                <React.Fragment key={booking.booking_id}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      mb: 0.5
                    }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: environmentColors[environment?.environment_id],
                          flexShrink: 0
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {environment?.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Booked by {user?.username} for {booking.purpose}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      From {new Date(booking.start_date).toLocaleDateString()} to{' '}
                      {new Date(booking.end_date).toLocaleDateString()}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: bookingStatus === 'Completed' ? 'success.main' : 
                               bookingStatus === 'In Progress' ? 'primary.main' : 
                               'info.main',
                        mt: 0.5
                      }}
                    >
                      {bookingStatus}
                    </Typography>
                  </ListItem>
                </React.Fragment>
              );
            })}
        </List>
      </DialogContent>
    </Dialog>
  );
} 