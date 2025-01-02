import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('URL hash:', window.location.hash); // Debug
        await authService.handleCallback();
        console.log('Callback handled, token stored'); // Debug
        navigate('/');
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/login-error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div>
      <p>Processing login...</p>
    </div>
  );
} 