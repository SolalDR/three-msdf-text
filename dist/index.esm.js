import * as THREE from 'three';
import { ShaderChunk, ShaderLib } from 'three';

const newline = /\n/;
const whitespace = /\s/;

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
class MSDFGeometry extends THREE.BufferGeometry {
    font;
    text;
    width;
    alignX;
    alignY;
    size;
    letterSpacing;
    lineHeight;
    wordSpacing;
    wordBreak;
    textScale;
    computedWidth;
    computedHeight;
    lineCount;
    constructor({ font, text, width = Infinity, alignX = 'left', alignY = 'top', size = 1, letterSpacing = 0, lineHeight = 1.4, wordSpacing = 0, wordBreak = false, useUv = true, usecharPosition = true, } = {}) {
        super();
        this.font = font;
        this.text = text;
        this.width = width;
        this.alignX = alignX;
        this.alignY = alignY;
        this.size = size;
        this.letterSpacing = letterSpacing;
        this.lineHeight = lineHeight;
        this.wordSpacing = wordSpacing;
        this.wordBreak = wordBreak;
        this.textScale =
            this.size / (this.font.common.baseline || this.font.common.base);
        this.generateGeometry({
            uv: useUv,
            position: true,
            charUv: true,
            index: true,
            charPosition: usecharPosition,
        });
    }
    generateGeometry({ uv = true, position = true, charUv = true, index = true, charPosition = true, } = {}) {
        // Strip spaces and newlines to get actual character length for buffers
        const chars = this.text.replace(/[ \n]/g, '');
        const numChars = chars.length;
        // Create output buffers
        this.setAttribute('position', new THREE.BufferAttribute(new Float32Array(numChars * 4 * 3), 3));
        this.setAttribute('charUv', new THREE.BufferAttribute(new Float32Array(numChars * 4 * 2), 2));
        if (charPosition)
            this.setAttribute('charPosition', new THREE.BufferAttribute(new Float32Array(numChars * 4 * 3), 3));
        if (uv)
            this.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(numChars * 4 * 2), 2));
        if (index) {
            this.setAttribute('charIndex', new THREE.BufferAttribute(new Float32Array(numChars * 4), 1));
            this.setAttribute('charIndex', new THREE.BufferAttribute(new Float32Array(numChars * 4), 1));
            this.setAttribute('lineCharIndex', new THREE.BufferAttribute(new Float32Array(numChars * 4), 1));
        }
        this.setAttribute('id', new THREE.BufferAttribute(new Float32Array(numChars * 4), 1));
        const indexArray = new Uint32Array(numChars * 6);
        // Set values for buffers that don't require calculation
        for (let i = 0; i < numChars; i++) {
            this.attributes.id.array.set([i, i, i, i], i * 4);
            indexArray.set([i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3], i * 6);
        }
        if (uv) {
            this.boundingBox = new THREE.Box3();
        }
        this.setIndex(Array.from(indexArray));
        this.generateLayout();
    }
    generateLayout() {
        const lines = [];
        let cursor = 0;
        let wordCursor = 0;
        let wordWidth = 0;
        let line = newLine();
        function newLine() {
            const line = {
                index: lines.length,
                width: 0,
                chars: [],
            };
            lines.push(line);
            wordCursor = cursor;
            wordWidth = 0;
            return line;
        }
        const maxTimes = 100;
        let count = 0;
        while (cursor < this.text.length && count < maxTimes) {
            count++;
            const char = this.text[cursor];
            // Skip whitespace at start of line
            if (!line.width && whitespace.test(char)) {
                cursor++;
                wordCursor = cursor;
                wordWidth = 0;
                continue;
            }
            // If newline char, skip to next line
            if (newline.test(char)) {
                cursor++;
                line = newLine();
                continue;
            }
            const glyph = this.font.glyphs[char] || this.font.glyphs[' '];
            if (!glyph) {
                throw new Error(`Missing glyph "${char}"`);
            }
            // Find any applicable kern pairs
            if (line.chars.length && glyph) {
                const prevGlyph = line.chars[line.chars.length - 1].glyph;
                const kern = getKernPairOffset(this.font.data, glyph.id || 0, prevGlyph.id) *
                    this.textScale;
                line.width += kern;
                wordWidth += kern;
            }
            // // add char to line
            line.chars.push({
                glyph,
                x: line.width,
                y: 0,
                lineIndex: line.index,
                lineCharIndex: line.chars.length,
            });
            // // calculate advance for next glyph
            let advance = 0;
            // // If whitespace, update location of current word for line breaks
            if (whitespace.test(char)) {
                wordCursor = cursor;
                wordWidth = 0;
                // Add wordspacing
                advance += this.wordSpacing * this.size;
            }
            else {
                // Add letterspacing
                advance += this.letterSpacing * this.size;
            }
            advance += glyph.xadvance * this.textScale;
            line.width += advance;
            wordWidth += advance;
            // If width defined
            if (line.width > this.width) {
                // If can break words, undo latest glyph if line not empty and create new line
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
            lines.pop();
        this.lineCount = lines.length;
        this.computedHeight = this.lineCount * this.size * this.lineHeight;
        this.computedWidth = Math.max(...lines.map(line => line.width));
        this.populateBuffers(lines);
    }
    populateBuffers(lines) {
        const texW = this.font.common.scaleW;
        const texH = this.font.common.scaleH;
        const cH = this.computedHeight;
        const cW = this.computedWidth;
        // For all fonts tested, a little offset was needed to be right on the baseline, hence 0.07.
        let y = 0.07 * this.size, x = 0;
        if (this.alignY === 'center') {
            y += this.computedHeight / 2;
        }
        else if (this.alignY === 'bottom') {
            y += this.computedHeight;
        }
        let j = 0;
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            for (let i = 0; i < line.chars.length; i++) {
                const glyph = line.chars[i].glyph;
                x = line.chars[i].x;
                if (this.alignX === 'center') {
                    x -= line.width * 0.5;
                }
                else if (this.alignX === 'right') {
                    x -= line.width;
                }
                // If space, don't add to geometry
                if (whitespace.test(glyph.char))
                    continue;
                // Apply char sprite offsets
                x += glyph.xoffset * this.textScale;
                y -= glyph.yoffset * this.textScale;
                // each letter is a quad. axis bottom left
                const w = glyph.width * this.textScale;
                const h = glyph.height * this.textScale;
                this.attributes.position.array.set([x, y - h, 0, x, y, 0, x + w, y - h, 0, x + w, y, 0], j * 4 * 3);
                if (this.attributes.charPosition) {
                    this.attributes.charPosition.array.set([x, y - h, 0, x, y, 0, x + w, y - h, 0, x + w, y, 0], j * 4 * 3);
                }
                if (this.attributes.uv) {
                    this.attributes.uv.array.set([
                        x / cW,
                        1 - (y - h) / -cH,
                        x / cW,
                        1 - y / -cH,
                        (x + w) / cW,
                        1 - (y - h) / -cH,
                        (x + w) / cW,
                        1 - y / -cH,
                    ], j * 4 * 2);
                }
                const u = glyph.x / texW;
                const uw = glyph.width / texW;
                const v = 1.0 - glyph.y / texH;
                const vh = glyph.height / texH;
                this.attributes.charUv.array.set([u, v - vh, u, v, u + uw, v - vh, u + uw, v], j * 4 * 2);
                this.attributes.charPosition.array.set([u, v - vh, u, v, u + uw, v - vh, u + uw, v], j * 4 * 3);
                // Reset cursor to baseline
                y += glyph.yoffset * this.textScale;
                j++;
            }
            y -= this.size * this.lineHeight;
        }
    }
    // Update buffers to layout with new layout
    resize(width) {
        this.width = width;
        this.generateGeometry();
    }
    // Completely change text (like creating new Text)
    updateText(text) {
        this.text = text;
        this.generateGeometry();
    }
}

