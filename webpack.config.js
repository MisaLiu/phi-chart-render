const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
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
};