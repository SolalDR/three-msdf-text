import filesize from 'rollup-plugin-filesize'
import { baseConfig, isProduction } from './rollup.base.config'
import copy from 'rollup-plugin-copy'
import serve from 'rollup-plugin-serve'
import externalGlobals from 'rollup-plugin-external-globals'
import demos from '../demo/src/index.json'
import fs from 'fs'

const template = fs.readFileSync(__dirname + '/demo/public/template.html', {
  encoding: 'utf8',
})

const demosConfig = demos.map((key) => {
  let demoTemplate = template.replaceAll('{{name}}', key)
  fs.writeFileSync(__dirname + `/public/demo/${key}.html`, demoTemplate)

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

fs.copyFileSync(
  __dirname + `/public/demo/basic.html`,
  __dirname + `/public/demo/index.html`,
)

export default [
  {
    input: `demo/src/basic.js`,
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
          { src: 'demo/public/**/*', dest: 'public/demo/' },
          {
            src: 'demo/public/basic.html',
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
