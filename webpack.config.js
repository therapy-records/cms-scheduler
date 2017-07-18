var path = require('path');
const fs = require('fs');

// ensures that we don't get build errors from node_modules
const nodeExternals = require('webpack-node-externals');
let nodeModules = {};
fs.readdirSync('node_modules')
  .filter((x) => ['.bin'].indexOf(x) === -1)
  .forEach((mod) => {
    nodeModules[mod] = 'commonjs ' + mod;
  });

  
module.exports = {
  target: 'node',
  entry: './src/index.js',
  externals: [nodeExternals()],
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude:/(node_modules)/,
        loader: 'babel-loader',
      }
    ]
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  node: {
    console: true,
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
