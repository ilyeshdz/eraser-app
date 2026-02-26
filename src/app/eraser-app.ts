import { LitElement, html } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import './controllers/drag-drop.controller'
import './controllers/theme.controller'
import './controllers/changelog.controller'
import '../components'
import type { AppState, ThemeMode, OutputFormat } from './state/app-store'
import { AppStore } from './state/app-store'
import { DragDropController } from './controllers/drag-drop.controller'
import { ThemeController } from './controllers/theme.controller'
import { ChangelogController, CHANGELOG_ITEMS } from './controllers/changelog.controller'
import {
  composeExportDataUrl,
  dataUrlToBlob,
  loadModel,
  removeBackground,
  type ModelType,
  saveModel
} from '../services'
import { readFileAsDataURL, isImageFile } from '../services/file.service'
import { getInitialTheme, getInitialModel } from '../services/preferences.service'
import { triggerDownload } from '../services/export.service'

@customElement('eraser-app')
export class EraserApp extends LitElement {
  @state() private declare viewState: AppState

  @query('#fileInput') private declare fileInput: HTMLInputElement

  private store: AppStore
  private themeController: ThemeController
  private changelogController: ChangelogController
  private processToken = 0
  private unsubscribeStore?: () => void

  constructor() {
    super()

    const initialState: AppState = {
      filename: null,
      originalImage: null,
      processedImage: null,
      backgroundColor: 'transparent',
      currentFormat: 'png',
      isProcessing: false,
      processingLabel: 'Preparing image...',
      processingProgress: 0,
      errorMessage: null,
      bannerVariant: 'info',
      isDraggingFile: false,
      showReplaceDialog: false,
      pendingFile: null,
      theme: getInitialTheme(),
      selectedModel: getInitialModel(),
      modelReady: false,
      showChangelog: false
    }

    this.store = new AppStore(initialState)
    this.viewState = this.store.snapshot

    this.unsubscribeStore = this.store.subscribe((state) => {
      this.viewState = state
      this.requestUpdate()
    })

    new DragDropController(this, this.store, {
      onFileDrop: (file) => this.maybeHandleIncomingFile(file)
    })
    this.themeController = new ThemeController(this, this.store)
    this.changelogController = new ChangelogController(this, this.store)
  }

  protected override createRenderRoot() {
    // Light DOM to let global styles apply
    return this
  }

  override firstUpdated(): void {
    this.showSafariWarning()
    void this.initializeModel(this.viewState.selectedModel)
  }

  override disconnectedCallback(): void {
    this.unsubscribeStore?.()
    super.disconnectedCallback()
  }

