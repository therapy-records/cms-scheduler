var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var app = express();
var methodOverride = require('method-override');
var morgan = require('morgan');
var port = process.env.PORT || 2000;

app.use(function (req, res, next){
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST');
  methodOverride('X-HTTP-Method-Override');
  bodyParser.urlencoded({ extended: true });
  next();
});

app.use(morgan('dev'));

app.listen(port);
console.log('Server running on port ' + port);
