import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle the OAuth callback with token from URL fragment
        await authService.handleCallback();
        
        // Redirect to home page after successful login
        navigate('/');
      } catch (error) {
        console.error('Authentication error:', error);
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
      height: '100vh' 
    }}>
      <p>Authenticating...</p>
    </div>
  );
} 