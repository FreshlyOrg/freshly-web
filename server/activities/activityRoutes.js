module.exports = function(mongoose) {

  var express = require('express');
  var Activity = require('./activityModel.js');
  var Grid = require('gridfs-stream');
  var Busboy = require('busboy');

  //Used to parse and store incoming images
  Grid.mongo = mongoose.mongo;
  var gfs;
  mongoose.connection.once('open', function() {
    gfs = Grid(mongoose.connection.db);
  });

  var router = express.Router();

  router.route('/:activity_id/images/:image_number')
    .get(function(req, res) {
      Activity.findById(req.params.activity_id, function(err, activity) {
        if (err) {
          res.send(err);
          return;
        }

        var imageId = activity.imageIds[req.params.image_number];

        gfs.exist({'_id': imageId}, function(err, found) {
          if (err) {
            res.send(err);
            return;
          }
          
          if (found) {
            var readStream = gfs.createReadStream({'_id': imageId});
            readStream.pipe(res);
          } else {
            res.json({message: 'Image not found'});
          }
        });
      });
    });

  router.route('/:activity_id/images')
    //Adds an image and links it to the given activity
    .post(function(req, res) {
      Activity.findById(req.params.activity_id, function(err, activity) {
        if (err) {
          res.send(err);
          return;
        }

        try {

          //If the activity exists, add the image
          var busboy = new Busboy({headers: req.headers});
          var filePresent = false;

          busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
            filePresent = true;

            var writeStream = gfs.createWriteStream({
              filename: filename, 
              content_type: mimetype, 
              mode: 'w'
            });

            file.pipe(writeStream);
            writeStream.on("close", function(file) {

              activity.imageIds.push(file._id);

              //Save activity
              activity.save(function(err, activity) {
                //Return errors if necessary
                if (err) {
                  res.send(err);
                  return;
                }

                res.json({ 
                  message: 'Image added to activity',
                  activity_id: activity._id
                });
              });
            });
          });

          busboy.on('finish', function() {
            if (!filePresent) {
              res.json({
                message: 'Must upload a file'
              });
            }
          });

          req.pipe(busboy);
        } catch(err) {
          res.send({
            message: 'Invalid data sent: doing nothing.'
          });
        }

      });
    });

  router.route('/:activity_id')

    .get(function(req, res) {
      //Find activity
      Activity.findById(req.params.activity_id, function(err, activity) {
        
        //Return errors if necessary
        if (err) {
          res.send(err);
          return;
        }

        //Else returns activity object (JSON)
        res.json(activity);
      });
    })

    .put(function(req, res) {
      //Find activity
      Activity.findById(req.params.activity_id, function(err, activity) {

        //Return errors if necessary
        if (err) {
          res.send(err);
          return;
        }

        //Update activity
        activity.name = req.body.name;
        activity.description = req.body.description;
        activity.cost = req.body.cost;
        activity.time = req.body.time;
        activity.lat = req.body.lat;
        activity.lng = req.body.lng;
        activity.tags = req.body.tags;

        //Save activity
        activity.save(function(err) {

          //Return errors if necessary
          if (err) {
            res.send(err);
            return;
          }

          //Return message on success
          res.json({ 
            message: 'Activity updated: ' + activity._id,
            activity_id: activity._id
          });
        });
      });
    })

    .delete(function(req, res) {
      Activity.remove({
        _id: req.params.activity_id
      }, function(err, activity) {
        //Return errors if necessary
        if (err) {
          res.send(err);
          return;
        }

        //Return message on success
        res.json({ message: 'Successfully deleted' });
      });
    });

  //Handles interactions at /api/activities
  router.route('/')


    //Handles querying of all activities
    .get(function(req, res) {

      Activity.find(function(err, activities) {
        
        //Return errors if necessary
        if (err) {
          res.send(err);
          return;
        }

        //Return array of activity objects (JSON format)
        res.json(activities);
      });
    })

    //Handles creation of new activities
    .post(function(req, res) {

      //Create activity
      var activity = new Activity();
      activity.name = req.body.name;
      activity.description = req.body.description;
      activity.cost = req.body.cost;
      activity.time = req.body.time;
      activity.lat = req.body.lat;
      activity.lng = req.body.lng;
      activity.tags = req.body.tags;

      //Save activity
      activity.save(function(err, activity) {
        //Return errors if necessary
        if (err) {
          res.send(err);
          return;
        }

        //Return message on success
        res.json({ 
          message: 'Activity created: ' + activity._id,
          activity_id: activity._id
        });
      });

    });

    return router;
}
