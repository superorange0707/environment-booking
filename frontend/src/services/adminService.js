import api from './api';

export const adminService = {
  updateEnvironmentStatus: async (environmentId, status) => {
    try {
      const response = await api.put(`/Environment/${environmentId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating environment status:', error);
      throw error;
    }
  },

  sendBookingReminder: async (bookingId) => {
    try {
      const response = await api.post(`/Booking/${bookingId}/reminder`);
      return response.data;
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  },

  getAuditLog: async (environmentId = null) => {
    try {
      const url = environmentId 
        ? `/admin/audit-log?environmentId=${environmentId}`
        : '/admin/audit-log';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    }
  }
}; 