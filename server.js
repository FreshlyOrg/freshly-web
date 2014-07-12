var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Activity = require('./server/activities/activityModel');

// BASIC SETUP
// ===========

var mongooseConnectionURL = process.env.CUSTOMCONNSTR_MONGOLAB_URI || 'mongodb://localhost/freshly'
mongoose.connect(mongooseConnectionURL)

//Defines port for azure deploy (and local deploy)
var port = process.env.port || 8080;

//Parses incoming form data onto request.body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// STATIC FILE SERVING
// ===================
app.use('/', express.static(__dirname + '/public'));


// ROUTES FOR API
// ==============
var router = express.Router();

//test route
router.get('/', function(req, res) {
  res.json({ message: 'Welcome to the freshly API!' });
});

var activityRouter = require('./server/activities/activityRoutes.js');

// REGISTER ROUTES
// ===============
app.use('/api', router);
app.use('/api', activityRouter);


// START SERVER
// ============
app.listen(port);
console.log('Listening on port ' + port);