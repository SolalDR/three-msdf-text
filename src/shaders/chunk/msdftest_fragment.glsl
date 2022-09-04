#ifdef USE_MSDF_GEOMETRY

  vec3 msdfTexel = texture2D(uAtlas, vcharUv).rgb;
  float signedDist = max(
    min(msdfTexel.r, msdfTexel.g),
    min(max(msdfTexel.r, msdfTexel.g), msdfTexel.b)
  ) - 0.5;

  float msdfD = fwidth(signedDist);
  float msdfAlpha = smoothstep(-msdfD, msdfD, signedDist);
  if (msdfAlpha < 0.01) discard;

#endif