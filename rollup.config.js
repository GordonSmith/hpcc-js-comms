const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

export default {
    entry: 'dist-es2015/index.js',
    format: 'umd',
    moduleName: 'HPCCComms',
    dest: 'dist-dev/bundle.js',
    plugins: [
        nodeResolve({
            jsnext: true,
            main: true
        }),
        commonjs({
            namedExports: { 'es6-promise': ["Promise"] }
        })
    ]
};
