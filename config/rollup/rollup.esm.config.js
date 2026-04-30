// @ts-nocheck
import { createRequire } from 'module'
import filesize from 'rollup-plugin-filesize'
import { baseConfig, isProduction, input } from './rollup.base.config.js'

const require = createRequire(import.meta.url)
const pkg = require('../../package.json')

export default {
  input,
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'es' },
  ],
  plugins: [...baseConfig, isProduction && filesize()],
}
