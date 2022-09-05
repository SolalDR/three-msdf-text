import './shaders/chunk'

import { ShaderLib, Shader, MeshBasicMaterialParameters, WebGLRenderer, Color } from 'three'; 

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

export interface MSDFMaterialOptions extends MeshBasicMaterialParameters {
  atlas?: THREE.Texture
  threshold?: number
  stroke?: boolean
  strokeInnerWidth?: number
  strokeOuterWidth?: number
}

export function extendMaterial(material: THREE.Material, { 
  atlas, 
  threshold,
  stroke, 
  strokeInnerWidth = 0.5, 
  strokeOuterWidth = 0.0,
}: MSDFMaterialOptions = {}) {
  const state = {
    userCallback: null,
    msdfCallback: (shader: Shader, renderer: WebGLRenderer) => {
      const s = shader as any
      if (!s.defines) s.defines = {}
      if (!s.uniforms) s.uniforms = {} as any

      const USE_THRESHOLD = threshold !== undefined
      const USE_STROKE = !!stroke;

      s.defines.USE_MSDF_GEOMETRY = ''
      s.uniforms.uAtlas = { value: atlas }

      if (USE_THRESHOLD) {
        s.defines.USE_THRESHOLD = ''
        s.uniforms.uThreshold = { value: threshold || 0.0 }
      }

      if (USE_STROKE) {
        s.defines.USE_STROKE = ''
        s.uniforms.uStrokeOuterWidth = { value: strokeOuterWidth }
        s.uniforms.uStrokeInnerWidth = { value: strokeInnerWidth }
      }

      console.log(s.uniforms)

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