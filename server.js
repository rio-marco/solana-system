'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const next = require('next');
const connectDB = require('./lib/db');
const { log1 } = require("./lib/general");

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


    app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
    app.use(express.static(path.join(__dirname, 'public')));

    app.all('*', (req, res) => {
        return nextHandler(req, res);
    });

    await connectDB();

    httpServer.listen(PORT, '0.0.0.0', () => {
        log1(['Next.js System running on PORT ----->', PORT]);
        log1(['Next.js System URL -----> ', process.env.NODE_URL]);
    });
}).catch((err) => {
    log1('Error starting Next.js server:', err);
    process.exit(1);
});
