import { IUniform } from "three";

export interface Shader {
  defines?: { [key: string]: string } 
  uniforms: { [uniform: string]: IUniform };
  vertexShader: string;
  fragmentShader: string;
}