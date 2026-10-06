'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const next = require('next');
const connectDB = require('./lib/db');

const PORT = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';

const nextApp = next({ dev, dir: __dirname });
const nextHandler = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
    const app = express();
    const httpServer = http.createServer(app);
    const { Server } = require('socket.io');

    const io = new Server(httpServer, {
        cors: {
            origin: true,
            credentials: true,
        },
    });

    global.io = io;
    app.set('io', io);

    io.on('connection', (socket) => {
        socket.on('joinRoom', (room) => {
            if (room) {
                socket.join(room);
            }
        });
    });

    // Dynamic CORS headers for Localhost & IP 192.168.0.131
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        }
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        next();
    });

    app.use(cookieParser());


    // Static uploads directory for user profile images
    app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
    app.use(express.static(path.join(__dirname, 'public')));

    // Delegate all page and API requests to Next.js handler
    app.all('*', (req, res) => {
        return nextHandler(req, res);
    });

    await connectDB();

    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log('Next.js System running on PORT ----->', PORT);
        console.log('Local URL -----> http://localhost:' + PORT);
        console.log('Network IP URL -----> http://192.168.0.131:' + PORT);
    });
}).catch((err) => {
    console.error('Error starting Next.js server:', err);
    process.exit(1);
});
