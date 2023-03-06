(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  const attributesDefinitions$1 = {
      id: { size: 1, default: true },
      position: { size: 3, default: true },
      charUv: { size: 2, default: true },
      uv: { size: 2, default: false },
      normal: { size: 3, default: false },
      charPosition: { size: 3, default: false },
      lineIndex: { size: 1, default: false },
      charIndex: { size: 1, default: false },
      charSize: { size: 2, default: false },
      wordIndex: { size: 1, default: false },
      lineCharIndex: { size: 1, default: false },
      lineWordIndex: { size: 1, default: false },
      lineWordCount: { size: 1, default: false },
      lineCharCount: { size: 1, default: false },
  };

  /**
   * Class representation of a JSON font file.
   */
  class Font$1 {
      pages;
      chars;
      indexedChar = {};
      info; // no use
      common;
      distanceField;
      kernings;
      constructor(font) {
          this.pages = font.pages;
          this.chars = font.chars;
          this.common = font.common;
          this.info = font.info;
          this.common = font.common;
          this.distanceField = font.distanceField;
          this.kernings = font.kernings;
          if (this.distanceField.fieldType !== 'msdf') {
              console.warn('three-msdf-text(font.distanceField): fieldType should be "msdf"');
          }
          // Index font chars per key for better accessibility
          font.chars.forEach((d) => (this.indexedChar[d.char] = d));
      }
  }

  function getKernPairOffset$1(font, id1, id2) {
      for (let i = 0; i < font.kernings.length; i++) {
          const k = font.kernings[i];
          if (k.first < id1)
              continue;
          if (k.second < id2)
              continue;
          if (k.first > id1)
              return 0;
          if (k.first === id1 && k.second > id2)
              return 0;
          return k.amount;
      }
      return 0;
  }

  const newline$1 = /\n/;
  const whitespace$1 = /\s/;
  const tabulation$1 = /\t/;

  class TextLayout$1 {
      font;
      text;
      width;
      height;
      alignX;
      alignY;
      _size;
      letterSpacing;
      tabSize;
      lineHeight;
      wordSpacing;
      wordBreak;
      lineBreak;
      textScale;
      lines;
      computedWidth;
      computedHeight;
      lineCount;
      constructor({ font, text, width = 'auto', height = 'auto', alignX = 'left', alignY = 'top', size = 1, letterSpacing = 0, tabSize = 4, lineHeight = 1, wordSpacing = 0, wordBreak = false, lineBreak = true, } = {}) {
          this.font = font instanceof Font$1 ? font : new Font$1(font);
          this.text = text;
          this.width = width;
          this.height = height;
          this.alignX = alignX;
          this.alignY = alignY;
          this.size = size;
          this.letterSpacing = letterSpacing;
          this.tabSize = tabSize;
          this.lineHeight = lineHeight;
          this.wordSpacing = wordSpacing;
          this.wordBreak = wordBreak;
          this.lineBreak = lineBreak;
          this.compute();
      }
      get size() {
          return this._size;
      }
      set size(value) {
          this._size = value;
          this.textScale =
              this._size /
                  (this.font.common.lineHeight ||
                      this.font.common.baseline ||
                      this.font.common.base);
      }
      compute() {
          this.lines = [];
          const maxTimes = 100;
          let cursor = 0;
          let wordCursor = 0;
          let wordWidth = 0;
          const newLine = () => {
              const line = {
                  index: this.lines.length,
                  width: 0,
                  chars: [],
              };
              this.lines.push(line);
              wordCursor = cursor;
              wordWidth = 0;
              return line;
          };
          let line = newLine();
          let count = 0;
          while (cursor < this.text.length && count < maxTimes) {
              const char = this.text[cursor];
              let advance = 0;
              count++;
              // Detect \n char
              if (newline$1.test(char)) {
                  cursor++;
                  line = newLine();
                  continue;
              }
              // Skip whitespace at start of line
              if (!line.width && whitespace$1.test(char) && !tabulation$1.test(char)) {
                  cursor++;
                  wordCursor = cursor;
                  wordWidth = 0;
                  continue;
              }
              const charDef = this.font.indexedChar[char] || this.font.indexedChar[' '];
              if (!charDef)
                  throw new Error(`Missing glyph "${char}"`);
              // Find any applicable kern pairs
              if (line.chars.length && charDef) {
                  const prevGlyph = line.chars[line.chars.length - 1].definition;
                  const kern = getKernPairOffset$1(this.font, charDef.id || 0, prevGlyph.id) *
                      this.textScale;
                  line.width += kern;
                  wordWidth += kern;
              }
              // add char to line
              line.chars.push({
                  definition: charDef,
                  x: line.width,
                  y: 0,
                  lineIndex: line.index,
                  lineCharIndex: line.chars.length,
              });
              // Handle whitespace, tabulation and others text advances
              if (tabulation$1.test(char)) {
                  wordCursor = cursor;
                  wordWidth = 0;
                  advance +=
                      this.font.indexedChar['o'].width * this.textScale * this.tabSize;
              }
              else if (whitespace$1.test(char)) {
                  wordCursor = cursor;
                  wordWidth = 0;
                  advance += this.wordSpacing * this.size;
              }
              else {
                  advance += this.letterSpacing * this.size;
              }
              advance += charDef.xadvance * this.textScale;
              line.width += advance;
              wordWidth += advance;
              // If strict width defined
              if (this.width !== 'auto' && line.width > this.width && this.lineBreak) {
                  // If can break words, undo latest glyph if line not empty. Then create new line
                  if (this.wordBreak && line.chars.length > 1) {
                      line.width -= advance;
                      line.chars.pop();
                      line = newLine();
                      continue;
                      // If not first word, undo current word and cursor and create new line
                  }
                  else if (!this.wordBreak && wordWidth !== line.width) {
                      const numGlyphs = cursor - wordCursor + 1;
                      line.chars.splice(-numGlyphs, numGlyphs);
                      cursor = wordCursor;
                      line.width -= wordWidth;
                      line = newLine();
                      continue;
                  }
              }
              cursor++;
              // Reset infinite loop catch
              count = 0;
          }
          // Remove last line if empty
          if (!line.width)
              this.lines.pop();
          this.lineCount = this.lines.length;
          // Compute boundaries
          this.computedHeight = this.lineCount * this.size * this.lineHeight;
          this.computedWidth = Math.max(...this.lines.map((line) => line.width));
      }
  }

  class TextGeometry$1 extends THREE.BufferGeometry {
      charGeometry;
      layout;
      computedWidth;
      computedHeight;
      lineCount;
      recordedAttributes;
      constructor({ widthSegments = 1, heightSegments = 1, ...options } = {}) {
          super();
          this.layout = new TextLayout$1(options);
          this.charGeometry = new THREE.PlaneGeometry(1, 1, widthSegments, heightSegments);
          this.recordedAttributes = Object.keys(attributesDefinitions$1).reduce((acc, value) => {
              const isGenerated = attributesDefinitions$1[value].default || options[value];
              acc[value] = isGenerated;
              return acc;
          }, {});
          this.computeGeometry();
      }
      get text() {
          return this.layout.text;
      }
      set text(value) {
          this.layout.text = value;
      }
      /**
       * Allocate attributes buffer, compute geometry indexes
       */
      computeGeometry() {
          // Strip spaces and newlines to get actual character length for buffers
          const chars = this.layout.text.replace(/[ \n]/g, '');
          const attr = this.recordedAttributes;
          const cc = chars.length; // char count
          const vcc = this.charGeometry.attributes.position.count; // vertices per char count
          const icc = this.charGeometry.index.count; // indexes per char count
          const indexArray = new Uint32Array(cc * icc);
          // Create output buffers
          Object.keys(attr).forEach((name) => {
              if (attr[name]) {
                  const size = attributesDefinitions$1[name].size;
                  this.setAttribute(name, new THREE.BufferAttribute(new Float32Array(cc * vcc * size), size));
              }
          });
          // Set values for buffers that don't require calculation
          for (let i = 0; i < cc; i++) {
              if (this.charGeometry) {
                  const ids = new Array(vcc);
                  for (let j = 0, l = ids.length; j < l; j++)
                      ids[j] = i;
                  this.attributes.id.array.set(ids, i * vcc);
                  const indexes = new Array(icc);
                  for (let j = 0, l = indexes.length; j < l; j++)
                      indexes[j] = i * vcc + this.charGeometry.index.array[j];
                  indexArray.set(indexes, i * icc);
                  continue;
              }
              this.attributes.id.array.set([i, i, i, i], i * 4);
              // Geometry index
              indexArray.set([i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3], i * 6);
          }
          this.setIndex(Array.from(indexArray));
          this.computeLayout();
          this.populateBuffers();
      }
      computeLayout() {
          this.layout.compute();
      }
      populateBuffers() {
          const l = this.layout;
          const vcc = this.charGeometry.attributes.position.count; // vertices per char count
          this.charGeometry.index.count; // indexes per char count
          const charUvs = this.charGeometry.attributes.uv.array;
          // Interpolation methods for subdivied geometries (vec2)
          const populateAttrSize2 = (attr, xMin, yMin, xMax, yMax, offset) => {
              const target = this.attributes[attr].array;
              for (let i = 0, l = vcc * 2; i < l; i += 2) {
                  target[offset + i] = charUvs[i] * (xMax - xMin) + xMin;
                  target[offset + i + 1] = charUvs[i + 1] * (yMax - yMin) + yMin;
              }
          };
          // Interpolation methods for subdivied geometries (vec3)
          const populateAttrSize3 = (attr, xMin, yMin, xMax, yMax, offset, defaultZ = 0) => {
              const target = this.attributes[attr].array;
              for (let i = 0, j = 0, l = vcc * 3; i < l; i += 3, j += 2) {
                  target[offset + i] = charUvs[j] * (xMax - xMin) + xMin;
                  target[offset + i + 1] = charUvs[j + 1] * (yMax - yMin) + yMin;
                  target[offset + i + 2] = defaultZ;
              }
          };
          const texW = l.font.common.scaleW;
          const texH = l.font.common.scaleH;
          const cH = l.computedHeight;
          const cW = l.computedWidth;
          const tW = l.width !== 'auto' ? l.width : cW;
          const tH = l.height !== 'auto' ? l.height : cH;
          let y = -(l.lineHeight * l.size - l.size) / 2;
          let x = 0;
          let j = 0;
          let offsetHeight = 0;
          let uy, ux;
          // Initialize counters
          const c = {
              lineIndex: 0,
              charIndex: 0,
              wordIndex: 0,
              lineCharIndex: 0,
              lineWordIndex: 0,
              lineWordCount: 0,
              lineCharCount: 0,
          };
          // Apply y alignment offset
          if (l.alignY === 'center') {
              offsetHeight = l.computedHeight / 2;
          }
          else if (l.alignY === 'bottom') {
              offsetHeight = l.computedHeight;
          }
          y += offsetHeight;
          for (c.lineIndex = 0; c.lineIndex < l.lines.length; c.lineIndex++) {
              const line = l.lines[c.lineIndex];
              // Initialize counters
              c.lineCharIndex = c.lineWordIndex = c.lineWordCount = 0;
              c.lineCharCount = line.chars.length;
              // Count words per line for optional attribute
              if (this.recordedAttributes.lineWordCount) {
                  c.lineWordCount = line.chars.reduce((acc, value, index) => {
                      const isWhitespace = whitespace$1.test(value.definition.char);
                      const isInMiddle = index !== 0 && index !== line.chars.length - 1;
                      if (isWhitespace && isInMiddle) {
                          acc++;
                      }
                      return acc;
                  }, 1);
              }
              for (let i = 0; i < line.chars.length; i++) {
                  const glyph = line.chars[i].definition;
                  // Current vertex
                  const vertexIndex = j * vcc;
                  // If space, don't add to geometry
                  if (whitespace$1.test(glyph.char)) {
                      c.wordIndex++;
                      c.lineWordIndex++;
                      continue;
                  }
                  // Each letter is a quad. axis bottom left
                  const w = glyph.width * l.textScale;
                  const h = glyph.height * l.textScale;
                  x = line.chars[i].x;
                  // Apply char sprite offsets
                  x += glyph.xoffset * l.textScale;
                  y -= glyph.yoffset * l.textScale;
                  // Compute global uv top-left corner
                  ux = x;
                  uy = y - offsetHeight;
                  // Apply x alignment offset
                  if (l.alignX === 'center') {
                      ux = tW * 0.5 - line.width * 0.5 + x;
                      x -= line.width * 0.5;
                  }
                  else if (l.alignX === 'right') {
                      ux = tW - line.width + x;
                      x -= line.width;
                  }
                  // Compute char uv
                  const u = glyph.x / texW;
                  const uw = glyph.width / texW;
                  const v = 1.0 - glyph.y / texH;
                  const vh = glyph.height / texH;
                  // Populate needed attributes
                  populateAttrSize3('position', x, y - h, x + w, y, vertexIndex * 3);
                  populateAttrSize2('charUv', u, v - vh, u + uw, v, vertexIndex * 2);
                  // Populate optional UV attribute
                  if (this.recordedAttributes.uv) {
                      populateAttrSize2('uv', ux / tW, 1 - (uy - h) / -tH, (ux + w) / tW, 1 - uy / -tH, vertexIndex * 2);
                  }
                  // Populate optional charPosition attribute
                  if (this.recordedAttributes.charPosition) {
                      populateAttrSize3('charPosition', x + w / 2, y - h / 2, x + w / 2, y - h / 2, vertexIndex * 3);
                  }
                  // Populate optional normal attribute
                  if (this.recordedAttributes.normal) {
                      populateAttrSize3('normal', 0, 0, 0, 0, vertexIndex * 3, 1);
                  }
                  // Populate optional charSize attribute
                  if (this.recordedAttributes.charSize) {
                      populateAttrSize2('charSize', w, h, w, h, vertexIndex * 2);
                  }
                  // Populate optionals counter attributes
                  for (let key in c) {
                      if (this.recordedAttributes[key]) {
                          for (let i = 0; i < vcc; i++) {
                              this.attributes[key].array[vertexIndex * 4] = c[key];
                          }
                      }
                  }
                  // Reset cursor to baseline
                  y += glyph.yoffset * l.textScale;
                  j++;
                  c.charIndex++;
                  c.lineCharIndex++;
              }
              c.wordIndex++;
              // Jump to next line
              y -= l.size * l.lineHeight;
          }
          this.computeBoundingBox();
      }
      computeBoundingBox() {
          const { alignX, alignY, computedWidth, computedHeight } = this.layout;
          if (!this.boundingBox)
              this.boundingBox = new THREE.Box3();
          this.boundingBox.min.setScalar(0);
          this.boundingBox.max.setScalar(0);
          if (alignX === 'center') {
              this.boundingBox.min.x = -computedWidth / 2;
              this.boundingBox.max.x = computedWidth / 2;
          }
          if (alignY === 'center') {
              this.boundingBox.min.y = -computedHeight / 2;
              this.boundingBox.max.y = computedHeight / 2;
          }
          if (alignX === 'left')
              this.boundingBox.max.x = computedWidth;
          if (alignX === 'right')
              this.boundingBox.min.x = -computedWidth;
          if (alignY === 'bottom')
              this.boundingBox.max.y = computedHeight;
          if (alignY === 'top')
              this.boundingBox.min.y = -computedHeight;
          if (isNaN(computedWidth) || isNaN(computedHeight)) {
              console.error('THREE.TextGeometry.computeBoundingBox(): Computed min/max have NaN values. The layout may be corrupted.', this);
          }
      }
      /**
       * Update buffers with new layout
       */
      resize(width, height = 'auto') {
          this.layout.width = width;
          this.layout.height = height;
          this.computeGeometry();
      }
      /**
       * Update text and re-compute geometry (like creating new Text)
       */
      updateText(text) {
          this.layout.text = text;
          this.computeGeometry();
      }
  }

  var msdfAlphatestFragment$1 = "#define GLSLIFY 1\n#define SQRT2DIV2 0.7071067811865476\n#ifdef USE_MSDF_GEOMETRY\nvec3 msdfTexel=texture2D(uAtlas,vCharUv).rgb;float signedDist=max(min(msdfTexel.r,msdfTexel.g),min(max(msdfTexel.r,msdfTexel.g),msdfTexel.b))-0.5;float msdfD=fwidth(signedDist);\n#ifdef USE_THRESHOLD\nfloat msdfTest=smoothstep(uThreshold-SQRT2DIV2,uThreshold+SQRT2DIV2,signedDist);\n#else\nfloat msdfTest=smoothstep(-msdfD,msdfD,signedDist);\n#endif\nif(msdfTest<0.01)discard;float signedDistOutset=signedDist+uStrokeOuterWidth*0.5;float signedDistInset=signedDist-uStrokeInnerWidth*0.5;\n#ifdef USE_THRESHOLD\nfloat outerAlpha=smoothstep(uThreshold-SQRT2DIV2,uThreshold+SQRT2DIV2,signedDistOutset);float innerAlpha=1.0;\n#ifdef USE_STROKE\ninnerAlpha-=smoothstep(uThreshold-SQRT2DIV2,uThreshold+SQRT2DIV2,signedDistInset);\n#endif\n#else\nfloat outerAlpha=clamp(signedDistOutset/fwidth(signedDistOutset)+0.5,0.0,1.0);float innerAlpha=1.0;\n#ifdef USE_STROKE\ninnerAlpha-=clamp(signedDistInset/fwidth(signedDistInset)+0.5,0.0,1.0);\n#endif\n#endif\ndiffuseColor.a*=outerAlpha*innerAlpha;\n#endif\n"; // eslint-disable-line

  var msdfAlphatestParsFragment$1 = "#define GLSLIFY 1\n#ifdef USE_MSDF_GEOMETRY\nvarying vec2 vCharUv;uniform sampler2D uAtlas;\n#ifdef USE_THRESHOLD\nuniform float uThreshold;\n#endif\n#ifdef USE_STROKE\nuniform float uStrokeOuterWidth;uniform float uStrokeInnerWidth;\n#else\nfloat uStrokeOuterWidth=0.0;float uStrokeInnerWidth=1.0;\n#endif\n#endif\n"; // eslint-disable-line

  var msdfCharUvVertex$1 = "#define GLSLIFY 1\n#ifdef USE_MSDF_GEOMETRY\nvCharUv=charUv;\n#endif\n"; // eslint-disable-line

  var msdfCharUvParsVertex$1 = "#define GLSLIFY 1\n#ifdef USE_MSDF_GEOMETRY\nattribute vec2 charUv;varying vec2 vCharUv;\n#endif\n"; // eslint-disable-line

  THREE.ShaderChunk.msdf_alphatest_fragment = msdfAlphatestFragment$1;
  THREE.ShaderChunk.msdf_alphatest_pars_fragment = msdfAlphatestParsFragment$1;
  THREE.ShaderChunk.msdf_char_uv_vertex = msdfCharUvVertex$1;
  THREE.ShaderChunk.msdf_char_uv_pars_vertex = msdfCharUvParsVertex$1;

  function hydrateMSDFLib(shader) {
      shader.fragmentShader = shader.fragmentShader.replace(`#include <alphatest_pars_fragment>`, `#include <alphatest_pars_fragment>\n#include <msdf_alphatest_pars_fragment>`);
      shader.fragmentShader = shader.fragmentShader.replace(`#include <alphatest_fragment>`, `#include <alphatest_fragment>\n#include <msdf_alphatest_fragment>`);
      shader.vertexShader = shader.vertexShader.replace(`#include <uv_pars_vertex>`, `#include <uv_pars_vertex>\n#include <msdf_char_uv_pars_vertex>`);
      shader.vertexShader = shader.vertexShader.replace(`#include <uv_vertex>`, `#include <uv_vertex>\n#include <msdf_char_uv_vertex>`);
  }

  /**
   * Define a new uniform and his acessors to manipulate uniforms
   */
  function defineUniformProperty(material, name, initialValue) {
      const privateName = `_${name}`;
      const uniformName = `u${name[0].toUpperCase() + name.substring(1)}`;
      material[privateName] = initialValue;
      Object.defineProperty(material, name, {
          get: () => material[privateName],
          set(value) {
              material[privateName] = value;
              if (material.userData.shader) {
                  material.userData.shader.uniforms[uniformName].value = value;
              }
          },
      });
  }
  let cacheIndex = 0;
  /**
   * Extend a THREE.Material with MSDF support
   */
  function extendMSDFMaterial(material, { atlas, threshold, stroke, strokeInnerWidth = 0.5, strokeOuterWidth = 0.0, } = {}) {
      const m = material;
      cacheIndex++;
      material.customProgramCacheKey = () => String(cacheIndex);
      const state = {
          userCallback: null,
          msdfCallback: (shader, renderer) => {
              const s = shader;
              hydrateMSDFLib(shader);
              if (!s.defines)
                  s.defines = {};
              if (!s.uniforms)
                  s.uniforms = {};
              const USE_THRESHOLD = threshold !== undefined;
              const USE_STROKE = !!stroke;
              s.defines.USE_MSDF_GEOMETRY = '';
              s.uniforms.uAtlas = { value: atlas };
              if (USE_THRESHOLD) {
                  s.defines.USE_THRESHOLD = '';
                  s.uniforms.uThreshold = { value: m.threshold || 0.0 };
              }
              if (USE_STROKE) {
                  s.defines.USE_STROKE = '';
                  s.uniforms.uStrokeOuterWidth = { value: m.strokeOuterWidth };
                  s.uniforms.uStrokeInnerWidth = { value: m.strokeInnerWidth };
              }
              material.userData.shader = shader;
              if (state.userCallback)
                  state.userCallback(shader, renderer);
          },
      };
      Object.defineProperty(m, 'isStroke', {
          get: () => stroke,
          set: () => {
              console.warn('Cannot set property "isStroke"');
          },
      });
      defineUniformProperty(m, 'strokeOuterWidth', strokeOuterWidth);
      defineUniformProperty(m, 'strokeInnerWidth', strokeInnerWidth);
      defineUniformProperty(m, 'threshold', threshold);
      Object.defineProperty(material, 'onBeforeCompile', {
          get() {
              return state.msdfCallback;
          },
          set(v) {
              state.userCallback = v;
          },
      });
      return material;
  }

  const attributesDefinitions = {
      id: { size: 1, default: true },
      position: { size: 3, default: true },
      charUv: { size: 2, default: true },
      uv: { size: 2, default: false },
      normal: { size: 3, default: false },
      charPosition: { size: 3, default: false },
      lineIndex: { size: 1, default: false },
      charIndex: { size: 1, default: false },
      charSize: { size: 2, default: false },
      wordIndex: { size: 1, default: false },
      lineCharIndex: { size: 1, default: false },
      lineWordIndex: { size: 1, default: false },
      lineWordCount: { size: 1, default: false },
      lineCharCount: { size: 1, default: false },
  };

  /**
   * Class representation of a JSON font file.
   */
  class Font {
      pages;
      chars;
      indexedChar = {};
      info; // no use
      common;
      distanceField;
      kernings;
      constructor(font) {
          this.pages = font.pages;
          this.chars = font.chars;
          this.common = font.common;
          this.info = font.info;
          this.common = font.common;
          this.distanceField = font.distanceField;
          this.kernings = font.kernings;
          if (this.distanceField.fieldType !== 'msdf') {
              console.warn('three-msdf-text(font.distanceField): fieldType should be "msdf"');
          }
          // Index font chars per key for better accessibility
          font.chars.forEach((d) => (this.indexedChar[d.char] = d));
      }
  }

  function getKernPairOffset(font, id1, id2) {
      for (let i = 0; i < font.kernings.length; i++) {
          const k = font.kernings[i];
          if (k.first < id1)
              continue;
          if (k.second < id2)
              continue;
          if (k.first > id1)
              return 0;
          if (k.first === id1 && k.second > id2)
              return 0;
          return k.amount;
      }
      return 0;
  }

  const newline = /\n/;
  const whitespace = /\s/;
  const tabulation = /\t/;

  class TextLayout {
      font;
      text;
      width;
      height;
      alignX;
      alignY;
      _size;
      letterSpacing;
      tabSize;
      lineHeight;
      wordSpacing;
      wordBreak;
      lineBreak;
      textScale;
      lines;
      computedWidth;
      computedHeight;
      lineCount;
      constructor({ font, text, width = 'auto', height = 'auto', alignX = 'left', alignY = 'top', size = 1, letterSpacing = 0, tabSize = 4, lineHeight = 1, wordSpacing = 0, wordBreak = false, lineBreak = true, } = {}) {
          this.font = font instanceof Font ? font : new Font(font);
          this.text = text;
          this.width = width;
          this.height = height;
          this.alignX = alignX;
          this.alignY = alignY;
          this.size = size;
          this.letterSpacing = letterSpacing;
          this.tabSize = tabSize;
          this.lineHeight = lineHeight;
          this.wordSpacing = wordSpacing;
          this.wordBreak = wordBreak;
          this.lineBreak = lineBreak;
          this.compute();
      }
      get size() {
          return this._size;
      }
      set size(value) {
          this._size = value;
          this.textScale =
              this._size /
                  (this.font.common.lineHeight ||
                      this.font.common.baseline ||
                      this.font.common.base);
      }
      compute() {
          this.lines = [];
          const maxTimes = 100;
          let cursor = 0;
          let wordCursor = 0;
          let wordWidth = 0;
          const newLine = () => {
              const line = {
                  index: this.lines.length,
                  width: 0,
                  chars: [],
              };
              this.lines.push(line);
              wordCursor = cursor;
              wordWidth = 0;
              return line;
          };
          let line = newLine();
          let count = 0;
          while (cursor < this.text.length && count < maxTimes) {
              const char = this.text[cursor];
              let advance = 0;
              count++;
              // Detect \n char
              if (newline.test(char)) {
                  cursor++;
                  line = newLine();
                  continue;
              }
              // Skip whitespace at start of line
              if (!line.width && whitespace.test(char) && !tabulation.test(char)) {
                  cursor++;
                  wordCursor = cursor;
                  wordWidth = 0;
                  continue;
              }
              const charDef = this.font.indexedChar[char] || this.font.indexedChar[' '];
              if (!charDef)
                  throw new Error(`Missing glyph "${char}"`);
              // Find any applicable kern pairs
              if (line.chars.length && charDef) {
                  const prevGlyph = line.chars[line.chars.length - 1].definition;
                  const kern = getKernPairOffset(this.font, charDef.id || 0, prevGlyph.id) *
                      this.textScale;
                  line.width += kern;
                  wordWidth += kern;
              }
              // add char to line
              line.chars.push({
                  definition: charDef,
                  x: line.width,
                  y: 0,
                  lineIndex: line.index,
                  lineCharIndex: line.chars.length,
              });
              // Handle whitespace, tabulation and others text advances
              if (tabulation.test(char)) {
                  wordCursor = cursor;
                  wordWidth = 0;
                  advance +=
                      this.font.indexedChar['o'].width * this.textScale * this.tabSize;
              }
              else if (whitespace.test(char)) {
                  wordCursor = cursor;
                  wordWidth = 0;
                  advance += this.wordSpacing * this.size;
              }
              else {
                  advance += this.letterSpacing * this.size;
              }
              advance += charDef.xadvance * this.textScale;
              line.width += advance;
              wordWidth += advance;
              // If strict width defined
              if (this.width !== 'auto' && line.width > this.width && this.lineBreak) {
                  // If can break words, undo latest glyph if line not empty. Then create new line
                  if (this.wordBreak && line.chars.length > 1) {
                      line.width -= advance;
                      line.chars.pop();
                      line = newLine();
                      continue;
                      // If not first word, undo current word and cursor and create new line
                  }
                  else if (!this.wordBreak && wordWidth !== line.width) {
                      const numGlyphs = cursor - wordCursor + 1;
                      line.chars.splice(-numGlyphs, numGlyphs);
                      cursor = wordCursor;
                      line.width -= wordWidth;
                      line = newLine();
                      continue;
                  }
              }
              cursor++;
              // Reset infinite loop catch
              count = 0;
          }
          // Remove last line if empty
          if (!line.width)
              this.lines.pop();
          this.lineCount = this.lines.length;
          // Compute boundaries
          this.computedHeight = this.lineCount * this.size * this.lineHeight;
          this.computedWidth = Math.max(...this.lines.map((line) => line.width));
      }
  }

  class TextGeometry extends THREE.BufferGeometry {
      charGeometry;
      layout;
      computedWidth;
      computedHeight;
      lineCount;
      recordedAttributes;
      constructor({ widthSegments = 1, heightSegments = 1, ...options } = {}) {
          super();
          this.layout = new TextLayout(options);
          this.charGeometry = new THREE.PlaneGeometry(1, 1, widthSegments, heightSegments);
          this.recordedAttributes = Object.keys(attributesDefinitions).reduce((acc, value) => {
              const isGenerated = attributesDefinitions[value].default || options[value];
              acc[value] = isGenerated;
              return acc;
          }, {});
          this.computeGeometry();
      }
      get text() {
          return this.layout.text;
      }
      set text(value) {
          this.layout.text = value;
      }
      /**
       * Allocate attributes buffer, compute geometry indexes
       */
      computeGeometry() {
          // Strip spaces and newlines to get actual character length for buffers
          const chars = this.layout.text.replace(/[ \n]/g, '');
          const attr = this.recordedAttributes;
          const cc = chars.length; // char count
          const vcc = this.charGeometry.attributes.position.count; // vertices per char count
          const icc = this.charGeometry.index.count; // indexes per char count
          const indexArray = new Uint32Array(cc * icc);
          // Create output buffers
          Object.keys(attr).forEach((name) => {
              if (attr[name]) {
                  const size = attributesDefinitions[name].size;
                  this.setAttribute(name, new THREE.BufferAttribute(new Float32Array(cc * vcc * size), size));
              }
          });
          // Set values for buffers that don't require calculation
          for (let i = 0; i < cc; i++) {
              if (this.charGeometry) {
                  const ids = new Array(vcc);
                  for (let j = 0, l = ids.length; j < l; j++)
                      ids[j] = i;
                  this.attributes.id.array.set(ids, i * vcc);
                  const indexes = new Array(icc);
                  for (let j = 0, l = indexes.length; j < l; j++)
                      indexes[j] = i * vcc + this.charGeometry.index.array[j];
                  indexArray.set(indexes, i * icc);
                  continue;
              }
              this.attributes.id.array.set([i, i, i, i], i * 4);
              // Geometry index
              indexArray.set([i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3], i * 6);
          }
          this.setIndex(Array.from(indexArray));
          this.computeLayout();
          this.populateBuffers();
      }
      computeLayout() {
          this.layout.compute();
      }
      populateBuffers() {
          const l = this.layout;
          const vcc = this.charGeometry.attributes.position.count; // vertices per char count
          this.charGeometry.index.count; // indexes per char count
          const charUvs = this.charGeometry.attributes.uv.array;
          // Interpolation methods for subdivied geometries (vec2)
          const populateAttrSize2 = (attr, xMin, yMin, xMax, yMax, offset) => {
              const target = this.attributes[attr].array;
              for (let i = 0, l = vcc * 2; i < l; i += 2) {
                  target[offset + i] = charUvs[i] * (xMax - xMin) + xMin;
                  target[offset + i + 1] = charUvs[i + 1] * (yMax - yMin) + yMin;
              }
          };
          // Interpolation methods for subdivied geometries (vec3)
          const populateAttrSize3 = (attr, xMin, yMin, xMax, yMax, offset, defaultZ = 0) => {
              const target = this.attributes[attr].array;
              for (let i = 0, j = 0, l = vcc * 3; i < l; i += 3, j += 2) {
                  target[offset + i] = charUvs[j] * (xMax - xMin) + xMin;
                  target[offset + i + 1] = charUvs[j + 1] * (yMax - yMin) + yMin;
                  target[offset + i + 2] = defaultZ;
              }
          };
          const texW = l.font.common.scaleW;
          const texH = l.font.common.scaleH;
          const cH = l.computedHeight;
          const cW = l.computedWidth;
          const tW = l.width !== 'auto' ? l.width : cW;
          const tH = l.height !== 'auto' ? l.height : cH;
          let y = -(l.lineHeight * l.size - l.size) / 2;
          let x = 0;
          let j = 0;
          let offsetHeight = 0;
          let uy, ux;
          // Initialize counters
          const c = {
              lineIndex: 0,
              charIndex: 0,
              wordIndex: 0,
              lineCharIndex: 0,
              lineWordIndex: 0,
              lineWordCount: 0,
              lineCharCount: 0,
          };
          // Apply y alignment offset
          if (l.alignY === 'center') {
              offsetHeight = l.computedHeight / 2;
          }
          else if (l.alignY === 'bottom') {
              offsetHeight = l.computedHeight;
          }
          y += offsetHeight;
          for (c.lineIndex = 0; c.lineIndex < l.lines.length; c.lineIndex++) {
              const line = l.lines[c.lineIndex];
              // Initialize counters
              c.lineCharIndex = c.lineWordIndex = c.lineWordCount = 0;
              c.lineCharCount = line.chars.length;
              // Count words per line for optional attribute
              if (this.recordedAttributes.lineWordCount) {
                  c.lineWordCount = line.chars.reduce((acc, value, index) => {
                      const isWhitespace = whitespace.test(value.definition.char);
                      const isInMiddle = index !== 0 && index !== line.chars.length - 1;
                      if (isWhitespace && isInMiddle) {
                          acc++;
                      }
                      return acc;
                  }, 1);
              }
              for (let i = 0; i < line.chars.length; i++) {
                  const glyph = line.chars[i].definition;
                  // Current vertex
                  const vertexIndex = j * vcc;
                  // If space, don't add to geometry
                  if (whitespace.test(glyph.char)) {
                      c.wordIndex++;
                      c.lineWordIndex++;
                      continue;
                  }
                  // Each letter is a quad. axis bottom left
                  const w = glyph.width * l.textScale;
                  const h = glyph.height * l.textScale;
                  x = line.chars[i].x;
                  // Apply char sprite offsets
                  x += glyph.xoffset * l.textScale;
                  y -= glyph.yoffset * l.textScale;
                  // Compute global uv top-left corner
                  ux = x;
                  uy = y - offsetHeight;
                  // Apply x alignment offset
                  if (l.alignX === 'center') {
                      ux = tW * 0.5 - line.width * 0.5 + x;
                      x -= line.width * 0.5;
                  }
                  else if (l.alignX === 'right') {
                      ux = tW - line.width + x;
                      x -= line.width;
                  }
                  // Compute char uv
                  const u = glyph.x / texW;
                  const uw = glyph.width / texW;
                  const v = 1.0 - glyph.y / texH;
                  const vh = glyph.height / texH;
                  // Populate needed attributes
                  populateAttrSize3('position', x, y - h, x + w, y, vertexIndex * 3);
                  populateAttrSize2('charUv', u, v - vh, u + uw, v, vertexIndex * 2);
                  // Populate optional UV attribute
                  if (this.recordedAttributes.uv) {
                      populateAttrSize2('uv', ux / tW, 1 - (uy - h) / -tH, (ux + w) / tW, 1 - uy / -tH, vertexIndex * 2);
                  }
                  // Populate optional charPosition attribute
                  if (this.recordedAttributes.charPosition) {
                      populateAttrSize3('charPosition', x + w / 2, y - h / 2, x + w / 2, y - h / 2, vertexIndex * 3);
                  }
                  // Populate optional normal attribute
                  if (this.recordedAttributes.normal) {
                      populateAttrSize3('normal', 0, 0, 0, 0, vertexIndex * 3, 1);
                  }
                  // Populate optional charSize attribute
                  if (this.recordedAttributes.charSize) {
                      populateAttrSize2('charSize', w, h, w, h, vertexIndex * 2);
                  }
                  // Populate optionals counter attributes
                  for (let key in c) {
                      if (this.recordedAttributes[key]) {
                          for (let i = 0; i < vcc; i++) {
                              this.attributes[key].array[vertexIndex * 4] = c[key];
                          }
                      }
                  }
                  // Reset cursor to baseline
                  y += glyph.yoffset * l.textScale;
                  j++;
                  c.charIndex++;
                  c.lineCharIndex++;
              }
              c.wordIndex++;
              // Jump to next line
              y -= l.size * l.lineHeight;
          }
          this.computeBoundingBox();
      }
      computeBoundingBox() {
          const { alignX, alignY, computedWidth, computedHeight } = this.layout;
          if (!this.boundingBox)
              this.boundingBox = new THREE.Box3();
          this.boundingBox.min.setScalar(0);
          this.boundingBox.max.setScalar(0);
          if (alignX === 'center') {
              this.boundingBox.min.x = -computedWidth / 2;
              this.boundingBox.max.x = computedWidth / 2;
          }
          if (alignY === 'center') {
              this.boundingBox.min.y = -computedHeight / 2;
              this.boundingBox.max.y = computedHeight / 2;
          }
          if (alignX === 'left')
              this.boundingBox.max.x = computedWidth;
          if (alignX === 'right')
              this.boundingBox.min.x = -computedWidth;
          if (alignY === 'bottom')
              this.boundingBox.max.y = computedHeight;
          if (alignY === 'top')
              this.boundingBox.min.y = -computedHeight;
          if (isNaN(computedWidth) || isNaN(computedHeight)) {
              console.error('THREE.TextGeometry.computeBoundingBox(): Computed min/max have NaN values. The layout may be corrupted.', this);
          }
      }
      /**
       * Update buffers with new layout
       */
      resize(width, height = 'auto') {
          this.layout.width = width;
          this.layout.height = height;
          this.computeGeometry();
      }
      /**
       * Update text and re-compute geometry (like creating new Text)
       */
      updateText(text) {
          this.layout.text = text;
          this.computeGeometry();
      }
  }

  var msdfAlphatestFragment = "#define GLSLIFY 1\n#define SQRT2DIV2 0.7071067811865476\n#ifdef USE_MSDF_GEOMETRY\nvec3 msdfTexel=texture2D(uAtlas,vCharUv).rgb;float signedDist=max(min(msdfTexel.r,msdfTexel.g),min(max(msdfTexel.r,msdfTexel.g),msdfTexel.b))-0.5;float msdfD=fwidth(signedDist);\n#ifdef USE_THRESHOLD\nfloat msdfTest=smoothstep(uThreshold-SQRT2DIV2,uThreshold+SQRT2DIV2,signedDist);\n#else\nfloat msdfTest=smoothstep(-msdfD,msdfD,signedDist);\n#endif\nif(msdfTest<0.01)discard;float signedDistOutset=signedDist+uStrokeOuterWidth*0.5;float signedDistInset=signedDist-uStrokeInnerWidth*0.5;\n#ifdef USE_THRESHOLD\nfloat outerAlpha=smoothstep(uThreshold-SQRT2DIV2,uThreshold+SQRT2DIV2,signedDistOutset);float innerAlpha=1.0;\n#ifdef USE_STROKE\ninnerAlpha-=smoothstep(uThreshold-SQRT2DIV2,uThreshold+SQRT2DIV2,signedDistInset);\n#endif\n#else\nfloat outerAlpha=clamp(signedDistOutset/fwidth(signedDistOutset)+0.5,0.0,1.0);float innerAlpha=1.0;\n#ifdef USE_STROKE\ninnerAlpha-=clamp(signedDistInset/fwidth(signedDistInset)+0.5,0.0,1.0);\n#endif\n#endif\ndiffuseColor.a*=outerAlpha*innerAlpha;\n#endif\n"; // eslint-disable-line

  var msdfAlphatestParsFragment = "#define GLSLIFY 1\n#ifdef USE_MSDF_GEOMETRY\nvarying vec2 vCharUv;uniform sampler2D uAtlas;\n#ifdef USE_THRESHOLD\nuniform float uThreshold;\n#endif\n#ifdef USE_STROKE\nuniform float uStrokeOuterWidth;uniform float uStrokeInnerWidth;\n#else\nfloat uStrokeOuterWidth=0.0;float uStrokeInnerWidth=1.0;\n#endif\n#endif\n"; // eslint-disable-line

  var msdfCharUvVertex = "#define GLSLIFY 1\n#ifdef USE_MSDF_GEOMETRY\nvCharUv=charUv;\n#endif\n"; // eslint-disable-line

  var msdfCharUvParsVertex = "#define GLSLIFY 1\n#ifdef USE_MSDF_GEOMETRY\nattribute vec2 charUv;varying vec2 vCharUv;\n#endif\n"; // eslint-disable-line

  THREE.ShaderChunk.msdf_alphatest_fragment = msdfAlphatestFragment;
  THREE.ShaderChunk.msdf_alphatest_pars_fragment = msdfAlphatestParsFragment;
  THREE.ShaderChunk.msdf_char_uv_vertex = msdfCharUvVertex;
  THREE.ShaderChunk.msdf_char_uv_pars_vertex = msdfCharUvParsVertex;

  var pages = [
  	"Roboto-Regular.png"
  ];
  var chars = [
  	{
  		id: 106,
  		index: 78,
  		char: "j",
  		width: 12,
  		height: 43,
  		xoffset: -3,
  		yoffset: 4,
  		xadvance: 10,
  		chnl: 15,
  		x: 0,
  		y: 0,
  		page: 0
  	},
  	{
  		id: 81,
  		index: 53,
  		char: "Q",
  		width: 28,
  		height: 39,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 29,
  		chnl: 15,
  		x: 0,
  		y: 44,
  		page: 0
  	},
  	{
  		id: 87,
  		index: 59,
  		char: "W",
  		width: 39,
  		height: 34,
  		xoffset: -1,
  		yoffset: 4,
  		xadvance: 37,
  		chnl: 15,
  		x: 13,
  		y: 0,
  		page: 0
  	},
  	{
  		id: 98,
  		index: 70,
  		char: "b",
  		width: 23,
  		height: 36,
  		xoffset: 1,
  		yoffset: 3,
  		xadvance: 24,
  		chnl: 15,
  		x: 0,
  		y: 84,
  		page: 0
  	},
  	{
  		id: 100,
  		index: 72,
  		char: "d",
  		width: 23,
  		height: 36,
  		xoffset: 0,
  		yoffset: 3,
  		xadvance: 24,
  		chnl: 15,
  		x: 0,
  		y: 121,
  		page: 0
  	},
  	{
  		id: 102,
  		index: 74,
  		char: "f",
  		width: 17,
  		height: 36,
  		xoffset: -1,
  		yoffset: 2,
  		xadvance: 15,
  		chnl: 15,
  		x: 0,
  		y: 158,
  		page: 0
  	},
  	{
  		id: 104,
  		index: 76,
  		char: "h",
  		width: 21,
  		height: 36,
  		xoffset: 1,
  		yoffset: 3,
  		xadvance: 23,
  		chnl: 15,
  		x: 0,
  		y: 195,
  		page: 0
  	},
  	{
  		id: 107,
  		index: 79,
  		char: "k",
  		width: 22,
  		height: 36,
  		xoffset: 1,
  		yoffset: 3,
  		xadvance: 21,
  		chnl: 15,
  		x: 18,
  		y: 158,
  		page: 0
  	},
  	{
  		id: 108,
  		index: 80,
  		char: "l",
  		width: 8,
  		height: 36,
  		xoffset: 1,
  		yoffset: 3,
  		xadvance: 10,
  		chnl: 15,
  		x: 22,
  		y: 195,
  		page: 0
  	},
  	{
  		id: 103,
  		index: 75,
  		char: "g",
  		width: 23,
  		height: 35,
  		xoffset: 0,
  		yoffset: 11,
  		xadvance: 24,
  		chnl: 15,
  		x: 31,
  		y: 195,
  		page: 0
  	},
  	{
  		id: 109,
  		index: 81,
  		char: "m",
  		width: 35,
  		height: 27,
  		xoffset: 1,
  		yoffset: 11,
  		xadvance: 37,
  		chnl: 15,
  		x: 24,
  		y: 84,
  		page: 0
  	},
  	{
  		id: 112,
  		index: 84,
  		char: "p",
  		width: 23,
  		height: 35,
  		xoffset: 1,
  		yoffset: 11,
  		xadvance: 24,
  		chnl: 15,
  		x: 24,
  		y: 112,
  		page: 0
  	},
  	{
  		id: 113,
  		index: 85,
  		char: "q",
  		width: 23,
  		height: 35,
  		xoffset: 0,
  		yoffset: 11,
  		xadvance: 24,
  		chnl: 15,
  		x: 41,
  		y: 148,
  		page: 0
  	},
  	{
  		id: 121,
  		index: 93,
  		char: "y",
  		width: 23,
  		height: 35,
  		xoffset: -2,
  		yoffset: 12,
  		xadvance: 20,
  		chnl: 15,
  		x: 48,
  		y: 112,
  		page: 0
  	},
  	{
  		id: 67,
  		index: 39,
  		char: "C",
  		width: 27,
  		height: 35,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 27,
  		chnl: 15,
  		x: 29,
  		y: 35,
  		page: 0
  	},
  	{
  		id: 71,
  		index: 43,
  		char: "G",
  		width: 27,
  		height: 35,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 29,
  		chnl: 15,
  		x: 55,
  		y: 184,
  		page: 0
  	},
  	{
  		id: 79,
  		index: 51,
  		char: "O",
  		width: 28,
  		height: 35,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 29,
  		chnl: 15,
  		x: 65,
  		y: 148,
  		page: 0
  	},
  	{
  		id: 83,
  		index: 55,
  		char: "S",
  		width: 26,
  		height: 35,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 25,
  		chnl: 15,
  		x: 55,
  		y: 220,
  		page: 0
  	},
  	{
  		id: 51,
  		index: 23,
  		char: "3",
  		width: 23,
  		height: 35,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 24,
  		chnl: 15,
  		x: 82,
  		y: 220,
  		page: 0
  	},
  	{
  		id: 56,
  		index: 28,
  		char: "8",
  		width: 23,
  		height: 35,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 24,
  		chnl: 15,
  		x: 83,
  		y: 184,
  		page: 0
  	},
  	{
  		id: 48,
  		index: 20,
  		char: "0",
  		width: 23,
  		height: 35,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 24,
  		chnl: 15,
  		x: 106,
  		y: 220,
  		page: 0
  	},
  	{
  		id: 105,
  		index: 77,
  		char: "i",
  		width: 8,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 10,
  		chnl: 15,
  		x: 53,
  		y: 0,
  		page: 0
  	},
  	{
  		id: 119,
  		index: 91,
  		char: "w",
  		width: 34,
  		height: 26,
  		xoffset: -1,
  		yoffset: 12,
  		xadvance: 32,
  		chnl: 15,
  		x: 57,
  		y: 35,
  		page: 0
  	},
  	{
  		id: 65,
  		index: 37,
  		char: "A",
  		width: 30,
  		height: 34,
  		xoffset: -1,
  		yoffset: 4,
  		xadvance: 27,
  		chnl: 15,
  		x: 62,
  		y: 0,
  		page: 0
  	},
  	{
  		id: 66,
  		index: 38,
  		char: "B",
  		width: 24,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 26,
  		chnl: 15,
  		x: 60,
  		y: 62,
  		page: 0
  	},
  	{
  		id: 68,
  		index: 40,
  		char: "D",
  		width: 26,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 28,
  		chnl: 15,
  		x: 72,
  		y: 97,
  		page: 0
  	},
  	{
  		id: 69,
  		index: 41,
  		char: "E",
  		width: 23,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 24,
  		chnl: 15,
  		x: 85,
  		y: 62,
  		page: 0
  	},
  	{
  		id: 70,
  		index: 42,
  		char: "F",
  		width: 22,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 23,
  		chnl: 15,
  		x: 94,
  		y: 132,
  		page: 0
  	},
  	{
  		id: 72,
  		index: 44,
  		char: "H",
  		width: 27,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 30,
  		chnl: 15,
  		x: 99,
  		y: 97,
  		page: 0
  	},
  	{
  		id: 73,
  		index: 45,
  		char: "I",
  		width: 8,
  		height: 34,
  		xoffset: 2,
  		yoffset: 4,
  		xadvance: 11,
  		chnl: 15,
  		x: 107,
  		y: 167,
  		page: 0
  	},
  	{
  		id: 74,
  		index: 46,
  		char: "J",
  		width: 23,
  		height: 34,
  		xoffset: -1,
  		yoffset: 4,
  		xadvance: 23,
  		chnl: 15,
  		x: 116,
  		y: 167,
  		page: 0
  	},
  	{
  		id: 75,
  		index: 47,
  		char: "K",
  		width: 27,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 26,
  		chnl: 15,
  		x: 117,
  		y: 132,
  		page: 0
  	},
  	{
  		id: 76,
  		index: 48,
  		char: "L",
  		width: 22,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 23,
  		chnl: 15,
  		x: 130,
  		y: 202,
  		page: 0
  	},
  	{
  		id: 77,
  		index: 49,
  		char: "M",
  		width: 34,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 37,
  		chnl: 15,
  		x: 140,
  		y: 167,
  		page: 0
  	},
  	{
  		id: 78,
  		index: 50,
  		char: "N",
  		width: 27,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 30,
  		chnl: 15,
  		x: 153,
  		y: 202,
  		page: 0
  	},
  	{
  		id: 80,
  		index: 52,
  		char: "P",
  		width: 25,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 26,
  		chnl: 15,
  		x: 93,
  		y: 0,
  		page: 0
  	},
  	{
  		id: 82,
  		index: 54,
  		char: "R",
  		width: 26,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 26,
  		chnl: 15,
  		x: 109,
  		y: 35,
  		page: 0
  	},
  	{
  		id: 84,
  		index: 56,
  		char: "T",
  		width: 27,
  		height: 34,
  		xoffset: -1,
  		yoffset: 4,
  		xadvance: 25,
  		chnl: 15,
  		x: 119,
  		y: 0,
  		page: 0
  	},
  	{
  		id: 85,
  		index: 57,
  		char: "U",
  		width: 26,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 27,
  		chnl: 15,
  		x: 127,
  		y: 70,
  		page: 0
  	},
  	{
  		id: 86,
  		index: 58,
  		char: "V",
  		width: 30,
  		height: 34,
  		xoffset: -1,
  		yoffset: 4,
  		xadvance: 27,
  		chnl: 15,
  		x: 136,
  		y: 35,
  		page: 0
  	},
  	{
  		id: 88,
  		index: 60,
  		char: "X",
  		width: 28,
  		height: 34,
  		xoffset: -1,
  		yoffset: 4,
  		xadvance: 26,
  		chnl: 15,
  		x: 147,
  		y: 0,
  		page: 0
  	},
  	{
  		id: 89,
  		index: 61,
  		char: "Y",
  		width: 29,
  		height: 34,
  		xoffset: -2,
  		yoffset: 4,
  		xadvance: 25,
  		chnl: 15,
  		x: 145,
  		y: 105,
  		page: 0
  	},
  	{
  		id: 90,
  		index: 62,
  		char: "Z",
  		width: 26,
  		height: 34,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 25,
  		chnl: 15,
  		x: 154,
  		y: 70,
  		page: 0
  	},
  	{
  		id: 49,
  		index: 21,
  		char: "1",
  		width: 15,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 24,
  		chnl: 15,
  		x: 167,
  		y: 35,
  		page: 0
  	},
  	{
  		id: 50,
  		index: 22,
  		char: "2",
  		width: 24,
  		height: 34,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 24,
  		chnl: 15,
  		x: 176,
  		y: 0,
  		page: 0
  	},
  	{
  		id: 52,
  		index: 24,
  		char: "4",
  		width: 26,
  		height: 34,
  		xoffset: -1,
  		yoffset: 4,
  		xadvance: 24,
  		chnl: 15,
  		x: 201,
  		y: 0,
  		page: 0
  	},
  	{
  		id: 53,
  		index: 25,
  		char: "5",
  		width: 23,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 24,
  		chnl: 15,
  		x: 228,
  		y: 0,
  		page: 0
  	},
  	{
  		id: 54,
  		index: 26,
  		char: "6",
  		width: 23,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 24,
  		chnl: 15,
  		x: 183,
  		y: 35,
  		page: 0
  	},
  	{
  		id: 55,
  		index: 27,
  		char: "7",
  		width: 24,
  		height: 34,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 24,
  		chnl: 15,
  		x: 207,
  		y: 35,
  		page: 0
  	},
  	{
  		id: 57,
  		index: 29,
  		char: "9",
  		width: 23,
  		height: 34,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 24,
  		chnl: 15,
  		x: 232,
  		y: 35,
  		page: 0
  	},
  	{
  		id: 33,
  		index: 5,
  		char: "!",
  		width: 8,
  		height: 34,
  		xoffset: 1,
  		yoffset: 4,
  		xadvance: 11,
  		chnl: 15,
  		x: 175,
  		y: 105,
  		page: 0
  	},
  	{
  		id: 63,
  		index: 35,
  		char: "?",
  		width: 21,
  		height: 34,
  		xoffset: 0,
  		yoffset: 4,
  		xadvance: 20,
  		chnl: 15,
  		x: 181,
  		y: 70,
  		page: 0
  	},
  	{
  		id: 116,
  		index: 88,
  		char: "t",
  		width: 16,
  		height: 32,
  		xoffset: -2,
  		yoffset: 6,
  		xadvance: 14,
  		chnl: 15,
  		x: 175,
  		y: 140,
  		page: 0
  	},
  	{
  		id: 97,
  		index: 69,
  		char: "a",
  		width: 22,
  		height: 27,
  		xoffset: 0,
  		yoffset: 11,
  		xadvance: 23,
  		chnl: 15,
  		x: 175,
  		y: 173,
  		page: 0
  	},
  	{
  		id: 99,
  		index: 71,
  		char: "c",
  		width: 23,
  		height: 27,
  		xoffset: 0,
  		yoffset: 11,
  		xadvance: 22,
  		chnl: 15,
  		x: 184,
  		y: 105,
  		page: 0
  	},
  	{
  		id: 101,
  		index: 73,
  		char: "e",
  		width: 23,
  		height: 27,
  		xoffset: 0,
  		yoffset: 11,
  		xadvance: 22,
  		chnl: 15,
  		x: 203,
  		y: 70,
  		page: 0
  	},
  	{
  		id: 110,
  		index: 82,
  		char: "n",
  		width: 21,
  		height: 27,
  		xoffset: 1,
  		yoffset: 11,
  		xadvance: 23,
  		chnl: 15,
  		x: 227,
  		y: 70,
  		page: 0
  	},
  	{
  		id: 111,
  		index: 83,
  		char: "o",
  		width: 24,
  		height: 27,
  		xoffset: 0,
  		yoffset: 11,
  		xadvance: 24,
  		chnl: 15,
  		x: 192,
  		y: 133,
  		page: 0
  	},
  	{
  		id: 114,
  		index: 86,
  		char: "r",
  		width: 15,
  		height: 27,
  		xoffset: 1,
  		yoffset: 11,
  		xadvance: 14,
  		chnl: 15,
  		x: 208,
  		y: 98,
  		page: 0
  	},
  	{
  		id: 115,
  		index: 87,
  		char: "s",
  		width: 22,
  		height: 27,
  		xoffset: 0,
  		yoffset: 11,
  		xadvance: 22,
  		chnl: 15,
  		x: 224,
  		y: 98,
  		page: 0
  	},
  	{
  		id: 117,
  		index: 89,
  		char: "u",
  		width: 21,
  		height: 27,
  		xoffset: 1,
  		yoffset: 12,
  		xadvance: 23,
  		chnl: 15,
  		x: 217,
  		y: 126,
  		page: 0
  	},
  	{
  		id: 118,
  		index: 90,
  		char: "v",
  		width: 23,
  		height: 26,
  		xoffset: -1,
  		yoffset: 12,
  		xadvance: 20,
  		chnl: 15,
  		x: 145,
  		y: 140,
  		page: 0
  	},
  	{
  		id: 120,
  		index: 92,
  		char: "x",
  		width: 23,
  		height: 26,
  		xoffset: -1,
  		yoffset: 12,
  		xadvance: 21,
  		chnl: 15,
  		x: 217,
  		y: 154,
  		page: 0
  	},
  	{
  		id: 122,
  		index: 94,
  		char: "z",
  		width: 22,
  		height: 26,
  		xoffset: 0,
  		yoffset: 12,
  		xadvance: 21,
  		chnl: 15,
  		x: 181,
  		y: 201,
  		page: 0
  	},
  	{
  		id: 32,
  		index: 4,
  		char: " ",
  		width: 0,
  		height: 0,
  		xoffset: -2,
  		yoffset: 34,
  		xadvance: 10,
  		chnl: 15,
  		x: 0,
  		y: 256,
  		page: 0
  	}
  ];
  var info = {
  	face: "Roboto-Regular",
  	size: 42,
  	bold: 0,
  	italic: 0,
  	charset: [
  		"a",
  		"b",
  		"c",
  		"d",
  		"e",
  		"f",
  		"g",
  		"h",
  		"i",
  		"j",
  		"k",
  		"l",
  		"m",
  		"n",
  		"o",
  		"p",
  		"q",
  		"r",
  		"s",
  		"t",
  		"u",
  		"v",
  		"w",
  		"x",
  		"y",
  		"z",
  		"A",
  		"B",
  		"C",
  		"D",
  		"E",
  		"F",
  		"G",
  		"H",
  		"I",
  		"J",
  		"K",
  		"L",
  		"M",
  		"N",
  		"O",
  		"P",
  		"Q",
  		"R",
  		"S",
  		"T",
  		"U",
  		"V",
  		"W",
  		"X",
  		"Y",
  		"Z",
  		"1",
  		"2",
  		"3",
  		"4",
  		"5",
  		"6",
  		"7",
  		"8",
  		"9",
  		"0",
  		" ",
  		"!",
  		"?"
  	],
  	unicode: 1,
  	stretchH: 100,
  	smooth: 1,
  	aa: 1,
  	padding: [
  		2,
  		2,
  		2,
  		2
  	],
  	spacing: [
  		0,
  		0
  	]
  };
  var common = {
  	lineHeight: 44,
  	base: 34,
  	scaleW: 256,
  	scaleH: 256,
  	pages: 1,
  	packed: 0,
  	alphaChnl: 0,
  	redChnl: 0,
  	greenChnl: 0,
  	blueChnl: 0
  };
  var distanceField = {
  	fieldType: "msdf",
  	distanceRange: 4
  };
  var kernings = [
  	{
  		first: 97,
  		second: 118,
  		amount: 0
  	},
  	{
  		first: 97,
  		second: 121,
  		amount: 0
  	},
  	{
  		first: 98,
  		second: 118,
  		amount: 0
  	},
  	{
  		first: 98,
  		second: 120,
  		amount: 0
  	},
  	{
  		first: 98,
  		second: 121,
  		amount: 0
  	},
  	{
  		first: 98,
  		second: 122,
  		amount: 0
  	},
  	{
  		first: 101,
  		second: 118,
  		amount: 0
  	},
  	{
  		first: 101,
  		second: 121,
  		amount: 0
  	},
  	{
  		first: 102,
  		second: 99,
  		amount: 0
  	},
  	{
  		first: 102,
  		second: 100,
  		amount: 0
  	},
  	{
  		first: 102,
  		second: 101,
  		amount: 0
  	},
  	{
  		first: 102,
  		second: 103,
  		amount: 0
  	},
  	{
  		first: 102,
  		second: 113,
  		amount: 0
  	},
  	{
  		first: 107,
  		second: 99,
  		amount: 0
  	},
  	{
  		first: 107,
  		second: 100,
  		amount: 0
  	},
  	{
  		first: 107,
  		second: 101,
  		amount: 0
  	},
  	{
  		first: 107,
  		second: 103,
  		amount: 0
  	},
  	{
  		first: 107,
  		second: 113,
  		amount: 0
  	},
  	{
  		first: 111,
  		second: 118,
  		amount: 0
  	},
  	{
  		first: 111,
  		second: 120,
  		amount: 0
  	},
  	{
  		first: 111,
  		second: 121,
  		amount: 0
  	},
  	{
  		first: 111,
  		second: 122,
  		amount: 0
  	},
  	{
  		first: 112,
  		second: 118,
  		amount: 0
  	},
  	{
  		first: 112,
  		second: 120,
  		amount: 0
  	},
  	{
  		first: 112,
  		second: 121,
  		amount: 0
  	},
  	{
  		first: 112,
  		second: 122,
  		amount: 0
  	},
  	{
  		first: 114,
  		second: 97,
  		amount: -1
  	},
  	{
  		first: 114,
  		second: 99,
  		amount: 0
  	},
  	{
  		first: 114,
  		second: 100,
  		amount: 0
  	},
  	{
  		first: 114,
  		second: 101,
  		amount: 0
  	},
  	{
  		first: 114,
  		second: 102,
  		amount: 0
  	},
  	{
  		first: 114,
  		second: 103,
  		amount: 0
  	},
  	{
  		first: 114,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 114,
  		second: 113,
  		amount: 0
  	},
  	{
  		first: 114,
  		second: 116,
  		amount: 1
  	},
  	{
  		first: 114,
  		second: 118,
  		amount: 0
  	},
  	{
  		first: 114,
  		second: 119,
  		amount: 0
  	},
  	{
  		first: 114,
  		second: 121,
  		amount: 0
  	},
  	{
  		first: 116,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 118,
  		second: 97,
  		amount: 0
  	},
  	{
  		first: 118,
  		second: 99,
  		amount: 0
  	},
  	{
  		first: 118,
  		second: 100,
  		amount: 0
  	},
  	{
  		first: 118,
  		second: 101,
  		amount: 0
  	},
  	{
  		first: 118,
  		second: 102,
  		amount: 0
  	},
  	{
  		first: 118,
  		second: 103,
  		amount: 0
  	},
  	{
  		first: 118,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 118,
  		second: 113,
  		amount: 0
  	},
  	{
  		first: 120,
  		second: 99,
  		amount: 0
  	},
  	{
  		first: 120,
  		second: 100,
  		amount: 0
  	},
  	{
  		first: 120,
  		second: 101,
  		amount: 0
  	},
  	{
  		first: 120,
  		second: 103,
  		amount: 0
  	},
  	{
  		first: 120,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 120,
  		second: 113,
  		amount: 0
  	},
  	{
  		first: 121,
  		second: 97,
  		amount: 0
  	},
  	{
  		first: 121,
  		second: 99,
  		amount: 0
  	},
  	{
  		first: 121,
  		second: 100,
  		amount: 0
  	},
  	{
  		first: 121,
  		second: 101,
  		amount: 0
  	},
  	{
  		first: 121,
  		second: 102,
  		amount: 0
  	},
  	{
  		first: 121,
  		second: 103,
  		amount: 0
  	},
  	{
  		first: 121,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 121,
  		second: 113,
  		amount: 0
  	},
  	{
  		first: 122,
  		second: 99,
  		amount: 0
  	},
  	{
  		first: 122,
  		second: 100,
  		amount: 0
  	},
  	{
  		first: 122,
  		second: 101,
  		amount: 0
  	},
  	{
  		first: 122,
  		second: 103,
  		amount: 0
  	},
  	{
  		first: 122,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 122,
  		second: 113,
  		amount: 0
  	},
  	{
  		first: 65,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 65,
  		second: 116,
  		amount: 0
  	},
  	{
  		first: 65,
  		second: 117,
  		amount: 0
  	},
  	{
  		first: 65,
  		second: 118,
  		amount: -1
  	},
  	{
  		first: 65,
  		second: 119,
  		amount: -1
  	},
  	{
  		first: 65,
  		second: 121,
  		amount: -1
  	},
  	{
  		first: 65,
  		second: 122,
  		amount: 0
  	},
  	{
  		first: 65,
  		second: 67,
  		amount: 0
  	},
  	{
  		first: 65,
  		second: 71,
  		amount: 0
  	},
  	{
  		first: 65,
  		second: 79,
  		amount: 0
  	},
  	{
  		first: 65,
  		second: 81,
  		amount: 0
  	},
  	{
  		first: 65,
  		second: 84,
  		amount: -3
  	},
  	{
  		first: 65,
  		second: 85,
  		amount: 0
  	},
  	{
  		first: 65,
  		second: 86,
  		amount: -2
  	},
  	{
  		first: 65,
  		second: 87,
  		amount: -1
  	},
  	{
  		first: 65,
  		second: 89,
  		amount: -2
  	},
  	{
  		first: 65,
  		second: 63,
  		amount: -1
  	},
  	{
  		first: 66,
  		second: 84,
  		amount: -1
  	},
  	{
  		first: 66,
  		second: 86,
  		amount: 0
  	},
  	{
  		first: 66,
  		second: 89,
  		amount: -1
  	},
  	{
  		first: 67,
  		second: 84,
  		amount: -1
  	},
  	{
  		first: 68,
  		second: 65,
  		amount: 0
  	},
  	{
  		first: 68,
  		second: 84,
  		amount: -1
  	},
  	{
  		first: 68,
  		second: 86,
  		amount: 0
  	},
  	{
  		first: 68,
  		second: 88,
  		amount: 0
  	},
  	{
  		first: 68,
  		second: 89,
  		amount: -1
  	},
  	{
  		first: 68,
  		second: 90,
  		amount: 0
  	},
  	{
  		first: 69,
  		second: 99,
  		amount: 0
  	},
  	{
  		first: 69,
  		second: 100,
  		amount: 0
  	},
  	{
  		first: 69,
  		second: 101,
  		amount: 0
  	},
  	{
  		first: 69,
  		second: 102,
  		amount: 0
  	},
  	{
  		first: 69,
  		second: 103,
  		amount: 0
  	},
  	{
  		first: 69,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 69,
  		second: 113,
  		amount: 0
  	},
  	{
  		first: 69,
  		second: 117,
  		amount: 0
  	},
  	{
  		first: 69,
  		second: 118,
  		amount: -1
  	},
  	{
  		first: 69,
  		second: 119,
  		amount: 0
  	},
  	{
  		first: 69,
  		second: 121,
  		amount: -1
  	},
  	{
  		first: 69,
  		second: 84,
  		amount: 0
  	},
  	{
  		first: 70,
  		second: 97,
  		amount: -1
  	},
  	{
  		first: 70,
  		second: 99,
  		amount: 0
  	},
  	{
  		first: 70,
  		second: 100,
  		amount: 0
  	},
  	{
  		first: 70,
  		second: 101,
  		amount: 0
  	},
  	{
  		first: 70,
  		second: 103,
  		amount: 0
  	},
  	{
  		first: 70,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 70,
  		second: 113,
  		amount: 0
  	},
  	{
  		first: 70,
  		second: 114,
  		amount: -1
  	},
  	{
  		first: 70,
  		second: 117,
  		amount: 0
  	},
  	{
  		first: 70,
  		second: 118,
  		amount: 0
  	},
  	{
  		first: 70,
  		second: 121,
  		amount: 0
  	},
  	{
  		first: 70,
  		second: 65,
  		amount: -3
  	},
  	{
  		first: 70,
  		second: 74,
  		amount: -5
  	},
  	{
  		first: 70,
  		second: 84,
  		amount: 0
  	},
  	{
  		first: 72,
  		second: 65,
  		amount: 0
  	},
  	{
  		first: 72,
  		second: 84,
  		amount: -1
  	},
  	{
  		first: 72,
  		second: 88,
  		amount: 0
  	},
  	{
  		first: 72,
  		second: 89,
  		amount: -1
  	},
  	{
  		first: 73,
  		second: 65,
  		amount: 0
  	},
  	{
  		first: 73,
  		second: 84,
  		amount: -1
  	},
  	{
  		first: 73,
  		second: 88,
  		amount: 0
  	},
  	{
  		first: 73,
  		second: 89,
  		amount: -1
  	},
  	{
  		first: 74,
  		second: 65,
  		amount: 0
  	},
  	{
  		first: 75,
  		second: 99,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 100,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 101,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 103,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 109,
  		amount: 0
  	},
  	{
  		first: 75,
  		second: 110,
  		amount: 0
  	},
  	{
  		first: 75,
  		second: 111,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 112,
  		amount: 0
  	},
  	{
  		first: 75,
  		second: 113,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 117,
  		amount: 0
  	},
  	{
  		first: 75,
  		second: 118,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 119,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 121,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 67,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 71,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 79,
  		amount: -1
  	},
  	{
  		first: 75,
  		second: 81,
  		amount: -1
  	},
  	{
  		first: 76,
  		second: 117,
  		amount: -1
  	},
  	{
  		first: 76,
  		second: 118,
  		amount: -3
  	},
  	{
  		first: 76,
  		second: 119,
  		amount: -2
  	},
  	{
  		first: 76,
  		second: 121,
  		amount: -3
  	},
  	{
  		first: 76,
  		second: 65,
  		amount: 0
  	},
  	{
  		first: 76,
  		second: 67,
  		amount: -1
  	},
  	{
  		first: 76,
  		second: 71,
  		amount: -1
  	},
  	{
  		first: 76,
  		second: 79,
  		amount: -1
  	},
  	{
  		first: 76,
  		second: 81,
  		amount: -1
  	},
  	{
  		first: 76,
  		second: 84,
  		amount: -6
  	},
  	{
  		first: 76,
  		second: 85,
  		amount: -1
  	},
  	{
  		first: 76,
  		second: 86,
  		amount: -4
  	},
  	{
  		first: 76,
  		second: 87,
  		amount: -3
  	},
  	{
  		first: 76,
  		second: 89,
  		amount: -5
  	},
  	{
  		first: 77,
  		second: 65,
  		amount: 0
  	},
  	{
  		first: 77,
  		second: 84,
  		amount: -1
  	},
  	{
  		first: 77,
  		second: 88,
  		amount: 0
  	},
  	{
  		first: 77,
  		second: 89,
  		amount: -1
  	},
  	{
  		first: 78,
  		second: 65,
  		amount: 0
  	},
  	{
  		first: 78,
  		second: 84,
  		amount: -1
  	},
  	{
  		first: 78,
  		second: 88,
  		amount: 0
  	},
  	{
  		first: 78,
  		second: 89,
  		amount: -1
  	},
  	{
  		first: 79,
  		second: 65,
  		amount: 0
  	},
  	{
  		first: 79,
  		second: 84,
  		amount: -1
  	},
  	{
  		first: 79,
  		second: 86,
  		amount: 0
  	},
  	{
  		first: 79,
  		second: 88,
  		amount: 0
  	},
  	{
  		first: 79,
  		second: 89,
  		amount: -1
  	},
  	{
  		first: 79,
  		second: 90,
  		amount: 0
  	},
  	{
  		first: 80,
  		second: 97,
  		amount: 0
  	},
  	{
  		first: 80,
  		second: 99,
  		amount: 0
  	},
  	{
  		first: 80,
  		second: 100,
  		amount: 0
  	},
  	{
  		first: 80,
  		second: 101,
  		amount: 0
  	},
  	{
  		first: 80,
  		second: 103,
  		amount: 0
  	},
  	{
  		first: 80,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 80,
  		second: 113,
  		amount: 0
  	},
  	{
  		first: 80,
  		second: 116,
  		amount: 0
  	},
  	{
  		first: 80,
  		second: 118,
  		amount: 0
  	},
  	{
  		first: 80,
  		second: 121,
  		amount: 0
  	},
  	{
  		first: 80,
  		second: 65,
  		amount: -3
  	},
  	{
  		first: 80,
  		second: 74,
  		amount: -4
  	},
  	{
  		first: 80,
  		second: 88,
  		amount: -1
  	},
  	{
  		first: 80,
  		second: 90,
  		amount: -1
  	},
  	{
  		first: 81,
  		second: 84,
  		amount: -1
  	},
  	{
  		first: 81,
  		second: 86,
  		amount: -1
  	},
  	{
  		first: 81,
  		second: 87,
  		amount: 0
  	},
  	{
  		first: 81,
  		second: 89,
  		amount: -1
  	},
  	{
  		first: 82,
  		second: 84,
  		amount: -2
  	},
  	{
  		first: 82,
  		second: 86,
  		amount: 0
  	},
  	{
  		first: 82,
  		second: 89,
  		amount: -1
  	},
  	{
  		first: 84,
  		second: 97,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 99,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 100,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 101,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 103,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 109,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 110,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 111,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 112,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 113,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 114,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 115,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 117,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 118,
  		amount: -1
  	},
  	{
  		first: 84,
  		second: 119,
  		amount: -1
  	},
  	{
  		first: 84,
  		second: 120,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 121,
  		amount: -1
  	},
  	{
  		first: 84,
  		second: 122,
  		amount: -1
  	},
  	{
  		first: 84,
  		second: 65,
  		amount: -2
  	},
  	{
  		first: 84,
  		second: 67,
  		amount: -1
  	},
  	{
  		first: 84,
  		second: 71,
  		amount: -1
  	},
  	{
  		first: 84,
  		second: 74,
  		amount: -5
  	},
  	{
  		first: 84,
  		second: 79,
  		amount: -1
  	},
  	{
  		first: 84,
  		second: 81,
  		amount: -1
  	},
  	{
  		first: 84,
  		second: 83,
  		amount: 0
  	},
  	{
  		first: 84,
  		second: 84,
  		amount: 0
  	},
  	{
  		first: 84,
  		second: 86,
  		amount: 0
  	},
  	{
  		first: 84,
  		second: 87,
  		amount: 0
  	},
  	{
  		first: 84,
  		second: 89,
  		amount: 0
  	},
  	{
  		first: 84,
  		second: 32,
  		amount: -1
  	},
  	{
  		first: 85,
  		second: 65,
  		amount: 0
  	},
  	{
  		first: 86,
  		second: 97,
  		amount: -1
  	},
  	{
  		first: 86,
  		second: 99,
  		amount: -1
  	},
  	{
  		first: 86,
  		second: 100,
  		amount: -1
  	},
  	{
  		first: 86,
  		second: 101,
  		amount: -1
  	},
  	{
  		first: 86,
  		second: 103,
  		amount: -1
  	},
  	{
  		first: 86,
  		second: 111,
  		amount: -1
  	},
  	{
  		first: 86,
  		second: 113,
  		amount: -1
  	},
  	{
  		first: 86,
  		second: 114,
  		amount: -1
  	},
  	{
  		first: 86,
  		second: 117,
  		amount: -1
  	},
  	{
  		first: 86,
  		second: 118,
  		amount: 0
  	},
  	{
  		first: 86,
  		second: 121,
  		amount: 0
  	},
  	{
  		first: 86,
  		second: 65,
  		amount: -2
  	},
  	{
  		first: 86,
  		second: 67,
  		amount: 0
  	},
  	{
  		first: 86,
  		second: 71,
  		amount: 0
  	},
  	{
  		first: 86,
  		second: 79,
  		amount: 0
  	},
  	{
  		first: 86,
  		second: 81,
  		amount: 0
  	},
  	{
  		first: 87,
  		second: 97,
  		amount: -1
  	},
  	{
  		first: 87,
  		second: 99,
  		amount: -1
  	},
  	{
  		first: 87,
  		second: 100,
  		amount: -1
  	},
  	{
  		first: 87,
  		second: 101,
  		amount: -1
  	},
  	{
  		first: 87,
  		second: 103,
  		amount: -1
  	},
  	{
  		first: 87,
  		second: 111,
  		amount: -1
  	},
  	{
  		first: 87,
  		second: 113,
  		amount: -1
  	},
  	{
  		first: 87,
  		second: 114,
  		amount: 0
  	},
  	{
  		first: 87,
  		second: 117,
  		amount: 0
  	},
  	{
  		first: 87,
  		second: 65,
  		amount: -1
  	},
  	{
  		first: 87,
  		second: 84,
  		amount: 0
  	},
  	{
  		first: 88,
  		second: 99,
  		amount: -1
  	},
  	{
  		first: 88,
  		second: 100,
  		amount: -1
  	},
  	{
  		first: 88,
  		second: 101,
  		amount: -1
  	},
  	{
  		first: 88,
  		second: 103,
  		amount: -1
  	},
  	{
  		first: 88,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 88,
  		second: 113,
  		amount: -1
  	},
  	{
  		first: 88,
  		second: 117,
  		amount: 0
  	},
  	{
  		first: 88,
  		second: 118,
  		amount: -1
  	},
  	{
  		first: 88,
  		second: 121,
  		amount: -1
  	},
  	{
  		first: 88,
  		second: 67,
  		amount: -1
  	},
  	{
  		first: 88,
  		second: 71,
  		amount: -1
  	},
  	{
  		first: 88,
  		second: 79,
  		amount: -1
  	},
  	{
  		first: 88,
  		second: 81,
  		amount: -1
  	},
  	{
  		first: 88,
  		second: 86,
  		amount: 0
  	},
  	{
  		first: 89,
  		second: 97,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 99,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 100,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 101,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 102,
  		amount: 0
  	},
  	{
  		first: 89,
  		second: 103,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 109,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 110,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 111,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 112,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 113,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 114,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 115,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 116,
  		amount: 0
  	},
  	{
  		first: 89,
  		second: 117,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 118,
  		amount: 0
  	},
  	{
  		first: 89,
  		second: 120,
  		amount: 0
  	},
  	{
  		first: 89,
  		second: 121,
  		amount: 0
  	},
  	{
  		first: 89,
  		second: 122,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 65,
  		amount: -2
  	},
  	{
  		first: 89,
  		second: 67,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 71,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 74,
  		amount: -2
  	},
  	{
  		first: 89,
  		second: 79,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 81,
  		amount: -1
  	},
  	{
  		first: 89,
  		second: 83,
  		amount: 0
  	},
  	{
  		first: 89,
  		second: 84,
  		amount: 0
  	},
  	{
  		first: 89,
  		second: 85,
  		amount: -2
  	},
  	{
  		first: 89,
  		second: 86,
  		amount: 0
  	},
  	{
  		first: 89,
  		second: 87,
  		amount: 0
  	},
  	{
  		first: 89,
  		second: 88,
  		amount: 0
  	},
  	{
  		first: 89,
  		second: 89,
  		amount: 0
  	},
  	{
  		first: 90,
  		second: 99,
  		amount: 0
  	},
  	{
  		first: 90,
  		second: 100,
  		amount: 0
  	},
  	{
  		first: 90,
  		second: 101,
  		amount: 0
  	},
  	{
  		first: 90,
  		second: 103,
  		amount: 0
  	},
  	{
  		first: 90,
  		second: 111,
  		amount: 0
  	},
  	{
  		first: 90,
  		second: 113,
  		amount: 0
  	},
  	{
  		first: 90,
  		second: 117,
  		amount: 0
  	},
  	{
  		first: 90,
  		second: 118,
  		amount: -1
  	},
  	{
  		first: 90,
  		second: 119,
  		amount: -1
  	},
  	{
  		first: 90,
  		second: 121,
  		amount: -1
  	},
  	{
  		first: 90,
  		second: 65,
  		amount: 0
  	},
  	{
  		first: 90,
  		second: 67,
  		amount: -1
  	},
  	{
  		first: 90,
  		second: 71,
  		amount: -1
  	},
  	{
  		first: 90,
  		second: 79,
  		amount: -1
  	},
  	{
  		first: 90,
  		second: 81,
  		amount: -1
  	},
  	{
  		first: 32,
  		second: 84,
  		amount: -1
  	}
  ];
  var fontsData = {
  	pages: pages,
  	chars: chars,
  	info: info,
  	common: common,
  	distanceField: distanceField,
  	kernings: kernings
  };

  var list = [
  	{
  		name: "Basic",
  		output: "index.html",
  		slug: "basic",
  		description: "Simple MSDF geometry example with THREE.MeshBasicMaterial."
  	},
  	{
  		name: "Small text",
  		output: "small-text.html",
  		slug: "small-text",
  		description: "MSDF material example using threshold distance options to improve rendering on small text."
  	},
  	{
  		name: "PBR",
  		output: "standard.html",
  		slug: "standard",
  		description: "MSDF example with THREE.MeshStandardMaterial."
  	},
  	{
  		name: "Stroke",
  		output: "stroke.html",
  		slug: "stroke",
  		description: "MSDF material example with `stroke`, `strokeInnerWidth` and `strokeOuterWidth` options. "
  	},
  	{
  		name: "Shader",
  		output: "shader.html",
  		slug: "shader",
  		description: "MSDF Shader material example."
  	},
  	{
  		name: "Attributes",
  		output: "attributes.html",
  		slug: "attributes",
  		description: "Extended attributes raycast example."
  	}
  ];

  window.pane = new Tweakpane.Pane();

  const demoName = window.location.href.match(/([\w\-.]+?)$/);
  const actualDemoName = demoName ? demoName[1] : 'index.html';

  pane
    .addBlade({
      view: 'list',
      label: 'demo',
      options: list.map((entry) => {
        return { text: entry.name, value: entry.output }
      }),
      value: actualDemoName,
    })
    .on('change', (ev) => {
      window.location.href = window.location.href.replace(
        /\/[\w\-.]*?$/,
        `/${ev.value}`,
      );
    });

  let renderer,
    canvas,
    scene,
    loader,
    atlas,
    font,
    camera,
    helper,
    boundingBox,
    mesh;

  const state = {
    color: { r: 255, g: 0, b: 55 },
    opacity: 1,
    text: '',
    debug: {
      boundingBox: false,
      axes: false,
    },
    alignX: 'center',
    alignY: 'center',
    size: 5,
    letterSpacing: 0,
    lineHeight: 1,
    wordSpacing: 0,
    wordBreak: false,
    lineBreak: true,
  };

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  async function initScene() {
    canvas = document.querySelector('#canvas');
    scene = new THREE.Scene();
    loader = new THREE.TextureLoader();
    atlas = await loader.loadAsync('./assets/font/Roboto-Regular.png');
    font = new Font(fontsData);
    renderer = new THREE.WebGLRenderer({
      canvas,
    });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    camera.position.set(0, 0, 15);
    camera.lookAt(new THREE.Vector3());

    onResize();

    window.addEventListener('resize', onResize);

    return { renderer, camera, scene, font, atlas, loader }
  }

  function updateGeometry() {
    mesh.geometry.computeGeometry();
    boundingBox.setFromObject(mesh);
  }

  /**
   * Create debug folder in Tweakpane
   * Display THREE.js helpers
   */
  function initDebugGUI() {
    const debugPane = pane.addFolder({
      title: 'Debug',
    });

    helper = new THREE.AxesHelper(10);
    helper.visible = state.debug.axes;
    scene.add(helper);

    boundingBox = new THREE.BoxHelper(mesh, 0xffff00);
    boundingBox.visible = state.debug.boundingBox;
    scene.add(boundingBox);

    debugPane.addInput(state.debug, 'axes').on('change', () => {
      helper.visible = state.debug.axes;
    });

    debugPane.addInput(state.debug, 'boundingBox').on('change', () => {
      boundingBox.visible = state.debug.boundingBox;
    });
  }

  /**
   * Create geometry folder in Tweakpane
   */
  function initGeometryGUI() {
    const geoPane = pane.addFolder({
      title: 'Geometry',
    });

    geoPane
      .addInput(state, 'alignX', {
        options: {
          center: 'center',
          left: 'left',
          right: 'right',
        },
      })
      .on('change', () => {
        mesh.geometry.layout.alignX = state.alignX;
        updateGeometry();
      });

    geoPane
      .addInput(state, 'alignY', {
        options: {
          center: 'center',
          top: 'top',
          bottom: 'bottom',
        },
      })
      .on('change', () => {
        mesh.geometry.layout.alignY = state.alignY;
        updateGeometry();
      });

    geoPane
      .addInput(state, 'size', {
        min: 0.1,
        max: 20,
      })
      .on('change', (e) => {
        mesh.geometry.layout.size = state.size;
        updateGeometry();
      });

    geoPane
      .addInput(state, 'letterSpacing', {
        min: 0,
        max: 1,
      })
      .on('change', (e) => {
        mesh.geometry.layout.letterSpacing = state.letterSpacing;
        updateGeometry();
      });

    geoPane
      .addInput(state, 'lineHeight', {
        min: 0.5,
        max: 2,
      })
      .on('change', (e) => {
        mesh.geometry.layout.lineHeight = state.lineHeight;
        updateGeometry();
      });

    geoPane
      .addInput(state, 'wordSpacing', {
        min: 0,
        max: 1,
      })
      .on('change', (e) => {
        mesh.geometry.layout.wordSpacing = state.wordSpacing;
        updateGeometry();
      });

    geoPane.addInput(state, 'wordBreak').on('change', (e) => {
      mesh.geometry.layout.wordBreak = state.wordBreak;
      updateGeometry();
    });

    geoPane.addInput(state, 'lineBreak').on('change', (e) => {
      mesh.geometry.layout.lineBreak = state.lineBreak;
      updateGeometry();
    });
  }

  /**
   * Create material folder in Tweakpane
   */
  function initMaterialGUI() {
    const matPane = pane.addFolder({
      title: 'Material',
    });

    matPane.addInput(state, 'color').on('change', (e) => {
      mesh.material.color.r = e.value.r / 256;
      mesh.material.color.g = e.value.g / 256;
      mesh.material.color.b = e.value.b / 256;
    });

    matPane
      .addInput(state, 'opacity', {
        min: 0,
        max: 1,
      })
      .on('change', (e) => {
        mesh.material.opacity = e.value;
      });
  }

  function initTypingListeners() {
    window.addEventListener('keypress', (e) => {
      if (e.key.length > 1) return
      if (['Backspace', 'Enter'].indexOf(e.key) > -1) return

      state.text += e.key;
      mesh.geometry.updateText(state.text);
      boundingBox.setFromObject(mesh);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') state.text = state.text.slice(0, -1);
      if (e.key === 'Enter') state.text += '\n';

      mesh.geometry.updateText(state.text);
      boundingBox.setFromObject(mesh);
    });
  }

  function initGUI(m, scene, { material = true } = {}) {
    mesh = m;
    state.text = mesh.geometry.text;

    initTypingListeners();
    initGeometryGUI();
    initDebugGUI();
    if (material) initMaterialGUI();
  }

  /**
   * @author SolalDR
   * @link https://solaldr.github.io/three-msdf-text/public/demo/small-text.html
   */

  async function init() {
    const { renderer, camera, scene, font, atlas, loader } = await initScene();

    const state = {
      text: `\tLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Sagittis aliquam malesuada bibendum arcu vitae elementum. Ullamcorper malesuada proin libero nunc. Tortor pretium viverra suspendisse potenti nullam ac. Gravida dictum fusce ut placerat. Sit amet consectetur adipiscing elit ut aliquam purus. Justo nec ultrices dui sapien eget mi. Varius morbi enim nunc faucibus a pellentesque sit amet. Elit sed vulputate mi sit amet mauris. In ornare quam viverra orci sagittis eu volutpat. Nunc pulvinar sapien et ligula ullamcorper malesuada proin libero. Quam adipiscing vitae proin sagittis nisl rhoncus mattis rhoncus urna. Fringilla phasellus faucibus scelerisque eleifend donec pretium vulputate sapien. Nibh mauris cursus mattis molestie a iaculis at. Risus commodo viverra maecenas accumsan. Senectus et netus et malesuada fames ac turpis egestas.

    \tSem integer vitae justo eget magna. Mattis enim ut tellus elementum sagittis vitae et leo. Facilisis leo vel fringilla est ullamcorper eget nulla facilisi. Ultricies leo integer malesuada nunc vel risus. Urna cursus eget nunc scelerisque. Lacus laoreet non curabitur gravida. Nulla facilisi morbi tempus iaculis urna id volutpat lacus laoreet. Imperdiet nulla malesuada pellentesque elit eget gravida cum sociis. Aliquam etiam erat velit scelerisque in dictum non. Mollis aliquam ut porttitor leo a diam sollicitudin tempor id. Dictum varius duis at consectetur lorem donec massa sapien faucibus. Posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque egestas diam in arcu cursus euismod. Consequat id porta nibh venenatis. Morbi enim nunc faucibus a. Commodo sed egestas egestas fringilla phasellus faucibus scelerisque.

    \tFermentum posuere urna nec tincidunt praesent semper feugiat nibh. Cursus risus at ultrices mi tempus imperdiet. Nisl nunc mi ipsum faucibus vitae aliquet nec. At auctor urna nunc id cursus metus aliquam eleifend. Donec ultrices tincidunt arcu non sodales neque. Sodales ut etiam sit amet nisl purus in mollis. Neque sodales ut etiam sit. Sit amet nisl purus in mollis nunc sed id. Bibendum est ultricies integer quis auctor elit sed vulputate mi. Sit amet aliquam id diam maecenas ultricies. Neque sodales ut etiam sit amet nisl. Ultrices tincidunt arcu non sodales neque. Risus viverra adipiscing at in tellus. Luctus venenatis lectus magna fringilla urna porttitor. Urna porttitor rhoncus dolor purus non enim praesent elementum.

    \tNunc eget lorem dolor sed viverra ipsum. Risus ultricies tristique nulla aliquet enim. Adipiscing commodo elit at imperdiet dui accumsan sit amet. Vestibulum sed arcu non odio euismod lacinia. In ante metus dictum at tempor commodo ullamcorper. Tellus rutrum tellus pellentesque eu. Velit scelerisque in dictum non consectetur a erat nam. Tincidunt ornare massa eget egestas. Ac tortor vitae purus faucibus ornare suspendisse sed. Posuere ac ut consequat semper viverra. Neque egestas congue quisque egestas diam. Turpis egestas pretium aenean pharetra. In vitae turpis massa sed elementum. Blandit libero volutpat sed cras ornare arcu dui vivamus arcu. Praesent elementum facilisis leo vel fringilla est ullamcorper eget. Sit amet commodo nulla facilisi nullam vehicula. Ultricies leo integer malesuada nunc vel risus. Phasellus vestibulum lorem sed risus. Quis viverra nibh cras pulvinar mattis nunc sed blandit libero. Ligula ullamcorper malesuada proin libero.
    `,
    };

    const geometry = new TextGeometry$1({
      font: font,
      text: state.text,
      size: 0.3,
      alignY: 'center',
      alignX: 'left',
      lineHeight: 1.2,
      width: 26,
    });

    let material = extendMSDFMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 1,
        transparent: true,
        side: THREE.DoubleSide,
      }),
      {
        atlas,
        threshold: 0.1,
      },
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = -13;
    initGUI(mesh);

    pane
      .addInput(material, 'threshold', {
        min: 0,
        max: 0.1,
      })
      .on('change', () => {
        material.needsUpdate = true;
      });

    scene.add(mesh);

    function loop() {
      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }
    loop();
  }

  window.addEventListener('load', init);

}));
