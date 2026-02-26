import { env, pipeline, RawImage } from '@huggingface/transformers'

export type ModelType = 'rmbg' | 'modnet'

export interface ModelInfo {
  id: ModelType
  name: string
  huggingfaceId: string
  description: string
}

export const MODELS: Record<ModelType, ModelInfo> = {
  rmbg: {
    id: 'rmbg',
    name: 'RMBG-1.4',
    huggingfaceId: 'briaai/RMBG-1.4',
    description: 'Best accuracy, works everywhere'
  },
  modnet: {
    id: 'modnet',
    name: 'MODNet',
    huggingfaceId: 'Xenova/modnet',
    description: 'Smaller, faster with WebGPU'
  }
}

export type ProgressCallback = (progress: number, status: string) => void

type BackgroundPipeline = (canvas: HTMLCanvasElement) => Promise<unknown>

let currentModel: BackgroundPipeline | null = null
let currentModelType: ModelType | null = null
let isBackgroundRemovalPipeline = false

export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export async function loadModel(modelType: ModelType, onProgress?: ProgressCallback): Promise<void> {
  if (currentModelType === modelType && currentModel) return

  onProgress?.(0, 'Loading model...')
  const modelInfo = MODELS[modelType]

  env.allowLocalModels = false
  env.useBrowserCache = false

  onProgress?.(10, `Downloading ${modelInfo.name}...`)
  const device = isWebGPUAvailable() ? 'webgpu' : 'wasm'

  onProgress?.(30, 'Initializing...')
  const model = await pipeline('background-removal', modelInfo.huggingfaceId, {
    dtype: 'q8',
    device
  })

  onProgress?.(50, 'Optimizing...')

  currentModel = model as BackgroundPipeline
  isBackgroundRemovalPipeline = true
  currentModelType = modelType
  onProgress?.(80, 'Ready')
}

export async function removeBackground(
  imageSource: string | File | Blob,
  onProgress?: ProgressCallback
): Promise<Blob> {
  if (!currentModel) {
    throw new Error('Model not initialized')
  }

  onProgress?.(0, 'Processing image...')
  const img = await loadImage(imageSource)

  onProgress?.(20, 'Analyzing image...')
  const { canvas: resizedCanvas } = resizeToMax(img, 2048)

  onProgress?.(40, 'Removing background...')
  const result = await currentModel(resizedCanvas)

  if (isBackgroundRemovalPipeline) {
    const blob = await renderFromMaskResult(resizedCanvas, result, onProgress)
    return blob
  }

  const outputBlob = await applyAlphaMask(resizedCanvas, result)
  onProgress?.(90, 'Rendering...')
  onProgress?.(100, 'Complete')
  return outputBlob
}

function resizeToMax(image: HTMLImageElement, maxDimension: number): { canvas: HTMLCanvasElement; width: number; height: number } {
  let { width, height } = image
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx?.drawImage(image, 0, 0, width, height)
  return { canvas, width, height }
}

async function renderFromMaskResult(
  sourceCanvas: HTMLCanvasElement,
  maskResult: unknown,
  onProgress?: ProgressCallback
): Promise<Blob> {
  onProgress?.(70, 'Applying mask...')

  const rawImage = Array.isArray(maskResult) ? maskResult[0] : maskResult
  if (rawImage instanceof RawImage) {
    const canvas = document.createElement('canvas')
    canvas.width = rawImage.width
    canvas.height = rawImage.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas context unavailable')
    const imageData = ctx.createImageData(rawImage.width, rawImage.height)
    imageData.data.set(rawImage.data)
    ctx.putImageData(imageData, 0, 0)
    const blob = await toPngBlob(canvas)
    onProgress?.(90, 'Rendering...')
    onProgress?.(100, 'Complete')
    return blob
  }

  const outputBlob = await applyAlphaMask(sourceCanvas, rawImage)
  onProgress?.(90, 'Rendering...')
  onProgress?.(100, 'Complete')
  return outputBlob
}

async function applyAlphaMask(sourceCanvas: HTMLCanvasElement, maskResult: unknown): Promise<Blob> {
  const maskCanvas = normalizeMaskResult(maskResult)
  const width = sourceCanvas.width
  const height = sourceCanvas.height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.drawImage(sourceCanvas, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)

  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })
  if (!maskCtx) throw new Error('Failed to get mask context')
  const maskData = maskCtx.getImageData(0, 0, width, height)

  for (let i = 0; i < width * height; i += 1) {
    const alpha = maskData.data[i * 4 + 3]
    imageData.data[i * 4 + 3] = alpha
  }

  ctx.putImageData(imageData, 0, 0)
  return toPngBlob(canvas)
}

function normalizeMaskResult(maskResult: unknown): HTMLCanvasElement {
  if (Array.isArray(maskResult) && maskResult.length > 0) {
    return normalizeMaskResult(maskResult[0])
  }

  if (maskResult instanceof HTMLCanvasElement) return maskResult
  if (maskResult instanceof RawImage) return maskResult.toCanvas()

  if (maskResult && typeof maskResult === 'object') {
    const maybeObj = maskResult as Record<string, unknown>
    if ('toCanvas' in maybeObj && typeof maybeObj.toCanvas === 'function') {
      return (maybeObj.toCanvas as () => HTMLCanvasElement)()
    }
    if ('data' in maybeObj && maybeObj.data instanceof RawImage) {
      return maybeObj.data.toCanvas()
    }
  }

  console.error('Mask result type:', maskResult)
  throw new Error('Invalid mask result')
}

async function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1.0))
  if (!blob) throw new Error('Failed to create blob')
  return blob
}

function loadImage(source: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))

    if (source instanceof Blob) {
      img.src = URL.createObjectURL(source)
    } else if (typeof source === 'string') {
      img.src = source
    } else {
      img.src = URL.createObjectURL(source)
    }
  })
}

export function resetModel(): void {
  currentModel = null
  currentModelType = null
}

export function isModelLoaded(): boolean {
  return currentModel !== null
}

export function getCurrentModelType(): ModelType | null {
  return currentModelType
}
