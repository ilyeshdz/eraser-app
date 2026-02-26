import type { ReactiveController, ReactiveControllerHost } from 'lit'
import type { AppStore } from '../state/app-store'

interface DragDropOptions {
  onFileDrop: (file: File) => void
}

export class DragDropController implements ReactiveController {
  private store: AppStore
  private options: DragDropOptions
  private dragDepth = 0
  private boundEnter: (event: DragEvent) => void
  private boundOver: (event: DragEvent) => void
  private boundLeave: (event: DragEvent) => void
  private boundDrop: (event: DragEvent) => void
  private boundEnd: () => void
  private boundBlur: () => void

  constructor(host: ReactiveControllerHost, store: AppStore, options: DragDropOptions) {
    this.store = store
    this.options = options

    this.boundEnter = this.handleDragEnter.bind(this)
    this.boundOver = this.handleDragOver.bind(this)
    this.boundLeave = this.handleDragLeave.bind(this)
    this.boundDrop = this.handleDrop.bind(this)
    this.boundEnd = this.clearDraggingState.bind(this)
    this.boundBlur = this.clearDraggingState.bind(this)

    host.addController(this)
  }

  hostConnected(): void {
    window.addEventListener('dragenter', this.boundEnter)
    window.addEventListener('dragover', this.boundOver)
    window.addEventListener('dragleave', this.boundLeave)
    window.addEventListener('drop', this.boundDrop)
    window.addEventListener('dragend', this.boundEnd)
    window.addEventListener('blur', this.boundBlur)
  }

  hostDisconnected(): void {
    window.removeEventListener('dragenter', this.boundEnter)
    window.removeEventListener('dragover', this.boundOver)
    window.removeEventListener('dragleave', this.boundLeave)
    window.removeEventListener('drop', this.boundDrop)
    window.removeEventListener('dragend', this.boundEnd)
    window.removeEventListener('blur', this.boundBlur)
  }

  private handleDragEnter(event: DragEvent): void {
    if (!this.hasFiles(event)) return
    event.preventDefault()
    this.dragDepth += 1
    if (!this.store.snapshot.isDraggingFile) {
      this.store.update({ isDraggingFile: true })
    }
  }

  private handleDragOver(event: DragEvent): void {
    if (this.hasFiles(event)) {
      event.preventDefault()
    }
  }

  private handleDragLeave(event: DragEvent): void {
    if (!this.store.snapshot.isDraggingFile) return
    if (!this.hasFiles(event) && event.relatedTarget !== null) return
    event.preventDefault()

    if (event.relatedTarget === null) {
      this.dragDepth = 0
    } else {
      this.dragDepth = Math.max(0, this.dragDepth - 1)
    }

    if (this.dragDepth === 0 && this.store.snapshot.isDraggingFile) {
      this.store.update({ isDraggingFile: false })
    }
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault()
    this.clearDraggingState()
    if (!this.hasFiles(event)) return
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      this.options.onFileDrop(file)
    }
  }

  private clearDraggingState(): void {
    this.dragDepth = 0
    if (this.store.snapshot.isDraggingFile) {
      this.store.update({ isDraggingFile: false })
    }
  }

  private hasFiles(event: DragEvent): boolean {
    return Boolean(event.dataTransfer?.types?.includes('Files'))
  }
}
