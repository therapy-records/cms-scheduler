import rp from 'request-promise';
import moment from 'moment';
import API from './constants';
import helpers from './helpers';

const sessionRange = {
  end: moment().add(24, 'hours')
};

const schedulerSessionPosts = (sessionArr, httpPostOptions, httpDeleteOptions) =>
  sessionArr.map((p) => {

    const postId = p._id; // easy reference to the posts ID

    // prep the article in the queue we want for api POST
    const _article = helpers.articleHelper(p);
    httpPostOptions.body = _article;

    // checks & conditions for posting immediately or during the scheduler session
    const scheduledTime = moment(p.scheduledTime).toISOString();
    const needsPostingDuringSession = moment(scheduledTime).isBetween(moment(), sessionRange.end);
    const currentTimeIsAfterScheduledTime = moment(scheduledTime).isBefore(moment());

    const needsPostingNow = currentTimeIsAfterScheduledTime;
    const needsPostingInSession = needsPostingNow ||
                                  needsPostingDuringSession;
  
    if (needsPostingNow) {
      helpers.throwConsole(`posting article ${postId} (${p.title})`);
      return helpers.handlePostAndDeleteArticle(httpPostOptions, httpDeleteOptions, postId);
    } else if (needsPostingDuringSession) {
      helpers.throwConsole(`waiting to post article ${postId} (${p.title})`);
      return helpers.throwConsole('wait and check currentTimeIsScheduledTime in this session...');
    }

  });

const scheduler = () => {
  rp(API.LOGIN, helpers.authOptions).then((auth) => {
    const token = auth.token;
    const getOptions = helpers.createHttpOptions(token, 'GET');
    let httpPostOptions = helpers.createHttpOptions(token, 'POST');
    let httpDeleteOptions = helpers.createHttpOptions(token, 'DELETE');
    const sessionArr = [];
    
    // if there any articles in the queue,
    // check if an article needs posting now (scheduledTime = now || beforeNow)
    // if an article's ascheduledTime is before the end of the session's range (8 hours)
    // wait for that time, and then do a POST.

    return rp(API.NEWS_QUEUE, getOptions).then((queueData) => {
      if (queueData.length && queueData.length > 0) {
        helpers.throwConsole(`queue has ${queueData.length} items`);
        queueData.map((postInQueue) => {

          const scheduledTime = moment(postInQueue.scheduledTime).toISOString();
          const scheduledBeforeSessionEnd = moment(scheduledTime).isBefore(sessionRange.end);

          if (scheduledBeforeSessionEnd) {
            sessionArr.push(postInQueue);
          }
        });
        if (sessionArr.length && sessionArr.length > 0) {
          helpers.throwConsole(`${queueData.length} items to be posted during this session`);
          return schedulerSessionPosts(sessionArr, httpPostOptions, httpDeleteOptions);
        }
      } else {
        helpers.throwConsole('queue is empty, all up to date!');
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
