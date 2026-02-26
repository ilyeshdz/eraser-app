import { css } from 'lit'

export const designTokens = css`
  :host {
    --ds-surface: var(--surface-base, #f8f9fc);
    --ds-surface-muted: var(--surface-subtle, #eef1f6);
    --ds-text: var(--text-primary, #1a1f36);
    --ds-text-muted: var(--text-secondary, #5e6578);
    --ds-border: var(--border, #e2e6ef);
    --ds-border-strong: var(--border-strong, #c5cdd8);
    --ds-primary: var(--accent, #3b6af5);
    --ds-primary-hover: var(--accent-hover, #2d56cc);
    --ds-on-primary: var(--on-accent, #ffffff);
    --ds-overlay: var(--overlay, rgba(10, 15, 30, 0.5));
    --ds-error-bg: var(--error-bg, #fef2f2);
    --ds-error-border: var(--error-border, #fecaca);
    --ds-error-text: var(--error-text, #dc2626);
    --ds-info-bg: var(--info-bg, #eff6ff);
    --ds-info-border: var(--info-border, #bfdbfe);
    --ds-info-text: var(--info-text, #2563eb);
    --ds-warning-bg: var(--warning-bg, #e8ba2f);
    --ds-warning-border: var(--warning-border, #e8ba2f);
    --ds-warning-text: var(--warning-text, #4c4c4c);
    --ds-checker-a: var(--checker-a, #eef1f6);
    --ds-checker-b: var(--checker-b, #dde3ed);
    --ds-radius-sm: var(--radius-sm, 8px);
    --ds-radius-md: var(--radius-md, 12px);
    --ds-shadow: var(--shadow, 0 4px 16px rgba(26, 31, 54, 0.08));
  }
`

export function defineComponent(tagName: string, ctor: CustomElementConstructor): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ctor)
  }
}
