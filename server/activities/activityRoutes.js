module.exports = function(mongoose) {

  var express = require('express');
  var Activity = require('./activityModel.js');
  var helpers = require('./activityHelpers.js');
  var Grid = require('gridfs-stream');
  var Busboy = require('busboy');
  var Q = require('q');

  //Used to parse and store incoming images
  Grid.mongo = mongoose.mongo;
  var gfs;
  mongoose.connection.once('open', function() {
    gfs = Grid(mongoose.connection.db);
  });

  var router = express.Router();

  //Used to handle routes pertaining to a specific image
  router.route('/:activity_id/images/:image_number')

    //Returns a file
    .get(function(req, res) {

      //Gets the activity, which will have a list of attached image IDs
      Activity.findById(req.params.activity_id, function(err, activity) {
        if (err) {
          res.send(err);
          return;
        }

        if (!activity) {
          res.json({ 
            message: 'Activity does not exist',
            activity_id: req.params.activity_id
          });
          return;
        }

        //Gets the image ID from the activity object and attempts
        //to retrieve and return the file with that ID
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
    })

    //Overwrites a previously saved image with a new image
    .put(function(req, res) {
      Activity.findById(req.params.activity_id, function(err, activity) {
        if (err) {
          res.send(err);
          return;
        }

        //Immediately returns if activity of the given ID is not found
        if (!activity) {
          res.json({ 
            message: 'Activity does not exist',
            activity_id: req.params.activity_id
          });
          return;
        }

        //Gets the specified imageID from the activity object
        var imageId = activity.imageIds[req.params.image_number];

        //Only updates the image if the imageID exists
        gfs.exist({'_id': imageId}, function(err, found) {
          if (err) {
            res.send(err);
            return;
          }
          
          //Updates the currently saved image
          if (found) {
            try {
              //If the activity exists, add the image
              var busboy = new Busboy({headers: req.headers});

              //Prevents the server from hanging when no
              //file is passed
              var filePresent = false;

              busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
                console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
                //If file is present, response will wait until the file is processed before sending back anything
                filePresent = true;

                var writeStream = gfs.createWriteStream({
                  //Need to set the ID here to make sure the original image is overwritten with this new one
                  '_id': imageId,
                  filename: filename, 
                  content_type: mimetype, 
                  mode: 'w'
                });

                file.pipe(writeStream);
                writeStream.on("close", function(file) {
                  res.json({ 
                    message: 'Activity image updated',
                    activity_id: activity._id
                  });
                });
              });

              //Only sends a response here if no file was passed
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
          } else {
            res.json({message: 'Image not found'});
          }
        });
      });
    });

  router.route('/:activity_id/images')


    //Adds an image and links it to the given activity
    .post(function(req, res) {

      Q.ninvoke(Activity, 'findById', req.params.activity_id).then(function(activity) {
        if (!activity) {
          throw new Error('Activity does not exist!');
        } else {
          return activity;
        }
      }).then(function(activity) {
        //Only uses the first file passed in (if more than one file is passed)
        var file;
        for (var filename in req.files) {
          file = req.files[filename];
          break;
        }

        //Throws an error if no file was passed in with the POST request
        if (!file) {
          console.log('throwing error');
          throw new Error('Must send an image file!');
        }

        res.json({
          message: file.mimetype
        });
        //Keeps track of whether busboy got a file
        //(if not, we can return a result when busboy "finishes",
        // otherwise we want to wait until the file is written to the
        // server so we can save its ID)
        // var fileReceived = false;

        // //Listens to a file event (runs only if file was passed to server)
        // busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

        //   //Creates a writestream to write the file to the database
        //   var writeStream = gfs.createWriteStream({
        //     filename: filename, 
        //     content_type: mimetype, 
        //     mode: 'w'
        //   });

        //   //Sends the file to the writestream
        //   file.pipe(writeStream);

        //   //When the writestream finishes with the file,
        //   //updates the activity's imageIds array
        //   writeStream.on("close", function(file) {

        //     activity.imageIds.push(file._id);

        //     //Save activity
        //     activity.save(function(err, activity) {
        //       //Return errors if necessary
        //       if (err) {
        //         res.send(err);
        //         return;
        //       }

        //       res.json({ 
        //         message: 'Image added to activity',
        //         activity_id: activity._id
        //       });
        //     });
        //   });
        // });

        // busboy.on('finish', function() {
        //   if (!filePresent) {
        //     res.json({
        //       message: 'Must upload a file'
        //     });
        //   }
        // });
      })

      .catch(function(err) {
        res.send('Error: ' + err.message);
      });


      // Activity.findById(req.params.activity_id, function(err, activity) {
      //   if (err) {
      //     res.send(err);
      //     return;
      //   }

      //   if (!activity) {
      //     res.json({ 
      //       message: 'Activity does not exist',
      //       activity_id: req.params.activity_id
      //     });
      //     return;
      //   }

      //   try {

      //     //If the activity exists, add the image
      //     var busboy = new Busboy({headers: req.headers});
      //     var filePresent = false;

          // busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

          //   var writeStream = gfs.createWriteStream({
          //     filename: filename, 
          //     content_type: mimetype, 
          //     mode: 'w'
          //   });

          //   file.pipe(writeStream);
          //   writeStream.on("close", function(file) {

          //     activity.imageIds.push(file._id);

          //     //Save activity
          //     activity.save(function(err, activity) {
          //       //Return errors if necessary
          //       if (err) {
          //         res.send(err);
          //         return;
          //       }

          //       res.json({ 
          //         message: 'Image added to activity',
          //         activity_id: activity._id
          //       });
          //     });
          //   });
          // });

          // busboy.on('finish', function() {
          //   if (!filePresent) {
          //     res.json({
          //       message: 'Must upload a file'
          //     });
          //   }
          // });

      //     req.pipe(busboy);
      //   } catch(err) {
      //     res.send({
      //       message: 'Invalid data sent: doing nothing.'
      //     });
      //   }

      // });
    });

  router.route('/:activity_id')

    .get(function(req, res) {

      Q.ninvoke(Activity, 'findById', req.params.activity_id).then(function(activity) {
        res.json(activity);
      }).catch(function(err) {
        res.send('Error: ' + err.message);
      });

    })

    .put(function(req, res) {

      Q.ninvoke(Activity, 'findById', req.params.activity_id).then(function(activity) {
        helpers.updateActivityFromRequest(req, activity);
        return Q.ninvoke(activity, 'save');
      }).then(function(activity) {
        res.json({
          message: 'Activity updated!',
          activity: activity,
          activity_id: activity._id
        });
      }).catch(function(err) {
        res.send('Error: ' + err.message);
      });

    })

    .delete(function(req, res) {
      //Deletes activity (after converting mongoose callback to a promise)
      Q.npost(Activity, 'findByIdAndRemove',[req.params.activity_id,{}]).then(function(activity) {
        res.json({
          message: 'Activity deleted!',
          activity: activity,
          activity_id: activity._id
        });
      }).catch(function(err) {
        res.send('Error: ' + err.message);
      });
    });

  //Handles interactions at /api/activities
  router.route('/')

    //Handles querying of all activities
    .get(function(req, res) {
      //Converts mongoose's find method to a promise
      Q.ninvoke(Activity, 'find').then(function(activities) {
        res.json(activities);
      }).catch(function(err) {
        res.send('Error: ' + err.message);
      });
    })

    //Handles creation of new activities
    .post(function(req, res) {

      //Create activity
      var activity = new Activity();

      //Update activity with passed-in values
      helpers.updateActivityFromRequest(req, activity);

      //Converts mongoose's "save" method to a promise
      Q.ninvoke(activity, 'save').then(function(activity) {
        //Sends a response when the promise resolves
        res.json({
          message: 'Activity created!',
          activity: activity,
          activity_id: activity._id
        });
      }).catch(function(err) {
        res.send('Error: ' + err.message);
      });
    });

    return router;
}
