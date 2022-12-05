import rollupEsmConfig from './config/rollup/rollup.esm.config'
import rollupUmdConfig from './config/rollup/rollup.umd.config'
import rollupDemoConfig from './config/rollup/rollup.demo.config'

export default [rollupEsmConfig, rollupUmdConfig, ...rollupDemoConfig]
