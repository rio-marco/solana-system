'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        let socketIo = null;
        if (user && user._id) {
            socketIo = io(window.location.origin, {
                transports: ['websocket', 'polling'],
                withCredentials: true,
            });

            socketIo.on('connect', () => {
                socketIo.emit('joinRoom', `user_${user._id}`);
            });

            setSocket(socketIo);
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }

        return () => {
            if (socketIo) {
                socketIo.disconnect();
            }
        };
    }, [user?._id]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};