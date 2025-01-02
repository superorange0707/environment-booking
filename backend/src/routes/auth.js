const express = require('express');
const router = express.Router();

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Backend received token request');
    
    if (!token) {
      console.log('No token in request');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Making request to OpenShift API...');
    const fetch = (await import('node-fetch')).default;
    const https = await import('https');
    
    try {
      const response = await fetch(
        `${process.env.OPENSHIFT_API_URL}/apis/user.openshift.io/v1/users/~`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          agent: new https.Agent({
            rejectUnauthorized: false
          })
        }
      );

      console.log('OpenShift API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenShift API error details:', errorText);
        return res.status(response.status).json({ 
          message: 'OpenShift API error',
          status: response.status,
          details: errorText
        });
      }

      const userData = await response.json();
      console.log('Successfully got user data from OpenShift');
      
      res.json({
        username: userData.metadata.name
      });
    } catch (fetchError) {
      console.error('Fetch error details:', fetchError);
      throw fetchError;
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