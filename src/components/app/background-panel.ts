import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { designTokens } from '../base'

const BASE_COLORS = [
  { color: 'transparent', label: 'Transparent' },
  { color: '#ffffff', label: 'White' }
]

const PASTEL_COLORS = [
  '#F9D5E5',
  '#FDE2E4',
  '#FAD2E1',
  '#E2ECE9',
  '#BEE1E6',
  '#CDEAC0',
  '#FFF1C1',
  '#E8DFF5',
  '#D7E3FC',
  '#F8EDEB'
]

@customElement('background-panel')
export class BackgroundPanel extends LitElement {
  static override styles = [
    designTokens,
    css`
      :host {
        display: block;
      }

      .swatch-row {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
        margin-bottom: 0.55rem;
      }

      .swatch-row-label {
        width: 58px;
        margin-top: 8px;
        color: var(--text-muted, #8f95a8);
        font-size: 0.8rem;
        flex-shrink: 0;
      }

      .swatch-row-swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .custom-color-wrapper {
        margin-top: 0.7rem;
      }

      .custom-color-label {
        display: block;
        margin-bottom: 6px;
        color: var(--text-secondary, #5e6578);
        font-size: 0.8rem;
      }

      .custom-color-input {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        min-height: 42px;
        border: 1px solid var(--border, #e2e6ef);
        border-radius: var(--radius-sm, 8px);
        background: var(--surface-subtle, #eef1f6);
        color: var(--text-primary, #1a1f36);
        font: inherit;
        padding: 0 10px;
        transition: border-color 160ms ease, box-shadow 160ms ease;
      }

      .custom-color-input::placeholder {
        color: var(--text-muted, #8f95a8);
      }

      .custom-color-input:focus {
        outline: none;
        border-color: var(--accent-hover, #2d56cc);
        box-shadow: 0 0 0 2px rgba(74, 116, 241, 0.28);
      }

      .custom-color-help {
        margin: 8px 0 0;
        color: var(--text-muted, #8f95a8);
        font-size: 0.76rem;
      }

      .custom-color-help code {
        padding: 1px 4px;
        border-radius: 4px;
        background: var(--surface-subtle, #eef1f6);
        color: var(--text-primary, #1a1f36);
      }
    `
  ]

  @property({ type: String }) declare selectedColor: string

  @state() private declare customValue: string

  constructor() {
    super()
    this.selectedColor = 'transparent'
    this.customValue = ''
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('selectedColor') && document.activeElement !== this.shadowRoot?.querySelector('input')) {
      this.customValue = this.selectedColor === 'transparent' ? '' : this.selectedColor
    }
  }

  override render() {
    return html`
      <div class="swatch-row">
        <span class="swatch-row-label">Base</span>
        <div class="swatch-row-swatches" role="group" aria-label="Base colors">
          ${BASE_COLORS.map((item) => html`
            <ui-swatch
              color=${item.color}
              label=${item.label}
              ?selected=${this.selectedColor === item.color}
              @swatch-select=${(e: CustomEvent<{ color: string }>) => this.handleSelect(e.detail.color)}
            ></ui-swatch>
          `)}
        </div>
      </div>

      <div class="swatch-row">
        <span class="swatch-row-label">Pastel</span>
        <div class="swatch-row-swatches" role="group" aria-label="Pastel colors">
          ${PASTEL_COLORS.map((color) => html`
            <ui-swatch
              color=${color}
              label=${color}
              ?selected=${this.selectedColor === color}
              @swatch-select=${(e: CustomEvent<{ color: string }>) => this.handleSelect(e.detail.color)}
            ></ui-swatch>
          `)}
        </div>
      </div>

      <div class="custom-color-wrapper">
        <label class="custom-color-label" for="customColorInput">Custom color</label>
        <input
          id="customColorInput"
          class="custom-color-input"
          type="text"
          .value=${this.customValue}
          placeholder="#FAD2E1 or lightblue"
          autocomplete="off"
          @keydown=${this.handleKeydown}
          @blur=${this.applyCustomColor}
        />
        <p class="custom-color-help">
          Tip: use any CSS color value, like <code>#FAD2E1</code>, <code>rgb(252 223 235)</code>, or <code>lavender</code>.
        </p>
      </div>
    `
  }

  private handleSelect(color: string): void {
    this.customValue = color === 'transparent' ? '' : color
    this.emitChange(color)
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.applyCustomColor()
    }
  }

  private applyCustomColor(): void {
    const raw = this.customValue.trim()
    if (!raw) {
      this.emitError('Enter a color value, for example #FAD2E1.')
      return
    }

    if (raw.toLowerCase() === 'transparent') {
      this.emitChange('transparent')
      return
    }

    if (!isCssColor(raw)) {
      this.emitError('Color not recognized. Use #hex, rgb(), hsl(), or a CSS color name.')
      return
    }

    this.emitChange(raw)
  }

  private emitChange(color: string): void {
    this.selectedColor = color
    this.dispatchEvent(
      new CustomEvent<{ color: string }>('background-change', {
        detail: { color },
        bubbles: true,
        composed: true
      })
    )
    this.dispatchEvent(new CustomEvent('clear-background-error', { bubbles: true, composed: true }))
  }

  private emitError(message: string): void {
    this.dispatchEvent(
      new CustomEvent<{ message: string }>('background-error', {
        detail: { message },
        bubbles: true,
        composed: true
      })
    )
  }
}

function isCssColor(value: string): boolean {
  return typeof CSS !== 'undefined' && CSS.supports('color', value)
}

declare global {
  interface HTMLElementTagNameMap {
    'background-panel': BackgroundPanel
  }
}
