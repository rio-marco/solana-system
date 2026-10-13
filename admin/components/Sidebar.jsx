'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    ArrowDownLeft,
    ArrowUpRight,
    Settings,
    LogOut,
    Shield,
    ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard',           icon: LayoutDashboard, href: '/' },
    { id: 'users',     label: 'User Management',     icon: Users,           href: '/user' },
    { id: 'deposits',  label: 'Deposit Management',  icon: ArrowDownLeft,   href: '/deposit' },
    { id: 'withdrawals', label: 'Withdraw Management', icon: ArrowUpRight,  href: '/withdraw' },
    { id: 'settings',  label: 'Settings',            icon: Settings,        href: '/setting' },
];

export function Sidebar() {
    const { admin, logout, config } = useAuth();
    const pathname = usePathname();

    const isActive = (href) => {
        if (href === '/') return pathname === '/';
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <aside
            style={{
                width: '260px',
                minWidth: '260px',
                height: '100vh',
                position: 'sticky',
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(10, 13, 22, 0.98)',
                borderRight: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(20px)',
                zIndex: 200,
                overflow: 'hidden',
            }}
        >
            {/* Logo Area */}
            <div
                style={{
                    padding: '1.75rem 1.5rem 1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #9945FF 100%)',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 4px 16px rgba(239,68,68,0.35)',
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                background: '#07090e',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Shield size={22} style={{ color: '#ef4444' }} />
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                fontWeight: 900,
                                fontSize: '0.95rem',
                                letterSpacing: '0.5px',
                                color: '#fff',
                                lineHeight: 1.2,
                            }}
                        >
                            SOLANA SYSTEM
                        </div>
                        <div
                            style={{
                                marginTop: '0.65rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.25rem 0.7rem',
                                borderRadius: '20px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                            }}
                        >
                            <div
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#14F195',
                                    boxShadow: '0 0 6px #14F195',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '0.67rem',
                                    color: '#fca5a5',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {config?.network || 'devnet'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    width: '100%',
                                    padding: '0.75rem 0.9rem',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: active
                                        ? 'linear-gradient(135deg, rgba(153,69,255,0.25) 0%, rgba(0,194,255,0.15) 100%)'
                                        : 'transparent',
                                    borderLeft: active ? '3px solid #9945FF' : '3px solid transparent',
                                    color: active ? '#ffffff' : '#94a3b8',
                                    textDecoration: 'none',
                                    position: 'relative',
                                }}
                                className={active ? '' : 'sidebar-nav-btn'}
                            >
                                <Icon
                                    size={18}
                                    style={{
                                        color: active ? '#14F195' : '#64748b',
                                        transition: 'color 0.2s ease',
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: '0.88rem',
                                        fontWeight: active ? 700 : 500,
                                        flex: 1,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {item.label}
                                </span>
                                {active && (
                                    <ChevronRight
                                        size={14}
                                        style={{ color: '#9945FF', opacity: 0.7 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Admin Info & Logout */}
            <div
                style={{
                    padding: '1rem 0.75rem 1.25rem',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                {admin && (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 0.9rem',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(239,68,68,0.4) 0%, rgba(153,69,255,0.4) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
                                    fontWeight: 800,
                                    color: '#fff',
                                    flexShrink: 0,
                                }}
                            >
                                {admin.name ? admin.name[0].toUpperCase() : 'A'}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        color: '#fff',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {admin.name || 'Admin'}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.72rem',
                                        color: '#64748b',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {admin.email}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={logout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                width: '100%',
                                padding: '0.65rem 0.9rem',
                                borderRadius: '12px',
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: '#fca5a5',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                            }}
                            className="sidebar-logout-btn"
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
};