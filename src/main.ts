import 'bootstrap-icons/font/bootstrap-icons.css'
import './style.css'
import './components'

import { initModel, removeBackground, type ModelType } from './lib/backgroundRemoval'

type OutputFormat = 'png' | 'jpg' | 'webp'
type ThemeMode = 'light' | 'dark'
const THEME_STORAGE_KEY = 'eraser:theme'
const MODEL_STORAGE_KEY = 'eraser:model'

interface AppState {
  filename: string | null
  originalImage: string | null
  processedImage: string | null
  backgroundColor: string
  currentFormat: OutputFormat
  isProcessing: boolean
  processingLabel: string
  processingProgress: number
  errorMessage: string | null
  isDraggingFile: boolean
  showReplaceDialog: boolean
  pendingFile: File | null
  theme: ThemeMode
  selectedModel: ModelType
  modelReady: boolean
}

interface AppRefs {
  appShell: HTMLElement
  themeToggleBtn: HTMLButtonElement
  themeToggleIcon: HTMLElement
  themeToggleText: HTMLElement
  fileInput: HTMLInputElement
  hintSection: HTMLElement
  backgroundSection: HTMLElement
  settingsSection: HTMLElement
  baseSwatches: HTMLElement
  pastelSwatches: HTMLElement
  customColorInput: HTMLInputElement
  errorBanner: HTMLElement
  emptyState: HTMLElement
  browseBtn: HTMLElement
  processingState: HTMLElement
  processingLabel: HTMLElement
  processingProgressBar: HTMLElement
  resultState: HTMLElement
  originalImagePreview: HTMLImageElement
  resultImagePreview: HTMLImageElement
  downloadSplit: HTMLElement
  dropOverlay: HTMLElement
  dropOverlayTitle: HTMLElement
  dropOverlayHint: HTMLElement
  replaceDialog: HTMLElement
  modelSelector: HTMLElement
}

const pastelColors = [
  '#F9D5E5',
  '#FDE2E4',
  '#FAD2E1',
  '#E2ECE9',
  '#BEE1E6',
  '#CDEAC0',
  '#FFF1C1',
  '#E8DFF5',
  '#D7E3FC',
  '#F8EDEB'
]

const formatOptions: OutputFormat[] = ['png', 'jpg', 'webp']

const state: AppState = {
  filename: null,
  originalImage: null,
  processedImage: null,
  backgroundColor: 'transparent',
  currentFormat: 'png',
  isProcessing: false,
  processingLabel: 'Preparing image...',
  processingProgress: 0,
  errorMessage: null,
  isDraggingFile: false,
  showReplaceDialog: false,
  pendingFile: null,
  theme: getInitialTheme(),
  selectedModel: getInitialModel(),
  modelReady: false
}

function getInitialModel(): ModelType {
  const stored = localStorage.getItem(MODEL_STORAGE_KEY)
  if (stored === 'rmbg' || stored === 'modnet') {
    return stored
  }
  return 'rmbg'
}

function persistModel(model: ModelType): void {
  localStorage.setItem(MODEL_STORAGE_KEY, model)
}

const refs: AppRefs = {
  appShell: mustQuery<HTMLElement>('#appShell'),
  themeToggleBtn: mustQuery<HTMLButtonElement>('#themeToggleBtn'),
  themeToggleIcon: mustQuery<HTMLElement>('#themeToggleIcon'),
  themeToggleText: mustQuery<HTMLElement>('#themeToggleText'),
  fileInput: mustQuery<HTMLInputElement>('#fileInput'),
  hintSection: mustQuery<HTMLElement>('#hintSection'),
  backgroundSection: mustQuery<HTMLElement>('#backgroundSection'),
  settingsSection: mustQuery<HTMLElement>('#settingsSection'),
  baseSwatches: mustQuery<HTMLElement>('#baseSwatches'),
  pastelSwatches: mustQuery<HTMLElement>('#pastelSwatches'),
  customColorInput: mustQuery<HTMLInputElement>('#customColorInput'),
  errorBanner: mustQuery<HTMLElement>('#errorBanner'),
  emptyState: mustQuery<HTMLElement>('#emptyState'),
  browseBtn: mustQuery<HTMLElement>('#browseBtn'),
  processingState: mustQuery<HTMLElement>('#processingState'),
  processingLabel: mustQuery<HTMLElement>('#processingLabel'),
  processingProgressBar: mustQuery<HTMLElement>('#processingProgressBar'),
  resultState: mustQuery<HTMLElement>('#resultState'),
  originalImagePreview: mustQuery<HTMLImageElement>('#originalImagePreview'),
  resultImagePreview: mustQuery<HTMLImageElement>('#resultImagePreview'),
  downloadSplit: mustQuery<HTMLElement>('#downloadSplit'),
  dropOverlay: mustQuery<HTMLElement>('#dropOverlay'),
  dropOverlayTitle: mustQuery<HTMLElement>('#dropOverlayTitle'),
  dropOverlayHint: mustQuery<HTMLElement>('#dropOverlayHint'),
  replaceDialog: mustQuery<HTMLElement>('#replaceDialog'),
  modelSelector: mustQuery<HTMLElement>('#modelSelector')
}

