import { ShaderChunk } from 'three'
import msdfAlphatestFragment from './msdf_alphatest_fragment.glsl'
import msdfAlphatestParsFragment from './msdf_alphatest_pars_fragment.glsl'
import msdfCharUvVertex from './msdf_char_uv_vertex.glsl'
import msdfCharUvParsVertex from './msdf_char_uv_pars_vertex.glsl'

const chunks = ShaderChunk as Record<string, string>
chunks.msdf_alphatest_fragment = msdfAlphatestFragment
chunks.msdf_alphatest_pars_fragment = msdfAlphatestParsFragment
chunks.msdf_char_uv_vertex = msdfCharUvVertex
chunks.msdf_char_uv_pars_vertex = msdfCharUvParsVertex
