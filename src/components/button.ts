import { LitElement, css, html } from 'lit'
import { property } from 'lit/decorators.js'
import { defineComponent, designTokens } from './base'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'md' | 'sm'

class UIButton extends LitElement {
  @property({ reflect: true }) declare variant: ButtonVariant
  @property({ reflect: true }) declare size: ButtonSize
  @property({ type: Boolean, reflect: true }) declare disabled: boolean

  constructor() {
    super()
    this.variant = 'primary'
    this.size = 'md'
    this.disabled = false
  }

  static override styles = [
    designTokens,
    css`
      :host {
        display: inline-block;
        min-width: 0;
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        width: 100%;
        min-height: 40px;
        border-radius: var(--ds-radius-sm);
        border: 1px solid transparent;
        padding: 0 14px;
        font: inherit;
        font-weight: 560;
        cursor: pointer;
        transition: border-color 160ms ease, background 160ms ease, color 160ms ease, transform 160ms ease;
      }

      ::slotted(i) {
        font-size: 1rem;
      }

      button:hover {
        transform: translateY(-1px);
      }

      button:focus-visible {
        outline: 2px solid var(--ds-primary);
        outline-offset: 2px;
      }

      button.primary {
        border-color: var(--ds-primary);
        background: var(--ds-primary);
        color: var(--ds-on-primary);
      }

      button.primary:hover {
        filter: brightness(1.06);
      }

      button.secondary {
        border-color: var(--ds-border);
        background: var(--ds-surface);
        color: var(--ds-text);
      }

      button.secondary:hover {
        border-color: var(--ds-border-strong);
        background: var(--ds-surface-muted);
      }

      button.ghost {
        border-color: transparent;
        background: transparent;
        color: var(--ds-text-muted);
      }

      button.ghost:hover {
        border-color: var(--ds-border);
        background: var(--ds-surface-muted);
        color: var(--ds-text);
      }

      button.sm {
        min-height: 34px;
        padding: 0 10px;
        font-size: 0.86rem;
      }

      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        transform: none;
      }
    `
  ]

  override render() {
    const variant = this.variant || 'primary'
    const size = this.size || 'md'

    return html`
      <button
        part="button"
        class="${variant} ${size}"
        type="button"
        ?disabled=${this.disabled}
        @click=${this.handleClick}
      >
        <slot></slot>
      </button>
    `
  }

  private handleClick(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }
}

defineComponent('ui-button', UIButton)

export {}
