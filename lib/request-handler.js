var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

// var db = require('../app/config');
var User = require('../app/config').User;
var Link = require('../app/config').Link;
// var Users = require('../app/collections/users');
//var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find({}).exec(function(err, links) {
    if (err) { console.log('fetchLinks', err); }
    res.status(200).send(links);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  Link.findOne({ url: uri }).exec(function(err, found) {
    if (err) { console.log('saveLink error: ', err); }
    if (found) {
      console.log('link found: ', found);
      res.status(200).send(found);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        var newLink = new Link({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        });
        newLink.save(function(err, newLink) {
          if (err) {
            return console.log(err);
          } else {
            console.log('newLink created: ', newLink);
            res.status(200).send(newLink);
          }
        });
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username }).exec(function(err, user) {
    if (err) { console.log('loginUser', err); }
    if (user) {
      user.comparePassword(password, function(err, match) {
        if (err) { console.error(err); }
        if (match) {
          util.createSession(req, res, user);
        } else {
          res.redirect('/login');
        }
      });
    } else {
      res.redirect('/login');
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username }).exec(function(err, user) {
    if (err) { console.log('signupUser', err); }
    if (user) {
      console.log('Account already exists');
      res.redirect('/signup');
    } else {
      var newUser = new User({
        username: username,
        password: password
      });
      newUser.save(function(err, newUser) {
        if (err) { console.log('signup new user', err); }
        util.createSession(req, res, newUser);
      });          
    }
  });
};

exports.navToLink = function(req, res) {
  Link.findOneAndUpdate({ code: req.params[0] }, {$inc: {visits: 1}}, function(err, link) {
    if (err) { console.log('navToLink', err); }
    if (!link) {
      res.redirect('/');
    } else {
      res.redirect(link.url);
    }
  });
};
