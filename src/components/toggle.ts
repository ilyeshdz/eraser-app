import { LitElement, css, html } from 'lit'
import { property } from 'lit/decorators.js'
import { defineComponent, designTokens } from './base'

class UIToggle extends LitElement {
  @property({ type: Boolean, reflect: true }) declare checked: boolean

  constructor() {
    super()
    this.checked = false
  }

  static override styles = [
    designTokens,
    css`
      :host {
        display: inline-block;
      }

      button {
        position: relative;
        width: 50px;
        height: 30px;
        border: 0;
        border-radius: 999px;
        background: var(--ds-border-strong);
        cursor: pointer;
        transition: background 180ms ease;
        padding: 0;
      }

      button::after {
        content: '';
        position: absolute;
        top: 4px;
        left: 4px;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        transition: transform 180ms ease;
      }

      button[aria-checked='true'] {
        background: var(--ds-primary);
      }

      button[aria-checked='true']::after {
        transform: translateX(20px);
      }

      button:focus-visible {
        outline: 2px solid var(--ds-primary);
        outline-offset: 2px;
      }
    `
  ]

  override render() {
    return html`
      <button
        type="button"
        role="switch"
        aria-checked=${this.checked ? 'true' : 'false'}
        @click=${this.handleToggle}
      ></button>
    `
  }

  private handleToggle(): void {
    this.checked = !this.checked
    this.dispatchEvent(
      new CustomEvent<{ checked: boolean }>('toggle-change', {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true
      })
    )
  }
}

defineComponent('ui-toggle', UIToggle)

export {}
