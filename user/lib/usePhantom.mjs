'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const getPhantomProvider = () => {
    if (typeof window === 'undefined') return null;

    const phantomProvider = window.phantom?.solana;
    if (phantomProvider && phantomProvider.isPhantom) {
        return phantomProvider;
    };

    const legacyProvider = window.solana;
    if (legacyProvider && legacyProvider.isPhantom) {
        return legacyProvider;
    };

    return null;
};

export const usePhantom = () => {
    const [provider, setProvider] = useState(null);
    const [publicKey, setPublicKey] = useState(null);
    const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const providerRef = useRef(null);

    useEffect(() => {
        let detach = () => {};

        const attach = (detectedProvider) => {
            providerRef.current = detectedProvider;
            setProvider(detectedProvider);
            setIsPhantomInstalled(true);

            if (detectedProvider.publicKey) {
                setPublicKey(detectedProvider.publicKey.toString());
            };

            const handleConnect = () => {
                if (detectedProvider.publicKey) {
                    setPublicKey(detectedProvider.publicKey.toString());
                };
            };

            const handleDisconnect = () => {
                setPublicKey(null);
            };

            const handleAccountChange = (nextPublicKey) => {
                setPublicKey(nextPublicKey ? nextPublicKey.toString() : null);
            };

            if (typeof detectedProvider.on === 'function') {
                detectedProvider.on('connect', handleConnect);
                detectedProvider.on('disconnect', handleDisconnect);
                detectedProvider.on('accountChanged', handleAccountChange);

                detach = () => {
                    if (typeof detectedProvider.off === 'function') {
                        detectedProvider.off('connect', handleConnect);
                        detectedProvider.off('disconnect', handleDisconnect);
                        detectedProvider.off('accountChanged', handleAccountChange);
                    };
                };
            };
        };

        const detected = getPhantomProvider();
        if (detected) {
            attach(detected);
        } else {
            const timer = setTimeout(() => {
                const late = getPhantomProvider();
                if (late && !providerRef.current) {
                    attach(late);
                };
            }, 1000);

            detach = () => clearTimeout(timer);
        };

        return () => detach();
    }, []);

    const connect = useCallback(async () => {
        const activeProvider = providerRef.current || getPhantomProvider();

        if (!activeProvider) {
            throw new Error('Phantom wallet is not installed.');
        };

        providerRef.current = activeProvider;
        setProvider(activeProvider);
        setIsPhantomInstalled(true);
        setConnecting(true);

        try {
            const response = await activeProvider.connect();
            const connectedKey = response?.publicKey || activeProvider.publicKey;
            const keyString = connectedKey ? connectedKey.toString() : null;

            setPublicKey(keyString);
            return keyString;
        } finally {
            setConnecting(false);
        };
    }, []);

    const disconnect = useCallback(async () => {
        const activeProvider = providerRef.current || getPhantomProvider();

        try {
            if (activeProvider && typeof activeProvider.disconnect === 'function') {
                await activeProvider.disconnect();
            };
        } catch (e) {
            // Ignore disconnect failures; state is cleared below regardless.
        } finally {
            setPublicKey(null);
        };
    }, []);

    return {
        provider: provider || providerRef.current,
        publicKey,
        isPhantomInstalled,
        connecting,
        connect,
        disconnect,
    };
};