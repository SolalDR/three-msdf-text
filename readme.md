# three-msdf-text

[![build](https://github.com/SolalDR/three-msdf-text/workflows/build/badge.svg?branch=master)](https://github.com/SolalDR/three-msdf-text/actions?workflow=build)
[![version](https://img.shields.io/github/package-json/v/SolalDR/three-msdf-text)](https://github.com/SolalDR/three-msdf-text)

[Demo](https://solaldr.github.io/three-msdf-text/public/demo/) -
[Documentation](https://solaldr.github.io/three-msdf-text/public/docs/) -
[Repository](https://github.com/SolalDR/three-msdf-text)

Provide geometry and material for MSDF (multi-channel signed distance fields) in [THREE.js](https://threejs.org).<br>

Features:

- Many advanced attributes
- Support all THREE.js Material
- Typescript
- No dependencies
- Geometry subdivision

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

## Attributes

You can use a lot of different attributes depending on your needs :

| Attribute       | Size | Required | Enabled | Description                                     |
| --------------- | ---- | -------- | ------- | ----------------------------------------------- |
| `id`            | 1    | `true`   | `true`  | Used for face indexing                          |
| `position`      | 3    | `true`   | `true`  | The classic position attribute used in three.js |
| `charUv`        | 2    | `true`   | `true`  | UV coords used in the font atlas                |
| `uv`            | 2    | `false`  | `false` | The classic uv attribute used in three.js       |
| `normal`        | 3    | `false`  | `false` | The classic normal attribute used in three.js   |
| `lineIndex`     | 1    | `false`  | `false` | See schema below                                |
| `charIndex`     | 1    | `false`  | `false` | See schema below                                |
| `wordIndex`     | 1    | `false`  | `false` | See schema below                                |
| `charSize`      | 2    | `false`  | `false` | See schema below                                |
| `lineCharIndex` | 1    | `false`  | `false` | See schema below                                |
| `lineWordIndex` | 1    | `false`  | `false` | See schema below                                |
| `lineCharCount` | 1    | `false`  | `false` | See schema below                                |
| `lineWordCount` | 1    | `false`  | `false` | See schema below                                |

For example, with a `THREE.MeshStandardMaterial` material, you will need `uv` and `normal` attributes.

```javascript
const geometry = new TextGeometry({
  ...options,
  uv: true,
  normal: true,
})
```

<img src="https://solaldr.github.io/three-msdf-text/public/demo/assets/docs/optional.svg" />

## width, height

The properties `width` and `height` are automatically computed.
The `uv` attribute is interpolate based on the `width` and `height` values.
You may want to force the `width` value to wrap automatically.
You may also want to force `width` and `height` values to correctly interpolate `uv` attribute.

<img src="https://solaldr.github.io/three-msdf-text/public/demo/assets/docs/layout.svg" />

## Contributing

Please refer to the [contribution guidelines](https://github.com/SolalDR/three-msdf-text/blob/master/CONTRIBUTE.md) for details.

## Unlicense

This library is [unlicensed](LICENSE).

The original code that this library was written by [ogl contributors](https://github.com/oframe/ogl/graphs/contributors) and is [unlicensed](https://unlicense.org).
