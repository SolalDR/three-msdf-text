/// <reference types="three" />
import * as THREE from "three";
import { MeshBasicMaterialParameters } from "three";
declare class Font {
    data: {};
    glyphs: {};
    common: {};
    constructor(font: any);
}
type Char = {
    glyph: Glyph;
    x: number;
    y: number;
    lineIndex: number;
    lineCharIndex: number;
};
type Glyph = {
    id: number;
    char: string;
    xoffset: number;
    yoffset: number;
    width: number;
    height: number;
    x: number;
    y: number;
    xadvance: number;
};
type Line = {
    index: number;
    width: number;
    chars: Char[];
};
interface MSDFGeometryOptions {
    font?: Font;
    text?: string;
    width?: number;
    alignX?: string;
    alignY?: string;
    size?: number;
    letterSpacing?: number;
    lineHeight?: number;
    wordSpacing?: number;
    wordBreak?: boolean;
    useUv?: boolean;
    usecharPosition?: boolean;
}
declare class MSDFGeometry extends THREE.BufferGeometry {
    font: any;
    text: string;
    width: number;
    alignX: string;
    alignY: string;
    size: number;
    letterSpacing: number;
    lineHeight: number;
    wordSpacing: number;
    wordBreak: boolean;
    textScale: number;
    computedWidth: number;
    computedHeight: number;
    lineCount: number;
    constructor({ font, text, width, alignX, alignY, size, letterSpacing, lineHeight, wordSpacing, wordBreak, useUv, usecharPosition }?: MSDFGeometryOptions);
    private generateGeometry;
    generateLayout(): void;
    populateBuffers(lines: Line[]): void;
    // Update buffers to layout with new layout
    resize(width: number): void;
    // Completely change text (like creating new Text)
    updateText(text: any): void;
}
interface MSDFMaterialOptions extends MeshBasicMaterialParameters {
    atlas?: THREE.Texture;
    threshold?: number;
    stroke?: boolean;
    strokeInnerWidth?: number;
    strokeOuterWidth?: number;
}
declare function extendMaterial(material: THREE.Material, { atlas, threshold, stroke, strokeInnerWidth, strokeOuterWidth }?: MSDFMaterialOptions): import("three").Material;
export { Font, MSDFGeometry, extendMaterial };
