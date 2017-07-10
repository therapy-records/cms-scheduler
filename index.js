require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var app = express();
var methodOverride = require('method-override');
var morgan = require('morgan');
var rp = require('request-promise');
var port = process.env.PORT || 2000;
var API = require('./constants');
var articleHelper = require('./articleHelper');
app.use(function (req, res, next){
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST');
  methodOverride('X-HTTP-Method-Override');
  app.use(bodyParser.json({ limit: 1500 * 1500 * 20, type: 'application/json' }));
  bodyParser.urlencoded({ extended: true });
  next();
});

app.use(morgan('dev'));

app.listen(port);
console.log('Server running on port ' + port);

const authOptions = {
  method: 'POST',
  body: {
    username: process.env.NAME || '',
    password: process.env.SECRET || ''
  },
  json: true
};

function scheduler() {
  return rp(API.LOGIN, authOptions).then(function(auth) {
    const token = auth.token;
    return rp(API.NEWS).then(function(d) {
      const data = JSON.parse(d);
      const origArticle = data[3];
      const _article = articleHelper(origArticle);
      const postOptions = {
        method: 'POST',
        body: _article,
        json: true,
        headers: {
          Authorization: token
        }
      };
      return rp(API.POST_NEWS, postOptions).then(function(postData) {
        console.log('🚀 posted to news!', postData);

      }, function(postNewsErr) {
        console.log('😭 error posting news ', postNewsErr);
      });
      
    }, function(getNewsErr) {
      console.log('😭 error getting news ', getNewsErr);
    });
  }, function(authErr) {
    console.log('😭 error authenticating ', authErr);
  });
}

scheduler();
