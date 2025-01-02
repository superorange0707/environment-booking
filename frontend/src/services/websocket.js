import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3001';

const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
});

export { socket };
export default socket;