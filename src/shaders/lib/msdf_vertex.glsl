#include <msdf_glyph_pars_vertex>

void main() {
    #include <msdf_glyph_vertex>
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}