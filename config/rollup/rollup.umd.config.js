// @ts-nocheck
import { createRequire } from 'module'
import filesize from 'rollup-plugin-filesize'
import terser from '@rollup/plugin-terser'
import { baseConfig, isProduction, input } from './rollup.base.config.js'
import externalGlobals from 'rollup-plugin-external-globals'

const require = createRequire(import.meta.url)
const pkg = require('../../package.json')

export default {
  input,
  output: { file: pkg.browser, name: 'Loader', format: 'umd' },
  plugins: [
    ...baseConfig,
    terser(),
    isProduction && filesize(),
    externalGlobals({
      three: 'THREE',
    }),
  ],
}