let dragDepth = 0
let globalListenersBound = false
let processToken = 0

initialize()

async function initialize(): Promise<void> {
  mountSwatches()
  bindEvents()
  applyTheme()
  updateUI()
  await initializeModel()
}

async function initializeModel(): Promise<void> {
  const selector = refs.modelSelector as unknown as { selectedModel: ModelType; setProgress: (msg: string) => void }
  if (selector && typeof selector.selectedModel !== 'undefined') {
    selector.selectedModel = state.selectedModel
  }
  
  try {
    await initModel(state.selectedModel, (progress, status) => {
      state.processingProgress = progress
      state.processingLabel = status
      updateProcessingText()
      updateProcessingProgress()
    })
    state.modelReady = true
  } catch (error) {
    console.error('Failed to initialize model:', error)
    setError('Failed to load AI model. Please refresh the page.')
  }
}

function mountSwatches(): void {
  const base = [
    { color: 'transparent', label: 'Transparent' },
    { color: '#ffffff', label: 'White' }
  ]

  refs.baseSwatches.innerHTML = base.map((item) => swatchMarkup(item.color, item.label)).join('')
  refs.pastelSwatches.innerHTML = pastelColors.map((color) => swatchMarkup(color, color)).join('')
}

function swatchMarkup(color: string, label: string): string {
  return `<ui-swatch color="${escapeAttribute(color)}" label="${escapeAttribute(label)}"></ui-swatch>`
}

function bindEvents(): void {
  refs.themeToggleBtn.addEventListener('click', toggleTheme)

  refs.modelSelector.addEventListener('model-change', async (event: Event) => {
    const detail = (event as CustomEvent<{ model: ModelType }>).detail
    state.selectedModel = detail.model
    persistModel(detail.model)
    
    state.modelReady = false
    await initializeModel()
  })

  refs.browseBtn.addEventListener('click', () => refs.fileInput.click())

  refs.emptyState.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('ui-button')) return
    refs.fileInput.click()
  })

  refs.emptyState.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      refs.fileInput.click()
    }
  })

  refs.fileInput.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    maybeHandleIncomingFile(file)
    ;(event.target as HTMLInputElement).value = ''
  })

  refs.baseSwatches.addEventListener('swatch-select', handleSwatchSelect as EventListener)
  refs.pastelSwatches.addEventListener('swatch-select', handleSwatchSelect as EventListener)

  refs.customColorInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      applyCustomColorFromInput()
    }
  })
  refs.customColorInput.addEventListener('blur', () => {
    if (!refs.customColorInput.value.trim()) return
    applyCustomColorFromInput()
  })

  refs.errorBanner.addEventListener('banner-dismiss', () => {
    setError(null)
  })

  refs.downloadSplit.addEventListener('split-main-click', () => {
    void handleDownload()
  })
  refs.downloadSplit.addEventListener('split-option-select', (event) => {
    const value = (event as CustomEvent<{ value: string }>).detail.value
    if (!isOutputFormat(value)) return
    state.currentFormat = value
    updateDownloadControl()
  })

  refs.replaceDialog.addEventListener('modal-cancel', cancelReplaceDialog)
  refs.replaceDialog.addEventListener('modal-confirm', () => {
    void confirmReplaceDialog()
  })

  bindGlobalDnDListeners()
}

function handleSwatchSelect(event: CustomEvent<{ color: string }>): void {
  state.backgroundColor = event.detail.color
  setError(null)
  updateBackgroundSelection()
  updatePreviewBackground()
}

function applyCustomColorFromInput(): void {
  const raw = refs.customColorInput.value.trim()
  if (!raw) {
    setError('Enter a color value, for example #FAD2E1.')
    return
  }

  if (raw.toLowerCase() === 'transparent') {
    state.backgroundColor = 'transparent'
    setError(null)
    updateBackgroundSelection()
    updatePreviewBackground()
    return
  }

  if (!isCssColor(raw)) {
    setError('Color not recognized. Use #hex, rgb(), hsl(), or a CSS color name.')
    return
  }

  state.backgroundColor = raw
  setError(null)
  updateBackgroundSelection()
  updatePreviewBackground()
}

function updateUI(): void {
  updateSidebarVisibility()
  updatePanels()
  updateProcessingText()
  updateImages()
  updateBackgroundSelection()
  updatePreviewBackground()
  updateDownloadControl()
  updateErrorBanner()
  updateDropOverlay()
  updateDialogVisibility()
  updateThemeToggle()
}

