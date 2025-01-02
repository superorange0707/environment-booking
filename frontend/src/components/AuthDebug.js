import { useEffect, useState } from 'react';

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const info = {
      auth_debug_time: localStorage.getItem('auth_debug_time'),
      auth_debug_start: localStorage.getItem('auth_debug_start'),
      auth_debug_callback: localStorage.getItem('auth_debug_callback'),
      auth_debug_token: localStorage.getItem('auth_debug_token'),
      auth_debug_error: localStorage.getItem('auth_debug_error'),
      current_token: localStorage.getItem('token') ? 'Present' : 'None'
    };
    setDebugInfo(info);
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, padding: '10px', background: '#f0f0f0' }}>
      <h4>Auth Debug Info:</h4>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
} 