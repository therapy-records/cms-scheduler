import articleHelper from './article';
import {
  authOptions,
  createHttpOptions,
  handlePostAndDeleteArticle
} from './api';
import throwConsole from './console';
import sendMail from './sendMail';

const helpers = {
  articleHelper,
  authOptions,
  createHttpOptions,
  handlePostAndDeleteArticle,
  throwConsole,
  sendMail
}

export default helpers;
