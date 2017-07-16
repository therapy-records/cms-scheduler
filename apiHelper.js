var API = require('./constants');

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
    console.log('🚀 posted new article to news! \n', postData);
    return deleteNewsQueuePost(postInQueueId, deleteOptions).then(function(deletedPost) {
      console.log('🚀 deleted post in queue');
      process.exit(0);
    }, function(delPostError) {
      console.error('😭 error deleting post in queue \n', delPostError);
      process.exit(1);
    });

  }, function(postNewsErr) {
    console.error('😭 error posting news \n', postNewsErr);
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
