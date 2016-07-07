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
  Link.find({}, function(err, links) {
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

  Link.find({ url: uri }, function(err, found) {
    if (err) { console.log('saveLink', err); }
    if (found) {
      console.log(found);
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
          baseUrl: req.headers.origin,
          code: util.hashUrl(uri)
        });
        newLink.save(function(err, newLink) {
          if (err) {
            return console.log(err);
          } else {
            console.log(newLink);
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

  User.find({ username: username }, function(err, user) {
    if (err) { console.log('loginUser', err); }
    if (!user) {
      res.redirect('/login');
    } else {
      console.log('login user  ', user);
      util.comparePassword(password, user, function(match) {
        if (match) {
          util.createSession(req, res, user);
        } else {
          res.redirect('/login');
        }
      });
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.find({ username: username }, function(err, user) {
    if (err) { console.log('signupUser', err); }
    if (!user || user.length === 0) {
      var newUser = new User({
        username: username,
        password: password
      });
      newUser.hashPassword().then(function() {
        newUser.save(function(err, newUser) {
          if (err) { console.log('signup new user', err); }
          util.createSession(req, res, newUser);
        });          
      }); 
    } else {
      console.log('Account already exists');
      res.redirect('/signup');
    }
  });
};

exports.navToLink = function(req, res) {
  Link.find({ code: req.params[0] }, function(err, link) {
    if (err) { console.log('navToLink', err); }
    if (!link || link.length === 0) {
      res.redirect('/');
    } else {
      console.log('link -------', link);
      link.visits = link.visits + 1;
      link.save(function(err, link) { return res.redirect(link.url); });
    }
  });
};