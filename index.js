require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var app = express();
var methodOverride = require('method-override');
var morgan = require('morgan');
var rp = require('request-promise');
var port = process.env.PORT || 2000;
var moment = require('moment');
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


function createHttpOptions(token, body) {
  return {
    method: 'GET',
    json: true,
    body: body,
    headers: {
      Authorization: token
    }
  };
};

function scheduler() {
  return rp(API.LOGIN, authOptions).then(function(auth) {
    const token = auth.token;
    const getOptions = createHttpOptions(token);
    let postOptions = createHttpOptions(token);

    return rp(API.NEWS_QUEUE, getOptions).then(function(queueData) {
      // if there any articles in the queue,
      // check if an article needs posting now (scheduledTime = now || beforeNow)
      // if an article's ascheduledTime is before the end of the session's range (8 hours)
      // wait for that time, and then do a POST.
      if (queueData.length && queueData.length > 0) {
        queueData.map((postInQueue) => {

          const scheduledTime = moment(postInQueue.scheduledTime).toISOString();
          const sessionRange = {
            end: moment().add(8, 'hours')
          };

          let needsPostingIn8HourSession = moment(scheduledTime).isBetween(moment(), sessionRange.end);
          const currentTimeIsAfterScheduledTime = moment(scheduledTime).isBefore(moment());
          const needsPostingNow = currentTimeIsAfterScheduledTime;
          needsPostingIn8HourSession = false;

          if (needsPostingNow) {
            console.log('post needs posting now.')
          } else if (needsPostingIn8HourSession) {

            const currentTimeIsScheduledTime = false;

            if (currentTimeIsScheduledTime) {
              const _article = articleHelper(postInQueue);

              postOptions.body = _article;

              return rp(API.POST_NEWS, postOptions).then(function(postData) {
                console.log('🚀 posted new article to news!', postData);
                // todo: delete article in queue
                process.exit(1);
              }, function(postNewsErr) {
                console.log('😭 error posting news \n', postNewsErr);
                process.exit(1);
              });
            } else {
              console.log('need to wait for currentTimeIsScheduledTime in this session...');
              // still waiting for currentTimeIsScheduledTime in this session...
            }  
          }
        });
      } else {
        console.log('no posts in queue, all up to date!');
        process.exit(1); 
      }
      
    }, function(getNewsErr) {
      console.log('😭 error getting news \n', getNewsErr);
      process.exit(1);
    });
  }, function(authErr) {
    console.log('😭 error authenticating \n', authErr);
    process.exit(1);
  });
}

scheduler();
