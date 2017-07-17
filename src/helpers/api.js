var API = require('../constants');

const authOptions = {
  method: 'POST',
  body: {
    username: process.env.NAME || '',
    password: process.env.SECRET || ''
  },
  json: true
};

function createHttpOptions(token, method, body) {
  return {
    method: method,
    json: true,
    body: body,
    headers: {
      Authorization: token
    }
  };
};

function postNewsArticle(httpOptions) {
  return rp(API.POST_NEWS, httpOptions);
}

function deleteNewsQueuePost(postId, httpOptions) {
  return rp(API.NEWS_QUEUE + '/' + postId, httpOptions);
}

function handlePostAndDeleteArticle(postOptions, deleteOptions, postInQueueId) {
  return postNewsArticle(postOptions).then(function(postData) {
    const message = '🚀  posted new article to news! \n' + postData;
    helpers.throwConsole(message);
    return deleteNewsQueuePost(postInQueueId, deleteOptions).then(function(deletedPost) {
      const message = '🚀  deleted post in queue';
      helpers.throwConsole(message);
      process.exit(0);
    }, function(delPostError) {
      const message = '😭  error deleting post in queue \n' + delPostError
      const isErr = true;
      helpers.throwConsole(message, isErr);
      process.exit(1);
    });
  }, function(postNewsErr) {
    const message = '😭  error posting news \n' + delPostError
    const isErr = true;
    helpers.throwConsole(message, isErr);
    process.exit(1);
  });
}

module.exports = {
  authOptions,
  createHttpOptions,
  postNewsArticle,
  deleteNewsQueuePost,
  handlePostAndDeleteArticle
}
