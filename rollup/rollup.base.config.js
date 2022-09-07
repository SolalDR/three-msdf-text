import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import external from 'rollup-plugin-peer-deps-external';
import ts from 'rollup-plugin-ts';
import glslify from 'rollup-plugin-glslify';
import tsconfig from '../tsconfig.json';

function resolveEntries() {
  return Object.entries(
    tsconfig.compilerOptions.paths
  ).map(([find, [replacement]]) => ({ find, replacement }));
}

export const input = 'src/index.ts';

export const isProduction = !process.env.ROLLUP_WATCH;

export const baseConfig = [
  external(),
  glslify(),
  json(),
  ts(),
  alias({
    resolve: ['.ts', '.tsx'],
    entries: resolveEntries(),
  }),
  commonjs({
    include: ['node_modules/**'],
  })
]
