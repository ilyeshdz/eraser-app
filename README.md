# Eraser

<div align="center">

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub Stars](https://img.shields.io/github/stars/eraser/eraser?style=flat&color=3b6af5)](https://github.com/eraser/eraser/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/eraser/eraser?style=flat&color=3b6af5)](https://github.com/eraser/eraser/issues)
[![npm version](https://img.shields.io/npm/v/eraser-ai?style=flat&color=3b6af5)](https://www.npmjs.com/package/eraser-ai)

> A browser-based AI background remover that runs entirely locally. No server, no uploads - your images never leave your device.

</div>

## What is this?

Eraser is a privacy-focused background removal tool that runs entirely in your browser. No data ever gets sent to a server - everything happens on your device using WebGPU or WebAssembly.

## Features

- **Privacy-first** - All processing happens in your browser. Your images never leave your device.
- **Multiple AI models** - Choose between RMBG-1.4 (works everywhere) and MODNet (faster with WebGPU).
- **Custom backgrounds** - Pick solid colors, pastels, or enter any hex color you want.
- **Export formats** - Download your result as PNG, JPG, or WebP.
- **Dark mode** - Toggle between light and dark themes.

## How it works

The app uses Transformers.js to run image segmentation models directly in the browser. Two models are available:

1. **RMBG-1.4** - BRIA's professional background removal model, great for most use cases.
2. **MODNet** - A lighter model that needs WebGPU to run fast.

Both models run in ONNX format via WebAssembly, so they work in any modern browser without a backend.

## Tech Stack

- TypeScript
- Lit (web components)
- Transformers.js
- Vite
- ONNX Runtime Web

## Getting Started

Install dependencies:
```bash
pnpm install
```

Run in development:
```bash
pnpm dev
```

Build for production:
```bash
pnpm build
```

Preview the production build:
```bash
pnpm preview
```

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome  | Full support (WebGPU + WASM) |
| Edge    | Full support (WebGPU + WASM) |
| Firefox | WASM only |
| Safari  | WASM only |

## License

This project is licensed under GPL v3. See the LICENSE file for details.

## Contributing

Got ideas or found a bug? Open an issue or submit a pull request on GitHub.
