import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { designTokens } from './base'

export interface ChangelogSection {
  title: string
  entries: string[]
}

export interface ChangelogItem {
  version: string
  date: string
  items: string[] | ChangelogSection[]
}

@customElement('ui-modal')
export class UIModal extends LitElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
    heading: { type: String },
    description: { type: String },
    confirmLabel: { type: String, attribute: 'confirm-label' },
    cancelLabel: { type: String, attribute: 'cancel-label' },
    changelogItems: { type: Array }
  }

  static override styles = [
    designTokens,
    css`
      :host {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 30;
      }

      :host([open]) {
        display: flex;
      }

      .overlay {
        position: absolute;
        inset: 0;
        background: var(--ds-overlay);
      }

      .card {
        position: relative;
        width: min(460px, 92vw);
        border-radius: var(--ds-radius-md);
        border: 1px solid var(--ds-border);
        background: var(--ds-surface);
        box-shadow: var(--ds-shadow);
        padding: 16px;
        z-index: 1;
      }

      h2 {
        margin: 0;
        font-size: 1.06rem;
        color: var(--ds-text);
      }

      p {
        margin: 8px 0 0;
        color: var(--ds-text-muted);
        font-size: 0.92rem;
      }

      .actions {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      button {
        min-height: 40px;
        border-radius: var(--ds-radius-sm);
        padding: 0 12px;
        font: inherit;
        cursor: pointer;
      }

      .cancel {
        border: 1px solid var(--ds-border);
        background: var(--ds-surface);
        color: var(--ds-text);
      }

      .confirm {
        border: 1px solid var(--ds-primary);
        background: var(--ds-primary);
        color: var(--ds-on-primary);
        font-weight: 560;
      }

      .confirm:hover,
      .cancel:hover {
        filter: brightness(1.03);
      }

      .cancel:focus-visible,
      .confirm:focus-visible {
        outline: 2px solid var(--ds-primary);
        outline-offset: 2px;
      }

      .changelog {
        max-height: 300px;
        overflow-y: auto;
        margin-top: 8px;
        padding-right: 8px;
      }

      .changelog-version {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .changelog-version-badge {
        background: var(--ds-primary);
        color: var(--ds-on-primary);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .changelog-version-date {
        color: var(--ds-text-muted);
        font-size: 0.8rem;
      }

      .changelog-items {
        list-style: none;
        padding: 0;
        margin: 0 0 16px;
      }

      .changelog-items li {
        position: relative;
        padding-left: 16px;
        margin: 6px 0;
        color: var(--ds-text-muted);
        font-size: 0.88rem;
        line-height: 1.4;
      }

      .changelog-items li::before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--ds-primary);
      }

      .changelog-section {
        margin-bottom: 12px;
      }

      .changelog-section-title {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--ds-text-primary);
        margin: 12px 0 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    `
  ]

  declare open: boolean
  declare heading: string
  declare description: string
  declare confirmLabel: string
  declare cancelLabel: string
  declare changelogItems: ChangelogItem[]

  constructor() {
    super()
    this.open = false
    this.heading = ''
    this.description = ''
    this.confirmLabel = 'Confirm'
    this.cancelLabel = 'Cancel'
    this.changelogItems = []
  }

  override render() {
    const isChangelog = this.changelogItems && this.changelogItems.length > 0

    return html`
      <div class="overlay" @click=${this.handleCancel}></div>
      <section class="card" role="dialog" aria-modal="true" aria-label=${this.heading || 'Dialog'}>
        <h2>${this.heading}</h2>
        ${isChangelog ? this.renderChangelog() : html`<p>${this.description}</p>`}
        <div class="actions">
          ${!isChangelog ? html`<button class="cancel" type="button" @click=${this.handleCancel}>${this.cancelLabel}</button>` : ''}
          <button class="confirm" type="button" @click=${this.handleConfirm}>${this.confirmLabel}</button>
        </div>
      </section>
    `
  }

  private renderChangelog() {
    return html`
      <div class="changelog">
        ${this.changelogItems?.map(
          (item) => html`
            <div class="changelog-version">
              <span class="changelog-version-badge">v${item.version}</span>
              <span class="changelog-version-date">${item.date}</span>
            </div>
            ${this.renderChangelogItems(item.items)}
          `
        )}
      </div>
    `
  }

  private renderChangelogItems(items: string[] | ChangelogSection[]) {
    const hasSections = items.length > 0 && typeof items[0] === 'object' && 'title' in items[0]
    
    if (hasSections) {
      return html`
        ${(items as ChangelogSection[]).map(
          (section) => html`
            <div class="changelog-section">
              <h4 class="changelog-section-title">${section.title}</h4>
              <ul class="changelog-items">
                ${section.entries.map((entry) => html`<li>${entry}</li>`)}
              </ul>
            </div>
          `
        )}
      `
    }
    
    return html`
      <ul class="changelog-items">
        ${(items as string[]).map((i) => html`<li>${i}</li>`)}
      </ul>
    `
  }

  private handleCancel(): void {
    this.dispatchEvent(
      new CustomEvent('modal-cancel', {
        bubbles: true,
        composed: true
      })
    )
  }

  private handleConfirm(): void {
    this.dispatchEvent(
      new CustomEvent('modal-confirm', {
        bubbles: true,
        composed: true
      })
    )
  }
}

export {}
