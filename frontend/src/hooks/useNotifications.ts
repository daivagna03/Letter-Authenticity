'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export interface Notification {
  type: 'INFO' | 'WARNING';
  message: string;
  letterId: string;
  timestamp: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (user) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('join', user.id);
      });

      newSocket.on('notification', (notif: Notification) => {
        setNotifications((prev) => [notif, ...prev]);
        // Show browser notification if possible
        if (Notification.permission === 'granted') {
          new Notification('Verification Scan', { body: notif.message });
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return { notifications, setNotifications };
};
