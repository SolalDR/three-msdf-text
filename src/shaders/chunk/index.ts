import { ShaderChunk } from 'three';
import msdftestFragment from './msdftest_fragment.glsl';
import msdftestParsFragment from './msdftest_pars_fragment.glsl';
import msdfcharUvVertex from './msdf_glyph_uv_vertex.glsl';
import msdfcharUvParsVertex from './msdf_glyph_uv_pars_vertex.glsl';

ShaderChunk.msdftest_fragment = msdftestFragment;
ShaderChunk.msdftest_pars_fragment = msdftestParsFragment;
ShaderChunk.msdf_glyph_uv_vertex = msdfcharUvVertex;
ShaderChunk.msdf_glyph_uv_pars_vertex = msdfcharUvParsVertex;