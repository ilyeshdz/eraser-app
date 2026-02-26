import { LitElement, css, html } from 'lit'
import { defineComponent, designTokens } from './base'

type BannerVariant = 'info' | 'error'

class UIBanner extends LitElement {
  static override properties = {
    variant: { type: String },
    message: { type: String },
    dismissible: { type: Boolean, reflect: true }
  }

  static override styles = [
    designTokens,
    css`
      :host {
        display: block;
      }

      .banner {
        min-height: 44px;
        border: 1px solid transparent;
        border-radius: var(--ds-radius-sm);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 12px;
        font-size: 0.88rem;
      }

      .banner.error {
        background: var(--ds-error-bg);
        border-color: var(--ds-error-border);
        color: var(--ds-error-text);
      }

      .banner.info {
        background: var(--ds-info-bg);
        border-color: var(--ds-info-border);
        color: var(--ds-info-text);
      }

      button {
        width: 30px;
        height: 30px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
      }

      button:hover {
        background: rgba(0, 0, 0, 0.08);
      }

      button:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }
    `
  ]

  declare variant: BannerVariant
  declare message: string
  declare dismissible: boolean

  constructor() {
    super()
    this.variant = 'info'
    this.message = ''
    this.dismissible = false
  }

  override render() {
    const variantClass = this.variant === 'error' ? 'error' : 'info'

    return html`
      <div class="banner ${variantClass}" role="alert">
        <span>${this.message}</span>
        ${this.dismissible
          ? html`<button type="button" aria-label="Dismiss" @click=${this.handleDismiss}>×</button>`
          : html``}
      </div>
    `
  }

  private handleDismiss(): void {
    this.dispatchEvent(
      new CustomEvent('banner-dismiss', {
        bubbles: true,
        composed: true
      })
    )
  }
}

defineComponent('ui-banner', UIBanner)

export {}