function updateSidebarVisibility(): void {
  const hasImage = Boolean(state.originalImage)
  refs.hintSection.hidden = hasImage
  refs.backgroundSection.hidden = !hasImage
  refs.settingsSection.hidden = !hasImage
}

function updatePanels(): void {
  const showEmpty = !state.originalImage && !state.isProcessing
  refs.emptyState.hidden = !showEmpty
  refs.processingState.hidden = !state.isProcessing
  refs.resultState.hidden = !(Boolean(state.originalImage) && !state.isProcessing)
}

function updateProcessingText(): void {
  refs.processingLabel.textContent = state.processingLabel
}

function updateProcessingProgress(): void {
  const progressBar = refs.processingProgressBar
  if (progressBar) {
    const fill = progressBar.querySelector('.progress-fill') as HTMLElement
    if (fill) {
      fill.style.width = `${state.processingProgress}%`
    }
  }
}

function updateImages(): void {
  if (state.originalImage) {
    refs.originalImagePreview.src = state.originalImage
  }

  if (state.processedImage || state.originalImage) {
    const src = state.processedImage || state.originalImage || ''
    refs.resultImagePreview.src = src
    
    const img = new Image()
    img.onload = () => {
      const aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`
      refs.resultImagePreview.style.aspectRatio = aspectRatio
    }
    img.src = src
  }
}

function updateBackgroundSelection(): void {
  document.querySelectorAll<HTMLElement>('ui-swatch').forEach((swatch) => {
    const swatchColor = swatch.getAttribute('color')
    swatch.toggleAttribute('selected', swatchColor === state.backgroundColor)
  })

  if (document.activeElement !== refs.customColorInput) {
    refs.customColorInput.value = state.backgroundColor === 'transparent' ? '' : state.backgroundColor
  }
}

function updatePreviewBackground(): void {
  if (state.backgroundColor === 'transparent') {
    refs.resultImagePreview.classList.add('transparent')
    refs.resultImagePreview.style.backgroundColor = 'transparent'
  } else {
    refs.resultImagePreview.classList.remove('transparent')
    refs.resultImagePreview.style.backgroundColor = state.backgroundColor
  }
}

function updateDownloadControl(): void {
  refs.downloadSplit.setAttribute('label', `Download ${state.currentFormat.toUpperCase()}`)
  refs.downloadSplit.setAttribute('value', state.currentFormat)
  refs.downloadSplit.setAttribute('options', formatOptions.join(','))
}

function updateErrorBanner(): void {
  if (state.errorMessage) {
    refs.errorBanner.hidden = false
    refs.errorBanner.setAttribute('message', state.errorMessage)
  } else {
    refs.errorBanner.hidden = true
    refs.errorBanner.setAttribute('message', '')
  }
}

function updateDropOverlay(): void {
  refs.dropOverlay.hidden = !state.isDraggingFile
  refs.appShell.classList.toggle('blurred', state.isDraggingFile)

  if (state.originalImage) {
    refs.dropOverlayTitle.textContent = 'Drop to load a new image'
    refs.dropOverlayHint.textContent = 'You will be asked to confirm replacement.'
  } else {
    refs.dropOverlayTitle.textContent = 'Drop to process this image'
    refs.dropOverlayHint.textContent = 'Processing starts immediately.'
  }
}

function updateDialogVisibility(): void {
  refs.replaceDialog.toggleAttribute('open', state.showReplaceDialog)
}

function bindGlobalDnDListeners(): void {
  if (globalListenersBound) return
  globalListenersBound = true

  window.addEventListener('dragenter', (event) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    dragDepth += 1
    if (!state.isDraggingFile) {
      state.isDraggingFile = true
      updateDropOverlay()
    }
  })

  window.addEventListener('dragover', (event) => {
    event.preventDefault()
  })

  window.addEventListener('dragleave', (event) => {
    if (!state.isDraggingFile) return
    if (!hasFiles(event) && event.relatedTarget !== null) return
    event.preventDefault()

    if (event.relatedTarget === null) {
      dragDepth = 0
    } else {
      dragDepth = Math.max(0, dragDepth - 1)
    }
    if (dragDepth === 0 && state.isDraggingFile) {
      state.isDraggingFile = false
      updateDropOverlay()
    }
  })

  window.addEventListener('dragend', () => {
    clearDraggingState()
  })

  window.addEventListener('blur', () => {
    clearDraggingState()
  })

  window.addEventListener('drop', (event) => {
    event.preventDefault()
    clearDraggingState()

    if (!hasFiles(event)) return
    const file = event.dataTransfer?.files[0]
    if (!file) return
    maybeHandleIncomingFile(file)
  })
}

function clearDraggingState(): void {
  dragDepth = 0
  if (state.isDraggingFile) {
    state.isDraggingFile = false
    updateDropOverlay()
  }
}

function maybeHandleIncomingFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    setError('Only image files are supported.')
    return
  }

  if (state.originalImage || state.isProcessing) {
    state.pendingFile = file
    state.showReplaceDialog = true
    updateDialogVisibility()
    return
  }

  void handleFile(file)
}

function cancelReplaceDialog(): void {
  state.showReplaceDialog = false
  state.pendingFile = null
  updateDialogVisibility()
}

async function confirmReplaceDialog(): Promise<void> {
  const file = state.pendingFile
  state.showReplaceDialog = false
  state.pendingFile = null
  updateDialogVisibility()

  if (file) {
    await handleFile(file)
  }
}

async function handleFile(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) {
    setError('Only image files are supported.')
    return
  }

  state.filename = file.name
  state.processingLabel = 'Preparing image...'
  setError(null)

  const dataUrl = await readFileAsDataURL(file)
  if (!dataUrl) {
    setError('Failed to read this file. Try another image.')
    return
  }

  state.originalImage = dataUrl
  state.processedImage = null
  state.isProcessing = true
  updateUI()

  await processImage(dataUrl)
}

async function processImage(sourceImage: string): Promise<void> {
  const token = ++processToken

  if (!state.modelReady) {
    state.processingLabel = 'Loading AI model...'
    updateProcessingText()
    await initializeModel()
    if (token !== processToken) return
  }

  state.processingLabel = 'Processing image...'
  state.processingProgress = 0
  updateProcessingText()
  updateProcessingProgress()

  try {
    const response = await fetch(sourceImage)
    const blob = await response.blob()

    const processedBlob = await removeBackground(blob, (progress, status) => {
      if (token !== processToken) return
      state.processingProgress = progress
      state.processingLabel = status
      updateProcessingText()
      updateProcessingProgress()
    })

    if (token !== processToken) return

    state.processedImage = URL.createObjectURL(processedBlob)
    state.isProcessing = false
    updateUI()
  } catch (error) {
    console.error('Background removal failed:', error)
    if (token === processToken) {
      state.isProcessing = false
      setError('Failed to remove background. Please try another image.')
      updateUI()
    }
  }
}

async function handleDownload(): Promise<void> {
  if (!state.processedImage) {
    setError('Upload and process an image before downloading.')
    return
  }

  try {
    const dataUrl = await composeExportDataUrl({
      source: state.processedImage,
      format: state.currentFormat,
      backgroundColor: state.backgroundColor
    })

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${baseFilename(state.filename)}-eraser.${state.currentFormat}`
    link.click()
  } catch {
    setError('Download failed. Please try another image or format.')
  }
}

async function composeExportDataUrl(params: {
  source: string
  format: OutputFormat
  backgroundColor: string
}): Promise<string> {
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

function toggleTheme(): void {
  state.theme = state.theme === 'light' ? 'dark' : 'light'
  applyTheme()
  updateThemeToggle()
  persistTheme()
}

function applyTheme(): void {
  document.documentElement.setAttribute('data-theme', state.theme)
}

function updateThemeToggle(): void {
  const darkMode = state.theme === 'dark'
  refs.themeToggleIcon.className = darkMode ? 'bi bi-moon-stars-fill' : 'bi bi-sun'
  refs.themeToggleText.textContent = darkMode ? 'Dark mode' : 'Light mode'
  refs.themeToggleBtn.setAttribute('aria-label', darkMode ? 'Switch to light mode' : 'Switch to dark mode')
  refs.themeToggleBtn.title = darkMode ? 'Switch to light mode' : 'Switch to dark mode'
}

function detectPreferredTheme(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') {
    return stored
  }
  return detectPreferredTheme()
}

function persistTheme(): void {
  localStorage.setItem(THEME_STORAGE_KEY, state.theme)
}

function setError(message: string | null): void {
  state.errorMessage = message
  updateErrorBanner()
}

function readFileAsDataURL(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve((event.target?.result as string) || null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

function hasFiles(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types?.includes('Files'))
}

function isOutputFormat(value: string): value is OutputFormat {
  return value === 'png' || value === 'jpg' || value === 'webp'
}

function isCssColor(value: string): boolean {
  return typeof CSS !== 'undefined' && CSS.supports('color', value)
}

function baseFilename(name: string | null): string {
  if (!name) return 'image'
  const trimmed = name.replace(/\.[^/.]+$/, '')
  return trimmed || 'image'
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image load failed'))
    image.src = src
  })
}

function mustQuery<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Missing required element: ${selector}`)
  }
  return element
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('`', '&#96;')
}
