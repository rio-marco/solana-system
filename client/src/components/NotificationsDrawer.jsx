import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, CheckCheck, X, Inbox } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const NotificationsDrawer = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications');
      if (res.data && res.data.flag && res.data.data) {
        const list = res.data.data.notifications || [];
        setNotifications(list);
        const unread = list.filter((n) => !n.isRead).length;
        if (onUnreadCountChange) onUnreadCountChange(unread);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    if (socket) {
      socket.on('newNotification', (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        if (onUnreadCountChange) {
          onUnreadCountChange((prev) => prev + 1);
        }
      });

      return () => {
        socket.off('newNotification');
      };
    }
  }, [socket]);

  const handleMarkAllRead = async () => {
    try {
      await axios.post('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (e) {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="solana-modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div style={{ width: '100%', maxWidth: '420px', height: '100%', background: '#0f1422', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} style={{ color: '#9945FF' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Notifications</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleMarkAllRead}
              style={{ background: 'rgba(153,69,255,0.15)', border: '1px solid rgba(153,69,255,0.3)', color: '#14F195', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '8px', cursor: 'pointer' }}
            >
              Mark read
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b', fontSize: '0.85rem' }}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <Inbox size={32} />
              <span style={{ fontSize: '0.85rem' }}>No notifications yet</span>
            </div>
          ) : (
            notifications.map((n, idx) => (
              <div
                key={n._id || idx}
                style={{
                  background: n.isRead ? 'rgba(7,9,14,0.4)' : 'rgba(153,69,255,0.08)',
                  border: '1px solid ' + (n.isRead ? 'rgba(255,255,255,0.05)' : 'rgba(153,69,255,0.2)'),
                  borderRadius: '12px',
                  padding: '0.85rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#14F195' }}>{n.title || 'Notification'}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>{n.message || n.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
