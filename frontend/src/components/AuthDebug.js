import { useEffect, useState } from 'react';
import { Button } from '@mui/material';

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(false);

  const updateDebugInfo = () => {
    const info = {
      // Auth process debug info
      debug_time: new Date().toISOString(),
      current_url: window.location.href,
      current_hash: window.location.hash,
      oauth_state: localStorage.getItem('oauth_state'),
      token: localStorage.getItem('token') ? 'Present' : 'None',
      user: localStorage.getItem('user'),
      raw_token: localStorage.getItem('token')?.substring(0, 10) + '...'
    };
    setDebugInfo(info);
  };

  useEffect(() => {
    updateDebugInfo();
    let interval;
    
    if (autoRefresh) {
      interval = setInterval(updateDebugInfo, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

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
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{ marginRight: '8px' }}
          >
            {autoRefresh ? 'Stop' : 'Start'} Auto-refresh
          </Button>
          <Button 
            size="small" 
            onClick={updateDebugInfo}
            style={{ marginRight: '8px' }}
          >
            Refresh
          </Button>
        </div>
      </div>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
} 