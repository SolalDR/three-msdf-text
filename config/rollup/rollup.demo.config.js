// @ts-nocheck
import { createRequire } from 'module'
import fs from 'fs'
import copy from 'rollup-plugin-copy'
import serve from 'rollup-plugin-serve'
import { baseConfig, isProduction } from './rollup.base.config.js'
import resolve from '@rollup/plugin-node-resolve'

// Demo files are plain JS — skip the TypeScript plugin and peer-deps-external
// (we bundle three.js directly since three 0.184+ has no UMD/global build)
const demoBaseConfig = baseConfig.filter(
  (p) =>
    p &&
    typeof p === 'object' &&
    p.name !== 'typescript' &&
    p.name !== 'peer-deps-external',
)

const require = createRequire(import.meta.url)
const demos = require('../../demo/src/demos.json')

const template = `
  <html>
    <head>
      <title>Example {{name}} | three-msdf-text</title>
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
if (!fs.existsSync(`public/demo`)) {
  fs.mkdirSync(`public/demo`, { recursive: true })
}

/**
 * For each demo, generate a HTML file and export the rollup config
 */
const demosConfig = demos.map((demo) => {
  let demoTemplate = template.replaceAll('{{name}}', demo.slug)
  fs.writeFileSync(`public/demo/${demo.output}`, demoTemplate)

  return {
    input: `demo/src/${demo.slug}.js`,
    output: {
      file: `public/demo/${demo.slug}.js`,
      format: 'umd',
    },
    plugins: [
      ...demoBaseConfig,
      resolve(),
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
      ...demoBaseConfig,
      resolve(),
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
        serve('public/demo') &&
        console.log('Server listening: localhost:10001'),
    ],
  },
  ...demosConfig,
]
