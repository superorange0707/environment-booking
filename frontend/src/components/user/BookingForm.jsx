import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Snackbar,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/material/styles';
import { addDays, isWithinInterval, isBefore, startOfDay, endOfDay, isAfter, isEqual } from 'date-fns';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  borderRadius: 12,
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  }
}));

const FormContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3)
}));

export function BookingForm({ environments, bookings, onSubmit, defaultEnvironment }) {
  const [formData, setFormData] = useState({
    environment_id: '',
    start_date: null,
    end_date: null,
    purpose: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [error, setError] = useState('');
  const [bookedRanges, setBookedRanges] = useState([]);

  // Get current date and time
  const now = new Date();

  // Update booked ranges when environment or bookings change
  useEffect(() => {
    if (formData.environment_id) {
      const environmentBookings = bookings.filter(
        booking => booking.environment_id === parseInt(formData.environment_id)
      );
      
      const ranges = environmentBookings.map(booking => ({
        start: startOfDay(new Date(booking.start_date)),
        end: endOfDay(new Date(booking.end_date))
      }));
      
      setBookedRanges(ranges);
    } else {
      setBookedRanges([]);
    }
  }, [formData.environment_id, bookings]);

  // Simplified date validation
  const isDateDisabled = (date) => {
    const currentDate = startOfDay(now);
    
    // Disable past dates
    if (isBefore(date, currentDate)) {
      return true;
    }


    if (formData.environment_id) {
      const environmentBookings = bookings.filter(
        booking => booking.environment_id === parseInt(formData.environment_id)
      );

      return environmentBookings.some(booking => {
        const bookingStart = startOfDay(new Date(booking.start_date));
        const bookingEnd = endOfDay(new Date(booking.end_date));
        return isWithinInterval(date, { start: bookingStart, end: bookingEnd });
      });
    }

    return false;
  };

  // Simplified end date validation
  const isEndDateDisabled = (date) => {
    if (!formData.start_date) return true;
    
    // Disable dates before start date
    if (isBefore(date, formData.start_date)) {
      return true;
    }

    if (formData.environment_id) {
      const environmentBookings = bookings.filter(
        booking => booking.environment_id === parseInt(formData.environment_id)
      ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

      // Find the next booking after the selected start date
      const nextBooking = environmentBookings.find(booking => 
        isAfter(startOfDay(new Date(booking.start_date)), formData.start_date)
      );

      if (nextBooking) {
        return isAfter(date, startOfDay(new Date(nextBooking.start_date))) ||
               isEqual(date, startOfDay(new Date(nextBooking.start_date)));
      }
    }

    return false;
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Enhanced date range validation
  const isDateRangeValid = (start, end, environmentId) => {
    if (!start || !end || !environmentId) return false;

    // Check if the start date is not in the past
    const currentDate = startOfDay(now);
    if (isBefore(startOfDay(start), currentDate)) {
      return false;
    }

    //add: check if end date is earlier than start date
    if (isBefore(end, start)) {
      setError('End date cannot be earlier than start date');
      return false;
    }

    const environmentBookings = bookings.filter(
      booking => booking.environment_id === parseInt(environmentId)
    );

    // Special handling for same-day bookings (today only)
    if (isEqual(startOfDay(start), startOfDay(now)) && 
        isEqual(startOfDay(start), startOfDay(end))) {
      
      const hasSameDayBooking = environmentBookings.some(booking => 
        isEqual(startOfDay(new Date(booking.start_date)), startOfDay(now)) ||
        isEqual(startOfDay(new Date(booking.end_date)), startOfDay(now))
      );

      return !hasSameDayBooking;
    }

    // Regular date range validation for other dates
    for (const booking of environmentBookings) {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);

      const hasOverlap = 
        isWithinInterval(bookingStart, { start, end }) ||
        isWithinInterval(bookingEnd, { start, end }) ||
        isWithinInterval(start, { start: bookingStart, end: bookingEnd }) ||
        isWithinInterval(end, { start: bookingStart, end: bookingEnd }) ||
        (isBefore(start, bookingStart) && isAfter(end, bookingEnd));

      if (hasOverlap) {
        return false;
      }
    }

    return true;
  };

  // Add a timer to automatically hide the notification
  useEffect(() => {
    let timer;
    if (notification.open) {
      timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, open: false }));
      }, 3000); // Hide after 3 seconds
    }
    return () => clearTimeout(timer);
  }, [notification.open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.environment_id || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const start = startOfDay(formData.start_date);
    const end = endOfDay(formData.end_date);

    if (!isDateRangeValid(start, end, formData.environment_id)) {
      setError('Selected dates conflict with existing bookings');
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({
        environment_id: '',
        start_date: null,
        end_date: null,
        purpose: ''
      });
      setNotification({
        open: true,
        message: '🎉 Booking created successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to create booking',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if the environment is available (not in maintenance status)
  const isEnvironmentAvailable = (env) => {
    return env.status !== 'Maintenance' && env.manual_status !== 'Maintenance';
  };

  // Add environment color mapping
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

  return (
    <StyledCard>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Create New Booking
        </Typography>

        <FormContainer component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Environment</InputLabel>
            <Select
              value={formData.environment_id}
              label="Environment"
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  environment_id: e.target.value,
                  // Reset dates when environment changes
                  start_date: null,
                  end_date: null
                }));
              }}
              required
            >
              {environments.map((env) => (
                <MenuItem 
                  key={env.environment_id} 
                  value={env.environment_id}
                  disabled={!isEnvironmentAvailable(env)}  // Disable environments in maintenance
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    opacity: isEnvironmentAvailable(env) ? 1 : 0.5,
                    '&.Mui-disabled': {
                      // Add visual indication for maintenance status
                      '&::after': {
                        content: '"(Maintenance)"',
                        fontSize: '0.75rem',
                        color: 'error.main',
                        marginLeft: 1
                      }
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: environmentColors[env.environment_id]
                    }}
                  />
                  {env.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <DatePicker
            label="Start Date"
            value={formData.start_date}
            onChange={(newValue) => {
              setFormData(prev => ({
                ...prev,
                start_date: newValue ? startOfDay(newValue) : null,
                end_date: null // Reset end date when start date changes
              }));
            }}
            shouldDisableDate={isDateDisabled}
            minDate={startOfDay(now)}
            slotProps={{ 
              textField: { 
                fullWidth: true,
                required: true,
                sx: { backgroundColor: 'background.paper' }
              } 
            }}
          />

          <DatePicker
            label="End Date"
            value={formData.end_date}
            onChange={(newValue) => setFormData(prev => ({
              ...prev,
              end_date: newValue ? endOfDay(newValue) : null
            }))}
            shouldDisableDate={isEndDateDisabled}
            minDate={formData.start_date || startOfDay(now)}
            disabled={!formData.start_date}
            slotProps={{ 
              textField: { 
                fullWidth: true,
                required: true,
                sx: { backgroundColor: 'background.paper' }
              } 
            }}
          />

          <TextField
            fullWidth
            label="Booking Purpose"
            multiline
            rows={4}
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            sx={{ backgroundColor: 'background.paper' }}
          />

          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
            fullWidth
            sx={{ 
              mt: 2,
              height: 48,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Create Booking'
            )}
          </Button>

          <Box
            sx={{
              height: notification.open ? '80px' : '0px',  
              overflow: 'hidden',  
              mt: notification.open ? 2 : 0,  
              transition: 'all 0.3s ease-in-out'
            }}
          >
            <Alert 
              severity={notification.severity}
              variant="filled"
              onClose={handleCloseNotification}
              sx={{
                borderRadius: 2,
                animation: notification.open ? 'slideIn 0.3s ease-out' : 'none',  
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                opacity: notification.open ? 1 : 0, 
                '& .MuiAlert-message': {
                  fontSize: '0.95rem',
                  py: 0.5
                },
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                },
                '@keyframes slideIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(-10px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)'
                  }
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {notification.message}
              </Box>
            </Alert>
          </Box>
        </FormContainer>
      </CardContent>
    </StyledCard>
  );
}