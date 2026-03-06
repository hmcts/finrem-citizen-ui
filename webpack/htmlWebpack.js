const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const cssPath = path.resolve(__dirname, '../src/main/views/webpack/css-template.njk');
const jsPath = path.resolve(__dirname, '../src/main/views/webpack/js-template.njk');

const cssWebPackPlugin = new HtmlWebpackPlugin({
  template: cssPath,
  publicPath: '/',
  filename: '../views/webpack/css.njk',
  inject: false,
});

const jsWebPackPlugin = new HtmlWebpackPlugin({
  template: jsPath,
  publicPath: '/',
  filename: '../views/webpack/js.njk',
  inject: false,
});

module.exports = {
  plugins: [cssWebPackPlugin, jsWebPackPlugin],
};
