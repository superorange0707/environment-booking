process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';  // Only for development!

const express = require('express');
const router = express.Router();
const https = require('https');

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

      const req = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          if (response.statusCode !== 200) {
            reject(new Error(`API returned status ${response.statusCode}: ${data}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (parseError) {
            reject(new Error(`Failed to parse response: ${parseError.message}`));
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
    res.json({
      username: userData.metadata.name
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Authentication failed', 
      error: error.message
    });
  }
});

module.exports = router; 