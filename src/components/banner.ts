import { css, html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { defineComponent, designTokens } from './base'

type BannerVariant = 'info' | 'error' | 'warning'

class UIBanner extends LitElement {
  @property({ type: String }) declare variant: BannerVariant
  @property({ type: String }) declare message: string
  @property({ type: Boolean, reflect: true }) declare dismissible: boolean

  constructor() {
    super()
    this.variant = 'info'
    this.message = ''
    this.dismissible = false
  }

  static override styles = [
    designTokens,
    css`
      :host {
        display: block;
      }

      .banner {
        min-height: 10px;
        border: 1px solid transparent;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 0 10px;
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

      .banner.warning {
        background: var(--ds-warning-bg);
        border-color: var(--ds-warning-border);
        color: var(--ds-warning-text);
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

  override render() {
    const variantClass =
      this.variant === 'error' ? 'error' : this.variant === 'warning' ? 'warning' : 'info'

    return html`
      <div class="banner ${variantClass}" role="alert">
        <span>${this.message}</span>
        ${this.dismissible
          ? html` <button type="button" aria-label="Dismiss" @click=${this.handleDismiss}>×</button> `
          : html``}
      </div>
    `
  }

  private handleDismiss(): void {
    this.dispatchEvent(
      new CustomEvent('banner-dismiss', {
        bubbles: true,
        composed: true,
      })
    )
  }
}

defineComponent('ui-banner', UIBanner)

export {}
