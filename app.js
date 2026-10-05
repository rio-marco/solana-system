'use strict';

require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const { Server } = require('socket.io');
const cookieParser = require("cookie-parser");
const { RedisStore } = require("connect-redis");
const fileUpload = require("express-fileupload");
const expressLayouts = require("express-ejs-layouts");

const redisClient = require("./config/cache");
const constants = require('./config/constant');
const connectDB = require('./config/database');
const indexRouter = require('./routes/index.routes');
const generalLib = require('./utils/lib/general.lib');
const errorHandler = require("./utils/error-handler");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;

app.set('io', io);

io.on('connection', (socket) => {
    socket.on('joinRoom', (room) => {
        if (room) {
            socket.join(room);
        }
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload({ createParentPath: true }));
app.use(expressLayouts);

app.set("layout", "layouts/main");

app.use(express.static(path.join(__dirname, 'public')));

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
        // ...(isIpAddress ? {} : { domain: hostname }),
        domain: parsedUrl.hostname,
        sameSite: "Lax",
        maxAge: constants.SESSION_MAX_AGE,
    },
};

const redisStore = new RedisStore({
    client: redisClient,
    ttl: constants.SESSION_MAX_AGE,
});
sessionConfig.store = redisStore;

app.use(session(sessionConfig));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

if (process.env.NODE_ENV !== 'live') {
    app.use(morgan('dev'));
};

app.use("/", indexRouter);

errorHandler(app);

connectDB().then(() => {
    httpServer.listen(PORT, () => {
        generalLib.log1(["Server is running on PORT ----->", PORT]);
        generalLib.log1(["Server URL -----> ", process.env.NODE_URL]);
    });
}).catch((error) => {
    errorLog(["Error in connecting to database ----->", error]);
    return process.exit(1);
});

module.exports = app;