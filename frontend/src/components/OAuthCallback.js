const express = require('express');
const router = express.Router();
const https = require('https');

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Backend received token request');
    
    if (!token) {
      console.log('No token in request');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Making request to OpenShift API...');

    // Create a Promise-based HTTPS request
    const getUserInfo = () => new Promise((resolve, reject) => {
      // Parse the OpenShift API URL
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
        rejectUnauthorized: false,  // Ignore certificate issues
        timeout: 5000  // 5 second timeout
      };

      const req = https.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          console.log('OpenShift API response status:', response.statusCode);
          
          if (response.statusCode !== 200) {
            reject(new Error(`API returned status ${response.statusCode}: ${data}`));
            return;
          }

          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (parseError) {
            reject(new Error(`Failed to parse response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      req.end();
    });

    try {
      const userData = await getUserInfo();
      console.log('Successfully got user data from OpenShift');
      
      res.json({
        username: userData.metadata.name
      });
    } catch (apiError) {
      console.error('OpenShift API error:', apiError);
      res.status(500).json({
        message: 'Failed to get user info from OpenShift',
        error: apiError.message
      });
    }

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      message: 'Authentication failed', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 
