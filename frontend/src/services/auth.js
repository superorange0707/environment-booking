export const authService = {
  // Initiate OpenShift OAuth login
  login: () => {
    // Store debug info before redirect
    localStorage.setItem('auth_debug_time', new Date().toISOString());
    localStorage.setItem('auth_debug_start', 'Initiating OAuth login');
    
    const currentOrigin = window.location.origin;
    const oauthEndpoint = process.env.REACT_APP_OPENSHIFT_OAUTH_URL;
    const clientId = process.env.REACT_APP_OAUTH_CLIENT_ID;
    
    // Modify OAuth URL to request token response type
    const oauthUrl = new URL(oauthEndpoint);
    oauthUrl.searchParams.append('response_type', 'token');
    oauthUrl.searchParams.append('client_id', clientId);
    oauthUrl.searchParams.append('redirect_uri', `${currentOrigin}/oauth/callback`);
    oauthUrl.searchParams.append('scope', 'user:full');
    
    console.log('Redirecting to:', oauthUrl.toString()); // Debug
    window.location.href = oauthUrl.toString();
  },

  // Handle OAuth callback with token in URL fragment
  handleCallback: async () => {
    try {
      localStorage.setItem('auth_debug_callback', `Callback received: ${window.location.hash}`);
      const params = new URLSearchParams(window.location.hash.substring(1));
      const token = params.get('access_token');
      
      localStorage.setItem('auth_debug_token', token ? 'Token received' : 'No token');
      
      if (!token) {
        throw new Error('No token received');
      }

      // Store token
      localStorage.setItem('token', token);

      // Immediately verify token and get user info
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${process.env.REACT_APP_OPENSHIFT_API_URL}/apis/user.openshift.io/v1/users/~`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await response.json();
      console.log('User data received:', userData); // Debug

      return token;
    } catch (error) {
      localStorage.setItem('auth_debug_error', error.message);
      throw error;
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      return await response.json();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
}; 