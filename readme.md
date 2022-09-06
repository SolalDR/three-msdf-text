# three-msdf-text

[![build](https://github.com/SolalDR/three-msdf-text/workflows/build/badge.svg?branch=master)](https://github.com/SolalDR/three-msdf-text/actions?workflow=build)
[![version](https://img.shields.io/github/package-json/v/SolalDR/three-msdf-text)](https://github.com/SolalDR/three-msdf-text)

[Demo](https://solaldr.github.io/three-msdf-text/public/demo/) - 
[Documentation](https://solaldr.github.io/three-msdf-text/public/docs/) -
[Repository](https://github.com/SolalDR/three-msdf-text)

⚠️ Experimental : This library is still in development.

Provide geometry and material for MSDF (multi-channel signed distance fields) in [THREE.js](threejs.org).<br>

Features: 
- [x] Geometry with multiple attributes
- [x] Native support of all THREE.js Material
- [x] Typescript support
- [x] No dependencies (except for three.js obviously)
- [ ] Multipage

## How to use 

``` javascript
(async () => {
  const textureLoader = new THREE.TextureLoader();
  const fontLoader = new THREE.FontLoader();

  const atlas = textureLoader.loadAsync('./font/font.png')
  const font = fontLoader.loadAsync('./font/font.fnt')

  const geometry = new TextGeometry({
    font,
    text: "Hello world",
  })

  const material = extendMSDFMaterial(new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    transparent: true
  }), { atlas })

  const mesh = new THREE.Mesh(geometry, material)
})()
```

## Contributing

Please refer to the [contribution guidelines](https://github.com/SolalDR/three-msdf-text/blob/master/CONTRIBUTE.md) for details.

## License

This library is licensed under the [MIT license](LICENSE).

The original code that this library is based on, was written by [mrdoob](https://mrdoob.com) and the [three.js contributors](https://github.com/mrdoob/three.js/graphs/contributors) and is licensed under the [MIT license](https://github.com/mrdoob/three.js/blob/master/LICENSE).


