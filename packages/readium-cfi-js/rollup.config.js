import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import {defineConfig} from 'rollup'
const pkg = require('./package.json');

const plugins = [
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    presets: ['@babel/preset-env']
  }),
  resolve(),
  commonjs({
    include: 'node_modules/**',
  }),
];

const standardConfig = defineConfig({
  input: 'src/index.js',
  output: [
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins,
});

const compatibilityConfig = defineConfig({
  input: 'src/index-compat.js',
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'EPUBcfi',
      sourcemap: true,
    },
  ],
  plugins,
});

export default [standardConfig, compatibilityConfig];
