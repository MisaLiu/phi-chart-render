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
const path = require('path');

module.exports = {
    mode: 'development',
    entry: '/src/index.js',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'script.js'
    },
    resolve: {
        alias: {
            '@': path.join(__dirname, './src')
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
    }
};