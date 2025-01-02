const express = require('express');
const router = express.Router();

// Get current user info
router.get('/me', async (req, res) => {
  try {
    // Since getUserFromToken middleware already attaches user to req
    res.json({
      user_id: req.user.user_id,
      username: req.user.username,
      role: req.user.role
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 