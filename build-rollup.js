const rollup = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify');

const rollupPlugins = [
    nodeResolve({
        jsnext: true,
        main: true
    }),
    commonjs({
        namedExports: { 'es6-promise': ["Promise"] }
    })
];
const rollupMinPlugins = rollupPlugins.concat([uglify()]);

const rollupConfig = {
    entry: 'dist-es2015/index.js',
    plugins: rollupPlugins
};
rollupMinConfig = Object.assign({}, rollupConfig, { plugins: rollupMinPlugins });

const writeConfig = {
    format: 'umd',
    moduleName: 'HPCCPlatformComms',
    sourceMap: true
};

function doRollup(rollupConfig, writeConfig) {
    rollup.rollup(rollupConfig).then(bundle => {
        return bundle.write(writeConfig);
    }).then(() => {
        console.log(`${rollupConfig.entry} => ${writeConfig.dest}`);
    })
}

doRollup(rollupConfig, Object.assign({}, writeConfig, {
    dest: 'dist/hpcc-platform-comms.js'
}));

doRollup(rollupConfig, Object.assign({}, writeConfig, {
    dest: 'dist/hpcc-platformcomms.es2015.js',
    format: 'es'
}));

doRollup(rollupMinConfig, Object.assign({}, writeConfig, {
    dest: 'dist/hpcc-platform-comms.min.js'
}));
