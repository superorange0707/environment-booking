import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [processState, setProcessState] = useState('initial');

  const [urlInfo] = useState(() => ({
    fullUrl: window.location.href,
    hash: window.location.hash,
    search: window.location.search
  }));

  const handleCallback = useCallback(async () => {
    try {
      setProcessState('started');
      
      if (!urlInfo.hash && processState !== 'initial') {
        return;
      }

      let token = null;
      if (urlInfo.hash) {
        const params = new URLSearchParams(urlInfo.hash.substring(1));
        token = params.get('access_token');
      }

      if (!token) {
        setProcessState('no_token');
        throw new Error('No token found in URL');
      }

      localStorage.setItem('token', token);
      setProcessState('token_stored');

      try {
        const userInfo = await authService.handleCallback();
        localStorage.removeItem('oauth_state');
        setProcessState('completed');
        
        // Dispatch a custom event to notify App.js about the login
        window.dispatchEvent(new CustomEvent('auth-update', { detail: userInfo }));
        
        // Auto-navigate after successful auth
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      } catch (apiError) {
        setProcessState('api_error');
        setError(`API Error: ${apiError.message}`);
      }
    } catch (error) {
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
    </div>
  );
}