class Font {
    data = {};
    glyphs = {};
    common = {};
    constructor(font) {
        this.data = font;
        this.common = font.common;
        font.chars.forEach((d) => (this.glyphs[d.char] = d));
    }
}

var msdftestFragment = "#define GLSLIFY 1\n#define SQRT2DIV2 0.7071067811865476\nfloat uThreshold=0.05;float uStrokeOutsetWidth=0.0;float uStrokeInsetWidth=0.5;vec3 uStrokeColor=vec3(1.0,0.0,0.0);\n#ifdef USE_MSDF_GEOMETRY\nvec3 msdfTexel=texture2D(uAtlas,vCharUv).rgb;float signedDist=max(min(msdfTexel.r,msdfTexel.g),min(max(msdfTexel.r,msdfTexel.g),msdfTexel.b))-0.5;float msdfD=fwidth(signedDist);\n#ifdef USE_THRESHOLD\nfloat msdfTest=smoothstep(uThreshold-SQRT2DIV2,uThreshold+SQRT2DIV2,signedDist);\n#else\nfloat msdfTest=smoothstep(-msdfD,msdfD,signedDist);\n#endif\nif(msdfTest<0.01)discard;float signedDistOutset=signedDist+uStrokeOuterWidth*0.5;float signedDistInset=signedDist-uStrokeInnerWidth*0.5;\n#ifdef USE_THRESHOLD\nfloat outerAlpha=smoothstep(uThreshold-SQRT2DIV2,uThreshold+SQRT2DIV2,signedDistOutset);float innerAlpha=1.0;\n#ifdef USE_STROKE\ninnerAlpha-=smoothstep(uThreshold-SQRT2DIV2,uThreshold+SQRT2DIV2,signedDistInset);\n#endif\n#else\nfloat outerAlpha=clamp(signedDistOutset/fwidth(signedDistOutset)+0.5,0.0,1.0);float innerAlpha=1.0;\n#ifdef USE_STROKE\ninnerAlpha-=clamp(signedDistInset/fwidth(signedDistInset)+0.5,0.0,1.0);\n#endif\n#endif\ndiffuseColor.a*=outerAlpha*innerAlpha;\n#endif\n"; // eslint-disable-line

