'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

axios.defaults.baseURL = '';
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ network: 'devnet', rpcUrl: 'https://api.devnet.solana.com' });

    const checkAuth = useCallback(async (showLoading = false) => {
        try {
            if (showLoading && !admin) {
                setLoading(true);
            };

            const res = await axios.get('/api/admin/me');
            if (res.data && res.data.flag && res.data.data) {
                setAdmin(res.data.data.admin);
                if (res.data.data.network) {
                    setConfig({
                        network: res.data.data.network,
                        rpcUrl: res.data.data.rpcUrl,
                    });
                };
            } else {
                setAdmin(null);
            };
        } catch (err) {
            setAdmin(null);
        } finally {
            if (showLoading) {
                setLoading(false);
            };
        };
    }, [admin]);

    const refreshAdmin = useCallback(async () => {
        try {
            const res = await axios.get('/api/admin/me');
            if (res.data && res.data.flag && res.data.data) {
                setAdmin(res.data.data.admin);
            };
        } catch (e) {
            // ignore
        };
    }, []);

    useEffect(() => {
        checkAuth(true);
    }, []);

    const login = (adminData) => {
        setAdmin(adminData);
    };

    const logout = async () => {
        try {
            await axios.post('/api/admin/sign-out');
        } catch (e) {
            // ignore
        } finally {
            setAdmin(null);
        };
    };

    const updateAdminData = (updatedFields) => {
        setAdmin((prev) => (prev ? { ...prev, ...updatedFields } : prev));
    };

    return (
        <AuthContext.Provider value={{ admin, setAdmin, loading, config, login, logout, checkAuth, refreshAdmin, updateAdminData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    };

    return context;
};