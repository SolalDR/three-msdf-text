import './shaders/chunk'

import { ShaderLib, Shader, MeshBasicMaterialParameters, WebGLRenderer } from 'three'; 

Object.keys(ShaderLib).forEach(shaderName => {
  const shaderDef = ShaderLib[shaderName];
  
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

interface MSDFMaterialOptions extends MeshBasicMaterialParameters {
  atlas: THREE.Texture
}

export function extendMaterial(material, { atlas }: MSDFMaterialOptions) {
  const state = {
    userCallback: null,
    msdfCallback: (shader : Shader, renderer: WebGLRenderer) => {
      if (!(shader as any).defines) (shader as any).defines = {}
      if (!shader.uniforms) shader.uniforms = {} as any

      (shader as any).defines.USE_MSDF_GEOMETRY = ''
      shader.uniforms.uAtlas = { value: atlas }

      console.log(shader);
      if (state.userCallback) state.userCallback(shader, renderer)
    },
  }

  Object.defineProperty(material, 'onBeforeCompile', {
    get () { 
      return state.msdfCallback
    },
    set (v) {
      state.userCallback = v;
    }
  });


  return material;
}
// export class MSDFBasicMaterial extends MeshBasicMaterial {
//   constructor(args: MSDFMaterialOptions) {
//     super(args)
//     extendMaterial(this, args)
//   }
// }

// export class MSDFStandardMaterial extends MeshStandardMaterial {
//   constructor(args: MSDFMaterialOptions) {
//     super(args)
//     extendMaterial(this, args)
//   }
// }