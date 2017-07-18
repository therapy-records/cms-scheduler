import rp from 'request-promise';
import moment from 'moment';
import API from './constants';
import helpers from './helpers';

const sessionRange = {
  end: moment().add(8, 'hours')
};

const scheduler = () => {
  rp(API.LOGIN, helpers.authOptions).then((auth) => {
    const token = auth.token;
    const getOptions = helpers.createHttpOptions(token, 'GET');
    let postOptions = helpers.createHttpOptions(token, 'POST');
    let deleteOptions = helpers.createHttpOptions(token, 'DELETE');
    
    // if there any articles in the queue,
    // check if an article needs posting now (scheduledTime = now || beforeNow)
    // if an article's ascheduledTime is before the end of the session's range (8 hours)
    // wait for that time, and then do a POST.
    return rp(API.NEWS_QUEUE, getOptions).then((queueData) => {

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
    }, (getNewsErr) => {
      const message = '😭  error getting news \n' + getNewsErr;
      const isErr = true;
      helpers.throwConsole(message, isErr);
      process.exit(1);
    });

  }, (authErr) => {
    const message = '😭  error authenticating \n' + authErr;
    const isErr = true;
    helpers.throwConsole(message, isErr);
    process.exit(1);
  });
}

export default scheduler;
