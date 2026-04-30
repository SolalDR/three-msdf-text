// @ts-nocheck
import { createRequire } from 'module'
import dts from 'rollup-plugin-dts'
import alias from '@rollup/plugin-alias'

const require = createRequire(import.meta.url)
const tsconfig = require('../../tsconfig.json')
const pkg = require('../../package.json')

function resolveEntries() {
  return Object.entries(tsconfig.compilerOptions.paths).map(
    ([find, [replacement]]) => ({ find, replacement }),
  )
}

const glslStub = {
  name: 'glsl-stub',
  resolveId(id) {
    if (id.endsWith('.glsl')) return id
  },
  load(id) {
    if (id.endsWith('.glsl')) return 'export default ""'
  },
}

export default {
  input: 'src/index.ts',
  output: [
    { file: pkg.types, format: 'es' },
    { file: 'build/index.esm.d.ts', format: 'es' },
    { file: 'build/index.umd.d.ts', format: 'es' },
  ],
  plugins: [
    glslStub,
    alias({
      entries: resolveEntries(),
    }),
    dts({ tsconfig: './tsconfig.json' }),
  ],
}
