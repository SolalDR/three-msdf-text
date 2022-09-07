import filesize from 'rollup-plugin-filesize';
import { terser } from 'rollup-plugin-terser';
import pkg from '../package.json';
import { baseConfig, isProduction, input } from './rollup.base.config';
import externalGlobals from "rollup-plugin-external-globals";

export default {
  input,
  output: { file: pkg.browser, name: 'Loader', format: 'umd' },
  plugins: [
    ...baseConfig,
    terser(),
    isProduction && filesize(),
    externalGlobals({
      three: "THREE"
    }),
  ],
}