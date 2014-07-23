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

      Q.ninvoke(Activity, 'findById', req.params.activity_id).then(function(activity) {
        if (!activity) {
          throw new Error('Activity does not exist!');
        }

        //Checks that the activity has an image at this index
        var imageId = activity.imageIds[req.params.image_number];
        if (!imageId) {
          throw new Error('Activity does not have this image!');
        }
        
        //Checks whether the given image id exists in the database
        return Q.ninvoke(gfs, 'exist', {'_id': imageId}).then(function(found) {
          if (!found) {
            throw new Error('Activity does not have an image with this ID!');
          }

          //Passes this object to the next .then() call
          return imageId;
        });

      }).then(function(imageId) {
        var readStream = gfs.createReadStream({'_id': imageId});
        readStream.pipe(res);
      }).catch(function(err) {
        res.send('Error: ' + err.message);
      });
    })

    //Overwrites a previously saved image with a new image
    .put(function(req, res) {

      Q.ninvoke(Activity, 'findById', req.params.activity_id).then(function(activity) {
        if (!activity) {
          throw new Error('Activity does not exist!');
        } else {
          return activity;
        }
      }).then(function(activity) {

        //Gets the specified imageID from the activity object
        var imageId = activity.imageIds[req.params.image_number];

        if (!imageId) {
          throw new Error('Activity does not have this image!');
        }

        //Checks whether the given image id exists in the database
        return Q.ninvoke(gfs, 'exist', {'_id': imageId}).then(function(found) {
          if (!found) {
            throw new Error('Activity does not have an image with this ID!');
          }

          //Passes this object to the next .then() call
          return {
            activity: activity,
            imageId: imageId
          };
        })

      }).then(function(infoObj) {
        //Updates the image
        
        //Busboy reads in the incoming file
        var busboy = new Busboy({headers: req.headers});

        //Prevents the server from hanging when no
        //file is passed
        var filePresent = false;

        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
          filePresent = true;

          //Creates a stream for writing the image to the database
          var writeStream = gfs.createWriteStream({
            //Including this _id property ensures that the currently-existing
            //image gets overwritten
            '_id': infoObj.imageId,
            filename: filename, 
            content_type: mimetype, 
            mode: 'w'
          });

          //Sends the file to the stream
          file.pipe(writeStream);

          //When the file finishes writing to the DB,
          //update the activity's imageIds and send
          //back a response
          writeStream.on("close", function(file) {
            res.json({
              message: 'Activity Image Updated!',
              activity: infoObj.activity,
              activity_id: infoObj.activity._id,
              image_index: req.params.image_number,
              image_id: file._id
            });
          });
        });

        //Only sends a response here if no file was passed
        busboy.on('finish', function() {
          if (!filePresent) {
            res.send('Error: Must send an image file!');
          }
        });

        //Sends the request object to busboy for handling
        req.pipe(busboy);
      }).catch(function(err) {
        res.send('Error: ' + err.message);
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
        //Busboy reads in the incoming file
        var busboy = new Busboy({headers: req.headers});

        //Prevents the server from hanging when no
        //file is passed
        var filePresent = false;

        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
          filePresent = true;

          //Creates a stream for writing the image to the database
          var writeStream = gfs.createWriteStream({
            filename: filename, 
            content_type: mimetype, 
            mode: 'w'
          });

          //Sends the file to the stream
          file.pipe(writeStream);

          //When the file finishes writing to the DB,
          //update the activity's imageIds and send
          //back a response
          writeStream.on("close", function(file) {
            activity.imageIds.push(file._id);
            Q.ninvoke(activity, 'save').then(function(activity) {
              res.json({
                message: 'Image saved to activity!',
                activity: activity,
                activity_id: activity._id,
                image_id: file._id
              });
            }).catch(function(err) {
              res.send('Error: ' + err.message);
            });
          });
        });

        //Only sends a response here if no file was passed
        busboy.on('finish', function() {
          if (!filePresent) {
            res.send('Error: Must send an image file!');
          }
        });

        //Sends the request object to busboy for handling
        req.pipe(busboy);

      }).catch(function(err) {
        res.send('Error: ' + err.message);
      });
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
