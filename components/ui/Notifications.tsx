'use client';

import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationService } from '../../lib/api';
import { formatDate } from '../../lib/utils';

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  notification_type: 'email' | 'push' | 'sms' | 'in_app';
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response)) {
        setNotifications(response);
      } else if (response && response.results) {
        setNotifications(response.results);
      } else {
        console.warn('Formato de respuesta inesperado:', response);
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Solo cargar notificaciones cuando se abre el dropdown
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      // Actualizar la lista de notificaciones
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div className="relative">
      <button 
        className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sr-only">Ver notificaciones</span>
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-10">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Notificaciones</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 animate-pulse space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index}>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-600">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">No tienes notificaciones</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between">
                        <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-2 border-t border-gray-200 flex justify-center">
            <button 
              className="text-xs text-primary-600 hover:text-primary-800"
              onClick={() => setIsOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}