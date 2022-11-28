import fs from 'fs'
import copy from 'rollup-plugin-copy'
import serve from 'rollup-plugin-serve'
import filesize from 'rollup-plugin-filesize'
import externalGlobals from 'rollup-plugin-external-globals'
import { baseConfig, isProduction } from './rollup.base.config'
import demos from '../demo/src/index.json'

const template = html`
  <html>
    <head>
      <title>Example {{name}} | three-msdf-text</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.143.0/three.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/tweakpane@3.1.0/dist/tweakpane.min.js"></script>
      <link rel="stylesheet" href="./index.css" />
    </head>
    <body>
      <canvas id="canvas"></canvas>
      <script defer src="./{{name}}.js"></script>
    </body>
  </html>
`

/**
 * Create a /public/demo if not exist
 */
if (!fs.existsSync(__dirname + `/public/demo`)) {
  fs.mkdirSync(__dirname + `/public/demo`, { recursive: true })
}

/**
 * For each demo, generate a HTML file and export the rollup config
 */
const demosConfig = demos.map((key) => {
  let demoTemplate = template.replaceAll('{{name}}', key)
  fs.writeFileSync(__dirname + `/public/demo/${key}.html`, demoTemplate)

  return {
    input: `demo/src/${key}.js`,
    output: {
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

let demoTemplate = template.replaceAll('{{name}}', 'basic')
fs.writeFileSync(__dirname + `/public/demo/index.html`, demoTemplate)

export default [
  {
    input: `demo/src/basic.js`,
    output: {
      file: `public/demo/index.js`,
      format: 'umd',
    },
    plugins: [
      ...baseConfig,
      isProduction && filesize(),
      copy({
        targets: [
          {
            src: 'demo/static/**/*',
            dest: 'public/demo/',
          },
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
