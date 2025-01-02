export const authService = {
  // Initiate OpenShift OAuth login
  login: () => {
    const currentOrigin = window.location.origin;
    const oauthEndpoint = process.env.REACT_APP_OPENSHIFT_OAUTH_URL;
    const clientId = process.env.REACT_APP_OAUTH_CLIENT_ID;
    
    // Modify OAuth URL to request token response type
    const oauthUrl = new URL(oauthEndpoint);
    oauthUrl.searchParams.append('response_type', 'token');
    oauthUrl.searchParams.append('client_id', clientId);
    oauthUrl.searchParams.append('redirect_uri', `${currentOrigin}/oauth/callback`);
    oauthUrl.searchParams.append('scope', 'user:full');
    
    window.location.href = oauthUrl.toString();
  },

  // Handle OAuth callback with token in URL fragment
  handleCallback: async () => {
    try {
      // Parse token from URL fragment
      const params = new URLSearchParams(window.location.hash.substring(1));
      const token = params.get('access_token');
      
      if (!token) {
        throw new Error('No token received');
      }

      // Get user info directly from OpenShift API
      const response = await fetch(`${process.env.REACT_APP_OPENSHIFT_API_URL}/apis/user.openshift.io/v1/users/~`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await response.json();
      const user = {
        username: userData.metadata.name,
        token: token
      };

      // Store user info and token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  },

  // Get current user info
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
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