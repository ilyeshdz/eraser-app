<div align="center">
<h1>Eraser</h1>
<i>Background removal that runs entirely in your browser : no uploads, no servers, no nonsense.</i>
  
<br />
  
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
</div>

---

Eraser removes image backgrounds using AI models that run directly in your browser via WebGPU or WebAssembly. Your images never leave your device : there's no backend, no account, no tracking.

## Features

- **Fully local** — processing happens on your machine, nothing is ever uploaded
- **Two AI models** — RMBG-1.4 for broad compatibility, MODNet for faster results with WebGPU
- **Custom backgrounds** — solid colors, pastels, or any hex value you want
- **Export as PNG, JPG, or WebP**
- **Light/dark mode**

## How it works

The app uses [Transformers.js](https://huggingface.co/docs/transformers.js) to run ONNX image segmentation models in-browser. No server required — just WebAssembly (and WebGPU when available).

RMBG-1.4 is the safe default and works everywhere. MODNet is a lighter model that really benefits from WebGPU acceleration to feel snappy.

## Stack

TypeScript · Lit · Transformers.js · Vite · ONNX Runtime Web

## Getting started

```bash
pnpm install
pnpm dev
```

```bash
pnpm build    # production build
pnpm preview  # preview the build locally
```

## Browser support

Chrome and Edge have full support (WebGPU + WASM). Firefox and Safari fall back to WASM only, which still works fine but is a bit slower.

## Contributing

Issues and PRs are welcome. If you found a bug or have an idea, just open an issue and we'll go from there.

## License

GPL v3 — see [LICENSE](./LICENSE).
