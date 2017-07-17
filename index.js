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
var helpers = require('./helpers');

const sessionRange = {
  end: moment().add(8, 'hours')
};

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
helpers.throwConsole('🚀  Server running on port ' + port);

function scheduler() {
  return rp(API.LOGIN, helpers.authOptions).then(function(auth) {
    const token = auth.token;
    const getOptions = helpers.createHttpOptions(token, 'GET');
    let postOptions = helpers.createHttpOptions(token, 'POST');
    let deleteOptions = helpers.createHttpOptions(token, 'DELETE');

    // if there any articles in the queue,
    // check if an article needs posting now (scheduledTime = now || beforeNow)
    // if an article's ascheduledTime is before the end of the session's range (8 hours)
    // wait for that time, and then do a POST.
    return rp(API.NEWS_QUEUE, getOptions).then(function(queueData) {

      if (queueData.length && queueData.length > 0) {
        queueData.map((postInQueue) => {
          const postInQueueScheduledTime = postInQueue.scheduledTime;
          const scheduledTime = moment(postInQueueScheduledTime).toISOString();
          let needsPostingIn8HourSession = moment(scheduledTime).isBetween(moment(), sessionRange.end);
          const currentTimeIsAfterScheduledTime = moment(scheduledTime).isBefore(moment());

          const needsPostingNow = currentTimeIsAfterScheduledTime;
          needsPostingIn8HourSession = false;

          let postInQueueId;

          if (needsPostingNow || currentTimeIsScheduledTime) {
            // create easy reference to the posts ID for api DELETE
            postInQueueId = postInQueue._id;
           
            // prep the article in the queue we want for api POST
            const _article = helpers.articleHelper(postInQueue);
            postOptions.body = _article;
          }

          if (needsPostingNow) {
            return this.handlePostAndDeleteArticle(postOptions, deleteOptions, postInQueueId);
          } else if (needsPostingIn8HourSession) {
            const currentTimeIsScheduledTime = false;

            if (currentTimeIsScheduledTime) {
              return this.handlePostAndDeleteArticle(postOptions, deleteOptions, postInQueueId);
            } else {
              helpers.throwConsole('need to wait for currentTimeIsScheduledTime in this session...');
              // still waiting for currentTimeIsScheduledTime in this session...
            }  
          }
        });
      } else {
        helpers.throwConsole('no posts in queue, all up to date!');
        process.exit(0); 
      }
    }, function(getNewsErr) {
      const message = '😭  error getting news \n' + getNewsErr;
      const isErr = true;
      helpers.throwConsole(message, isErr);
      process.exit(1);
    });
  }, function(authErr) {
    const message = '😭  error authenticating \n' + authErr;
    const isErr = true;
    helpers.throwConsole(message, isErr);
    process.exit(1);
  });
}

scheduler();
