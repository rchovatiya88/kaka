const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/shopify-entry.js',
  output: {
    filename: 'storybook-app-bundle.js',
    path: path.resolve(__dirname, '../public'),
    clean: false, // Don't clean the entire public directory
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.SHOPIFY_MODE': JSON.stringify(true),
    }),
  ],
  optimization: {
    minimize: true,
  },
  performance: {
    maxAssetSize: 1000000, // 1MB
    maxEntrypointSize: 1000000, // 1MB
  },
};
