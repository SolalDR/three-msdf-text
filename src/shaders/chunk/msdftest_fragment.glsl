#define SQRT2DIV2 0.7071067811865476 // Math.sqrt(2) / 2 

float uThreshold = 0.05;
float uStrokeOutsetWidth = 0.0;
float uStrokeInsetWidth = 0.5;
vec3 uStrokeColor = vec3(1.0, 0.0, 0.0);

#ifdef USE_MSDF_GEOMETRY

  vec3 msdfTexel = texture2D(uAtlas, vCharUv).rgb;
  
  float signedDist = max(
    min(msdfTexel.r, msdfTexel.g),
    min(max(msdfTexel.r, msdfTexel.g), msdfTexel.b)
  ) - 0.5;

  float msdfD = fwidth(signedDist);

  #ifdef USE_THRESHOLD
    float msdfAlpha = smoothstep(uThreshold - SQRT2DIV2, uThreshold + SQRT2DIV2, signedDist);
  #else
    float msdfAlpha = smoothstep(-msdfD, msdfD, signedDist);
  #endif

  if (msdfAlpha < 0.01) discard;


  // Outset
  float signedDistOutset = signedDist + uStrokeOuterWidth * 0.5;
  // Inset
  float signedDistInset = signedDist - uStrokeInnerWidth * 0.5;


  #ifdef USE_THRESHOLD
      float outset = smoothstep(uThreshold - SQRT2DIV2, uThreshold + SQRT2DIV2, signedDistOutset);  
      float inset = 1.0;
      
      #ifdef USE_STROKE 
        inset -= smoothstep(uThreshold - SQRT2DIV2, uThreshold + SQRT2DIV2, signedDistInset);
      #endif
      
  #else
      float outset = clamp(signedDistOutset / fwidth(signedDistOutset) + 0.5, 0.0, 1.0);
      float inset = 1.0;
      
      #ifdef USE_STROKE 
        inset -= clamp(signedDistInset / fwidth(signedDistInset) + 0.5, 0.0, 1.0);
      #endif
  #endif

  // Border
  float border = outset * inset;


  diffuseColor.a *= opacity * border;

#endif