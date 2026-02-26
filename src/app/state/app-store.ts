export type OutputFormat = 'png' | 'jpg' | 'webp'
export type ThemeMode = 'light' | 'dark'

export interface AppState {
  filename: string | null
  originalImage: string | null
  processedImage: string | null
  backgroundColor: string
  currentFormat: OutputFormat
  isProcessing: boolean
  processingLabel: string
  processingProgress: number
  errorMessage: string | null
  bannerVariant: 'info' | 'error' | 'warning'
  isDraggingFile: boolean
  showReplaceDialog: boolean
  pendingFile: File | null
  theme: ThemeMode
  selectedModel: 'rmbg' | 'modnet'
  modelReady: boolean
  showChangelog: boolean
}

export type AppStateListener = (state: Readonly<AppState>) => void

export class AppStore extends EventTarget {
  private state: AppState

  constructor(initial: AppState) {
    super()
    this.state = initial
  }

  get snapshot(): Readonly<AppState> {
    return { ...this.state }
  }

  subscribe(listener: AppStateListener): () => void {
    const handler = () => listener(this.snapshot)
    this.addEventListener('change', handler)
    // fire once immediately
    listener(this.snapshot)
    return () => this.removeEventListener('change', handler)
  }

  update(patch: Partial<AppState>): void {
    const next = { ...this.state, ...patch }
    this.state = next
    this.dispatchEvent(new Event('change'))
  }
}
