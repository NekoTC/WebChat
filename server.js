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

    socket.on('setUsername', (data) => {
        const { username, email, avatar } = data;
        users[socket.id] = { username, email, avatar };
        console.log(`用户设置: ${username} (${socket.id}), 头像: ${avatar}`);

        socket.emit('message', { sender: '服务器', text: `你的用户名已设置为 ${username}`, avatar });
        socket.broadcast.emit('message', { sender: '服务器', text: `${username} 加入了聊天室！`, avatar });
        io.emit('updateUserList', Object.entries(users));
    });

    socket.on('chatMessage', (msg) => {
        const user = users[socket.id] || { username: '匿名用户', avatar: '' };
        console.log(`来自 ${user.username} (${socket.id}) 的消息:`, msg);
        io.emit('message', { sender: user.username, text: msg, avatar: user.avatar });
    });

    socket.on('disconnect', () => {
        const user = users[socket.id] || { username: '匿名用户', avatar: '' };
        console.log('用户已断开连接:', user.username, socket.id);
        io.emit('message', { sender: '服务器', text: `${user.username} 离开了聊天室。`, avatar: '' });
        delete users[socket.id];
        io.emit('updateUserList', Object.entries(users));
    });
    socket.on('typing', (username) => {
        io.emit('userTyping', username); // 广播给所有用户，包括本人
    });

// 处理“停止输入”事件
    socket.on('stopTyping', (username) => {
        io.emit('userStopTyping', username); // 广播给所有用户，包括本人
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
