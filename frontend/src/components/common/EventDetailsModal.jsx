import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Divider,
  Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export function EventDetailsModal({ open, onClose, event, users, environments }) {
  if (!event) return null;

  const user = users.find(u => u.user_id === event.user_id);
  const environment = environments.find(e => e.environment_id === event.environment_id);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const InfoSection = ({ icon, title, content }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
      <Box
        sx={{
          backgroundColor: 'primary.main',
          borderRadius: '50%',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {React.cloneElement(icon, { sx: { color: 'white', fontSize: 20 } })}
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1">
          {content}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {/* Header */}
        <Box 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            p: 3,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Booking Details
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {formatDate(event.start_date)} - {formatDate(event.end_date)}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white'
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* User Info */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main',
                    width: 56,
                    height: 56
                  }}
                >
                  {user?.username?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {user?.username || 'Unknown User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Booking Owner
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Environment */}
            <Grid item xs={12}>
              <InfoSection 
                icon={<BusinessIcon />}
                title="Environment"
                content={environment?.name || 'Unknown Environment'}
              />
            </Grid>

            {/* Purpose */}
            <Grid item xs={12}>
              <InfoSection 
                icon={<DescriptionIcon />}
                title="Purpose"
                content={event.purpose}
              />
            </Grid>

            {/* Booking Period */}
            <Grid item xs={12}>
              <InfoSection 
                icon={<EventIcon />}
                title="Booking Period"
                content={
                  <>
                    From: {formatDate(event.start_date)}
                    <br />
                    To: {formatDate(event.end_date)}
                  </>
                }
              />
            </Grid>

            {/* Created At */}
            {event.created_at && (
              <Grid item xs={12}>
                <InfoSection 
                  icon={<AccessTimeIcon />}
                  title="Created At"
                  content={formatDate(event.created_at)}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
      </Box>
    </Dialog>
  );
} 