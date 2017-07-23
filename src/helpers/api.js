require('dotenv').config();
import rp from 'request-promise';
import API from '../constants';
import throwConsole from './console';

export const authOptions = {
  method: 'POST',
  body: {
    username: process.env.NAME || '',
    password: process.env.SECRET || ''
  },
  json: true
};

export const createHttpOptions = (token, method, body) => {
  return {
    method: method,
    json: true,
    body: body,
    headers: {
      Authorization: token
    }
  };
};

const postNewsArticle = (httpOptions) =>
  rp(API.POST_NEWS, httpOptions);

const deleteNewsQueuePost = (postId, httpOptions) => 
  rp(API.NEWS_QUEUE + '/' + postId, httpOptions);

export const handlePostAndDeleteArticle = (postOptions, deleteOptions, postInQueueId) =>
  postNewsArticle(postOptions).then((postData) => {
    const message = '🚀  posted new article to news! \n' + postData;
    throwConsole(message);
    return deleteNewsQueuePost(postInQueueId, deleteOptions).then((deletedPost) => {
      const message = '🚀  deleted post in queue';
      throwConsole(message);
      process.exit(0);
    }, (delPostError) => {
      const message = '😭  error deleting post in queue \n' + delPostError
      const isErr = true;
      throwConsole(message, isErr);
      process.exit(1);
    });
  }, (postNewsErr) => {
    const message = '😭  error posting news \n' + delPostError
    const isErr = true;
    throwConsole(message, isErr);
    process.exit(1);
  });

const apiHelper = {
  authOptions,
  createHttpOptions,
  postNewsArticle,
  deleteNewsQueuePost,
  handlePostAndDeleteArticle
};

export default apiHelper;
