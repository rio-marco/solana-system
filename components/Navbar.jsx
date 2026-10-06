'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Coins, Bell, LogOut, Code } from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { NotificationsDrawer } from './NotificationsDrawer';
import { TransactionDecoderModal } from './TransactionDecoderModal';

export const Navbar = () => {
    const { user, logout, config } = useAuth();
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showDecoder, setShowDecoder] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    return (
        <>
            <nav className="dashboard-navbar">
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--solana-gradient)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '100%', height: '100%', background: '#07090e', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Coins size={20} style={{ color: '#14F195' }} />
                            </div>
                        </div>
                        <div>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.5px', color: '#fff' }}>SOLANA SYSTEM</span>
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(153,69,255,0.15)', color: '#9945FF', border: '1px solid rgba(153,69,255,0.3)', textTransform: 'uppercase', fontWeight: 700 }}>
                                {config?.network || 'devnet'}
                            </span>
                        </div>
                    </div>

                    {/* Right Action Menu */}
                    {user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => setShowDecoder(true)}
                                className="solana-btn-outline"
                                style={{ width: 'auto', padding: '0 0.85rem', height: '38px', fontSize: '0.8rem', color: '#00C2FF', borderColor: 'rgba(0,194,255,0.3)' }}
                                title="Decode Transaction"
                            >
                                <Code size={16} />
                                <span>Decoder</span>
                            </button>

                            <button
                                onClick={() => setShowNotifications(true)}
                                style={{ position: 'relative', padding: '0.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', background: '#14F195', color: '#000', fontSize: '10px', fontWeight: 800, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setShowProfile(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                            >
                                {user.profilePhoto ? (
                                    <img
                                        src={`/${user.profilePhoto.startsWith('/') ? user.profilePhoto.slice(1) : user.profilePhoto}`}
                                        alt="Profile"
                                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #9945FF' }}
                                    />
                                ) : (
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(153,69,255,0.3)', color: '#14F195', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                                        {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                                    </div>
                                )}
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.fullName || user.email}</span>
                            </button>

                            <button
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