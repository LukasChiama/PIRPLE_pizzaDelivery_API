const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer(function(req, res){
  res.end('hello world\n');
})

server.listen(30, function(){
  console.log('server running on port 30');
})