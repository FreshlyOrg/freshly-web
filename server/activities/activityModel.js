var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

  created_at: { type: Date },
  updated_at: { type: Date }
});

//Adds timestamps
ActivitySchema.pre('save', function(next) {
  var now = new Date();
  this.updated_at = now
  if (!this.created_at) {
    this.created_at = now;
  }
  next();
})


module.exports = mongoose.model('FreshlyActivity', ActivitySchema);

