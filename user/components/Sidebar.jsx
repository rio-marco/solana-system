'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowDownLeft, ArrowUpRight, Megaphone } from 'lucide-react';

export const USER_NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { key: 'deposit', label: 'Deposit', icon: ArrowDownLeft, href: '/deposit' },
    { key: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, href: '/withdraw' },
    { key: 'campaign', label: 'Campaign', icon: Megaphone, href: '/campaign' },
];

export const Sidebar = () => {
    const pathname = usePathname();

    const isActive = (href) => {
        if (href === '/') return pathname === '/';
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <aside className="user-sidebar">
            <span className="user-sidebar-title">Menu</span>
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
        </aside>
    );
};