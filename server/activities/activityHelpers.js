module.exports = {
  //Used for activity PUT and POST requests
  updateActivityFromRequest: function(req, activity) {
    activity.name = req.body.name;
    activity.description = req.body.description;
    activity.cost = req.body.cost;
    activity.time = req.body.time;
    activity.lat = req.body.lat;
    activity.lng = req.body.lng;
    activity.tags = req.body.tags;
    return activity;
  }
};