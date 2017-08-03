require('dotenv').config();
import rp from 'request-promise';
import API from '../constants';
import throwConsole from './console';
import sendMail from './sendMail';

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
      const message = `🚀  deleted post in queue ${postInQueueId}`;
      throwConsole(message);
    }, (delPostError) => {
      const errMessage = `😭  error deleting post in queue ${postInQueueId} \n ${delPostError}`
      const isErr = true;
      throwConsole(errMessage, isErr);
      sendMail(errMessage).then(() =>
        process.exit(1)
      ).catch((mailErr) => {
        const message = `😭  error sending mail \n ${mailErr}`;
        const isErr = true;
        throwConsole(message, isErr)
        process.exit(1);
      });
    });
  }, (postNewsErr) => {
    const errMessage = `😭  error posting news \n ${postNewsErr}`
    const isErr = true;
    throwConsole(errMessage, isErr);
    sendMail(errMessage).then(() => {
      process.exit(1);
    }).catch((mailErr) => {
      const message = `😭  error sending mail \n ${mailErr}`;
      const isErr = true;
      throwConsole(errMessage, isErr);
      process.exit(1);
    });
  });

const apiHelper = {
  authOptions,
  createHttpOptions,
  postNewsArticle,
  deleteNewsQueuePost,
  handlePostAndDeleteArticle
};

export default apiHelper;
