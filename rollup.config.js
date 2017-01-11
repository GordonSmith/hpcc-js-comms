import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    entry: 'dist-es2015/index.js',
    dest: 'dist/hpcc-platform-comms.js',
    format: 'umd',
    moduleName: 'HPCCPlatformComms',
    sourceMap: false,
    plugins: [
        nodeResolve({ jsnext: true, main: true }),
        commonjs({
            namedExports: { 'es6-promise': ["Promise"] }
        })
    ]
};