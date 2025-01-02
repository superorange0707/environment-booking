import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  Divider,
  Tooltip,
  useTheme
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { StatusPanel } from './StatusPanel';
import { AdminCalendar } from './AdminCalendar';
import { AuditModal } from './AuditModal';
import { CancelBookingDialog } from './CancelBookingDialog';
import { bookingService } from '../../services/api';

export function AdminDashboard({ environments, bookings, users, onBookingsChange }) {
  const theme = useTheme();
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState(null);
  const [isFullAuditView, setIsFullAuditView] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = (error) => {
    setError(error.message || 'An error occurred');
    setTimeout(() => setError(''), 5000);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 5000);
  };

  const handleAuditClick = (environmentId) => {
    setSelectedEnvironmentId(environmentId);
    setAuditModalOpen(true);
  };

  const handleExport = () => {
    try {
      // Create the CSV data
      const headers = [
        'Booking ID',
        'Environment',
        'User',
        'Start Date',
        'End Date',
        'Purpose',
        'Status'
      ];

      const csvData = bookings.map(booking => {
        const environment = environments.find(env => env.environment_id === booking.environment_id);
        const user = users.find(u => u.user_id === booking.user_id);
        
        return [
          booking.booking_id,
          environment?.name || 'Unknown Environment',
          user?.username || 'Unknown User',
          new Date(booking.start_date).toLocaleDateString(),
          new Date(booking.end_date).toLocaleDateString(),
          booking.purpose,
          booking.status
        ];
      });

      // Convert to CSV string
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      handleError(error);
    }
  };

  const handleCancelBooking = async () => {
    setIsLoading(true);
    try {
      await bookingService.cancelBooking(cancelBookingId);
      showNotification('Booking cancelled successfully');
      setCancelBookingId(null);
      
      if (onBookingsChange) {
        await onBookingsChange();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        py: 4
      }}
    >
      <Container maxWidth="xl">
        {/* Notifications */}
        <Stack spacing={2} sx={{ mb: 4 }}>
          {error && (
            <Alert 
              severity="error"
              sx={{ 
                borderRadius: 2,
                boxShadow: theme.shadows[2]
              }}
            >
              {error}
            </Alert>
          )}
          {notification && (
            <Alert 
              severity="success"
              sx={{ 
                borderRadius: 2,
                boxShadow: theme.shadows[2]
              }}
            >
              {notification}
            </Alert>
          )}
        </Stack>

        {/* Header Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: theme.palette.background.paper,
            boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage environments, bookings and view audit logs
            </Typography>
          </Box>
          <Stack 
            direction="row" 
            spacing={2} 
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Tooltip title="Export Bookings">
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                    borderColor: theme.palette.primary.light
                  }
                }}
              >
                Export
              </Button>
            </Tooltip>
            <Tooltip title="View Audit Logs">
              <Button
                variant="contained"
                startIcon={<AssessmentIcon />}
                onClick={() => {
                  setSelectedEnvironmentId(null);
                  setIsFullAuditView(true);
                  setAuditModalOpen(true);
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark
                  }
                }}
              >
                Audit Logs
              </Button>
            </Tooltip>
          </Stack>
        </Paper>

        {/* Main Content */}
        <Grid container spacing={4}>
          {/* Status Panel */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)'
              }}
            >
              <StatusPanel 
                environments={environments}
                bookings={bookings}
                users={users}
              />
            </Paper>
          </Grid>

          {/* Calendar Section */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                background: theme.palette.background.paper,
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)'
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Booking Calendar
                </Typography>
                <AdminCalendar
                  bookings={bookings}
                  environments={environments}
                  users={users}
                  onAuditClick={(envId) => {
                    setSelectedEnvironmentId(envId);
                    setIsFullAuditView(false);
                    setAuditModalOpen(true);
                  }}
                  onCancelBooking={setCancelBookingId}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Modals */}
        <AuditModal
          open={auditModalOpen}
          onClose={() => {
            setAuditModalOpen(false);
            setSelectedEnvironmentId(null);
            setIsFullAuditView(false);
          }}
          environments={environments}
          selectedEnvironmentId={selectedEnvironmentId}
          bookings={bookings}
          users={users}
          isFullView={isFullAuditView}
        />

        <CancelBookingDialog
          open={!!cancelBookingId}
          onClose={() => setCancelBookingId(null)}
          onConfirm={handleCancelBooking}
          booking={bookings.find(b => b.booking_id === cancelBookingId)}
          environments={environments}
          users={users}
          isLoading={isLoading}
        />
      </Container>
    </Box>
  );
} 