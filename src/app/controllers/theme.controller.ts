import type { ReactiveController, ReactiveControllerHost } from 'lit'
import type { AppStore, ThemeMode } from '../state/app-store'
import { saveTheme } from '../../services/preferences.service'

export class ThemeController implements ReactiveController {
  private store: AppStore
  private unsubscribe?: () => void
  private lastTheme: ThemeMode | null = null

  constructor(host: ReactiveControllerHost, store: AppStore) {
    this.store = store
    host.addController(this)
  }

  hostConnected(): void {
    this.unsubscribe = this.store.subscribe((state) => {
      if (state.theme !== this.lastTheme) {
        this.lastTheme = state.theme
        this.applyTheme(state.theme)
        saveTheme(state.theme)
      }
    })
  }

  hostDisconnected(): void {
    this.unsubscribe?.()
  }

  setTheme(mode: ThemeMode): void {
    this.store.update({ theme: mode })
  }

  private applyTheme(mode: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', mode)
  }
}
