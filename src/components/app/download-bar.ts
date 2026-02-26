import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { designTokens } from '../base'
import type { OutputFormat } from '../../app/state/app-store'

@customElement('download-bar')
export class DownloadBar extends LitElement {
  static override styles = [
    designTokens,
    css`
      :host {
        display: block;
        width: 100%;
      }

      .actionbar {
        width: min(360px, 100%);
        margin: 0 auto;
      }
    `
  ]

  @property({ type: String }) declare format: OutputFormat
  @property({ type: Array }) declare options: OutputFormat[]

  constructor() {
    super()
    this.format = 'png'
    this.options = ['png', 'jpg', 'webp']
  }

  override render() {
    const label = `Download ${this.format.toUpperCase()}`
    return html`
      <div class="actionbar">
        <ui-split-button
          id="downloadSplit"
          label=${label}
          .value=${this.format}
          .options=${this.options.join(',')}
          @split-main-click=${this.handleMainClick}
          @split-option-select=${this.handleOptionSelect}
        ></ui-split-button>
      </div>
    `
  }

  private handleMainClick(): void {
    this.dispatchEvent(new CustomEvent('download-main', { bubbles: true, composed: true }))
  }

  private handleOptionSelect(event: CustomEvent<{ value: string }>): void {
    const value = event.detail.value as OutputFormat
    this.dispatchEvent(
      new CustomEvent<{ format: OutputFormat }>('download-format-change', {
        detail: { format: value },
        bubbles: true,
        composed: true
      })
    )
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'download-bar': DownloadBar
  }
}
