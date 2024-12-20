const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const users = {};

io.on('connection', (socket) => {
    console.log('用户已连接:', socket.id);

    socket.on('setUsername', (username) => {
        users[socket.id] = username;
        console.log(`用户设置用户名: ${username} (${socket.id})`);
        socket.emit('message', { sender: '服务器', text: `你的用户名已设置为 ${username}` });
        socket.broadcast.emit('message', { sender: '服务器', text: `${username} 加入了聊天室！` });
        io.emit('updateUserList', Object.entries(users));
    });

    socket.on('chatMessage', (msg) => {
        const username = users[socket.id] || '匿名用户';
        console.log(`来自 ${username} (${socket.id}) 的消息:`, msg);
        io.emit('message', { sender: username, text: msg });
    });

    socket.on('privateMessage', ({ targetId, message }) => {
        const sender = users[socket.id] || '匿名用户';
        if (users[targetId]) {
            socket.to(targetId).emit('privateMessage', {
                sender,
                message,
            });
            console.log(`私聊消息: ${sender} -> ${users[targetId]}: ${message}`);
        } else {
            socket.emit('message', { sender: '服务器', text: '目标用户已离线或不存在。' });
        }
    });

    socket.on('fetchOnlineUsers', () => {
        socket.emit('updateUserList', Object.entries(users));
    });

    socket.on('disconnect', () => {
        const username = users[socket.id] || '匿名用户';
        console.log('用户已断开连接:', username, socket.id);
        io.emit('message', { sender: '服务器', text: `${username} 离开了聊天室。` });
        delete users[socket.id];
        io.emit('updateUserList', Object.entries(users));
    });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
