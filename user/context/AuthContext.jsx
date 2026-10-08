'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

axios.defaults.baseURL = '';
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ network: 'devnet', rpcUrl: 'https://api.devnet.solana.com' });

    const checkAuth = useCallback(async (showLoading = false) => {
        try {
            if (showLoading && !user) {
                setLoading(true);
            };

            const res = await axios.get('/api/user/me');
            if (res.data && res.data.flag && res.data.data) {
                setUser(res.data.data.user);
                if (res.data.data.network) {
                    setConfig({
                        network: res.data.data.network,
                        rpcUrl: res.data.data.rpcUrl,
                    });
                };
            } else {
                setUser(null);
            };
        } catch (err) {
            setUser(null);
        } finally {
            if (showLoading) {
                setLoading(false);
            };
        };
    }, [user]);

    const refreshUser = useCallback(async () => {
        try {
            const res = await axios.get('/api/user/me');
            if (res.data && res.data.flag && res.data.data) {
                setUser(res.data.data.user);
            };
        } catch (e) {
            // ignore
        };
    }, []);

    useEffect(() => {
        checkAuth(true);
    }, []);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await axios.post('/api/user/sign-out');
        } catch (e) {
            // ignore
        } finally {
            setUser(null);
        };
    };

    const updateUserData = (updatedFields) => {
        setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, config, login, logout, checkAuth, refreshUser, updateUserData }}>
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