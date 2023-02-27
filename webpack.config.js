/*
 * @Author: git config user.name && git config user.email
 * @Date: 2022-07-17 20:27:06
 * @LastEditors: git config user.name && git config user.email
 * @LastEditTime: 2022-10-31 19:23:29
 * @FilePath: \phi-chart-render\webpack.config.js
 * @Description: 
 * 
 * Copyright (c) 2022 by ${git_name_email}, All Rights Reserved. 
 */
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');
const GitRevision = new GitRevisionPlugin({ versionCommand: 'describe --always --tags' });
const path = require('path');

module.exports = {
    entry: path.join(__dirname, 'src/index.js'),
    devtool: 'source-map',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'script-[git-revision-version].js'
    },
    resolve: {
        alias: {
            '@': path.join(__dirname, 'src')
        }
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
        GitRevision,
        new webpack.DefinePlugin({
            GIT_VERSION: JSON.stringify(GitRevision.version())
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'public/index.html'),
            filename: path.join(__dirname, 'dist/index.html'),
            inject: 'body'
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [{ loader: 'babel-loader' }]
            }
        ]
    }
};