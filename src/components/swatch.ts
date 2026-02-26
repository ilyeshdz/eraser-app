import { LitElement, css, html } from 'lit'
import { defineComponent, designTokens } from './base'

class UISwatch extends LitElement {
  static override properties = {
    color: { type: String, reflect: true },
    selected: { type: Boolean, reflect: true },
    label: { type: String }
  }

  static override styles = [
    designTokens,
    css`
      :host {
        display: inline-flex;
      }

      button {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: 2px solid transparent;
        cursor: pointer;
        transition: border-color 140ms ease, transform 140ms ease;
        background: var(--swatch-color, #ffffff);
        padding: 0;
      }

      button:hover {
        transform: scale(1.04);
      }

      button[aria-pressed='true'] {
        border-color: var(--ds-primary);
      }

      button.transparent {
        background:
          linear-gradient(45deg, var(--ds-checker-a) 25%, transparent 25%),
          linear-gradient(-45deg, var(--ds-checker-a) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, var(--ds-checker-b) 75%),
          linear-gradient(-45deg, transparent 75%, var(--ds-checker-b) 75%);
        background-size: 8px 8px;
        background-position: 0 0, 0 4px, 4px -4px, -4px 0;
        background-color: var(--ds-surface);
        opacity: 0.6;
      }

      button:focus-visible {
        outline: 2px solid var(--ds-primary);
        outline-offset: 2px;
      }
    `
  ]

  declare color: string
  declare selected: boolean
  declare label: string

  constructor() {
    super()
    this.color = '#ffffff'
    this.selected = false
    this.label = ''
  }

  override render() {
    const isTransparent = this.color === 'transparent'
    const title = this.label || this.color

    return html`
      <button
        type="button"
        class=${isTransparent ? 'transparent' : ''}
        style=${`--swatch-color: ${this.color};`}
        title=${title}
        aria-label=${title}
        aria-pressed=${this.selected ? 'true' : 'false'}
        @click=${this.handleSelect}
      ></button>
    `
  }

  private handleSelect(): void {
    this.dispatchEvent(
      new CustomEvent<{ color: string }>('swatch-select', {
        detail: { color: this.color },
        bubbles: true,
        composed: true
      })
    )
  }
}

defineComponent('ui-swatch', UISwatch)

export {}
