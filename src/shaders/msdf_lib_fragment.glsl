uniform sampler2D uAtlas;
varying vec2 vUv;
void main() {
  vec3 tex = texture2D(uAtlas, vUv).rgb;
  float signedDist = max(min(tex.r, tex.g), min(max(tex.r, tex.g), tex.b)) - 0.5;
  float d = fwidth(signedDist);
  float alpha = smoothstep(-d, d, signedDist);
  if (alpha < 0.01) discard;
  gl_FragColor.rgb = vec3(0.0);
  gl_FragColor.a = alpha;

  gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
}