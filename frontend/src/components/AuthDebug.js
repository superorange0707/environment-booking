import { useEffect, useState } from 'react';
import { Button } from '@mui/material';

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState({});

  const updateDebugInfo = () => {
    const info = {
      // Auth process debug info
      debug_time: localStorage.getItem('debug_time'),
      debug_url: localStorage.getItem('debug_url'),
      debug_hash: localStorage.getItem('debug_hash'),
      debug_token_found: localStorage.getItem('debug_token_found'),
      debug_token_length: localStorage.getItem('debug_token_length'),
      debug_token_stored: localStorage.getItem('debug_token_stored'),
      debug_token_verify: localStorage.getItem('debug_token_verify'),
      debug_final_token_check: localStorage.getItem('debug_final_token_check'),
      debug_params: localStorage.getItem('debug_params'),
      debug_user_data: localStorage.getItem('debug_user_data'),
      auth_error: localStorage.getItem('auth_error'),
      
      // Current state
      current_token: localStorage.getItem('token') ? 'Present' : 'None',
      current_user: localStorage.getItem('user'),
      token_value: localStorage.getItem('token')?.substring(0, 10) + '...',
      
      // Timestamp
      last_updated: new Date().toISOString()
    };
    setDebugInfo(info);
  };

  // Update every second
  useEffect(() => {
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearDebugInfo = () => {
    // Clear all debug items from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('debug_')) {
        localStorage.removeItem(key);
      }
    });
    updateDebugInfo();
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      padding: '10px', 
      background: '#f0f0f0',
      maxWidth: '500px',
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0 }}>Auth Debug Info:</h4>
        <div>
          <Button 
            size="small" 
            onClick={updateDebugInfo} 
            style={{ marginRight: '8px' }}
          >
            Refresh
          </Button>
          <Button 
            size="small" 
            onClick={clearDebugInfo}
            color="error"
          >
            Clear
          </Button>
        </div>
      </div>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
} 