export const authService = {
  login: () => {
    const currentOrigin = window.location.origin;
    const oauthEndpoint = process.env.REACT_APP_OPENSHIFT_OAUTH_URL;
    const clientId = process.env.REACT_APP_OAUTH_CLIENT_ID;
    
    const oauthUrl = new URL(oauthEndpoint);
    oauthUrl.searchParams.append('response_type', 'token');  // Implicit flow
    oauthUrl.searchParams.append('client_id', clientId);
    oauthUrl.searchParams.append('redirect_uri', `${currentOrigin}/callback`);
    oauthUrl.searchParams.append('scope', 'user:full');
    
    window.location.href = oauthUrl.toString();
  },

  handleCallback: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token in localStorage');
      }

      // Fetch user info from OpenShift
      const response = await fetch(`${process.env.REACT_APP_OPENSHIFT_API_URL}/apis/user.openshift.io/v1/users/~`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }

      const openshiftUser = await response.json();
      
      // Create user info object
      const userInfo = {
        token: token,
        authenticated: true,
        username: openshiftUser.metadata.name,
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