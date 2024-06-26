var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var server_time = require('moment');
require('moment-timezone');
server_time.tz.setDefault('Asia/Seoul');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/chat.html');
});

const express = require('express');
app.use(express.static('public'));

let messageReactions = {};
let comments = {};

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('login', function (data) {
        console.log(
            'Client logged-in:\n name:' +
                data.name +
                '\n userid: ' +
                data.userid +
                '\n time:' +
                server_time().format('YYYY-MM-DD HH:mm:ss')
        );

        socket.name = data.name;
        socket.userid = data.userid;
        socket.enter_time = server_time().format('YYYY-MM-DD HH:mm:ss');

        io.emit('login', { name: this.name, enter_time: this.enter_time });
    });

    socket.on('chat', (data) => {
        console.log(
            'Message from %s: %s (%s)',
            socket.name,
            data.msg,
            server_time().format('YYYY-MM-DD HH:mm:ss')
        );
        socket.broadcast.emit('chat', {
            msg: data.msg,
            name: socket.name,
            msg_time: data.msg_time,
            count: 0,
        });
    });

    socket.on('base64', (data) => {
        console.log('base64 image received');
        socket.broadcast.emit('base64', {
            msg: data.base64,
            name: socket.name,
            msg_time: data.msg_time,
            count: 0,
        });
    });

    socket.on('like', (data) => {
        console.log('like:', data.msg_id);
        if (messageReactions[data.msg_id]) {
            messageReactions[data.msg_id].like++;
        } else {
            messageReactions[data.msg_id] = { like: 1, dislike: 0 };
        }
        io.emit('update', {
            msg_id: data.msg_id,
            action: 'like',
            count: messageReactions[data.msg_id].like,
        });
    });

    socket.on('dislike', (data) => {
        console.log('dislike:', data.msg_id);
        if (messageReactions[data.msg_id]) {
            messageReactions[data.msg_id].dislike++;
        } else {
            messageReactions[data.msg_id] = { like: 0, dislike: 1 };
        }
        io.emit('update', {
            msg_id: data.msg_id,
            action: 'dislike',
            count: messageReactions[data.msg_id].dislike,
        });
    });

    socket.on('comment', (data) => {
        if (!comments[data.msg_id]) {
            comments[data.msg_id] = [];
        }
        comments[data.msg_id].push({ name: socket.name, comment: data.comment });
        io.emit('newComment', { msg_id: data.msg_id, name: socket.name, comment: data.comment });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(3000, function () {
    console.log('Socket IO server listening on port 3000');
});
