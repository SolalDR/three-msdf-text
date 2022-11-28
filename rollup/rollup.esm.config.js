import filesize from 'rollup-plugin-filesize'
import pkg from '../package.json'
import { baseConfig, isProduction, input } from './rollup.base.config'

/**
 * Output:
 * - index.d.ts
 * - index.js
 * - index.esm.js
 * - index.esm.d.ts
 */
export default {
  input,
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'es' },
  ],
  plugins: [...baseConfig, isProduction && filesize()],
}
