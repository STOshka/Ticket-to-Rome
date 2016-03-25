const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const precss = require('precss');

const PATHS = {
  app: path.resolve(__dirname, 'app', 'index.js'),
  build: path.resolve(__dirname, 'public', 'build'),
  node: path.resolve(__dirname, 'node_modules'),
};


const config = {

  devtool: 'eval',

  entry: [
    'webpack/hot/dev-server',
    'webpack-dev-server/client?http://localhost:8080',
    PATHS.app,
  ],

  output: {
    path: PATHS.build,
    filename: 'bundle.js',
    publicPath: '/build/',
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        exclude: [PATHS.node],
      },
      {
        test: /\.css$/,
        loaders: ['style', 'css', 'postcss'],
      },
    ],
  },

  postcss: () => [autoprefixer, precss],

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],

};

module.exports = config;
