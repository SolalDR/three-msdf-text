import { Shader } from '@/shaders/types/Shader'

export function hydrateMSDFLib(shader: Shader) {
  shader.fragmentShader = shader.fragmentShader.replace(
    `#include <alphatest_pars_fragment>`,
    `#include <alphatest_pars_fragment>\n#include <msdf_alphatest_pars_fragment>`,
  )

  shader.fragmentShader = shader.fragmentShader.replace(
    `#include <alphatest_fragment>`,
    `#include <alphatest_fragment>\n#include <msdf_alphatest_fragment>`,
  )

  shader.vertexShader = shader.vertexShader.replace(
    `#include <uv_pars_vertex>`,
    `#include <uv_pars_vertex>\n#include <msdf_char_uv_pars_vertex>`,
  )

  shader.vertexShader = shader.vertexShader.replace(
    `#include <uv_vertex>`,
    `#include <uv_vertex>\n#include <msdf_char_uv_vertex>`,
  )
}
