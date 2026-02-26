import { LitElement, css, html } from 'lit'
import { defineComponent, designTokens } from './base'

class UICheckbox extends LitElement {
  static override properties = {
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true }
  }

  static override styles = [
    designTokens,
    css`
      :host {
        display: inline-flex;
      }

      button {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        border: 1.5px solid var(--ds-border-strong);
        background: var(--ds-surface-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: border-color 160ms ease, background 160ms ease, transform 140ms ease;
        padding: 0;
      }

      button:hover {
        transform: translateY(-1px);
      }

      button:focus-visible {
        outline: 2px solid var(--ds-primary);
        outline-offset: 2px;
      }

      button[aria-checked='true'] {
        border-color: var(--ds-primary);
        background: var(--ds-primary);
      }

      svg {
        width: 13px;
        height: 13px;
        stroke: var(--ds-on-primary);
        stroke-width: 2.4;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 18;
        stroke-dashoffset: 18;
        transform-origin: center;
        opacity: 0;
      }

      button[aria-checked='true'] svg {
        opacity: 1;
        animation: check-draw 220ms ease-out forwards, check-pop 220ms ease-out;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      @keyframes check-draw {
        from {
          stroke-dashoffset: 18;
        }
        to {
          stroke-dashoffset: 0;
        }
      }

      @keyframes check-pop {
        0% {
          transform: scale(0.7);
        }
        100% {
          transform: scale(1);
        }
      }
    `
  ]

  declare checked: boolean
  declare disabled: boolean

  constructor() {
    super()
    this.checked = false
    this.disabled = false
  }

  override render() {
    return html`
      <button
        type="button"
        role="checkbox"
        aria-checked=${this.checked ? 'true' : 'false'}
        ?disabled=${this.disabled}
        @click=${this.handleToggle}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8l3 3 7-7"></path>
        </svg>
      </button>
    `
  }

  private handleToggle(): void {
    if (this.disabled) return

    this.checked = !this.checked
    this.dispatchEvent(
      new CustomEvent<{ checked: boolean }>('checkbox-change', {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true
      })
    )
  }
}

defineComponent('ui-checkbox', UICheckbox)

export {}