  override render() {
    const state = this.viewState
    const hasImage = Boolean(state.originalImage)
    const showEmpty = !hasImage && !state.isProcessing
    const showProcessing = state.isProcessing
    const showResult = hasImage && !state.isProcessing
    const canvasModeClass = showResult ? 'result-mode' : showProcessing ? 'processing-mode' : 'empty-mode'

    const appShellClass = ['app-shell', state.isDraggingFile ? 'blurred' : ''].filter(Boolean).join(' ')

    return html`
      <div id="app">
        <div class=${appShellClass}>
          <ui-banner
            variant=${state.bannerVariant}
            .message=${state.errorMessage ?? ''}
            ?hidden=${!state.errorMessage}
            dismissible
            @banner-dismiss=${() => this.setError(null)}
          ></ui-banner>

          <header class="topbar">
            ${hasImage || state.isProcessing
              ? html`
                  <ui-button
                    variant="ghost"
                    size="sm"
                    @click=${this.handleGoBack}
                    aria-label="Go back to upload screen"
                  >
                    <i class="bi bi-arrow-left" aria-hidden="true"></i>
                    Go back
                  </ui-button>
                `
              : null}
            <button
              class="theme-toggle"
              id="themeToggleBtn"
              type="button"
              aria-label="Toggle color theme"
              @click=${this.toggleTheme}
            >
              <i
                class=${state.theme === 'dark' ? 'bi bi-moon-stars-fill' : 'bi bi-sun'}
                id="themeToggleIcon"
                aria-hidden="true"
              ></i>
              <span id="themeToggleText">${state.theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            </button>
          </header>

          <main class="main">
            <aside class="sidebar">
              <input type="file" id="fileInput" accept="image/*" hidden @change=${this.handleFileInput} />

              <section class="sidebar-section" ?hidden=${hasImage}>
                <div class="sidebar-label">Start</div>
                <p class="hint-text">
                  Drag and drop an image to begin. You can tune background and output styling after upload.
                </p>
                <model-selector
                  id="modelSelector"
                  .selectedModel=${state.selectedModel}
                  .disabled=${state.isProcessing}
                  @model-change=${this.handleModelChange}
                ></model-selector>
              </section>

              <section class="sidebar-section" ?hidden=${!hasImage}>
                <div class="sidebar-label">Background</div>
                <background-panel
                  .selectedColor=${state.backgroundColor}
                  @background-change=${this.handleBackgroundChange}
                  @background-error=${(e: CustomEvent<{ message: string }>) => this.setError(e.detail.message)}
                  @clear-background-error=${() => this.setError(null)}
                ></background-panel>
              </section>
            </aside>

            <section class="canvas">
              <div class="canvas-content ${canvasModeClass}">
                ${showEmpty
                  ? html`<empty-state-card @browse-click=${this.triggerBrowse}></empty-state-card>`
                  : null}

                ${showProcessing
                  ? html`<processing-panel
                      .label=${state.processingLabel}
                      .progress=${state.processingProgress}
                    ></processing-panel>`
                  : null}

                ${showResult
                  ? html`
                      <result-gallery
                        .originalSrc=${state.originalImage}
                        .resultSrc=${state.processedImage ?? state.originalImage}
                        .backgroundColor=${state.backgroundColor}
                      >
                        <download-bar
                          slot="actions"
                          .format=${state.currentFormat}
                          .options=${(['png', 'jpg', 'webp'] as OutputFormat[])}
                          @download-main=${this.handleDownload}
                          @download-format-change=${(e: CustomEvent<{ format: OutputFormat }>) =>
                            this.store.update({ currentFormat: e.detail.format })}
                        ></download-bar>
                      </result-gallery>
                    `
                  : null}
              </div>
            </section>
          </main>
        </div>

        <div class="drop-overlay" aria-hidden=${state.isDraggingFile ? 'false' : 'true'} ?hidden=${!state.isDraggingFile}>
          <div class="drop-popup">
            <p class="drop-popup-title">
              ${state.originalImage ? 'Drop to load a new image' : 'Drop to process this image'}
            </p>
            <p class="drop-popup-hint">
              ${state.originalImage
                ? 'You will be asked to confirm replacement.'
                : 'Processing starts immediately.'}
            </p>
          </div>
        </div>

        <ui-modal
          id="replaceDialog"
          heading="Replace current image?"
          description="Loading a new image will stop the current edit and replace the preview."
          confirm-label="Replace image"
          cancel-label="Cancel"
          ?open=${state.showReplaceDialog}
          @modal-cancel=${this.cancelReplaceDialog}
          @modal-confirm=${this.confirmReplaceDialog}
        ></ui-modal>

        <ui-modal
          id="changelogModal"
          heading="What's New"
          confirm-label="Got it"
          .changelogItems=${CHANGELOG_ITEMS}
          ?open=${state.showChangelog}
          @modal-confirm=${() => this.changelogController.markSeen()}
        ></ui-modal>
      </div>
    `
  }

  private toggleTheme(): void {
    const next: ThemeMode = this.viewState.theme === 'light' ? 'dark' : 'light'
    this.themeController.setTheme(next)
  }

  private triggerBrowse(): void {
    this.fileInput?.click()
  }

  private handleFileInput(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    this.maybeHandleIncomingFile(file)
    ;(event.target as HTMLInputElement).value = ''
  }

  private async maybeHandleIncomingFile(file: File): Promise<void> {
    if (!isImageFile(file)) {
      this.setError('Only image files are supported.')
      return
    }

    if (this.viewState.originalImage || this.viewState.isProcessing) {
      this.store.update({ pendingFile: file, showReplaceDialog: true })
      return
    }

    await this.handleFile(file)
  }

  private cancelReplaceDialog = (): void => {
    this.store.update({ showReplaceDialog: false, pendingFile: null })
  }

  private confirmReplaceDialog = async (): Promise<void> => {
    const file = this.viewState.pendingFile
    this.store.update({ showReplaceDialog: false, pendingFile: null })
    if (file) {
      await this.handleFile(file)
    }
  }

