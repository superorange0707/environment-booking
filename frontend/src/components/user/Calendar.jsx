import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { EventDetailsModal } from '../common/EventDetailsModal';
import '../calendar/CalendarStyles.css';

export const Calendar = ({ bookings, environments, users, selectedEnvironment = 'all' }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('Environments:', environments);
    console.log('Bookings:', bookings);
  }, [environments, bookings]);

  // Updated color scheme to match StatusPanel
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

  // Add this function at the top of your component
  const formatToLocalDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Filter and format bookings for calendar display
  const calendarEvents = bookings
    .filter(booking => 
      selectedEnvironment === 'all' || 
      booking.environment_id === parseInt(selectedEnvironment)
    )
    .map(booking => {
      const environment = environments.find(env => env.environment_id === booking.environment_id);
      const user = users.find(u => u.user_id === booking.user_id);

      // Create proper Date objects and handle timezone correctly
      const startDate = formatToLocalDate(booking.start_date);
      const endDate = formatToLocalDate(booking.end_date);
      
      // Add one day to end date to make it inclusive in the calendar
      const displayEndDate = new Date(endDate);
      displayEndDate.setDate(displayEndDate.getDate() + 1);

      return {
        id: booking.booking_id.toString(),
        title: environment?.name || 'Unknown Environment',
        start: startDate,
        end: displayEndDate,
        backgroundColor: environmentColors[environment?.environment_id] || '#999999',
        borderColor: environmentColors[environment?.environment_id] || '#999999',
        allDay: true,
        display: 'block',
        classNames: ['calendar-event-block'],
        extendedProps: {
          purpose: booking.purpose,
          username: user?.username || 'Unknown User',
          environment: environment
        }
      };
    });

  // Custom event render
  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    const color = environmentColors[event.extendedProps.environment_id];
    const booking = bookings.find(b => b.booking_id.toString() === event.id);
    const owner = users.find(u => u.user_id === booking?.user_id);
    
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
          },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: '6px 8px',
          m: '1px',
          cursor: 'pointer'
        }}
      >
        {/* First Row: Environment Name and Owner */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mb: 0.5 
        }}>
          <Typography 
            sx={{ 
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              lineHeight: 1.2
            }}
          >
            {event.extendedProps.environmentName}
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
              fontWeight: 500
            }}
          >
            {owner?.username}
          </Typography>
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

  // Add useRef for calendar instance
  const calendarRef = useRef(null);

  // Add useEffect to force calendar refresh when data changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.refetchEvents();
    }
  }, [bookings, environments, selectedEnvironment]);

  return (
    <Box>
      {/* Environment Legend */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: 'background.default',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
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
            />
          ))}
      </Paper>

      {/* Calendar */}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        eventContent={renderEventContent}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }}
        height="auto"
        eventDisplay="block"
        displayEventEnd={true}
        eventDurationEditable={false}
        nextDayThreshold="00:00:00"
        dayMaxEventRows={true}
        forceEventDuration={true}
        stickyHeaderDates={false}
        expandRows={true}
        handleWindowResize={true}
        windowResizeDelay={0}
        lazyFetching={false}
        rerenderDelay={0}
        eventClick={(clickInfo) => {
          const booking = bookings.find(b => b.booking_id.toString() === clickInfo.event.id);
          if (booking) {
            setSelectedEvent(booking);
            setModalOpen(true);
          }
        }}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        event={selectedEvent}
        users={users}
        environments={environments}
      />
    </Box>
  );
};
