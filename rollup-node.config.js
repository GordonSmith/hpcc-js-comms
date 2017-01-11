import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    entry: 'dist-es2015/index.js',
    dest: 'dist/hpcc-platform-comms.node.js',
    format: 'umd',
    moduleName: 'HPCCPlatformComms',
    sourceMap: false,
    plugins: [
        nodeResolve({
            jsnext: true, main: true, skip: ['node_modules/**/*'],
        }),
        commonjs({
            namedExports: { 'es6-promise': ["Promise"] }
        })
    ]
};
