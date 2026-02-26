import { LitElement, css, html } from 'lit'
import { defineComponent, designTokens } from './base'

class UISplitButton extends LitElement {
  static override properties = {
    label: { type: String },
    value: { type: String },
    options: { type: String },
    open: { type: Boolean, state: true }
  }

  static override styles = [
    designTokens,
    css`
      :host {
        display: block;
      }

      .group {
        position: relative;
        display: flex;
        border-radius: var(--ds-radius-sm);
        overflow: visible;
        box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
      }

      .main,
      .arrow {
        min-height: 42px;
        border: none;
        color: var(--ds-on-primary);
        background: var(--ds-primary);
        cursor: pointer;
        font: inherit;
      }

      .main {
        flex: 1;
        border-top-left-radius: var(--ds-radius-sm);
        border-bottom-left-radius: var(--ds-radius-sm);
        font-weight: 560;
        padding: 0 14px;
      }

      .arrow {
        width: 42px;
        border-top-right-radius: var(--ds-radius-sm);
        border-bottom-right-radius: var(--ds-radius-sm);
        border-left: 1px solid rgba(255, 255, 255, 0.18);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .arrow svg {
        transition: transform 160ms ease;
      }

      .arrow[aria-expanded='true'] svg {
        transform: rotate(180deg);
      }

      .main:hover,
      .arrow:hover {
        filter: brightness(1.06);
      }

      .main:focus-visible,
      .arrow:focus-visible,
      .menu button:focus-visible {
        outline: 2px solid var(--ds-primary);
        outline-offset: 2px;
      }

      .menu {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        min-width: 118px;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-sm);
        background: var(--ds-surface);
        box-shadow: var(--ds-shadow);
        overflow: hidden;
        z-index: 12;
        opacity: 0;
        transform: translateY(8px) scale(0.98);
        pointer-events: none;
        transition: opacity 160ms ease, transform 160ms ease;
      }

      .menu.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      .menu button {
        width: 100%;
        min-height: 36px;
        border: none;
        background: var(--ds-surface);
        text-align: left;
        padding: 0 10px;
        cursor: pointer;
        color: var(--ds-text);
        font: inherit;
      }

      .menu button:hover {
        background: var(--ds-surface-muted);
      }

      .menu button[aria-checked='true'] {
        font-weight: 600;
        background: var(--ds-surface-muted);
      }
    `
  ]

  declare label: string
  declare value: string
  declare options: string
  declare open: boolean

  private readonly onDocumentPointerDown: (event: PointerEvent) => void

  constructor() {
    super()
    this.label = 'Download'
    this.value = ''
    this.options = ''
    this.open = false

    this.onDocumentPointerDown = (event: PointerEvent) => {
      if (!this.open) return
      const path = event.composedPath()
      if (!path.includes(this)) {
        this.open = false
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    document.addEventListener('pointerdown', this.onDocumentPointerDown)
  }

  override disconnectedCallback(): void {
    document.removeEventListener('pointerdown', this.onDocumentPointerDown)
    super.disconnectedCallback()
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('options') && !this.optionList.includes(this.value)) {
      const firstOption = this.optionList[0]
      this.value = firstOption ?? ''
    }
  }

  override render() {
    return html`
      <div class="group">
        <button class="main" type="button" @click=${this.handleMainClick}>${this.label}</button>

        <button
          class="arrow"
          type="button"
          aria-label="Open format menu"
          aria-expanded=${this.open ? 'true' : 'false'}
          @click=${this.handleArrowClick}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M3 4.5L6 7.5L9 4.5" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>

        <div class="menu ${this.open ? 'open' : ''}" role="menu" @keydown=${this.handleMenuKeydown}>
          ${this.optionList.map((option) => {
            const selected = option === this.value
            return html`
              <button
                type="button"
                role="menuitemradio"
                aria-checked=${selected ? 'true' : 'false'}
                @click=${() => this.handleOptionSelect(option)}
              >
                ${option.toUpperCase()}
              </button>
            `
          })}
        </div>
      </div>
    `
  }

  private get optionList(): string[] {
    return this.options
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  private handleMainClick(): void {
    this.dispatchEvent(
      new CustomEvent('split-main-click', {
        bubbles: true,
        composed: true
      })
    )
  }

  private handleArrowClick(event: MouseEvent): void {
    event.stopPropagation()
    this.open = !this.open
  }

  private handleOptionSelect(option: string): void {
    this.value = option
    this.open = false
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('split-option-select', {
        detail: { value: option },
        bubbles: true,
        composed: true
      })
    )
  }

  private handleMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      this.open = false
    }
  }
}

defineComponent('ui-split-button', UISplitButton)

export {}
