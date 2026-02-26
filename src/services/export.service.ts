import type { OutputFormat } from '../app/state/app-store'
import { baseFilename } from './image-processing.service'

export function triggerDownload(dataUrl: string, originalName: string | null, format: OutputFormat): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${baseFilename(originalName)}-eraser.${format}`
  link.click()
}
