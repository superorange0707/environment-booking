import axios from 'axios';

// Add debug logging
console.log('Environment variables:', {
    REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
});

// Add fallback if env variable is not loaded
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL) + '/api';

console.log('Final API_BASE_URL:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use(request => {
    const token = localStorage.getItem('token');
    if (token) {
        request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
});

// Handle auth errors
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Add authorization header to all API calls
const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const userService = {
    getAllUsers: async () => {
        try {
            const response = await api.get('/userstable');
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    },
    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    }
};

export const environmentService = {
    getAllEnvironments: async () => {
        try {
            console.log('Calling environmentstatus API');
            const response = await api.get('/environmentstatus');
            console.log('Environment status from API:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching environments:', error);
            return [];
        }
    },

    updateEnvironment: async (id, data) => {
        try {
            const response = await api.put(`/environment/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating environment:', error);
            throw error;
        }
    },

    updateEnvironmentStatus: async (environmentId, status) => {
        try {
            const response = await fetch(`${API_BASE_URL}/environment/${environmentId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(status)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update environment status');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
};

export const bookingService = {
    getAllBookings: async () => {
        try {
            const response = await api.get('/booking');
            return response.data;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return [];
        }
    },

    createBooking: async (bookingData) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const response = await api.post('/booking', {
            ...bookingData,
            user_id: user.user_id
        });
        return response.data;
    },

    updateBooking: async (id, data) => {
        try {
            const response = await api.put(`/booking/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    },

    cancelBooking: async (bookingId) => {
        try {
            const response = await api.put(`/booking/${bookingId}`, {
                action: 'cancel'
            });
            return response.data;
        } catch (error) {
            console.error('Error cancelling booking:', error);
            throw error;
        }
    }
};

export const getEnvironmentStatus = async () => {
    try {
        const response = await fetch('/api/environmentstatus');
        if (!response.ok) throw new Error('Failed to fetch environment status');
        return await response.json();
    } catch (error) {
        console.error('Error fetching environment status:', error);
        throw error;
    }
};

export default api; 