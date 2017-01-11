var webpackUglifyJsPlugin = require('webpack-uglify-js-plugin');
var path = require('path');

var libraryName = "hpcc-comms";

module.exports = {
    entry: {
        "bundle": "./src/index.ts",
        "bundle.min": "./src/index.ts",
    },
    output: {
        library: libraryName,
        libraryTarget: 'umd',
        umdNamedDefine: true,
        filename: "[name].js",
        path: __dirname + "/dist"
    },
    plugins: [
        new webpackUglifyJsPlugin({
            cacheFolder: path.resolve(__dirname, 'public/cached_uglify/'),
            debug: true,
            include: /\.min\.js$/,
            minimize: true,
            sourceMap: false,
            output: {
                comments: false
            },
            compressor: {
                warnings: false
            }
        })
    ],

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },

    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" }
        ],

        preLoaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, loader: "source-map-loader" }
        ]
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        //"d3-request": "request",
        //"react-dom": "ReactDOM"
    }
};