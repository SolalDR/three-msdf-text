import { IUniform } from 'three'

export interface Shader {
  defines?: { [key: string]: string }
  uniforms: { [uniform: string]: IUniform }
  vertexShader: string
  fragmentShader: string
}

export interface MSDFShader extends Shader {
  uniforms: {
    [uniform: string]: IUniform
    uAtlas: { value: THREE.Texture }
    uThreshold?: { value: number }
    uStrokeOuterWidth?: { value: number }
    uStrokeInnerWidth?: { value: number }
  }
}
