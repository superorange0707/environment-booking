require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const db = require('./config/database');
const authRouter = require('./routes/auth');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Add logging function
async function logAuth(message, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    data
  };
  
  await fs.appendFile(
    path.join(__dirname, 'auth.log'),
    JSON.stringify(logEntry) + '\n'
  );
}

// Middleware to get/create user from OpenShift token
const getUserFromToken = async (req, res, next) => {
  try {
    await logAuth('Auth attempt', { 
      headers: req.headers.authorization ? 'Present' : 'Missing'
    });
    
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Received auth header:', !!req.headers.authorization); // Debug
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Dynamic import of node-fetch
    const fetch = (await import('node-fetch')).default;

    console.log('Fetching user info from OpenShift...'); // Debug
    const response = await fetch(`${process.env.OPENSHIFT_API_URL}/apis/user.openshift.io/v1/users/~`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('OpenShift API error:', response.status); // Debug
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userData = await response.json();
    console.log('OpenShift user data:', userData); // Debug
    
    const openshiftUsername = userData.metadata.name;

    // Check if user exists in our database
    let result = await db.query(
      'SELECT * FROM userstable WHERE username = $1',
      [openshiftUsername]
    );

    console.log('Database lookup result:', result.rows.length ? 'user found' : 'user not found'); // Debug

    let user;
    if (result.rows.length === 0) {
      console.log('Creating new user:', openshiftUsername); // Debug
      result = await db.query(
        'INSERT INTO userstable (username, role) VALUES ($1, $2) RETURNING *',
        [openshiftUsername, 'user']
      );
    }
    
    user = result.rows[0];
    req.user = user;
    
    await logAuth('Auth success', { 
      username: openshiftUsername,
      user_id: user.user_id 
    });
    
    next();
  } catch (error) {
    await logAuth('Auth error', { error: error.message });
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Public routes (no auth required)
app.get('/api/booking', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        b.*,
        e.name as environment_name,
        u.username
      FROM booking b
      LEFT JOIN environment e ON b.environment_id = e.environment_id
      LEFT JOIN userstable u ON b.user_id = u.user_id
      ORDER BY b.booking_id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Protected routes (auth required)
app.post('/api/booking', getUserFromToken, async (req, res) => {
  const { environment_id, start_date, end_date, purpose } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO booking (environment_id, user_id, start_date, end_date, purpose) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [environment_id, req.user.user_id, start_date, end_date, purpose]
    );
    
    await broadcastUpdates();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.put('/api/booking/:id', getUserFromToken, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  
  try {
    // Start a transaction
    await db.query('BEGIN');
    
    if (action === 'cancel') {
      // Get the environment_id from the booking
      const bookingResult = await db.query(
        'SELECT environment_id FROM booking WHERE booking_id = $1',
        [id]
      );
      
      if (bookingResult.rows.length > 0) {
        // Update environment status to Ready
        await db.query(
          'UPDATE environment SET status = $1 WHERE environment_id = $2',
          ['Ready', bookingResult.rows[0].environment_id]
        );
        
        // Delete the booking
        await db.query('DELETE FROM booking WHERE booking_id = $1', [id]);
      }
    }

    // Commit transaction
    await db.query('COMMIT');
    
    // Broadcast updates
    await broadcastUpdates();
    
    res.json({ success: true });
  } catch (error) {
    // Rollback in case of error
    await db.query('ROLLBACK');
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.delete('/api/booking/:id', getUserFromToken, async (req, res) => {
  try {
    await db.query('DELETE FROM booking WHERE booking_id = $1', [req.params.id]);
    await broadcastUpdates();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Similarly for environment routes
app.get('/api/environment', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM environment');
    console.log('Environments query result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching environments:', error);
    res.status(500).json({ error: 'Failed to fetch environments' });
  }
});

app.get('/api/environmentstatus', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM environmentstatus');
    console.log('Environment status query result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching environment status:', error);
    res.status(500).json({ error: 'Failed to fetch environment status' });
  }
});

// Protected routes (auth required)
app.put('/api/environment/:id', getUserFromToken, async (req, res) => {
  const { id } = req.params;
  const { name, type, status } = req.body;
  try {
    const result = await db.query(
      'UPDATE environment SET name = $1, type = $2, status = $3 WHERE environment_id = $4 RETURNING *',
      [name, type, status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating environment:', error);
    res.status(500).json({ error: 'Failed to update environment' });
  }
});

// Mount auth routes
app.use('/api/auth', getUserFromToken, authRouter);

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: corsOptions
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Broadcast updates function
const broadcastUpdates = async () => {
  try {
    // Get bookings
    const bookings = await db.query(`
      SELECT 
        b.*,
        e.name as environment_name,
        u.username
      FROM booking b
      LEFT JOIN environment e ON b.environment_id = e.environment_id
      LEFT JOIN userstable u ON b.user_id = u.user_id
      ORDER BY b.booking_id DESC
    `);
    
    // Get environment status
    const environmentStatus = await db.query('SELECT * FROM environmentstatus');
    
    // Emit both updates
    io.emit('bookings-updated', bookings.rows);
    io.emit('environment-status-updated', environmentStatus.rows);
  } catch (error) {
    console.error('Error broadcasting updates:', error);
  }
};

// API Routes
// Users
app.get('/api/userstable', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM userstable');
    console.log('Users query result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update environment status
app.put('/api/environment/:id/status', async (req, res) => {
  const { id } = req.params;
  const { manual_status } = req.body;

  try {
    // Start a transaction
    await db.query('BEGIN');

    // Update the manual_status
    const updateResult = await db.query(
      'UPDATE environment SET manual_status = $1 WHERE environment_id = $2 RETURNING *',
      [manual_status, id]
    );

    // Get the updated status from the view
    const statusResult = await db.query(
      'SELECT * FROM environmentstatus WHERE environment_id = $1',
      [id]
    );

    // Commit transaction
    await db.query('COMMIT');

    if (statusResult.rows.length === 0) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    // Send the updated status
    await broadcastUpdates();
    res.json(statusResult.rows[0]);

  } catch (error) {
    // Rollback in case of error
    await db.query('ROLLBACK');
    console.error('Error updating environment status:', error);
    res.status(500).json({ error: 'Failed to update environment status' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 