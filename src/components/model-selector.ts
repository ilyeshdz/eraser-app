import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { MODELS, type ModelType, isWebGPUAvailable } from '../services/background-removal.service'

@customElement('model-selector')
export class ModelSelector extends LitElement {
  static override styles = [
    css`
      :host {
        display: block;
      }

      .selector {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .selector-label {
        font-size: 0.8rem;
        color: var(--text-secondary, #5e6578);
      }

      .options {
        display: flex;
        gap: 0.5rem;
        align-items: stretch;
      }

      .option {
        flex: 1;
        position: relative;
        display: flex;
      }

      .option input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .option-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.75rem 0.5rem;
        border: 1.5px solid var(--border, #e2e6ef);
        border-radius: var(--radius-sm, 8px);
        background: var(--surface-subtle, #eef1f6);
        cursor: pointer;
        transition: border-color 160ms ease, background 160ms ease;
        text-align: center;
        width: 100%;
        justify-content: center;
      }

      .option-card:hover {
        border-color: var(--accent, #3b6af5);
        background: var(--surface-raised, #ffffff);
      }

      .option input:checked + .option-card {
        border-color: var(--accent, #3b6af5);
        background: var(--surface-raised, #ffffff);
      }

      .option-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-primary, #1a1f36);
      }

      .option-desc {
        font-size: 0.7rem;
        color: var(--text-muted, #8f95a8);
        margin-top: 2px;
      }

      .option-badge {
        font-size: 0.6rem;
        padding: 1px 4px;
        border-radius: 4px;
        background: var(--accent, #3b6af5);
        color: white;
        margin-bottom: 2px;
      }

      .option input:focus-visible + .option-card {
        outline: 2px solid var(--accent, #3b6af5);
        outline-offset: 2px;
      }
    `
  ]

  @property({ type: String, reflect: true }) declare selectedModel: ModelType
  @property({ type: Boolean, reflect: true }) declare disabled: boolean
  @state() private declare loadingStatus: string

  constructor() {
    super()
    this.selectedModel = 'rmbg'
    this.disabled = false
    this.loadingStatus = ''
  }

  override render() {
    const webGpuAvailable = isWebGPUAvailable()

    return html`
      <div class="selector">
        <span class="selector-label">AI Model</span>
        <div class="options">
          ${Object.values(MODELS).map(model => html`
            <label class="option">
              <input
                type="radio"
                name="model"
                value=${model.id}
                ?checked=${this.selectedModel === model.id}
                ?disabled=${this.disabled || (model.id === 'modnet' && !webGpuAvailable)}
                @change=${this.handleChange}
              />
              <div class="option-card">
                ${model.id === 'rmbg' ? html`<span class="option-badge">Default</span>` : ''}
                <span class="option-name">${model.name}</span>
                <span class="option-desc">
                  ${model.id === 'modnet' && !webGpuAvailable 
                    ? 'Requires WebGPU' 
                    : model.description}
                </span>
              </div>
            </label>
          `)}
        </div>
      </div>
    `
  }

  private handleChange(event: Event) {
    const target = event.target as HTMLInputElement
    this.selectedModel = target.value as ModelType
    this.dispatchEvent(new CustomEvent('model-change', {
      detail: { model: this.selectedModel },
      bubbles: true,
      composed: true
    }))
  }
}

export {}
