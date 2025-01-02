import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Avatar
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { BookingForm } from './BookingForm';
import { socket } from '../../services/websocket';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL) + '/api';

// Use the same color mapping as Calendar
const ENVIRONMENT_COLORS = {
  1: '#4CAF50',
  2: '#2196F3',
  3: '#9C27B0',
  4: '#FF9800',
  5: '#E91E63',
  6: '#00BCD4',
  7: '#FF5722',
  8: '#8BC34A'
};

const styles = {
  bookingOwner: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mt: 1,
    color: 'text.secondary',
    '& .MuiAvatar-root': {
      width: 24,
      height: 24,
      fontSize: '0.875rem',
      bgcolor: 'primary.light'
    }
  }
};

// Global helper function
const getBookingUser = (booking, users) => {
  console.log('getBookingUser called with:', { booking, users });
  if (!booking || !users) return null;
  const user = users.find(u => u.user_id === booking.user_id);
  console.log('Found user:', user);
  return user;
};

export const StatusPanel = ({ environments, bookings, users, onBookingSubmit }) => {
  console.log('StatusPanel props:', { environments, bookings, users });
  const [selectedBooking, setSelectedBooking] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('realtime'); // 'realtime' or 'planned'
  const [dateRange, setDateRange] = useState([null, null]);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [tempDateRange, setTempDateRange] = useState(null);
  const [bookingFormEnv, setBookingFormEnv] = useState(null);
  const [localEnvironments, setLocalEnvironments] = useState(environments);
  const [localBookings, setLocalBookings] = useState(bookings);

  useEffect(() => {
    console.log('Setting up socket listeners');
    
    // Initial fetch
    fetchEnvironmentStatus();

    // Socket event listener for environment status updates
    const handleStatusUpdate = (updatedStatus) => {
      console.log('Received environment status update:', updatedStatus);
      setLocalEnvironments(updatedStatus);
    };

    // Socket event listener for booking updates
    const handleBookingUpdate = (updatedBookings) => {
      console.log('Received booking update:', updatedBookings);
      setLocalBookings(updatedBookings);
    };

    // Add socket listeners
    socket.on('environment-status-updated', handleStatusUpdate);
    socket.on('bookings-updated', handleBookingUpdate);

    // Cleanup function
    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('environment-status-updated', handleStatusUpdate);
      socket.off('bookings-updated', handleBookingUpdate);
    };
  }, []); // Empty dependency array

  const fetchEnvironmentStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/environmentstatus`);
      const data = await response.json();
      setLocalEnvironments(data);
    } catch (error) {
      console.error('Error fetching environment status:', error);
    }
  };

  const calculateNextAvailableDate = (bookings, environmentId) => {
    if (!bookings || bookings.length === 0) return null;

    const envBookings = bookings.filter(b => b.environment_id === environmentId);
    if (envBookings.length === 0) return null;

    // sortedBookings
    const sortedBookings = [...envBookings].sort((a, b) => 
      new Date(a.start_date) - new Date(b.start_date)
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // find the consecutive bookings starting from today
    let consecutiveEndDate = null;
    let previousEndDate = null;

    for (const booking of sortedBookings) {
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);

      // skip the bookings that have already passed
      if (endDate < today) continue;

      if (!previousEndDate) {
        // the first future booking
        if (startDate.getTime() === today.getTime()) {
          previousEndDate = endDate;
        } else {
          // the first booking is not today, which means today is available
          return today;
        }
      } else {
        // check if the booking is consecutive
        const nextDay = new Date(previousEndDate);
        nextDay.setDate(nextDay.getDate() + 1);

        if (startDate.getTime() === nextDay.getTime()) {
          // consecutive booking
          previousEndDate = endDate;
        } else {
          // find the gap, return the next day after the previous booking
          const nextAvailable = new Date(previousEndDate);
          nextAvailable.setDate(nextAvailable.getDate() + 1);
          return nextAvailable;
        }
      }
    }

    // if there is consecutive booking, return the next day after the last booking
    if (previousEndDate) {
      const nextAvailable = new Date(previousEndDate);
      nextAvailable.setDate(nextAvailable.getDate() + 1);
      return nextAvailable;
    }

    // if there is no future booking, return today
    return today;
  };

  const formatNextAvailable = (date) => {
    if (!date) return 'Not available';
    return format(date, 'MMM dd, yyyy');
  };

  const getEnvironmentStatus = (env) => {
    const now = new Date();
    const baseColor = ENVIRONMENT_COLORS[env.environment_id];

    // Get current booking
    const currentBooking = bookings.find(booking => {
      const startDate = startOfDay(new Date(booking.start_date));
      const endDate = endOfDay(new Date(booking.end_date));
      const currentDate = now;
      
      return booking.environment_id === env.environment_id && 
             currentDate >= startDate && 
             currentDate <= endDate;
    });

    // Get future bookings
    const futureBookings = bookings.filter(booking => 
      booking.environment_id === env.environment_id && 
      isAfter(new Date(booking.start_date), now)
    ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    switch (env.status) {
      case 'Booked':
        const nextAvailable = calculateNextAvailableDate(bookings, env.environment_id);
        return {
          status: 'Currently Booked',
          nextAvailable,
          booking: currentBooking,
          futureBookings,
          color: baseColor,
          statusColor: '#ff9800'
        };
      
      case 'Require Attention':
        return {
          status: 'Requires Attention',
          futureBookings,
          color: baseColor,
          statusColor: '#f44336'
        };
      
      case 'Ready':
      default:
        return {
          status: 'Ready',
          futureBookings,
          color: baseColor,
          statusColor: '#4caf50'
        };
    }
  };

  const isEnvironmentAvailable = (envId, startDate, endDate) => {
    const bookingsInRange = bookings.filter(booking => 
      booking.environment_id === envId &&
      !isBefore(new Date(booking.end_date), startDate) &&
      !isAfter(new Date(booking.start_date), endDate)
    );

    return bookingsInRange.length === 0;
  };

  const handleDateRangeChange = (event, field) => {
    const newDate = event.target.value;
    const newRange = [...dateRange];
    newRange[field === 'start' ? 0 : 1] = newDate ? new Date(newDate) : null;
    setDateRange(newRange);

    if (newRange[0] && newRange[1]) {
      setTempDateRange({
        start: startOfDay(newRange[0]),
        end: endOfDay(newRange[1])
      });
    }
  };

  const handleApply = () => {
    if (dateRange[0] && dateRange[1]) {
      setSelectedDateRange({
        start: startOfDay(dateRange[0]),
        end: endOfDay(dateRange[1])
      });
      setOpenDatePicker(false);
    }
  };

  const handleReselect = () => {
    setOpenDatePicker(true);
  };

  const getCurrentBookingOwner = (env) => {
    console.log('Environment status:', env.status);
    console.log('Current booking:', env.current_booking);
    
    if (env.status === 'Booked' && env.current_booking) {
      const owner = users.find(u => u.user_id === env.current_booking.user_id);
      console.log('Found owner:', owner);
      return owner;
    }
    return null;
  };

  const getBookingsForEnvironment = (env) => {
    const now = new Date();
    return bookings.filter(booking => 
      booking.environment_id === env.environment_id && 
      isAfter(new Date(booking.start_date), now)
    ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  };

  // Handle booking submission
  const handleBookingSubmit = async (bookingData) => {
    try {
      await onBookingSubmit(bookingData);
      setBookingFormEnv(null);  // Close the dialog first
    } catch (error) {
      console.error('Error submitting booking:', error);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6" sx={{ 
          color: '#1a237e',
          fontWeight: 600,
        }}>
          Environment Status Overview
        </Typography>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              setViewMode(newValue);
            }
          }}
          size="small"
        >
          <ToggleButton value="realtime">
            <Tooltip title="Real-time Status">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ViewListIcon sx={{ mr: 1 }} />
                Real-time
              </Box>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="planned">
            <Tooltip title="Planned Availability">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarMonthIcon sx={{ mr: 1 }} />
                Planned
              </Box>
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {viewMode === 'realtime' ? (
        // real-time status view
        <Grid container spacing={3}>
          {localEnvironments.map((env) => {
            const statusInfo = getEnvironmentStatus(env);
            console.log('Environment:', env);
            console.log('Status Info:', statusInfo);
            console.log('Current booking:', statusInfo.booking);
            
            // If there is a current booking, find the user
            const bookingOwner = statusInfo.booking ? 
              users.find(u => u.user_id === statusInfo.booking.user_id) : null;
            
            console.log('Booking owner:', bookingOwner);

            return (
              <Grid item xs={12} sm={6} md={4} key={env.environment_id}>
                <Tooltip
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Upcoming Bookings:
                      </Typography>
                      {statusInfo.futureBookings && statusInfo.futureBookings.length > 0 ? (
                        statusInfo.futureBookings.map((booking, index) => (
                          <Typography key={index} variant="body2" sx={{ 
                            mb: 0.5,
                            color: 'rgba(255, 255, 255, 0.9)'
                          }}>
                            {format(new Date(booking.start_date), 'MMM dd')} - {format(new Date(booking.end_date), 'MMM dd')}
                            : {booking.purpose || 'No purpose specified'}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2">No upcoming bookings</Typography>
                      )}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Card 
                    elevation={2}
                    onClick={() => {
                      setBookingFormEnv(env);
                    }}
                    sx={{
                      height: '100%',
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${statusInfo.color}08, ${statusInfo.color}15)`,
                      border: `1px solid ${statusInfo.color}40`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 4px 20px ${statusInfo.color}30`
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
                        <Typography variant="h6" sx={{ 
                          fontWeight: 500,
                          color: statusInfo.color
                        }}>
                          {env.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {console.log('Environment status:', env.status)}
                          {console.log('Status Info status:', statusInfo.status)}
                          {/* Change to use env.status === 'Booked' */}
                          {statusInfo.status === 'Currently Booked' && (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: 1,
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                              borderRadius: 1,
                              px: 1,
                              py: 0.5
                            }}>
                              <Avatar 
                                sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  fontSize: '0.75rem',
                                  bgcolor: statusInfo.color
                                }}
                              >
                                {getBookingUser(statusInfo.booking, users)?.username.charAt(0)}
                              </Avatar>
                              <Typography variant="caption" color="text.secondary">
                                {getBookingUser(statusInfo.booking, users)?.username}
                              </Typography>
                            </Box>
                          )}
                          <Chip
                            label={statusInfo.status}
                            sx={{
                              backgroundColor: `${statusInfo.statusColor}15`,
                              color: statusInfo.statusColor,
                              fontWeight: 500,
                              border: `1px solid ${statusInfo.statusColor}40`
                            }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        {statusInfo.status === 'Currently Booked' && (
                          <>
                            <AccessTimeIcon sx={{ mr: 1, color: statusInfo.statusColor }} />
                            <Typography variant="body2" color="text.secondary">
                              Next available: {formatNextAvailable(statusInfo.nextAvailable)}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                
                                // get the start date of the current time (remove the time part)
                                const now = new Date();
                                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                
                                const currentBooking = bookings.find(booking => {
                                  const startDate = new Date(booking.start_date);
                                  const endDate = new Date(booking.end_date);
                                  
                                  // use date comparison instead of specific time
                                  const bookingStartDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                                  const bookingEndDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                                  
                                  return booking.environment_id === env.environment_id && 
                                         bookingStartDay <= todayStart && 
                                         bookingEndDay >= todayStart;
                                });
                                
                                setSelectedBooking(currentBooking);
                              }}
                              sx={{ ml: 1 }}
                            >
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        // planned availability view
        <Box>
          {!selectedDateRange ? (
            <Card 
              onClick={() => setOpenDatePicker(true)}
              sx={{ 
                p: 4, 
                textAlign: 'center',
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%)',
                border: '1px solid rgba(145, 158, 171, 0.12)',
                boxShadow: '0 8px 16px 0 rgba(145, 158, 171, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px 0 rgba(145, 158, 171, 0.15)',
                  background: 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%)',
                }
              }}
            >
              <CalendarMonthIcon 
                sx={{ 
                  fontSize: 48, 
                  color: 'primary.main',
                  opacity: 0.7,
                  mb: 2,
                  transition: 'all 0.2s ease-in-out',
                  transform: openDatePicker ? 'scale(1.1)' : 'scale(1)'
                }} 
              />
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'text.primary',
                  mb: 1,
                  fontWeight: 600
                }}
              >
                Select Date Range
              </Typography>
              <Typography color="text.secondary">
                Click to choose dates for environment availability
              </Typography>
            </Card>
          ) : (
            <Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3 
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Environment Availability
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleReselect}
                  startIcon={<CalendarMonthIcon />}
                  size="small"
                >
                  Change Dates
                </Button>
              </Box>

              <Box sx={{ 
                mb: 3, 
                p: 2, 
                backgroundColor: '#f5f5f5', 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <CalendarMonthIcon color="primary" />
                <Typography>
                  {format(selectedDateRange.start, 'MMM dd, yyyy')} - {format(selectedDateRange.end, 'MMM dd, yyyy')}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {localEnvironments.map((env) => {
                  const isAvailable = isEnvironmentAvailable(
                    env.environment_id,
                    selectedDateRange.start,
                    selectedDateRange.end
                  );
                  
                  // get the conflicting bookings (if any)
                  const conflictingBookings = bookings.filter(booking => 
                    booking.environment_id === env.environment_id &&
                    !isBefore(new Date(booking.end_date), selectedDateRange.start) &&
                    !isAfter(new Date(booking.start_date), selectedDateRange.end)
                  );
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={env.environment_id}>
                      <Card 
                        elevation={0}
                        sx={{
                          height: '100%',
                          borderRadius: 2,
                          background: isAvailable 
                            ? 'linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 100%)'
                            : 'linear-gradient(135deg, #FFF3E0 0%, #FFFFFF 100%)',
                          border: `1px solid ${isAvailable ? '#81C784' : '#FFB74D'}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 24px 0 ${isAvailable 
                              ? 'rgba(129, 199, 132, 0.2)'
                              : 'rgba(255, 183, 77, 0.2)'
                            }`
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2
                          }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 600,
                              color: isAvailable ? '#2E7D32' : '#EF6C00'
                            }}>
                              {env.name}
                            </Typography>
                            <Chip
                              label={isAvailable ? "Available" : "Unavailable"}
                              sx={{
                                backgroundColor: isAvailable ? '#E8F5E9' : '#FFF3E0',
                                color: isAvailable ? '#2E7D32' : '#EF6C00',
                                fontWeight: 500,
                                border: `1px solid ${isAvailable ? '#81C784' : '#FFB74D'}`
                              }}
                            />
                          </Box>

                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Selected Period:
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: 'text.primary',
                              fontWeight: 500
                            }}>
                              {format(selectedDateRange.start, 'MMM dd, yyyy')} - {format(selectedDateRange.end, 'MMM dd, yyyy')}
                            </Typography>
                          </Box>

                          {!isAvailable && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Existing Bookings:
                              </Typography>
                              {conflictingBookings.map((booking, index) => (
                                <Typography 
                                  key={index} 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#EF6C00',
                                    fontSize: '0.875rem',
                                    mb: 0.5
                                  }}
                                >
                                  {format(new Date(booking.start_date), 'MMM dd')} - {format(new Date(booking.end_date), 'MMM dd')}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          <Dialog
            open={openDatePicker}
            onClose={() => {
              setOpenDatePicker(false);
              setTempDateRange(null);
              if (selectedDateRange) {
                setDateRange([selectedDateRange.start, selectedDateRange.end]);
              } else {
                setDateRange([null, null]);
              }
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ 
              borderBottom: '1px solid #eee',
              pb: 2
            }}>
              Select Date Range
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', pt: 1 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateRangeChange(e, 'start')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: format(new Date(), 'yyyy-MM-dd')
                  }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={dateRange[1] ? format(dateRange[1], 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateRangeChange(e, 'end')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
                  }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
              <Button 
                onClick={() => {
                  setOpenDatePicker(false);
                  setTempDateRange(null);
                  if (selectedDateRange) {
                    setDateRange([selectedDateRange.start, selectedDateRange.end]);
                  } else {
                    setDateRange([null, null]);
                  }
                }}
                color="inherit"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApply}
                variant="contained"
                disabled={!dateRange[0] || !dateRange[1]}
              >
                Apply
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* Booking Details Dialog */}
      <Dialog 
        open={Boolean(selectedBooking)} 
        onClose={() => setSelectedBooking(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #eee',
          pb: 2
        }}>
          Booking Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedBooking && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Environment
                </Typography>
                <Typography variant="body1">
                  {localEnvironments.find(e => e.environment_id === selectedBooking.environment_id)?.name}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Booked By
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Avatar 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      fontSize: '0.75rem',
                      bgcolor: ENVIRONMENT_COLORS[selectedBooking.environment_id]
                    }}
                  >
                    {getBookingUser(selectedBooking, users)?.username.charAt(0)}
                  </Avatar>
                  <Typography variant="body1">
                    {getBookingUser(selectedBooking, users)?.username}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body1">
                  {format(new Date(selectedBooking.start_date), 'MMM dd, yyyy')}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  End Date
                </Typography>
                <Typography variant="body1">
                  {format(new Date(selectedBooking.end_date), 'MMM dd, yyyy')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Purpose
                </Typography>
                <Typography variant="body1">
                  {selectedBooking.purpose || 'Not specified'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
          <Button 
            onClick={() => setSelectedBooking(null)}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={Boolean(bookingFormEnv)} 
        onClose={() => setBookingFormEnv(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #eee',
          pb: 2
        }}>
          Book Environment: {bookingFormEnv?.name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {bookingFormEnv && (  // Add condition check
            <BookingForm 
              environments={[bookingFormEnv]}
              bookings={bookings}
              onSubmit={handleBookingSubmit}
              defaultEnvironment={bookingFormEnv}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};