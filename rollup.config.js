import external from 'rollup-plugin-peer-deps-external';
import ts from 'rollup-plugin-ts';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import pkg from './package.json';
import glslify from 'rollup-plugin-glslify';
import json from '@rollup/plugin-json';
import tsconfig from './tsconfig.json';
import serve from 'rollup-plugin-serve';
import copy from 'rollup-plugin-copy'

const production = !process.env.ROLLUP_WATCH;

const input = 'src/index.ts';

function resolveEntries() {
  return Object.entries(
    tsconfig.compilerOptions.paths
  ).map(([find, [replacement]]) => ({ find, replacement }));
}

console.log(input, pkg, tsconfig)

export default [
  {
    input,
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
    ],
    plugins: [
      glslify(),
      external(),
      ts(),
      
      alias({
        resolve: ['.ts', '.tsx'],
        entries: resolveEntries(),
      }),
      commonjs({
        include: ['node_modules/**'],
      }),
      production && filesize(),
    ],
  },
  {
    input,
    output: { file: pkg.browser, name: 'Loader', format: 'umd' },
    plugins: [
      glslify(),
      external(),
      ts(),
      alias({
        resolve: ['.ts', '.tsx'],
        entries: resolveEntries(),
      }),
      resolve(),
      commonjs({
        include: ['node_modules/**'],
      }),
      terser(),
      production && filesize(),
    ],
	},
	{
		input: 'demo/src/index.js',
		output: {
			name: 'howLongUntilLunch',
			file: 'public/demo/index.js',
			format: 'umd'
		},
		plugins: [
      glslify(),
      json(),
      external(),
      ts(),
      alias({
        resolve: ['.ts', '.tsx'],
        entries: resolveEntries(),
      }),
      resolve(),
      commonjs({
        include: ['node_modules/**'],
      }),
      terser(),
      production && filesize(),
      copy({
        targets: [
          { src: 'demo/static/**/*', dest: 'public/demo/' }
        ]
      }),
      // serve(''),
			//resolve(), // so Rollup can find `ms`
			//commonjs() // so Rollup can convert `ms` to an ES module
		]
	},
];