'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Coins } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [pushNotifications, setPushNotifications] = useState([]);

    const showToast = useCallback((msg, type = 'info', duration = 4000) => {
        if (!msg) return;
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, msg, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const toastSuccess = useCallback((msg, duration) => showToast(msg, 'success', duration), [showToast]);
    const toastError = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast]);
    const toastInfo = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast]);

    const showPushNotification = useCallback(({ title, message, type = 'success', duration = 5000 }) => {
        if (!title && !message) return;

        const id = Date.now() + Math.random();
        setPushNotifications((prev) => [...prev, { id, title: title || 'Notification', message: message || '', type }]);

        setTimeout(() => {
            setPushNotifications((prev) => prev.filter((p) => p.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const removePush = useCallback((id) => {
        setPushNotifications((prev) => prev.filter((p) => p.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, toastSuccess, toastError, toastInfo, showPushNotification }}>
            {children}

            {/* 1. Mobile / System Push Notification Banner (Top-Center, Slide Down from Top) */}
            <div
                style={{
                    position: 'fixed',
                    top: '1.5rem',
                    left: '70%',
                    transform: 'translateX(-70%)',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    pointerEvents: 'none',
                    width: '100%',
                    maxWidth: '440px',
                    padding: '0 1rem',
                }}
            >
                {pushNotifications.map((p) => (
                    <div
                        key={p.id}
                        style={{
                            pointerEvents: 'auto',
                            width: '100%',
                            background: 'rgba(15, 23, 42, 0.96)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(153, 69, 255, 0.45)',
                            borderRadius: '16px',
                            padding: '0.75rem 1rem',
                            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(153, 69, 255, 0.25)',
                            animation: 'slideDownFromTop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        }}
                    >
                        {/* Notification Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--solana-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Coins size={12} style={{ color: '#000' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9945FF', letterSpacing: '0.5px' }}>SOLANA SYSTEM</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>now</span>
                                <button
                                    type="button"
                                    onClick={() => removePush(p.id)}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Notification Content */}
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#14F195', marginBottom: '2px' }}>
                            {p.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.35 }}>
                            {p.message}
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. Standard Toast Messages Container (Top-Right, Slide In Right) */}
            <div
                style={{
                    position: 'fixed',
                    top: '1.5rem',
                    right: '1.5rem',
                    zIndex: 99998,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    pointerEvents: 'none',
                }}
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        style={{
                            pointerEvents: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.85rem 1.25rem',
                            borderRadius: '14px',
                            minWidth: '300px',
                            maxWidth: '440px',
                            boxShadow: t.type === 'success'
                                ? '0 10px 30px rgba(20, 241, 149, 0.2)'
                                : t.type === 'error'
                                    ? '0 10px 30px rgba(239, 68, 68, 0.2)'
                                    : '0 10px 30px rgba(0, 194, 255, 0.2)',
                            backdropFilter: 'blur(16px)',
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: `1px solid ${t.type === 'success'
                                ? 'rgba(20, 241, 149, 0.4)'
                                : t.type === 'error'
                                    ? 'rgba(239, 68, 68, 0.4)'
                                    : 'rgba(0, 194, 255, 0.4)'
                                }`,
                            color: '#ffffff',
                            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {t.type === 'success' && <CheckCircle2 size={20} style={{ color: '#14F195', flexShrink: 0 }} />}
                        {t.type === 'error' && <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />}
                        {t.type === 'info' && <Info size={20} style={{ color: '#00C2FF', flexShrink: 0 }} />}

                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', flex: 1, lineHeight: 1.4 }}>
                            {t.msg}
                        </span>

                        <button
                            type="button"
                            onClick={() => removeToast(t.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};