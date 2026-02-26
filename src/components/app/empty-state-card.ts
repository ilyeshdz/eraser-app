import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { designTokens } from '../base'

@customElement('empty-state-card')
export class EmptyStateCard extends LitElement {
  static override styles = [
    designTokens,
    css`
      :host {
        display: block;
      }

      .empty-state {
        width: min(760px, 100%);
        min-height: 240px;
        border: 2px dashed var(--border, #e2e6ef);
        border-radius: var(--radius-lg, 16px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 0.8rem;
        cursor: pointer;
        padding: 2rem;
        background: linear-gradient(180deg, var(--surface-raised, #fff) 0%, var(--surface-subtle, #eef1f6) 100%);
        transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
      }

      .empty-state:hover {
        border-color: var(--accent, #3b6af5);
        transform: translateY(-1px);
      }

      .empty-icon {
        width: 72px;
        height: 72px;
        border-radius: 16px;
        border: 1px solid var(--border, #e2e6ef);
        color: var(--accent, #3b6af5);
        background: var(--surface-subtle, #eef1f6);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
      }

      .empty-label {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
      }

      .empty-hint {
        margin: 0;
        color: var(--text-muted, #8f95a8);
        font-size: 0.9rem;
      }

      ui-button {
        margin-top: 0.2rem;
      }
    `
  ]

  @property({ type: Boolean }) declare disabled: boolean

  constructor() {
    super()
    this.disabled = false
  }

  override render() {
    return html`
      <div
        class="empty-state"
        role="button"
        tabindex="0"
        aria-label="Drop image here or browse files"
        @click=${this.handleBrowse}
        @keydown=${this.handleKeydown}
      >
        <div class="empty-icon">
          <i class="bi bi-cloud-arrow-up" aria-hidden="true"></i>
        </div>
        <p class="empty-label">Drop your image here</p>
        <p class="empty-hint">or click to browse files</p>
        <ui-button variant="secondary">
          <i class="bi bi-folder2-open" aria-hidden="true"></i>
          Browse files
        </ui-button>
      </div>
    `
  }

  private handleBrowse(event: Event): void {
    if (this.disabled) return
    event.preventDefault()
    this.dispatchEvent(new CustomEvent('browse-click', { bubbles: true, composed: true }))
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.handleBrowse(event)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'empty-state-card': EmptyStateCard
  }
}
