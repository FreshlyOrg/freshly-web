var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Tells mongoose the expected format for "activity"
//objects...this determines how they get saved in the Mongo DB
var ActivitySchema = new Schema({
  name: String,
  description: String,
  cost: String,
  time: String,
  lat: Number,
  lng: Number,
  tags: {
    type: Array,
    'default': []
  },
  imageIds: {
    type: Array,
    'default': []
  },
  created_at: { type: Date },
  updated_at: { type: Date }
});

//Adds/updates timestamps to activity objects before they
//are added to the database
ActivitySchema.pre('save', function(next) {
  var now = new Date();
  this.updated_at = now
  if (!this.created_at) {
    this.created_at = now;
  }
  next();
})

module.exports = mongoose.model('FreshlyActivity', ActivitySchema);

