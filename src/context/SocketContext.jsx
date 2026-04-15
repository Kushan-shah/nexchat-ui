import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user, logout } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());

  useEffect(() => {
    if (!token) return;

    // In dev: connect to localhost:3000. In prod: connect to Render backend.
    const backendUrl = API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '/');
    
    const newSocket = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket auth error:', err.message);
      if (err.message.includes('Authentication error')) {
        logout();
      }
    });

    // Real-time online users list
    newSocket.on('online_users', (users) => {
      setOnlineUsers(users.filter(u => u.id !== user.id));
    });

    // Typing indicators
    newSocket.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.set(data.userId, data.username);
        return next;
      });
    });

    newSocket.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [token, user, logout]);

  const emitTyping = useCallback((targetUserId, roomId, isTyping) => {
    if (!socket) return;
    const event = isTyping ? 'typing_start' : 'typing_stop';
    socket.emit(event, { targetUserId, roomId });
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingUsers, emitTyping }}>
      {children}
    </SocketContext.Provider>
  );
};
