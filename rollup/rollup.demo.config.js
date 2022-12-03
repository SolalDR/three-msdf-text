import fs from 'fs'
import fsExtra from 'fs-extra'
import copy from 'rollup-plugin-copy'
import serve from 'rollup-plugin-serve'
import externalGlobals from 'rollup-plugin-external-globals'
import { baseConfig, isProduction } from './rollup.base.config'
import demos from '../demo/src/demos.json'

const template = `
  <html>
    <head>
      <title>Example {{name}} | three-msdf-text</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.143.0/three.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/tweakpane@3.1.0/dist/tweakpane.min.js"></script>
      <link rel="stylesheet" href="./assets/index.css" />
    </head>
    <body>
      <canvas id="canvas"></canvas>
      <script defer src="./{{name}}.js"></script>
      <a class="codeBtn" href="https://github.com/SolalDR/three-msdf-text/blob/master/demo/src/{{name}}.js">
        < / >
      </a>
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
const demosConfig = demos.map((demo) => {
  let demoTemplate = template.replaceAll('{{name}}', demo.slug)
  fs.writeFileSync(__dirname + `/public/demo/${demo.output}`, demoTemplate)

  return {
    input: `demo/src/${demo.slug}.js`,
    output: {
      file: `public/demo/${demo.slug}.js`,
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
    input: `demo/src/basic.js`,
    output: {
      file: `public/demo/basic.js`,
      format: 'umd',
    },
    plugins: [
      ...baseConfig,
      copy({
        targets: [
          {
            src: 'demo/assets/*',
            dest: 'public/demo',
          },
        ],
        flatten: false,
      }),
      !isProduction &&
        serve('') &&
        console.log('Server listening: localhost:10001'),
    ],
  },
  ...demosConfig,
]
