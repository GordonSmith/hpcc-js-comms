import rollup from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    entry: 'lib/index.js',
    dest: 'dist/hpcc-platform-comms.dev.js',
    format: 'umd',
    moduleName: 'HPCCPlatformComms',
    sourceMap: true,
    plugins: [
        nodeResolve({ jsnext: true, main: true }),
        commonjs({
            namedExports: { 'es6-promise': ["Promise"] }
        })
    ]
};