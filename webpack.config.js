const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        'lib': './src/lib.ts',
    },
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.js',
        libraryTarget: 'umd',
        library: 'ContractWatcher',
        umdNamedDefine: true
    },
    resolve: {
        mainFields: ['browser', 'main'],
        extensions: [".webpack.js", ".web.js", '.wasm', '.mjs', '.ts', '.js'],
    },
    devtool: 'source-map',
    module: {
        rules: [{
            test: /\.m?js/,
            resolve: {
                fullySpecified: false
            }
        }, {
            test: require.resolve('./src/lib.ts'),
            use: [{
                loader: 'expose-loader',
                options: {
                    exposes: 'ContractWatcher'
                },
            }],
            exclude: [path.resolve(__dirname, "node_modules")],
        }, {
            test: /\.tsx?$/,
            loader: 'awesome-typescript-loader',
            exclude: [path.resolve(__dirname, "node_modules")],
            resolve: {
                fullySpecified: false
            },
        }]
    }
}
