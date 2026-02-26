import type { OutputFormat } from '../app/state/app-store'

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

export function baseFilename(name: string | null): string {
  if (!name) return 'image'
  const trimmed = name.replace(/\.[^/.]+$/, '')
  return trimmed || 'image'
}

export interface ExportParams {
  source: string
  format: OutputFormat
  backgroundColor: string
}

export async function composeExportDataUrl(params: ExportParams): Promise<string> {
  const image = await loadImage(params.source)
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas context unavailable')

  const effectiveBackground =
    params.backgroundColor === 'transparent' && params.format === 'jpg'
      ? '#ffffff'
      : params.backgroundColor

  if (effectiveBackground !== 'transparent') {
    context.fillStyle = effectiveBackground
    context.fillRect(0, 0, width, height)
  }

  context.drawImage(image, 0, 0, width, height)

  const mimeMap: Record<OutputFormat, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp'
  }

  const quality = params.format === 'png' ? undefined : 0.92
  return canvas.toDataURL(mimeMap[params.format], quality)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image load failed'))
    image.src = src
  })
}