var msdftestParsFragment = "#define GLSLIFY 1\n#ifdef USE_MSDF_GEOMETRY\nvarying vec2 vCharUv;uniform sampler2D uAtlas;\n#ifdef USE_STROKE\nuniform float uStrokeOuterWidth;uniform float uStrokeInnerWidth;\n#else\nfloat uStrokeOuterWidth=0.0;float uStrokeInnerWidth=1.0;\n#endif\n#endif\n"; // eslint-disable-line

var msdfcharUvVertex = "#define GLSLIFY 1\n#ifdef USE_MSDF_GEOMETRY\nvCharUv=charUv;\n#endif\n"; // eslint-disable-line

var msdfcharUvParsVertex = "#define GLSLIFY 1\n#ifdef USE_MSDF_GEOMETRY\nattribute vec2 charUv;varying vec2 vCharUv;\n#endif\n"; // eslint-disable-line

ShaderChunk.msdftest_fragment = msdftestFragment;
ShaderChunk.msdftest_pars_fragment = msdftestParsFragment;
ShaderChunk.msdf_glyph_uv_vertex = msdfcharUvVertex;
ShaderChunk.msdf_glyph_uv_pars_vertex = msdfcharUvParsVertex;

Object.keys(ShaderLib).forEach(shaderName => {
    const shaderDef = ShaderLib[shaderName];
    shaderDef.fragmentShader = shaderDef.fragmentShader.replace(`#include <alphatest_pars_fragment>`, `#include <alphatest_pars_fragment>\n#include <msdftest_pars_fragment>`);
    shaderDef.fragmentShader = shaderDef.fragmentShader.replace(`#include <alphatest_fragment>`, `#include <alphatest_fragment>\n#include <msdftest_fragment>`);
    shaderDef.vertexShader = shaderDef.vertexShader.replace(`#include <uv_pars_vertex>`, `#include <uv_pars_vertex>\n#include <msdf_glyph_uv_pars_vertex>`);
    shaderDef.vertexShader = shaderDef.vertexShader.replace(`#include <uv_vertex>`, `#include <uv_vertex>\n#include <msdf_glyph_uv_vertex>`);
});
function extendMaterial(material, { atlas, threshold, stroke, strokeInnerWidth = 0.5, strokeOuterWidth = 0.0, } = {}) {
    const state = {
        userCallback: null,
        msdfCallback: (shader, renderer) => {
            const s = shader;
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
                s.uniforms.uThreshold = { value: threshold || 0.0 };
            }
            if (USE_STROKE) {
                s.defines.USE_STROKE = '';
                s.uniforms.uStrokeOuterWidth = { value: strokeOuterWidth };
                s.uniforms.uStrokeInnerWidth = { value: strokeInnerWidth };
            }
            console.log(s.uniforms);
            if (state.userCallback)
                state.userCallback(shader, renderer);
        },
    };
    Object.defineProperty(material, 'onBeforeCompile', {
        get() {
            return state.msdfCallback;
        },
        set(v) {
            state.userCallback = v;
        }
    });
    return material;
}

export { Font, MSDFGeometry, extendMaterial };
