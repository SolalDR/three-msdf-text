import filesize from 'rollup-plugin-filesize'
import { baseConfig, isProduction } from './rollup.base.config'
import copy from 'rollup-plugin-copy'
import serve from 'rollup-plugin-serve'
import externalGlobals from 'rollup-plugin-external-globals'

const demos = ['basic', 'standard', 'stroke']

const demosConfig = demos.map(key => {
  return {
    input: `demo/src/${key}.js`,
    output: {
      name: 'howLongUntilLunch',
      file: `public/demo/${key}.js`,
      format: 'umd',
    },
    plugins: [
      ...baseConfig,
      externalGlobals({
        three: 'THREE',
      }),
    ],
  }
})

export default [
  {
    input: `demo/src/index.js`,
    output: {
      name: 'howLongUntilLunch',
      file: `public/demo/index.js`,
      format: 'umd',
    },
    plugins: [
      ...baseConfig,
      isProduction && filesize(),
      copy({
        targets: [
          { src: 'demo/static/**/*', dest: 'public/demo/' },
          {
            src: 'demo/static/basic.html',
            dest: 'public/demo/',
            rename: 'index.html',
          },
        ],
      }),
      !isProduction &&
        serve('') &&
        console.log('Server listening: localhost:10001'),
    ],
  },
  ...demosConfig,
]
