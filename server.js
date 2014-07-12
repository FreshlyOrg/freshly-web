var express = require('express');

var port = process.env.port || 8080;
var app = express();

app.get('/', function(req, res, next) {
  res.send('hi');
});

app.listen(port);