const express = require('express');
const app = express();
var cors = require('cors')
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser');

const dbUsers = [
  {
    id: 1,
    user: 'user',
    password: 'password'
  }
]

const io = new Server(server, {  cors: {    origin: "http://localhost:3000",    methods: ["GET", "POST"],    allowedHeaders: ["my-custom-header"],    credentials: true  }});

app.use(cors())
app.use(bodyParser.json());

app.post('/login', (req, res) => {
  console.log(req.body)
  const user = dbUsers.find(x => x.user === req.body.username && x.password === req.body.password)
  if(user) {
    const token = jwt.sign({ id: user.id }, "123123123");
    return res.status(200).json({ token });
  }
  else {
    return res.status(401).json({ data: 'User/password incorrect'});
  }
});

const users = {}

io.use(function(socket, next) {
  
  console.log("socket.handshake.query:", JSON.stringify(socket.handshake.query));

  if (socket.handshake.query && socket.handshake.query.token){
    jwt.verify(socket.handshake.query.token, '123123123', function(err, decoded) {
      console.log('err:', err)
      if (err) return next(new Error('Authentication error'));
      socket.decoded = decoded;
      users[socket.id] = {
        userId: decoded.id
      }
      next();
    });
  }
  else {
    next(new Error('Authentication error'));
  }    
})
.on('connection', (socket) => {
  console.log("socket.id:", socket.id)

  users['socket.id'] = {}

  socket.broadcast.emit('hi');
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');  
  });

  socket.on('chat message', (msg) => {
    console.log('users')
    console.log(users)
    if((msg + "").includes("Para:")) {
      const indexOf = (msg + "").indexOf("Para:") + 5
      const socketId = (msg + "").substring(indexOf, 25)
      console.log('SocketId:', socketId)
      io.to(socketId).emit('chat message', msg);
    }
    else {
      io.emit('chat message', msg);
    }
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});