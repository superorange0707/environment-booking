import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { Button } from '@mui/material';

export function OAuthCallback() {
  const navigate = useNavigate();
  const [debugVisible, setDebugVisible] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get actual URL from window.location
        console.log('1. Current URL:', window.location.href);
        console.log('2. URL hash:', window.location.hash);

        // Get token from hash
        const params = new URLSearchParams(window.location.hash.substring(1));
        const token = params.get('access_token');
        
        console.log('3. Extracted token:', token ? 'Found' : 'Not found');

        if (!token) {
          throw new Error('No token found in URL');
        }

        // Store token
        localStorage.setItem('token', token);
        console.log('4. Token stored:', !!localStorage.getItem('token'));

        // Complete auth flow
        const userInfo = await authService.handleCallback();
        console.log('5. Auth completed:', userInfo);

        navigate('/');
      } catch (error) {
        console.error('OAuth Error:', error);
        navigate('/login-error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <h2>Processing Login...</h2>
      <Button onClick={() => setDebugVisible(!debugVisible)}>
        {debugVisible ? 'Hide' : 'Show'} Debug Info
      </Button>
      {debugVisible && (
        <pre style={{ 
          maxWidth: '80%', 
          overflow: 'auto', 
          wordWrap: 'break-word',
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px'
        }}>
          {JSON.stringify({
            current_url: window.location.href,
            url_hash: window.location.hash,
            token_present: !!localStorage.getItem('token'),
            user_info: localStorage.getItem('user'),
            authenticated: authService.isAuthenticated()
          }, null, 2)}
        </pre>
      )}
    </div>
  );
}