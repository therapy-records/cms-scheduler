// TODO: update to es6

// preps an object ready for API post
const articleHelper = (article) => {
  // handle old post schemas (mainBody is required)
  if (article.mainBody) {
    article.bodyMain = article.mainBody;
    delete article.mainBody;
  }
  // remove queue related db fields
  delete article._id;
  delete article.__v;
  return article;
}

export default articleHelper;
