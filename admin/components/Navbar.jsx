'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { Coins, Bell, LogOut, Code, Wallet, Shield } from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { NotificationsDrawer } from './NotificationsDrawer';
import { TransactionDecoderModal } from './TransactionDecoderModal';

export const Navbar = () => {
    const { user, logout, config, refreshUser } = useAuth();
    const socket = useSocket();
    const { showPushNotification } = useToast();

    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showDecoder, setShowDecoder] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;

        try {
            const res = await axios.get('/api/notifications');
            if (res.data && res.data.flag && res.data.data) {
                const list = res.data.data.notifications || [];
                const unread = list.filter((n) => !n.isRead).length;
                setUnreadCount(unread);
            };
        } catch (e) {
            // ignore
        };
    }, [user]);

    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    useEffect(() => {
        if (socket && user) {
            const handleNewNotification = (notif) => {
                const title = notif.title || 'Notification';
                const msg = notif.message || notif.content || '';

                showPushNotification({
                    title: title,
                    message: msg,
                    type: 'success',
                });

                setUnreadCount((prev) => prev + 1);
                refreshUser();
            };

            const handleBalanceUpdate = () => {
                refreshUser();
            };

            socket.on('newNotification', handleNewNotification);
            socket.on('deposit_confirmed', handleBalanceUpdate);
            socket.on('withdrawal_confirmed', handleBalanceUpdate);

            return () => {
                socket.off('newNotification', handleNewNotification);
                socket.off('deposit_confirmed', handleBalanceUpdate);
                socket.off('withdrawal_confirmed', handleBalanceUpdate);
            };
        }
    }, [socket, user, showPushNotification, refreshUser]);

    return (
        <>
            <nav className="dashboard-navbar" style={{ padding: '0.85rem 1.5rem', background: 'rgba(7, 9, 14, 0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', sticky: 'top', top: 0, zIndex: 100 }}>
                <div style={{ maxWidth: '1500px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    {/* Logo & Admin Panel Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #9945FF 100%)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '100%', height: '100%', background: '#07090e', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={20} style={{ color: '#ef4444' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.5px', color: '#fff' }}>SOLANA SYSTEM</span>
                                    <span style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', borderRadius: '12px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff', fontWeight: 800 }}>
                                        ADMIN PANEL
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', textTransform: 'uppercase', fontWeight: 700 }}>
                                    {config?.network || 'devnet'}
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Right Action Menu */}
                    {user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <button
                                type="button"
                                onClick={() => setShowDecoder(true)}
                                className="solana-btn-outline"
                                style={{ width: 'auto', padding: '0 0.85rem', height: '36px', fontSize: '0.8rem', color: '#00C2FF', borderColor: 'rgba(0,194,255,0.3)' }}
                                title="Decode Transaction"
                            >
                                <Code size={15} />
                                <span>Decoder</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowNotifications(true)}
                                style={{ position: 'relative', padding: '0.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowProfile(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                            >
                                {user.profilePhoto ? (
                                    <img
                                        src={`/${user.profilePhoto.startsWith('/') ? user.profilePhoto.slice(1) : user.profilePhoto}`}
                                        alt="Profile"
                                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ef4444' }}
                                    />
                                ) : (
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                                        {user.fullName ? user.fullName[0].toUpperCase() : 'A'}
                                    </div>
                                )}
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.fullName || user.email}</span>
                            </button>

                            <button
                                type="button"
                                onClick={logout}
                                style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', cursor: 'pointer' }}
                                title="Sign Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
            <NotificationsDrawer
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onUnreadCountChange={setUnreadCount}
            />
            <TransactionDecoderModal isOpen={showDecoder} onClose={() => setShowDecoder(false)} />
        </>
    );
};