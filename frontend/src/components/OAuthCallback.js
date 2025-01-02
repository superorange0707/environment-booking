import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { Button } from '@mui/material';
import { logger } from '../utils/logger';

export function OAuthCallback() {
  const navigate = useNavigate();
  const [debugVisible, setDebugVisible] = useState(true);
  const [error, setError] = useState(null);
  const [processState, setProcessState] = useState('initial');

  // Store URL info immediately when component mounts
  const [urlInfo] = useState(() => ({
    fullUrl: window.location.href,
    hash: window.location.hash,
    search: window.location.search
  }));

  const handleCallback = useCallback(async () => {
    try {
      setProcessState('started');
      
      if (!urlInfo.hash && processState !== 'initial') {
        logger.log('Skipping callback processing - no hash present');
        return;
      }

      logger.log('1. Captured URL:', urlInfo.fullUrl);
      logger.log('2. Captured hash:', urlInfo.hash);
      logger.log('3. Captured search:', urlInfo.search);

      const expectedCallback = localStorage.getItem('oauth_state');
      logger.log('4. Expected callback:', expectedCallback);

      let token = null;
      if (urlInfo.hash) {
        const params = new URLSearchParams(urlInfo.hash.substring(1));
        token = params.get('access_token');
        logger.log('5a. Token from hash:', token ? 'Found' : 'Not found');
      }

      if (!token) {
        setProcessState('no_token');
        throw new Error('No token found in URL');
      }

      localStorage.setItem('token', token);
      setProcessState('token_stored');
      logger.log('6. Token stored:', !!localStorage.getItem('token'));

      try {
        const userInfo = await authService.handleCallback();
        logger.log('7. Auth completed:', userInfo);
        
        localStorage.removeItem('oauth_state');
        setProcessState('completed');

        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      } catch (apiError) {
        logger.error('API Error:', apiError);
        setProcessState('api_error');
        setError(`API Error: ${apiError.message}`);
      }
    } catch (error) {
      logger.error('OAuth Error:', error);
      setProcessState('oauth_error');
      setError(error.message);
      setTimeout(() => {
        navigate('/login-error', { replace: true });
      }, 1000);
    }
  }, [navigate, urlInfo, processState]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

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
      <div>Current state: {processState}</div>
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          Error: {error}
        </div>
      )}
      <Button onClick={() => setDebugVisible(!debugVisible)}>
        {debugVisible ? 'Hide' : 'Show'} Debug Info
      </Button>
      {debugVisible && (
        <>
          <pre style={{ 
            maxWidth: '80%', 
            overflow: 'auto', 
            wordWrap: 'break-word',
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px'
          }}>
            {JSON.stringify({
              process_state: processState,
              captured_url: urlInfo.fullUrl,
              captured_hash: urlInfo.hash,
              captured_search: urlInfo.search,
              expected_callback: localStorage.getItem('oauth_state'),
              token_present: !!localStorage.getItem('token'),
              user_info: localStorage.getItem('user'),
              authenticated: authService.isAuthenticated(),
              error: error
            }, null, 2)}
          </pre>
          <div style={{ 
            maxWidth: '80%', 
            maxHeight: '200px', 
            overflow: 'auto',
            backgroundColor: '#1e1e1e',
            color: '#fff',
            padding: '1rem',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            {logger.getLogs().map((log, index) => (
              <div key={index} style={{ 
                color: log.type === 'error' ? '#ff6b6b' : '#a8ff60',
                marginBottom: '4px'
              }}>
                [{log.timestamp}] {log.message}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}