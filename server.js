var express = require('express');
var socket = require('socket.io');
var http = require('http')
var app = express();
var server = http.createServer(app)
var io = require('socket.io').listen(server);

// Configure the server to use static content (the Cargo-Webpage)
app.configure(function () {
  app.use(
    "/", //the URL throught which you want to access to you static content
    express.static(__dirname) //where your static content is located in your filesystem
  );
});

server.listen(8081);
console.log("Started listening on Port 8081");

// Handle Client connection
io.sockets.on('connection', function (socket) {
  socket.on('myEvent', function (data) {
    console.log(data);
  });
});