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
                width: '240px',
                minWidth: '240px',
                height: '100vh',
                position: 'sticky',
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                background: '#FFFFFF',
                borderRight: '1px solid #DEE2E6',
                zIndex: 200,
                overflow: 'hidden',
            }}
        >
            {/* Logo Area */}
            <div
                style={{
                    padding: '1.75rem 1.5rem 1.25rem',
                    borderBottom: '1px solid #DEE2E6',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '6px',
                                background: '#E7F1FF',
                                padding: '0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Shield size={22} style={{ color: '#0D6EFD' }} />
                    </div>
                    <div>
                        <div
                            style={{
                                fontWeight: 900,
                                fontSize: '0.95rem',
                                letterSpacing: '0.5px',
                                color: '#212529',
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
                                borderRadius: '6px',
                                background: '#F1F3F5',
                                border: '1px solid #DEE2E6',
                            }}
                        >
                            <div
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#198754',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '0.67rem',
                                    color: '#6C757D',
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
                                    padding: '0.65rem 0.9rem',
                                    borderRadius: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: active
                                        ? '#E7F1FF'
                                        : 'transparent',
                                    borderLeft: active ? '3px solid #0D6EFD' : '3px solid transparent',
                                    color: active ? '#0D6EFD' : '#212529',
                                    textDecoration: 'none',
                                    position: 'relative',
                                }}
                            >
                                <Icon
                                    size={18}
                                    style={{
                                        color: active ? '#0D6EFD' : '#6C757D',
                                        transition: 'color 0.2s ease',
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: '0.88rem',
                                        fontWeight: active ? 600 : 500,
                                        flex: 1,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Admin Info & Logout */}
            <div
                style={{
                    padding: '1rem 0.75rem 1.25rem',
                    borderTop: '1px solid #DEE2E6',
                }}
            >
                {admin && (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.65rem 0.9rem',
                                borderRadius: '6px',
                                background: '#F8F9FA',
                                border: '1px solid #DEE2E6',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <div
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                background: '#0D6EFD',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                color: '#FFFFFF',
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
                                        color: '#212529',
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
                                borderRadius: '6px',
                                background: '#FFFFFF',
                                border: '1px solid #DC3545',
                                color: '#DC3545',
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