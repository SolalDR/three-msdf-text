# three-msdf-text

[![build](https://github.com/SolalDR/three-msdf-text/workflows/build/badge.svg?branch=master)](https://github.com/SolalDR/three-msdf-text/actions?workflow=build)
[![version](https://img.shields.io/github/package-json/v/SolalDR/three-msdf-text)](https://github.com/SolalDR/three-msdf-text)

⚠️ Experimental : This library is still in development.

Provide geometry and material for MSDF (multi-channel signed distance fields).<br>

Features: 
- [x] Geometry with multiple attributes
- [x] Native support of all THREE.js Material
- [x] Typescript support
- [x] No dependencies (except for three.js obviously)

## How to contribute

Install dependencies

```
npm install
```

Install and init `commitizen`

```bash
npm install commitizen -g
```

```bash
commitizen init cz-conventional-changelog --save-dev --save-exact
```

```
npm run dev
```

Commit your work
```
npm run commit
```

## License

[MIT](LICENSE).
