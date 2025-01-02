process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';  // Only for development!

const express = require('express');
const router = express.Router();
const https = require('https');
const db = require('../config/database');

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const getUserInfo = () => new Promise((resolve, reject) => {
      const apiUrl = new URL(process.env.OPENSHIFT_API_URL);
      
      const options = {
        hostname: apiUrl.hostname,
        port: apiUrl.port || 443,
        path: '/apis/user.openshift.io/v1/users/~',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        rejectUnauthorized: false,
        timeout: 5000
      };

      const req = https.request(options, async (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', async () => {
          if (response.statusCode !== 200) {
            reject(new Error(`API returned status ${response.statusCode}: ${data}`));
            return;
          }
          try {
            const userData = JSON.parse(data);
            const openshiftUsername = userData.metadata.name;

            // Check if user exists in database
            let result = await db.query(
              'SELECT * FROM userstable WHERE username = $1',
              [openshiftUsername]
            );

            // Create user if doesn't exist
            if (result.rows.length === 0) {
              result = await db.query(
                'INSERT INTO userstable (username, role) VALUES ($1, $2) RETURNING *',
                [openshiftUsername, 'user']  // Default role is 'user'
              );
            }

            resolve({
              username: openshiftUsername,
              role: result.rows[0].role,
              user_id: result.rows[0].user_id
            });
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => reject(error));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      req.end();
    });

    const userData = await getUserInfo();
    res.json(userData);  // Return user data including role and user_id

  } catch (error) {
    res.status(500).json({ 
      message: 'Authentication failed', 
      error: error.message
    });
  }
});

module.exports = router;