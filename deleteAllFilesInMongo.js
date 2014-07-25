var mongoose = require('mongoose');
var Activity = require('./server/activities/activityModel');
var Grid = require('gridfs-stream');
var Q = require('q');

var mongooseConnectionURL = process.env.CUSTOMCONNSTR_MONGOLAB_URI || 'mongodb://localhost/freshly'
mongoose.connect(mongooseConnectionURL)

//Used to parse and store incoming images
Grid.mongo = mongoose.mongo;
var gfs;
mongoose.connection.once('open', function() {
  gfs = Grid(mongoose.connection.db);
  console.log('loaded');
  Q.ninvoke(gfs.files, 'find',{}).then(function(result) {
    return Q.ninvoke(result, 'toArray');
  }).then(function(result) {
    console.log(result);
    var arr = [];
    for (var i=0; i<result.length; i++) {
      var promise = Q.ninvoke(gfs, 'remove', {
        '_id': result[i]['_id']
      });
      arr.push(promise);
    }
    return Q.all(arr);
  }).then(function(result) {
    console.log('success');
  }).catch(function(err) {
    console.log('error');
  });
});

