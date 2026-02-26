import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { designTokens } from '../base'

@customElement('result-gallery')
export class ResultGallery extends LitElement {
  static override styles = [
    designTokens,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      .result-shell {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }

      .result-state {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: center;
        gap: 1.2rem;
      }

      .result-panel {
        min-width: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .result-panel-media {
        position: relative;
        min-height: 0;
        flex: 1;
        border-radius: var(--radius-md, 12px);
        border: 1px solid var(--border, #e2e6ef);
        background: var(--surface-subtle, #eef1f6);
        box-shadow: 0 8px 20px rgba(6, 10, 22, 0.18);
        overflow: hidden;
      }

      .result-panel-media.transparent {
        background:
          linear-gradient(45deg, var(--checker-a, #eef1f6) 25%, transparent 25%),
          linear-gradient(-45deg, var(--checker-a, #eef1f6) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, var(--checker-b, #dde3ed) 75%),
          linear-gradient(-45deg, transparent 75%, var(--checker-b, #dde3ed) 75%);
        background-size: 12px 12px;
        background-position: 0 0, 0 6px, 6px -6px, -6px 0;
      }

      .result-panel-label {
        text-align: center;
        font-size: 0.75rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--text-muted, #8f95a8);
        font-weight: 600;
      }

      .result-panel-image {
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
        transition: box-shadow 180ms ease;
      }

      @media (max-width: 860px) {
        .result-state {
          grid-template-columns: 1fr;
        }
      }
    `
  ]

  @property({ type: String }) declare originalSrc: string | null
  @property({ type: String }) declare resultSrc: string | null
  @property({ type: String }) declare backgroundColor: string

  @state() private declare resultAspect: string | null

  constructor() {
    super()
    this.originalSrc = null
    this.resultSrc = null
    this.backgroundColor = 'transparent'
    this.resultAspect = null
  }

  override render() {
    const resultStageClasses = [
      'result-panel-media',
      this.backgroundColor === 'transparent' ? 'transparent' : ''
    ]
      .filter(Boolean)
      .join(' ')
    const backgroundStyle =
      this.backgroundColor !== 'transparent' ? `background-color: ${this.backgroundColor};` : ''
    const aspectStyle = this.resultAspect ? `aspect-ratio: ${this.resultAspect};` : ''
    const imageStyle = `${aspectStyle}${backgroundStyle}`

    return html`
      <div class="result-shell">
        <div class="result-state">
          <div class="result-panel">
            <div class="result-panel-label">Original</div>
            <div class="result-panel-media transparent">
              <img
                class="result-panel-image"
                src=${this.originalSrc ?? ''}
                alt="Original image"
              />
            </div>
          </div>
          <div class="result-panel">
            <div class="result-panel-label">Result</div>
            <div class=${resultStageClasses}>
              <img
                class="result-panel-image"
                style=${imageStyle}
                src=${this.resultSrc ?? ''}
                alt="Processed image preview"
                @load=${this.handleResultLoad}
              />
            </div>
          </div>
        </div>
        <slot name="actions"></slot>
      </div>
    `
  }

  private handleResultLoad(event: Event): void {
    const img = event.target as HTMLImageElement
    if (img.naturalWidth && img.naturalHeight) {
      this.resultAspect = `${img.naturalWidth} / ${img.naturalHeight}`
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'result-gallery': ResultGallery
  }
}
