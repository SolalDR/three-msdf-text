import { ShaderLib } from 'three';

/**
 * Add MSDF chunks to THREE.ShaderLib to support TextGeometry
 */

Object.keys(ShaderLib).forEach(shaderName => {
  const shaderDef = ShaderLib[shaderName];
  
  if (shaderDef.fragmentShader.match('msdf')) return;
  
  shaderDef.fragmentShader = shaderDef.fragmentShader.replace(
    `#include <alphatest_pars_fragment>`, 
    `#include <alphatest_pars_fragment>\n#include <msdftest_pars_fragment>`
  )

  shaderDef.fragmentShader = shaderDef.fragmentShader.replace(
    `#include <alphatest_fragment>`,
    `#include <alphatest_fragment>\n#include <msdftest_fragment>`
  )

  shaderDef.vertexShader = shaderDef.vertexShader.replace(
    `#include <uv_pars_vertex>`,
    `#include <uv_pars_vertex>\n#include <msdf_glyph_uv_pars_vertex>`
  )
  
  shaderDef.vertexShader = shaderDef.vertexShader.replace(
    `#include <uv_vertex>`,
    `#include <uv_vertex>\n#include <msdf_glyph_uv_vertex>`
  )
})