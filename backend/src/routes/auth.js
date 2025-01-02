const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Backend received token request');
    
    if (!token) {
      console.log('No token in request');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Making request to OpenShift API using curl...');
    
    // Construct curl command with -k flag to ignore SSL certificate issues
    const curlCommand = `curl -k -s -H "Authorization: Bearer ${token}" -H "Accept: application/json" ${process.env.OPENSHIFT_API_URL}/apis/user.openshift.io/v1/users/~`;
    
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Curl execution error:', error);
        return res.status(500).json({
          message: 'Failed to execute curl command',
          error: error.message
        });
      }

      if (stderr) {
        console.error('Curl stderr:', stderr);
      }

      try {
        const userData = JSON.parse(stdout);
        console.log('Successfully got user data from OpenShift');
        
        res.json({
          username: userData.metadata.name
        });
      } catch (parseError) {
        console.error('Error parsing OpenShift response:', parseError);
        console.error('Raw response:', stdout);
        res.status(500).json({
          message: 'Failed to parse OpenShift response',
          error: parseError.message,
          raw: stdout
        });
      }
    });

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
