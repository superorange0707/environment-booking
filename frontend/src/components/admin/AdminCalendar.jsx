import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip,
  Tooltip, 
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { EventDetailsModal } from '../common/EventDetailsModal';
import './AdminCalendar.css';

export function AdminCalendar({ bookings, environments, users, onAuditClick, onCancelBooking }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');

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

  const calendarEvents = bookings.map(booking => {
    const environment = environments.find(env => env.environment_id === booking.environment_id);
    const user = users.find(u => u.user_id === booking.user_id);
    const color = environmentColors[booking.environment_id];

    // Create proper Date objects and handle timezone correctly
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    
    // Add one day to end date to make it inclusive in the calendar
    const displayEndDate = new Date(endDate);
    displayEndDate.setDate(displayEndDate.getDate() + 1);

    return {
      id: booking.booking_id.toString(),
      title: environment?.name || 'Unknown Environment',
      start: startDate.toISOString().split('T')[0], // Use date only
      end: displayEndDate.toISOString().split('T')[0], // Use date only
      backgroundColor: color,
      borderColor: color,
      allDay: true,
      display: 'block',
      extendedProps: {
        purpose: booking.purpose,
        username: user?.username || 'Unknown User',
        environment_id: booking.environment_id
      }
    };
  });

  // Filter events based on selected environment
  const filteredEvents = calendarEvents.filter(event => {
    if (selectedEnvironment === 'all') {
      return true; // Show all events
    }
    return event.extendedProps.environment_id.toString() === selectedEnvironment;
  });

  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    const color = environmentColors[event.extendedProps.environment_id];
    
    return (
      <Box
        className="calendar-event"
        sx={{ 
          minHeight: '40px',
          backgroundColor: color,
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
            zIndex: 10
          },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: '6px 8px',
          m: '1px',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* First Row: Environment Name and Owner */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.5
        }}>
          {/* Left side: Env name and owner */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            flex: 1,
            minWidth: 0 // make sure text can be truncated
          }}>
            <Typography 
              sx={{ 
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                lineHeight: 1.2
              }}
            >
              {event.title}
            </Typography>
            
            <Box 
              sx={{ 
                width: '2px',
                height: '2px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.8)'
              }}
            />
            
            <Typography 
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.85rem',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {event.extendedProps.username}
            </Typography>
          </Box>

          {/* Right side: Action buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            ml: 1,
            position: 'relative',
            zIndex: 20
          }}>
            <Tooltip title="Cancel Booking">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelBooking(parseInt(event.id));
                }}
                sx={{ 
                  color: 'white',
                  padding: '2px',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.2)'
                  },
                  zIndex: 30
                }}
              >
                <CancelIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Audit Log">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onAuditClick(event.extendedProps.environment_id);
                }}
                sx={{ 
                  color: 'white',
                  padding: '2px',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.2)'
                  },
                  zIndex: 30
                }}
              >
                <AssessmentIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Second Row: Purpose */}
        <Typography 
          sx={{ 
            color: 'rgba(255,255,255,0.85)',
            fontSize: '0.75rem',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {event.extendedProps.purpose}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      {/* Top Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        {/* Environment Legend - Left Side */}
        <Box sx={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1
        }}>
          {environments
            .filter(env => env.type === 'pilot')
            .map(env => (
              <Chip
                key={env.environment_id}
                label={env.name}
                sx={{
                  backgroundColor: environmentColors[env.environment_id],
                  color: 'white',
                  '& .MuiChip-label': {
                    fontWeight: 500
                  }
                }}
                size="small"
                onClick={() => setSelectedEnvironment(env.environment_id.toString())}
              />
            ))}
        </Box>

        {/* Environment Filter - Right Side */}
        <FormControl 
          size="small" 
          sx={{ 
            minWidth: 200,
            backgroundColor: 'white',
            borderRadius: 1
          }}
        >
          <InputLabel>Filter Environment</InputLabel>
          <Select
            value={selectedEnvironment}
            label="Filter Environment"
            onChange={(e) => setSelectedEnvironment(e.target.value)}
            sx={{
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }
            }}
            renderValue={(selected) => {
              if (selected === 'all') return 'All Environments';
              const env = environments.find(e => e.environment_id.toString() === selected);
              return (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  height: '100%'
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
                  {env?.name}
                </Box>
              );
            }}
          >
            <MenuItem value="all">All Environments</MenuItem>
            {environments
              .filter(env => env.type === 'pilot')
              .map(env => (
                <MenuItem 
                  key={env.environment_id} 
                  value={env.environment_id.toString()}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
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
      </Box>

      {/* Calendar Box */}
      <Box sx={{ 
        backgroundColor: 'white', 
        borderRadius: 2, 
        p: 2,
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)'
      }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          events={filteredEvents}
          eventContent={renderEventContent}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
          }}
          height="auto"
          dayMaxEvents={3}
          eventDisplay="block"
          displayEventEnd={true}
          eventDurationEditable={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          nextDayThreshold="00:00:00"
          dayMaxEventRows={true}
          forceEventDuration={true}
        />
      </Box>

      {/* Event Details Modal */}
      <EventDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        event={selectedEvent}
        users={users}
        environments={environments}
        onCancelBooking={onCancelBooking}
        isAdmin={true}
      />
    </Box>
  );
} 