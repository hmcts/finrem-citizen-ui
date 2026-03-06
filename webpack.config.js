const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const sourcePath = path.resolve(__dirname, 'src/main/assets/js');
const govukFrontend = require(path.resolve(__dirname, 'webpack/govukFrontend'));
const scss = require(path.resolve(__dirname, 'webpack/scss'));
const HtmlWebpack = require(path.resolve(__dirname, 'webpack/htmlWebpack'));

const devMode = process.env.NODE_ENV !== 'production';
const fileNameSuffix = devMode ? '-dev' : '.[contenthash]';
const filename = `[name]${fileNameSuffix}.js`;

module.exports = {
  plugins: [...govukFrontend.plugins, ...scss.plugins, ...HtmlWebpack.plugins, new ForkTsCheckerWebpackPlugin()],
  entry: path.resolve(sourcePath, 'index.ts'),
  mode: devMode ? 'development' : 'production',
  context: __dirname,
  module: {
    rules: [
      ...scss.rules,
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            // Keep speed high by transpiling only
            transpileOnly: true,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
  },
  output: {
    path: path.resolve(__dirname, 'src/main/public/'),
    publicPath: '',
    filename,
  },
};
