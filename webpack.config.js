const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    background: './src/windows/background/background.ts',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
  output: {
    path: `${__dirname}/src/dist`,
    filename: '[name]/[name].js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/windows/background/background.html',
      filename: `${__dirname}/src/dist/background/background.html`,
      chunks: ['background'],
    }),
    new HtmlWebpackPlugin({
      template: './src/windows/desktop/desktop.html',
      filename: `${__dirname}/src/dist/desktop/desktop.html`,
      chunks: ['desktop'],
    }),
    new HtmlWebpackPlugin({
      template: './src/windows/in_game/in_game.html',
      filename: `${__dirname}/src/dist/in_game/in_game.html`,
      chunks: ['in_game'],
    }),
  ],
};
