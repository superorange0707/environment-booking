export const authService = {
  login: () => {
    const currentOrigin = window.location.origin;
    const oauthEndpoint = process.env.REACT_APP_OPENSHIFT_OAUTH_URL;
    const clientId = process.env.REACT_APP_OAUTH_CLIENT_ID;
    
    const oauthUrl = new URL(oauthEndpoint);
    oauthUrl.searchParams.append('response_type', 'token');  // Force token response
    oauthUrl.searchParams.append('client_id', clientId);
    oauthUrl.searchParams.append('redirect_uri', `${currentOrigin}/callback`);
    oauthUrl.searchParams.append('scope', 'user:full');
    
    localStorage.setItem('oauth_state', `${currentOrigin}/callback`);
    
    console.log('Redirecting to OAuth:', oauthUrl.toString());
    
    window.location.replace(oauthUrl.toString());
  },

  handleCallback: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token in localStorage');
      }

      // Use backend proxy instead of direct OpenShift API call
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auth Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Auth error: ${response.status}`);
      }

      const userData = await response.json();
      console.log('User data received:', userData);
      
      const userInfo = {
        token: token,
        authenticated: true,
        username: userData.username
      };

      localStorage.setItem('user', JSON.stringify(userInfo));
      return userInfo;
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}; 