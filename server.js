'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const urlExists = require('url-exists');

let app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.urlencoded({extended: false}));
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

//Connect db and create model
mongoose.connect(process.env.MONGO_URI);
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  originalUrl: {type: String, required: true, unique: true},
  newUrl: {type: Number, required: true, unique: true}
});
const Url = mongoose.model("Url", urlSchema);

//Receive url and create shorter url
app.post("/api/shorturl/new", (req, res, next) => {    
  urlExists(req.body.url, function(err, exists) { //Checks if the url actually exists
    if(exists)
      Url.find({originalUrl: req.body.url}, (err, urls) => {
        if(urls.length) //Url already exists 
          res.json({originalUrl: urls[0].originalUrl, newUrl: urls[0].newUrl});
        else //A new url must be created
          Url.countDocuments({}, (err, count) => { //Get the number of urls to increment the id
            if(err) next(err); //If an error occured
            new Url({
              originalUrl: req.body.url,
              newUrl: count
            }).save((err, url) => res.json({originalUrl: url["originalUrl"], newUrl: url["newUrl"]}));
          });
      });
    else 
      res.json({"error":"invalid URL"});
  });  
});

//Accesing to a shorter url
app.get("/api/shorturl/:shortUrl?", (req, res, next) => {
  Url.find({newUrl: parseInt(req.params.shortUrl)}, (err, urls) => {
    if(urls.length) 
      res.redirect(urls[0].originalUrl);
  });
});

const listener = app.listen(port, function () {
  console.log('Node.js listening at port', listener.address().port);
});