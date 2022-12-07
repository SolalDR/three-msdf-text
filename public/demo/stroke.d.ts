/// <reference types="three" />
import { MeshBasicMaterialParameters, IUniform } from 'three';
interface Shader {
    defines?: {
        [key: string]: string;
    };
    uniforms: {
        [uniform: string]: IUniform;
    };
    vertexShader: string;
    fragmentShader: string;
}
interface MSDFShader extends Shader {
    uniforms: {
        [uniform: string]: IUniform;
        uAtlas: {
            value: THREE.Texture;
        };
        uThreshold?: {
            value: number;
        };
        uStrokeOuterWidth?: {
            value: number;
        };
        uStrokeInnerWidth?: {
            value: number;
        };
    };
}
interface MSDFMaterialOptions extends MeshBasicMaterialParameters {
    atlas?: THREE.Texture;
    threshold?: number;
    stroke?: boolean;
    strokeInnerWidth?: number;
    strokeOuterWidth?: number;
}
type ExtendMSDFMaterial<M extends THREE.Material> = Omit<M, 'userData'> & {
    userData: Record<string, any> & {
        shader: MSDFShader;
    };
    strokeOuterWidth: number;
    strokeInnerWidth: number;
    threshold: number;
    isStroke: boolean;
    _strokeOuterWidth: number;
    _strokeInnerWidth: number;
    _threshold: number;
};
type ExtendedMSDFMaterial<M extends THREE.Material> = Omit<ExtendMSDFMaterial<M>, '_strokeOuterWidth' | '_strokeInnerWidth' | '_threshold'>;
/**
 * Extend a THREE.Material with MSDF support
 */
declare function extendMSDFMaterial<M extends THREE.Material>(material: any, { atlas, threshold, stroke, strokeInnerWidth, strokeOuterWidth, }?: MSDFMaterialOptions): ExtendedMSDFMaterial<M>;
export { MSDFMaterialOptions, extendMSDFMaterial };
