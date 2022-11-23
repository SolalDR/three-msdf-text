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

```javascript
;(async () => {
  const textureLoader = new THREE.TextureLoader()
  const fontLoader = new THREE.FontLoader()

  const atlas = textureLoader.loadAsync('./font/font.png')
  const font = fontLoader.loadAsync('./font/font.fnt')

  const geometry = new TextGeometry({
    font,
    text: 'Hello world',
  })

  const material = extendMSDFMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
    }),
    { atlas },
  )

  const mesh = new THREE.Mesh(geometry, material)
})()
```

## width, height and uv attribute

The properties `width` and `height` are automatically computed.
The `uv` attribute is interpolate based on the `width` and `height` values.
You may want to force the `width` value to wrap automatically.
You may also want to force `width` and `height` values to correctly interpolate `uv` attribute.

<img src="http://localhost:10001/public/demo/docs/layout.svg" />

## optional attributes

You can use a lot of different attributes depending on your needs :

- `uv`, `vec2`
- `normal`, `vec3`
- `lineIndex`, `int`
- `charIndex`, `int`
- `wordIndex`, `int`
- `charSize`, `vec2`
- `lineCharIndex`, `int`
- `lineWordIndex`, `int`
- `lineWordCount`, `int`
- `lineCharCount`, `int`

### Enabled a attribute

```javascript
const geometry = new TextGeometry({
  ...options,
  uv: true,
  normal: true,
  lineIndex: true,
})
```

<img src="http://localhost:10001/public/demo/docs/optional.svg" />

## alignX and alignY

Depending on the alignX and alignY properties, the geometry is constructed with a different origin.

<img src="http://localhost:10001/public/demo/docs/alignment.svg" />

## Contributing

Please refer to the [contribution guidelines](https://github.com/SolalDR/three-msdf-text/blob/master/CONTRIBUTE.md) for details.

## License

This library is licensed under the [MIT license](LICENSE).

The original code that this library is based on, was written by [mrdoob](https://mrdoob.com) and the [three.js contributors](https://github.com/mrdoob/three.js/graphs/contributors) and is licensed under the [MIT license](https://github.com/mrdoob/three.js/blob/master/LICENSE).
