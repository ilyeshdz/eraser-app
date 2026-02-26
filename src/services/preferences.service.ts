import type { ThemeMode } from '../app/state/app-store'
import type { ModelType } from './background-removal.service'

const THEME_STORAGE_KEY = 'eraser:theme'
const MODEL_STORAGE_KEY = 'eraser:model'
const CHANGELOG_VERSION_KEY = 'eraser:version'

export function detectPreferredTheme(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') {
    return stored
  }
  return detectPreferredTheme()
}

export function saveTheme(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode)
}

export function getInitialModel(): ModelType {
  const stored = localStorage.getItem(MODEL_STORAGE_KEY)
  if (stored === 'rmbg' || stored === 'modnet') {
    return stored
  }
  return 'rmbg'
}

export function saveModel(model: ModelType): void {
  localStorage.setItem(MODEL_STORAGE_KEY, model)
}

export function getChangelogVersion(): string | null {
  return localStorage.getItem(CHANGELOG_VERSION_KEY)
}

export function saveChangelogVersion(version: string): void {
  localStorage.setItem(CHANGELOG_VERSION_KEY, version)
}
