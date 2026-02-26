export interface FileReadResult {
  dataUrl: string | null
  error?: string
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function readFileAsDataURL(file: File): Promise<FileReadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve({ dataUrl: (event.target?.result as string) || null })
    reader.onerror = () => resolve({ dataUrl: null, error: 'Failed to read this file. Try another image.' })
    reader.readAsDataURL(file)
  })
}
