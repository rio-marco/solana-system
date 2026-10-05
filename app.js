'use strict';

require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const { Server } = require('socket.io');

const constants = require('./config/constant');
const connectDatabase = require('./config/database');
const indexRouter = require('./routes/index.routes');
const Generallib = require('./utils/lib/general.lib');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.set('io', io);

io.on('connection', (socket) => {
    socket.on('joinRoom', (room) => {
        if (room) {
            socket.join(room);
        }
    });
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const parsedUrl = new URL(process.env.NODE_URL);
const hostname = parsedUrl.hostname;
const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

const sessionConfig = {
    name: constants.PLATFORM_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    proxy: true,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV !== "local",
        ...(isIpAddress ? {} : { domain: hostname }),
        sameSite: "Lax",
        maxAge: constants.SESSION_MAX_AGE,
    },
};

app.use(session(sessionConfig));

if (process.env.NODE_ENV !== 'live') {
    app.use(morgan('dev'));
}

app.use("/", indexRouter);

app.use((err, req, res, next) => {
    Generallib.log1(["[Global Error]------->", err.message]);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

(async () => {
    await connectDatabase();
    server.listen(PORT, () => {
        Generallib.log1(["Solana System running on------->", process.env.NODE_URL]);
    });
})();

module.exports = app;
