import { ShaderMaterial, DoubleSide } from 'three'
import vertexShader from './shaders/msdf_lib_vertex.glsl'
import fragmentShader from './shaders/msdf_lib_fragment.glsl'

interface MSDFMaterialOptions {
  atlas: THREE.Texture
}

export class MSDFMaterial extends ShaderMaterial {
  atlas: THREE.Texture
  constructor({
    atlas,
  }: MSDFMaterialOptions) {
    super({
      vertexShader,
      fragmentShader,
      side: DoubleSide,
      uniforms: {
        uAtlas: { value: atlas }
      }
    });
    this.atlas = atlas;
  }
}