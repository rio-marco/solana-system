'use client';

import React from 'react';
import { LayoutDashboard, ArrowDownLeft, ArrowUpRight, Megaphone } from 'lucide-react';

export const USER_NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'deposit', label: 'Deposit', icon: ArrowDownLeft },
    { key: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
    { key: 'campaign', label: 'Campaign', icon: Megaphone },
];

export const Sidebar = ({ activeTab, onTabChange }) => {
    return (
        <aside className="user-sidebar">
            <span className="user-sidebar-title">Menu</span>
            {USER_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => onTabChange(item.key)}
                        className={`user-sidebar-item${isActive ? ' active' : ''}`}
                    >
                        <Icon size={18} />
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </aside>
    );
};