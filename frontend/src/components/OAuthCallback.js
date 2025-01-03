import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Extract the token from the URL hash
        const urlHash = window.location.hash;
        const params = new URLSearchParams(urlHash.substring(1));
        const token = params.get('access_token');

        if (!token) {
          throw new Error('No token found in URL');
        }

        // Store the token locally
        localStorage.setItem('token', token);

        // Perform any necessary backend processing
        await authService.handleCallback(token);

        // Redirect to the dashboard or target page
        navigate('/', { replace: true });
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login-error', { replace: true });
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  // Render nothing (no visible UI)
  return null;
}
