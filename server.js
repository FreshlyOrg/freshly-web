//Get references to code in other files
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Activity = require('./server/activities/activityModel');
var multer = require('multer');

// BASIC SETUP
// ===========

//Defines mongo connection for azure deploy (or, failing that, for local deploy)
var mongooseConnectionURL = process.env.CUSTOMCONNSTR_MONGOLAB_URI || 'mongodb://localhost/freshly'
mongoose.connect(mongooseConnectionURL)

//Defines port for azure deploy (or, failing that, for local deploy)
var port = process.env.port || 8080;

//Parses incoming form data onto request.body

//Not strictly necessary, but nice to have for testing with Google's Postman tool
app.use(bodyParser.urlencoded({ extended: true }));

//The mobile app will primarily be sending data in JSON format
app.use(bodyParser.json());

//Accepts incoming form data (used to handle incoming files)
app.use(multer());

// STATIC FILE SERVING
// ===================
app.use('/', express.static(__dirname + '/public'));

// ALLOW CROSS ORIGIN REQUESTS
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE");
  next();
});


// ROUTES FOR API
// ==============
var router = express.Router();

//Base route--not strictly necessary
router.get('/', function(req, res) {
  res.json({ message: 'Welcome to the freshly API!' });
});

//Defines the activity routes--mongoose is passed in so images can be added/accessed
//using gridfs-stream (more info in activityRoutes.js)
var ActivityRoutes = require('./server/activities/activityRoutes.js');
var activityRouter = ActivityRoutes(mongoose);

// REGISTER ROUTES
// ===============

//Only used with the base route so far, so not strictly necessary at the moment
app.use('/api', router);

//All addresses starting with /api/activities will be handled by activityRouter
app.use('/api/activities', activityRouter);


// START SERVER
// ============
app.listen(port);
console.log('Listening on port ' + port);