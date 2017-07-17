var path = require('path');

module.exports = {
  target: 'node',
  entry: './src/index.js',
  resolve: {
    modules: [
      path.join(__dirname, './src/helpers/*.js'),
      path.join(__dirname, './node_modules')
    ]
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  node: {
    fs: "empty"
  }
};
