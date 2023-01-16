const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
var session = require('express-session');
const passport = require('passport');
var findOrCreate = require('mongoose-findorcreate')
const passportLocalMongoose = require('passport-local-mongoose');
var GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const pass = process.env.PASSWORD;
mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://admin-rudra:" + pass + "@cluster0.fsn0ojs.mongodb.net/userDB");

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = mongoose.model('User', userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//get routes
app.get('/', function(req, res) {
    res.render('home');
});

app.get('/login', function(req, res) {
    if(req.isAuthenticated()){
        res.redirect('/secrets');
    } else {
        res.render('login');
    }
});

app.get('/register', function(req, res) {
    res.render('register');
});

app.get('/submit', function(req, res) {
    if(req.isAuthenticated()){
        res.render('submit');
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', function(req, res) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/secrets', function(req, res) {
    User.find({'secret': {$ne: null}}, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            if(user) {
                res.render('secrets', {usersWithSecret: user});
            }
        }
    });
});

//post routes
app.post('/register', function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect('/secrets');
            });
        }
    })
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/secrets',
    failureRedirect: '/login',
}));

app.post('/submit', function(req, res){
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, function(err, user){
        if (err) {
            console.log(err);
        } else {
            if (user) {
                user.secret = submittedSecret;
                user.save();
                res.redirect('/secrets');
            }
        }
    });
});


app.listen(process.env.PORT || 3000, function(){
    console.log('listening on port 3000');
});