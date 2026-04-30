import rollupEsmConfig from './config/rollup/rollup.esm.config.js'
import rollupUmdConfig from './config/rollup/rollup.umd.config.js'
import rollupDemoConfig from './config/rollup/rollup.demo.config.js'
import rollupDtsConfig from './config/rollup/rollup.dts.config.js'

export default [rollupEsmConfig, rollupUmdConfig, ...rollupDemoConfig, rollupDtsConfig]
