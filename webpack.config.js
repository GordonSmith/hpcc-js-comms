const path = require('path');
const webpack = require('webpack');
const ModuleMappingPlugin = require('module-mapping-webpack-plugin');

const config = {
    entry: "./src/index.ts",
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, 'lib-browser'),
        filename: 'index.js',
        sourceMapFilename: 'index.map',
        library: "HPCCComms",
        libraryTarget: "umd"
    },
    resolve: {
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
    plugins: [
        new ModuleMappingPlugin({
            './src/platform/node.ts': './src/platform/browser.ts'
        })
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
        config.output.filename = 'index.min.js';
        delete config.devtool;
        delete config.output.sourceMapFilename;
        config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
        config.plugins.push(new webpack.optimize.UglifyJsPlugin());
        break;
    case "min-debug":
        config.output.filename = 'index.min-debug.js';
        delete config.devtool;
        delete config.output.sourceMapFilename;
        config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
        config.plugins.push(new webpack.optimize.UglifyJsPlugin({
            beautify: true,
            mangle: false
        }));
        break;
    case "test":
        config.entry = "./test/collections/stack.ts";
        config.output.filename = 'index.test.js';
        config.output.sourceMapFilename = 'index.test.map';
        config.module.rules[0].options.configFileName = "./tsconfig-test.json";
        break;
    default:
}

module.exports = config;
