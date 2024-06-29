const typescript = require('@rollup/plugin-typescript');
const {nodeResolve} = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');

module.exports = {
  input: 'main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default'
  },
  external: ['obsidian'],
  plugins: [
    typescript({tsconfig: './tsconfig.json'}),
    nodeResolve({browser: true}),
    commonjs(),
  ]
};