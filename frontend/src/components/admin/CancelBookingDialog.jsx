import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';

export function CancelBookingDialog({ 
  open, 
  onClose, 
  onConfirm, 
  booking, 
  environments, 
  users,
  isLoading = false 
}) {
  if (!booking) return null;

  const environment = environments.find(e => e.environment_id === booking.environment_id);
  const user = users.find(u => u.user_id === booking.user_id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Cancel Booking
        </Typography>
        <IconButton onClick={onClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          This action cannot be undone. The booking will be deleted and the environment will be marked as available.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ComputerIcon color="primary" />
            <Typography>
              <strong>Environment:</strong> {environment?.name}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            <Typography>
              <strong>User:</strong> {user?.username}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon color="primary" />
            <Typography>
              <strong>Duration:</strong><br />
              {new Date(booking.start_date).toLocaleString()} - {new Date(booking.end_date).toLocaleString()}
            </Typography>
          </Box>

          <Divider />

          <Typography>
            <strong>Purpose:</strong><br />
            {booking.purpose}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={isLoading}
          sx={{
            minWidth: 100,
            '&.Mui-disabled': {
              backgroundColor: 'error.main',
              opacity: 0.5
            }
          }}
        >
          {isLoading ? 'Processing...' : 'Confirm Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 