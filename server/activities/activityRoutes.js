var express = require('express');
var Activity = require('./activityModel.js');

var router = express.Router();

router.route('/activities/:activity_id')

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
router.route('/activities')
  
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

  module.exports = router;