/*
 * @Author: git config user.name && git config user.email
 * @Date: 2022-07-17 20:27:06
 * @LastEditors: git config user.name && git config user.email
 * @LastEditTime: 2022-10-31 19:01:59
 * @FilePath: \phi-chart-render\webpack.config.js
 * @Description: 
 * 
 * Copyright (c) 2022 by ${git_name_email}, All Rights Reserved. 
 */
const path = require('path');
const SentryPlugin = require('@sentry/webpack-plugin');

module.exports = {
    mode: 'development',
    entry: '/src/index.js',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'script.js'
    },
    devServer: {
        client: {
            logging: 'info',
            progress: true,
            overlay: {
                errors: true,
                warnings: false
            }
        },
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 9000,
        open: true
    },
    plugins: [
        new SentryPlugin({
            release: true,
            include: './dist',
            ignoreFile: '.gitignore',
            ignore: [ 'node_modules', 'webpack.config.js' ]
        })
    ]
};