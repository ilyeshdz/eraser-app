import { LitElement, css, html } from 'lit'
import { defineComponent, designTokens } from './base'

class UIModal extends LitElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
    heading: { type: String },
    description: { type: String },
    confirmLabel: { type: String, attribute: 'confirm-label' },
    cancelLabel: { type: String, attribute: 'cancel-label' }
  }

  static override styles = [
    designTokens,
    css`
      :host {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 30;
      }

      :host([open]) {
        display: flex;
      }

      .overlay {
        position: absolute;
        inset: 0;
        background: var(--ds-overlay);
      }

      .card {
        position: relative;
        width: min(460px, 92vw);
        border-radius: var(--ds-radius-md);
        border: 1px solid var(--ds-border);
        background: var(--ds-surface);
        box-shadow: var(--ds-shadow);
        padding: 16px;
        z-index: 1;
      }

      h2 {
        margin: 0;
        font-size: 1.06rem;
        color: var(--ds-text);
      }

      p {
        margin: 8px 0 0;
        color: var(--ds-text-muted);
        font-size: 0.92rem;
      }

      .actions {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      button {
        min-height: 40px;
        border-radius: var(--ds-radius-sm);
        padding: 0 12px;
        font: inherit;
        cursor: pointer;
      }

      .cancel {
        border: 1px solid var(--ds-border);
        background: var(--ds-surface);
        color: var(--ds-text);
      }

      .confirm {
        border: 1px solid var(--ds-primary);
        background: var(--ds-primary);
        color: var(--ds-on-primary);
        font-weight: 560;
      }

      .confirm:hover,
      .cancel:hover {
        filter: brightness(1.03);
      }

      .cancel:focus-visible,
      .confirm:focus-visible {
        outline: 2px solid var(--ds-primary);
        outline-offset: 2px;
      }
    `
  ]

  declare open: boolean
  declare heading: string
  declare description: string
  declare confirmLabel: string
  declare cancelLabel: string

  constructor() {
    super()
    this.open = false
    this.heading = ''
    this.description = ''
    this.confirmLabel = 'Confirm'
    this.cancelLabel = 'Cancel'
  }

  override render() {
    return html`
      <div class="overlay" @click=${this.handleCancel}></div>
      <section class="card" role="dialog" aria-modal="true" aria-label=${this.heading || 'Dialog'}>
        <h2>${this.heading}</h2>
        <p>${this.description}</p>
        <div class="actions">
          <button class="cancel" type="button" @click=${this.handleCancel}>${this.cancelLabel}</button>
          <button class="confirm" type="button" @click=${this.handleConfirm}>${this.confirmLabel}</button>
        </div>
      </section>
    `
  }

  private handleCancel(): void {
    this.dispatchEvent(
      new CustomEvent('modal-cancel', {
        bubbles: true,
        composed: true
      })
    )
  }

  private handleConfirm(): void {
    this.dispatchEvent(
      new CustomEvent('modal-confirm', {
        bubbles: true,
        composed: true
      })
    )
  }
}

defineComponent('ui-modal', UIModal)

export {}
