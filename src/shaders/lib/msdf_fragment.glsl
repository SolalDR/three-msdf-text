uniform sampler2D uAtlas;
varying vec2 vcharUv;
void main() {
  
  #include <msdftest_fragment>

  gl_FragColor.rgb = vec3(0.0);
}