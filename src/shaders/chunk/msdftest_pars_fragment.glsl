#ifdef USE_MSDF_GEOMETRY
  varying vec2 vCharUv;
  uniform sampler2D uAtlas;

  #ifdef USE_STROKE
    uniform float uStrokeOuterWidth;
    uniform float uStrokeInnerWidth;
  #endif
#endif