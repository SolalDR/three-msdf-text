// @ts-nocheck
import { createRequire } from 'module'
import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import external from 'rollup-plugin-peer-deps-external'
import typescript from '@rollup/plugin-typescript'
import glslify from 'rollup-plugin-glslify'

const require = createRequire(import.meta.url)
const tsconfig = require('../../tsconfig.json')

function resolveEntries() {
  return Object.entries(tsconfig.compilerOptions.paths).map(
    ([find, [replacement]]) => ({ find, replacement }),
  )
}

export const input = 'src/index.ts'

export const isProduction = !process.env.ROLLUP_WATCH

export const baseConfig = [
  external(),
  glslify(),
  json(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
    outDir: 'build',
  }),
  alias({
    resolve: ['.ts', '.tsx'],
    entries: resolveEntries(),
  }),
  commonjs({
    include: ['node_modules/**'],
  }),
]
