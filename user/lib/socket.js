'use strict';

const emitToRoom = (room, event, data) => {
    if (global.io) {
        global.io.to(room).emit(event, data);
    };
};

const emitToUser = (userId, event, data) => {
    if (userId) {
        emitToRoom(`user_${userId.toString()}`, event, data);
    };
};

const emitGlobal = (event, data) => {
    if (global.io) {
        global.io.emit(event, data);
    };
};

module.exports = {
    emitToRoom,
    emitToUser,
    emitGlobal,
};