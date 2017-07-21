var path = require('path');
var fs = require('fs');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');

// ensures that we don't get build errors from node_modules
var nodeExternals = require('webpack-node-externals');
var nodeModules = {};
fs.readdirSync('node_modules')
  .filter((x) => ['.bin'].indexOf(x) === -1)
  .forEach((mod) => {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  target: 'node',
  entry: './src/index.js',
  node: {
    console: true,
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
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
  plugins: [
    new UglifyJSPlugin()
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
