import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { designTokens } from '../base'

@customElement('processing-panel')
export class ProcessingPanel extends LitElement {
  static override styles = [
    designTokens,
    css`
      :host {
        display: block;
      }

      .processing-state {
        min-height: 320px;
        width: min(520px, 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        gap: 0.5rem;
      }

      .spinner {
        width: 30px;
        height: 30px;
        border-radius: 999px;
        border: 3px solid var(--surface-subtle, #eef1f6);
        border-top-color: var(--accent-hover, #2d56cc);
        animation: spin 0.82s linear infinite;
      }

      .processing-label {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }

      .processing-progress {
        width: 100%;
        max-width: 280px;
        height: 6px;
        border-radius: 999px;
        background: var(--surface-subtle, #eef1f6);
        overflow: hidden;
      }

      .processing-progress .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-hover, #2d56cc), var(--accent, #3b6af5));
        border-radius: 999px;
        transition: width 200ms ease;
        width: 0%;
      }

      .processing-hint {
        margin: 0;
        color: var(--text-muted, #8f95a8);
        font-size: 0.86rem;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `
  ]

  @property({ type: String }) declare label: string
  @property({ type: Number }) declare progress: number

  constructor() {
    super()
    this.label = 'Processing image...'
    this.progress = 0
  }

  override render() {
    return html`
      <div class="processing-state" aria-live="polite" aria-busy="true">
        <div class="spinner" aria-hidden="true"></div>
        <p class="processing-label">${this.label}</p>
        <div class="processing-progress">
          <div class="progress-fill" style=${`width: ${Math.round(this.progress)}%;`}></div>
        </div>
        <p class="processing-hint">This may take a few seconds depending on image size.</p>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'processing-panel': ProcessingPanel
  }
}
