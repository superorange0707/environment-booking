import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container,
  Grid,
  Paper,
  Button,
  Switch,
  CircularProgress,
  FormControlLabel
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import { Calendar } from './components/user/Calendar';
import { BookingForm } from './components/user/BookingForm';
import { FilterSection } from './components/user/FilterSection';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StatusPanel } from './components/user/StatusPanel';
import { userService, environmentService, bookingService } from './services/api';
import { socket as websocketService } from './services/websocket';
import { authService } from './services/auth';
import { OAuthCallback } from './components/OAuthCallback';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    users: [],
    environments: [],
    bookings: []
  });
  const [filters, setFilters] = useState({
    environmentType: 'all',
    environment: 'all',
    status: 'all'
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data...');
        const [users, environments, bookings] = await Promise.all([
          userService.getAllUsers(),
          environmentService.getAllEnvironments(),
          bookingService.getAllBookings()
        ]);
        
        console.log('Raw API Response:', { users, environments, bookings });

        // Filter and sort pilot environments
        const pilotEnvironments = environments
          .filter(env => env.type === 'pilot')
          .sort((a, b) => a.environment_id - b.environment_id);
        
        // Format booking data to ensure correct dates
        const formattedBookings = bookings.map(booking => ({
          booking_id: booking.booking_id,
          environment_id: booking.environment_id,
          user_id: booking.user_id,
          start_date: new Date(booking.start_date),
          end_date: new Date(booking.end_date),
          purpose: booking.purpose,
          status: booking.status,
          created_at: booking.created_at,
          last_updated: booking.last_updated,
          // Add environment name for display
          environment_name: pilotEnvironments.find(
            env => env.environment_id === booking.environment_id
          )?.name || 'Unknown'
        }));

        console.log('Formatted Data:', {
          users,
          environments: pilotEnvironments,
          bookings: formattedBookings
        });

        setData({
          users,
          environments: pilotEnvironments,
          bookings: formattedBookings
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter environments based on selected criteria
  const filteredEnvironments = useMemo(() => {
    return data.environments.filter(env => {
      if (filters.environmentType !== 'all' && env.type !== filters.environmentType) {
        return false;
      }
      if (filters.environment !== 'all' && env.environment_id !== parseInt(filters.environment)) {
        return false;
      }
      if (filters.status !== 'all' && env.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [filters, data.environments]);

  // Filter bookings based on filtered environments
  const filteredBookings = useMemo(() => {
    const filteredEnvIds = filteredEnvironments.map(env => env.environment_id);
    const filtered = data.bookings.filter(booking => 
      filteredEnvIds.includes(booking.environment_id)
    );
    console.log('Filtered Bookings:', filtered);
    return filtered;
  }, [filteredEnvironments, data.bookings]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleLogout = () => {
    authService.logout();
  };

  const handleLogin = () => {
    authService.login();
  };

  const refreshData = async () => {
    try {
      const [environments, bookings, users] = await Promise.all([
        environmentService.getAllEnvironments(),
        bookingService.getAllBookings(),
        userService.getAllUsers()
      ]);
      
      console.log('Refreshed bookings:', bookings); // Debug log
      
      setData({
        environments,
        bookings,
        users
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleBookingSubmit = async (bookingData) => {
    if (!user) {
      alert('Please login to make a booking');
      handleLogin();
      return;
    }

    try {
      console.log('Creating booking with data:', {
        ...bookingData,
        user_id: user.user_id
      });

      const createdBooking = await bookingService.createBooking(bookingData);
      console.log('Created booking:', createdBooking);
      
      await fetchData(); // Refresh all data after successful booking

      return createdBooking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error(`Failed to create booking: ${error.message}`);
    }
  };

  const handleBookingCancel = async (bookingId) => {
    try {
      // Update the booking status to Cancelled
      await bookingService.updateBooking(bookingId, { status: 'Cancelled' });
      
      // Refresh all data
      const [environments, bookings] = await Promise.all([
        environmentService.getAllEnvironments(),
        bookingService.getAllBookings()
      ]);

      // Update state
      setData(prev => ({
        ...prev,
        environments,
        bookings
      }));

      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw new Error('Failed to cancel booking');
    }
  };

  // Connect to WebSocket when component mounts
  useEffect(() => {
    const handleBookingsUpdate = (bookings) => {
      setData(prevData => ({
        ...prevData,
        bookings: bookings
      }));
    };

    const handleEnvironmentStatusUpdate = (environmentId, newStatus) => {
      setData(prevData => ({
        ...prevData,
        environments: prevData.environments.map(env =>
          env.environment_id === environmentId ? { ...env, status: newStatus } : env
        )
      }));
    };

    websocketService.on('bookings-updated', handleBookingsUpdate);
    websocketService.on('environment-status-updated', handleEnvironmentStatusUpdate);

    return () => {
      websocketService.off('bookings-updated', handleBookingsUpdate);
      websocketService.off('environment-status-updated', handleEnvironmentStatusUpdate);
    };
  }, []);

  // Separate auth loading from data loading
  useEffect(() => {
    const handleAuthUpdate = (event) => {
      const userInfo = event.detail;
      setUser(userInfo);
      setIsAdmin(userInfo.role === 'admin');
    };

    window.addEventListener('auth-update', handleAuthUpdate);

    return () => {
      window.removeEventListener('auth-update', handleAuthUpdate);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchData();
      } finally {
        setInitialLoading(false);
      }

      if (authService.isAuthenticated()) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user'));
          if (storedUser) {
            setUser(storedUser);
            // Only enable admin mode if user has admin role
            setIsAdmin(storedUser.role === 'admin' ? true : false);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          authService.logout();
        }
      }
    };

    init();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      const [users, environments, bookings] = await Promise.all([
        userService.getAllUsers(),
        environmentService.getAllEnvironments(),
        bookingService.getAllBookings()
      ]);
      
      // Filter and sort pilot environments
      const pilotEnvironments = environments
        .filter(env => env.type === 'pilot')
        .sort((a, b) => a.environment_id - b.environment_id);
      
      // Format booking data
      const formattedBookings = bookings.map(booking => ({
        ...booking,
        start_date: new Date(booking.start_date),
        end_date: new Date(booking.end_date),
        environment_name: pilotEnvironments.find(
          env => env.environment_id === booking.environment_id
        )?.name || 'Unknown'
      }));

      setData({
        users,
        environments: pilotEnvironments,
        bookings: formattedBookings
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleEnvironmentUpdate = async (updatedEnv) => {
    try {
      await environmentService.updateEnvironment(updatedEnv.id, updatedEnv);
      await fetchData(); // Refresh data after update
    } catch (error) {
      console.error('Error updating environment:', error);
      throw error;
    }
  };

  const handleBookingUpdate = async (updatedBooking) => {
    try {
      await bookingService.updateBooking(updatedBooking.id, updatedBooking);
      await fetchData(); // Refresh data after update
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  };

  // Modify the admin switch handler
  const handleAdminModeToggle = (e) => {
    // Only allow switching if user has admin role
    if (user?.role === 'admin') {
      setIsAdmin(e.target.checked);
    }
  };

  if (initialLoading) {
    return <CircularProgress />;
  }

  return (
    <Router>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Routes>
          <Route path="/callback" element={<OAuthCallback />} />
          <Route path="/" element={
            <Box sx={{ backgroundColor: '#f5f5f7', minHeight: '100vh', pb: 8 }}>
              <AppBar position="static" sx={{ 
                mb: 3,
                background: 'linear-gradient(145deg, #1976d2, #1565c0)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
              }}>
                <Toolbar sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: { xs: 2, sm: 4 }
                }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    Environment Booking System
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {user ? (
                      <>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isAdmin}
                              onChange={handleAdminModeToggle}
                              // Only enable the switch if user has admin role
                              disabled={user?.role !== 'admin'}
                            />
                          }
                          label={isAdmin ? "Admin Mode" : "User Mode"}
                          sx={{ color: 'white' }}
                        />
                        <Typography sx={{ color: 'white' }}>{user.username}</Typography>
                        <Button 
                          color="inherit"
                          onClick={handleLogout}
                          startIcon={<LogoutIcon />}
                        >
                          Logout
                        </Button>
                      </>
                    ) : (
                      <Button 
                        color="inherit"
                        onClick={handleLogin}
                      >
                        Login with OpenShift
                      </Button>
                    )}
                  </Box>
                </Toolbar>
              </AppBar>

              <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
                <Typography variant="h4" gutterBottom>
                  {isAdmin ? 'Admin Dashboard' : 'User Dashboard'}
                </Typography>
                
                {isAdmin && user ? (
                  <AdminDashboard 
                    data={data}
                    onEnvironmentUpdate={handleEnvironmentUpdate}
                    onBookingUpdate={handleBookingUpdate}
                    onBookingsChange={fetchData}
                    onCancelBooking={handleBookingCancel}
                  />
                ) : (
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Status Panel */}
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 3, mb: 2 }}>
                        <StatusPanel 
                          environments={data.environments}
                          bookings={data.bookings}
                          users={data.users}
                          onBookingSubmit={handleBookingSubmit}
                          isAdmin={isAdmin}
                          isAuthenticated={!!user}
                        />
                      </Paper>
                    </Grid>

                    <Grid container item xs={12} spacing={3}>
                      {/* Calendar Section with Integrated Filters */}
                      <Grid item xs={12} md={9}>
                        <Paper elevation={0} sx={{ p: 3 }}>
                          <Box sx={{ mb: 3 }}>
                            <FilterSection 
                              filters={filters}
                              onFilterChange={handleFilterChange}
                              environments={data.environments}
                            />
                          </Box>
                          <Calendar 
                            bookings={filteredBookings}
                            environments={data.environments}
                            users={data.users}
                            isAuthenticated={!!user}
                            onBookingClick={(booking) => {
                              if (!user) {
                                alert('Please login to interact with bookings');
                                handleLogin();
                              }
                            }}
                          />
                        </Paper>
                      </Grid>

                      {/* Booking Form Section */}
                      <Grid item xs={12} md={3}>
                        <Paper elevation={0} sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            Book Environment
                          </Typography>
                          <BookingForm 
                            environments={filteredEnvironments}
                            bookings={data.bookings}
                            onSubmit={handleBookingSubmit}
                            disabled={!user}
                            loginPrompt={
                              !user && (
                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Please login to make a booking
                                  </Typography>
                                  <Button 
                                    variant="outlined" 
                                    size="small" 
                                    onClick={handleLogin}
                                  >
                                    Login
                                  </Button>
                                </Box>
                              )
                            }
                          />
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              </Container>
            </Box>
          } />
        </Routes>
      </LocalizationProvider>
    </Router>
  );
}

export default App;
