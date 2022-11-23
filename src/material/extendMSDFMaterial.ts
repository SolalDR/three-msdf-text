import type { WebGLRenderer, MeshBasicMaterialParameters } from 'three'
import type { MSDFShader, Shader } from '@/shaders/types/Shader'
import { hydrateMSDFLib } from './hydrateMSDFLib'

export interface MSDFMaterialOptions extends MeshBasicMaterialParameters {
  atlas?: THREE.Texture
  threshold?: number
  stroke?: boolean
  strokeInnerWidth?: number
  strokeOuterWidth?: number
}

type ExtendMSDFMaterial<M extends THREE.Material> = Omit<M, 'userData'> & {
  userData: Record<string, any> & { shader: MSDFShader }
  strokeOuterWidth: number
  strokeInnerWidth: number
  threshold: number
  isStroke: boolean
  _strokeOuterWidth: number
  _strokeInnerWidth: number
  _threshold: number
}

type ExtendedMSDFMaterial<M extends THREE.Material> = Omit<
  ExtendMSDFMaterial<M>,
  '_strokeOuterWidth' | '_strokeInnerWidth' | '_threshold'
>

/**
 * Define a new uniform and his acessors to manipulate uniforms
 */
function defineUniformProperty<M extends THREE.Material>(
  material: ExtendMSDFMaterial<M>,
  name: string,
  initialValue,
) {
  const privateName = `_${name}`
  const uniformName = `u${name[0].toUpperCase() + name.substring(1)}`

  material[privateName] = initialValue
  Object.defineProperty(material, name, {
    get: () => material[privateName],
    set(value: number) {
      material[privateName] = value
      if (material.userData.shader) {
        material.userData.shader.uniforms[uniformName].value = value
      }
    },
  })
}

/**
 * Extend a THREE.Material with MSDF support
 */
export function extendMSDFMaterial<M extends THREE.Material>(
  material,
  {
    atlas,
    threshold,
    stroke,
    strokeInnerWidth = 0.5,
    strokeOuterWidth = 0.0,
  }: MSDFMaterialOptions = {},
): ExtendedMSDFMaterial<M> {
  const m: ExtendMSDFMaterial<M> = material

  const state = {
    userCallback: null,
    msdfCallback: (shader: Shader, renderer: WebGLRenderer) => {
      const s = shader

      hydrateMSDFLib(shader)

      if (!s.defines) s.defines = {}
      if (!s.uniforms) s.uniforms = {}

      const USE_THRESHOLD = threshold !== undefined
      const USE_STROKE = !!stroke

      s.defines.USE_MSDF_GEOMETRY = ''
      s.uniforms.uAtlas = { value: atlas }

      if (USE_THRESHOLD) {
        s.defines.USE_THRESHOLD = ''
        s.uniforms.uThreshold = { value: m.threshold || 0.0 }
      }

      if (USE_STROKE) {
        s.defines.USE_STROKE = ''
        s.uniforms.uStrokeOuterWidth = { value: m.strokeOuterWidth }
        s.uniforms.uStrokeInnerWidth = { value: m.strokeInnerWidth }
      }

      material.userData.shader = shader

      if (state.userCallback) state.userCallback(shader, renderer)
    },
  }

  Object.defineProperty(m, 'isStroke', {
    get: () => stroke,
    set: () => {
      console.warn('Cannot set property "isStroke"')
    },
  })

  defineUniformProperty(m, 'strokeOuterWidth', strokeOuterWidth)
  defineUniformProperty(m, 'strokeInnerWidth', strokeInnerWidth)
  defineUniformProperty(m, 'threshold', threshold)

  Object.defineProperty(material, 'onBeforeCompile', {
    get() {
      return state.msdfCallback
    },
    set(v) {
      state.userCallback = v
    },
  })

  return material
}