  private async handleFile(file: File): Promise<void> {
    if (!isImageFile(file)) {
      this.setError('Only image files are supported.')
      return
    }

    this.store.update({
      filename: file.name,
      processingLabel: 'Preparing image...',
      processingProgress: 0,
      errorMessage: null
    })

    const readResult = await readFileAsDataURL(file)
    if (!readResult.dataUrl) {
      this.setError(readResult.error ?? 'Failed to read this file. Try another image.')
      return
    }

    const dataUrl = readResult.dataUrl
    this.store.update({
      originalImage: dataUrl,
      processedImage: null,
      isProcessing: true
    })

    await this.processImage(dataUrl)
  }

  private async processImage(sourceDataUrl: string): Promise<void> {
    const token = ++this.processToken

    this.store.update({ processingLabel: 'Loading AI model...', processingProgress: 0 })

    if (!this.viewState.modelReady) {
      await this.initializeModel(this.viewState.selectedModel, token)
      if (token !== this.processToken) return
    }

    this.store.update({ processingLabel: 'Processing image...', processingProgress: 0 })

    const startTime = Date.now()
    const animate = window.setInterval(() => {
      const elapsed = Date.now() - startTime
      const progressValue = Math.min((elapsed / 5000) * 90, 90)
      this.store.update({ processingProgress: progressValue })
    }, 50)

    try {
      const blob = await dataUrlToBlob(sourceDataUrl)
      const processedBlob = await removeBackground(blob, (progress, status) => {
        if (token !== this.processToken) return
        this.store.update({ processingLabel: status, processingProgress: Math.min(progress, 90) })
      })

      window.clearInterval(animate)
      if (token !== this.processToken) return

      this.store.update({ processingProgress: 100, processingLabel: 'Complete' })
      const objectUrl = URL.createObjectURL(processedBlob)
      this.store.update({ processedImage: objectUrl, isProcessing: false })
    } catch (error) {
      console.error('Background removal failed:', error)
      window.clearInterval(animate)
      if (token === this.processToken) {
        this.store.update({ isProcessing: false, processingProgress: 0 })
        this.setError('Failed to remove background. Please try another image.')
      }
    }
  }

  private async initializeModel(model: ModelType, currentToken?: number): Promise<void> {
    try {
      await loadModel(model, (_progress, status) => {
        if (currentToken && currentToken !== this.processToken) return
        this.store.update({ processingLabel: status })
      })
      this.store.update({ modelReady: true, processingLabel: 'Ready' })
    } catch (error) {
      console.error('Failed to initialize model:', error)
      this.setError('Failed to load AI model. Please refresh the page.')
    }
  }

  private async handleDownload(): Promise<void> {
    const state = this.viewState
    if (!state.processedImage) {
      this.setError('Upload and process an image before downloading.')
      return
    }

    try {
      const dataUrl = await composeExportDataUrl({
        source: state.processedImage,
        format: state.currentFormat,
        backgroundColor: state.backgroundColor
      })
      triggerDownload(dataUrl, state.filename, state.currentFormat)
    } catch (error) {
      console.error('Download failed', error)
      this.setError('Download failed. Please try another image or format.')
    }
  }

  private handleBackgroundChange = (event: CustomEvent<{ color: string }>): void => {
    this.store.update({ backgroundColor: event.detail.color, errorMessage: null, bannerVariant: 'info' })
  }

  private handleModelChange = async (event: CustomEvent<{ model: ModelType }>): Promise<void> => {
    const model = event.detail.model
    saveModel(model)
    this.store.update({ selectedModel: model, modelReady: false })
    await this.initializeModel(model)
  }

  private setError(message: string | null): void {
    this.store.update({ errorMessage: message, bannerVariant: message ? 'error' : 'info' })
  }

  private showSafariWarning(): void {
    const ua = navigator.userAgent
    const isSafari = ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Chromium')
    if (isSafari) {
      this.store.update({
        errorMessage: 'Safari users: Please use Chrome or Firefox for a smoother experience.',
        bannerVariant: 'warning'
      })
    }
  }

  private handleGoBack = (): void => {
    this.processToken += 1
    this.store.update({
      filename: null,
      originalImage: null,
      processedImage: null,
      backgroundColor: 'transparent',
      currentFormat: 'png',
      isProcessing: false,
      processingLabel: 'Preparing image...',
      processingProgress: 0,
      errorMessage: null,
      bannerVariant: 'info',
      showReplaceDialog: false,
      pendingFile: null
    })
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'eraser-app': EraserApp
  }
}
