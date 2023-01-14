const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.set('strictQuery', true);
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

//get routes
app.get('/', function(req, res) {
    res.render('home');
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.get('/register', function(req, res) {
    res.render('register');
});

//post routes
app.post('/register', function(req, res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save(function(err){
            if(err){
                console.log(err);
            } else {
                res.render('secrets');
            }
        });
    });
    
});

app.post('/login', function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if(result === true) {
                        res.render('secrets');
                    }
                    });
                };
        }
    });
});

app.listen(3000, function(){
    console.log('listening on port 3000');
});