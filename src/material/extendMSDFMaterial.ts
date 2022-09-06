import { MeshBasicMaterialParameters, WebGLRenderer } from 'three'; 
import { Shader } from '@/shaders/types/Shader';

export interface MSDFMaterialOptions extends MeshBasicMaterialParameters {
  atlas?: THREE.Texture
  threshold?: number
  stroke?: boolean
  strokeInnerWidth?: number
  strokeOuterWidth?: number
}

export function extendMSDFMaterial(material: THREE.Material, { 
  atlas, 
  threshold,
  stroke, 
  strokeInnerWidth = 0.5, 
  strokeOuterWidth = 0.0,
}: MSDFMaterialOptions = {}) {
  const state = {
    userCallback: null,
    msdfCallback: (shader: Shader, renderer: WebGLRenderer) => {
      const s = shader
      if (!s.defines) s.defines = {}
      if (!s.uniforms) s.uniforms = {}

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