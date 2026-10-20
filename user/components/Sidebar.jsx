'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Coins, ArrowDownLeft, ArrowUpRight, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const USER_NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { key: 'deposit', label: 'Deposit', icon: ArrowDownLeft, href: '/deposit' },
    { key: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, href: '/withdraw' },
    { key: 'campaign', label: 'Campaign', icon: Megaphone, href: '/campaign' },
];

export const Sidebar = () => {
    const { user, config } = useAuth();
    const pathname = usePathname();

    const isActive = (href) => {
        if (href === '/') return pathname === '/';
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <aside className="user-sidebar">
            <Link
                href="/"
                style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginTop: '0.85rem',
                    paddingLeft: '1.5rem',
                    paddingBottom: '1.2rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--solana-gradient)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: '100%', height: '100%', background: '#07090e', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Coins size={16} style={{ color: '#14F195' }} />
                    </div>
                </div>
                <div className="nav-brand-text">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.5px', color: '#fff' }}>SOLANA SYSTEM</span>
                    </div>
                    {/* <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(153,69,255,0.15)', color: '#9945FF', border: '1px solid rgba(153,69,255,0.3)', textTransform: 'uppercase', fontWeight: 700 }}>
                        {config?.network || 'devnet'}
                    </span> */}
                </div>
            </Link>

            <nav className="user-sidebar-nav">
                {USER_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`user-sidebar-item${active ? ' active' : ''}`}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};