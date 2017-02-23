const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

const config = {
    entry: ["./src/index.ts"],
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'hpcc-platform-comms.js',
        library: "HPCCPlatformComms",
        libraryTarget: "umd"
    },
    resolve: {
        alias: {
            "request$": "xhr"
        },
        extensions: [
            ".ts", ".js"
        ]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "awesome-typescript-loader",
                options: {
                }
            }
        ]
    },
    externals: {
        "xmldom": "window"
    },
    plugins: [
    ]
};

//  Uncomment for unittesting in webbrowser
// config.entry.push("./test/index.ts");
switch (process.env.NODE_ENV) {
    case "watch":
        config.watch = true;
        config.watchOptions = {
        };
        break;
    case "min":
        config.output.filename = 'hpcc-platform-comms.min.js';
        config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
        config.plugins.push(new webpack.optimize.UglifyJsPlugin());
        break;
    case "min-debug":
        config.output.filename = 'hpcc-platform-comms.min-debug.js';
        config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
        config.plugins.push(new webpack.optimize.UglifyJsPlugin({
            beautify: true,
            mangle: false
        }));
        break;
    case "test":
        config.entry = ["./test/index.ts"];
        config.output.filename = 'hpcc-platform-comms.test.js';
        config.module.rules[0].options.configFileName = "./tsconfig-test.json"
        break;
    default:
}

module.exports = config;
