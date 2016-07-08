var path = require('path');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var Promise = require('bluebird');

// environment variable?? 
mongoose.connect('mongodb://localhost:27017/shortly');

var Schema = mongoose.Schema;

var urlSchema = new Schema ({
  url: String,
  baseUrl: String,
  code: String,
  title: String,
  visits: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now}
});

var Link = mongoose.model('Link', urlSchema);

urlSchema.pre('save', function(next) {
  var shasum = crypto.createHash('sha1');
  shasum.update(this.url);
  this.code = shasum.digest('hex').slice(0, 5);
  next();
});

var userSchema = new Schema({
  username: String,
  password: String,
  createdAt: {type: Date, default: Date.now}
});

var User = mongoose.model('User', userSchema);

userSchema.pre('save', function(next) {
  var cipher = Promise.promisify(bcrypt.hash);
  return cipher(this.password, null, null).bind(this)
    .then(function(hash) {
      this.password = hash;
      next();
    });
});

User.prototype.comparePassword = function(attemptedPassword, callback) {
  bcrypt.compare(attemptedPassword, this.password, function(err, isMatch) {
    callback(err, isMatch);
  });
};

module.exports.Link = Link;
module.exports.User = User;