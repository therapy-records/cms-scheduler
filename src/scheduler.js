import rp from 'request-promise';
import moment from 'moment';
import API from './constants';
import helpers from './helpers';

// TODO: tidy httpPostOptions & httpDeleteOptions usage!

let token;

const sessionRange = {
  end: moment().add(24, 'hours')
};

const handlePendingPosts = (pendingPosts, httpDeleteOptions) => {
  const now = moment();
  return pendingPosts.forEach((pendingPost, i) => {

    const postScheduledAt = moment(pendingPost.scheduledTime);
    const waitTimeInMs = postScheduledAt.diff(now);

    // prep the article for api post / handle old fields
    const _article = helpers.articleHelper(pendingPost);
    const httpPostOptions = helpers.createHttpOptions(token, 'POST', _article);
    helpers.throwConsole(`ready & waiting to post article '${_article.title}' @ ${_article.scheduledTime}`);

    // what if 2 posts posted for the same time? the second post would have a negative millisecond.
    // so probably add condition here - if scheduledAt is before *now* post now,
    // otherwise do MS things

    return setTimeout(() => {
      helpers.throwConsole(`time to post article ${_article._id}! @
                            ${now.format('MMMM Do YYYY, HH:mm:ss')}.
                            post's scheduledTime: ${pendingPost.scheduledTime}`);
      return helpers.handlePostAndDeleteArticle(httpPostOptions, httpDeleteOptions, pendingPost._id).then(() => {
        if (i + 1 === pendingPosts.length) {
          process.exit(0);
          helpers.throwConsole('🚀  all pendingPosts up to date!');
        }
      });
    }, waitTimeInMs);

  });
};

const schedulerSession = (sessionArr, httpPostOptions, httpDeleteOptions) => {
  const pendingPostsInSession = [];

  sessionArr.map((p) => {
    // conditions for posting immediately or during the scheduler session
    const scheduledTime = moment(p.scheduledTime).toISOString();
    const needsPostingDuringSession = moment(scheduledTime).isBetween(moment(), sessionRange.end);
    const currentTimeIsAfterScheduledTime = moment(scheduledTime).isBefore(moment().toISOString());

    const needsPostingNow = currentTimeIsAfterScheduledTime;
    const needsPostingInSession = needsPostingNow ||
                                  needsPostingDuringSession;

    // prep the article in the queue we want for api POST
    const _article = helpers.articleHelper(p);
    httpPostOptions.body = _article;

    // TODO: needsPostingNow not working - at 20:06,
    // posts with a scheduledTime of 20:00 were posted via pendingPosts
    if (needsPostingNow) {
      helpers.throwConsole(`posting an article immediately: ${p._id} (${p.title})`);
      return helpers.handlePostAndDeleteArticle(httpPostOptions, httpDeleteOptions, p._id);
    } else if (needsPostingDuringSession) {
      helpers.throwConsole(`an article needs posting during this session. Adding ${p._id} to pendingPosts`);
      return pendingPostsInSession.push(p);
    }
  });

  // failsafe to ensure that articles are ordered by scheduledTime
  pendingPostsInSession.sort((a, b) => {
    if (a.scheduledTime < b.scheduledTime) {
      return -1;
    }
    if (a.scheduledTime > b.scheduledTime) {
      return 1;
    }
    return 0;
  });

  return handlePendingPosts(pendingPostsInSession, httpDeleteOptions);
}

const scheduler = () => {
  rp(API.LOGIN, helpers.authOptions).then((auth) => {
    token = auth.token;
    const getOptions = helpers.createHttpOptions(token, 'GET');
    let httpPostOptions = helpers.createHttpOptions(token, 'POST');
    let httpDeleteOptions = helpers.createHttpOptions(token, 'DELETE');
    const sessionArr = [];

    // if there any articles in the queue,
    // check if an article needs posting now (scheduledTime = now || beforeNow)
    // if an article's scheduledTime is before the end of the session's range (8 hours? tbd)
    // wait for that time, and then do a POST.

    return rp(API.NEWS_QUEUE, getOptions).then((queueData) => {
      if (queueData.length && queueData.length > 0) {

        queueData.map((postInQueue) => {

          const scheduledBeforeSessionEnd = moment(postInQueue.scheduledTime).isBefore(sessionRange.end);

          if (scheduledBeforeSessionEnd) {
            sessionArr.push(postInQueue);
          }
        });

        if (sessionArr.length && sessionArr.length > 0) {
          helpers.throwConsole(`queue has ${queueData.length} items. ${sessionArr.length} post(s) for this session`);
          return schedulerSession(sessionArr, httpPostOptions, httpDeleteOptions);
        } else {
          helpers.throwConsole('queue has nothing scheduled for the duration of this session. All up to date!');
          process.exit(0);
        }

      } else {
        helpers.throwConsole('queue is empty. All up to date!');
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
