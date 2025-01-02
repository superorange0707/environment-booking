import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Tooltip,
  Button,
} from '@mui/material';
import { Calendar } from './Calendar';
import { BookingForm } from './BookingForm';
import { FilterSection } from './FilterSection';
import { StatusPanel } from './StatusPanel';

export function UserDashboard() {
  const [environments, setEnvironments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    specificEnvironment: 'all'
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [environmentsRes, bookingsRes, usersRes] = await Promise.all([
          api.get(endpoints.environments),
          api.get(endpoints.bookings),
          api.get(endpoints.users)
        ]);

        const pilotEnvironments = environmentsRes.data.filter(env => env.type === 'pilot');
        
        setEnvironments(pilotEnvironments);
        setBookings(bookingsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];

    return bookings.filter(booking => {
      if (filters.specificEnvironment !== 'all') {
        return booking.environment_id === Number(filters.specificEnvironment);
      }
      return true;
    });
  }, [bookings, filters.specificEnvironment]);

  const handleBookingSubmit = async (bookingData) => {
    try {
      const response = await api.post(endpoints.bookings, bookingData);
      setBookings(prevBookings => [...prevBookings, response.data]);
      return response.data;
    } catch (err) {
      console.error('Error creating booking:', err);
      throw new Error('Failed to create booking');
    }
  };

  const handleBookClick = (environment) => {
    console.log('Book clicked for environment:', environment);
  };

  // Add debug logging
  useEffect(() => {
    console.log('Environments:', environments);
    console.log('Bookings:', bookings);
  }, [environments, bookings]);

  // sort environments by environment_id
  const sortedEnvironments = [...environments].sort((a, b) => a.environment_id - b.environment_id);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" color="error.main">
        {error}
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        bgcolor: '#f5f5f5', 
        minHeight: '100vh',
        pt: 3,         // Top padding
        px: 3,         // Horizontal padding
        pb: 8,         // Increased bottom padding (from 6 to 8)
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={3} sx={{ mb: 4 }}> {/* Added margin bottom to the main Grid container */}
          {/* Status Panel - Top Section */}
          <Grid item xs={12}>
            <Card sx={{ boxShadow: 2 }}>
              <CardContent sx={{ p: 3 }}>
                {environments && bookings ? (
                  <StatusPanel 
                    environments={environments}
                    bookings={bookings}
                  />
                ) : (
                  <Typography>Loading status panel...</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content Area */}
          <Grid container item xs={12} spacing={3}>
            {/* Calendar Section - Left Side */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 2
              }}>
                <CardContent sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  p: 3,
                  pb: 4, // Added bottom padding inside card
                }}>
                  {/* Filter Section */}
                  <FilterSection 
                    filters={filters} 
                    onFilterChange={setFilters}
                    environments={environments}
                  />

                  {/* Calendar Container with bottom margin */}
                  <Box sx={{ 
                    flex: 1,
                    minHeight: '700px',
                    mb: 4, // Added margin bottom
                    '& .fc': {
                      height: '100%'
                    },
                    '& .fc-view-harness': {
                      mb: 3 // Added margin to calendar view
                    },
                    '& .fc-header-toolbar': {
                      mb: 2 // Adjusted toolbar spacing
                    }
                  }}>
                    <Calendar 
                      bookings={filteredBookings}
                      environments={environments}
                      users={users}
                      selectedEnvironment={filters.specificEnvironment}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Booking Form Section - Right Side */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ 
                position: { lg: 'sticky' },
                top: { lg: '24px' },
                boxShadow: 2,
                mb: { xs: 4, lg: 0 } // Added bottom margin on mobile
              }}>
                <CardContent sx={{
                  p: 3,
                  maxHeight: { lg: 'calc(100vh - 180px)' }, // Adjusted max height
                  overflow: 'auto'
                }}>
                  <Typography variant="h6" gutterBottom>
                    Book Environment
                  </Typography>
                  <Tooltip title={isLoggedIn ? "" : "Please log in to create a booking."}>
                    <span>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        disabled={!isLoggedIn} // Disable button if not logged in
                        onClick={isLoggedIn ? handleLogout : handleLogin}
                      >
                        {isLoggedIn ? 'Logout' : 'Login'}
                      </Button>
                    </span>
                  </Tooltip>
                  <BookingForm 
                    environments={environments}
                    bookings={bookings}
                    onSubmit={handleBookingSubmit}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 