import rollupEsmConfig from './rollup/rollup.esm.config';
import rollupUmdConfig from './rollup/rollup.umd.config';
import rollupDemoConfig from './rollup/rollup.demo.config';

export default [
  rollupEsmConfig,
  rollupUmdConfig,
	...rollupDemoConfig
];