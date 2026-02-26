/* eslint-disable @typescript-eslint/no-explicit-any */
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

let currentModel: any = null
let currentModelType: ModelType | null = null
let isBackgroundRemovalPipeline = false

export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export async function initModel(
  modelType: ModelType,
  onProgress?: ProgressCallback
): Promise<void> {
  if (currentModelType === modelType && currentModel !== null) {
    return
  }

  onProgress?.(0, 'Loading model...')

  const modelInfo = MODELS[modelType]
  
  env.allowLocalModels = false
  env.useBrowserCache = false

  onProgress?.(10, `Downloading ${modelInfo.name}...`)

  const device = isWebGPUAvailable() ? 'webgpu' : 'cpu'

  currentModel = await pipeline('background-removal', modelInfo.huggingfaceId, {
    dtype: 'q8',
    device
  })

  isBackgroundRemovalPipeline = true
  currentModelType = modelType
  onProgress?.(100, 'Ready')
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

  onProgress?.(30, 'Analyzing image...')

  const maxDimension = 2048
  let width = img.width
  let height = img.height
  
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const resizedCanvas = document.createElement('canvas')
  resizedCanvas.width = width
  resizedCanvas.height = height
  const resizedCtx = resizedCanvas.getContext('2d', { willReadFrequently: true })!
  resizedCtx.drawImage(img, 0, 0, width, height)

  onProgress?.(50, 'Removing background...')

  const result = await currentModel(resizedCanvas)

  if (isBackgroundRemovalPipeline) {
    onProgress?.(80, 'Saving...')
    const rawImage = Array.isArray(result) ? result[0] : result
    if (rawImage instanceof RawImage) {
      const canvas = document.createElement('canvas')
      canvas.width = rawImage.width
      canvas.height = rawImage.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      const imageData = ctx.createImageData(rawImage.width, rawImage.height)
      imageData.data.set(rawImage.data)
      ctx.putImageData(imageData, 0, 0)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b: Blob | null) => {
          if (b) resolve(b)
          else reject(new Error('Failed to create blob'))
        }, 'image/png', 1.0)
      })
      onProgress?.(100, 'Complete')
      return blob
    }
  }

  onProgress?.(80, 'Applying mask...')

  const outputBlob = await applyAlphaMask(resizedCanvas, result)

  onProgress?.(100, 'Complete')

  return outputBlob
}

function loadImage(source: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    
    if (source instanceof Blob) {
      img.src = URL.createObjectURL(source)
    } else if (typeof source === 'string') {
      img.src = source
    } else {
      img.src = URL.createObjectURL(source)
    }
  })
}

async function applyAlphaMask(sourceCanvas: HTMLImageElement | HTMLCanvasElement, maskResult: unknown): Promise<Blob> {
  let maskCanvas: HTMLCanvasElement

  // Handle array result from pipeline
  if (Array.isArray(maskResult) && maskResult.length > 0) {
    maskResult = maskResult[0]
  }

  if (maskResult instanceof HTMLCanvasElement) {
    maskCanvas = maskResult
  } else if (maskResult instanceof RawImage) {
    maskCanvas = maskResult.toCanvas()
  } else if (typeof maskResult === 'object' && maskResult !== null) {
    const resultObj = maskResult as Record<string, unknown>
    if ('toCanvas' in resultObj && typeof resultObj.toCanvas === 'function') {
      maskCanvas = (resultObj.toCanvas as () => HTMLCanvasElement)()
    } else if ('data' in resultObj && resultObj.data instanceof RawImage) {
      maskCanvas = resultObj.data.toCanvas()
    } else {
      console.error('Mask result:', maskResult)
      throw new Error('Invalid mask result')
    }
  } else {
    console.error('Mask result type:', maskResult)
    throw new Error('Invalid mask result')
  }

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

  ctx.drawImage(maskCanvas, 0, 0, width, height)
  const maskData = ctx.getImageData(0, 0, width, height)

  for (let i = 0; i < width * height; i++) {
    const alpha = maskData.data[i * 4 + 3]
    imageData.data[i * 4 + 3] = alpha
  }

  ctx.putImageData(imageData, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob'))
        }
      },
      'image/png',
      1.0
    )
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
