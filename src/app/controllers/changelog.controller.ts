import type { ReactiveController, ReactiveControllerHost } from 'lit'
import type { AppStore } from '../state/app-store'
import type { ChangelogItem, ChangelogSection } from '../../components/modal'
import { getChangelogVersion, saveChangelogVersion } from '../../services/preferences.service'

export const CURRENT_VERSION = '1.0.0'

export const CHANGELOG_ITEMS: ChangelogItem[] = [
  {
    version: '1.0.0',
    date: '2026-02-26',
    items: [
      {
        title: 'Features',
        entries: [
          'Real-time processing progress with status updates',
          'Changelog popup to discover new features',
          'Smart dropdown positioning (opens upward when needed)'
        ]
      },
      {
        title: 'Fix',
        entries: [
          'Brighter image preview (fixed transparency display)',
          'Safari/Firefox compatibility issues when loading AI models'
        ]
      }
    ] as ChangelogSection[]
  }
]

export class ChangelogController implements ReactiveController {
  private store: AppStore

  constructor(host: ReactiveControllerHost, store: AppStore) {
    this.store = store
    host.addController(this)
  }

  hostConnected(): void {
    const seen = getChangelogVersion()
    if (seen !== CURRENT_VERSION) {
      this.store.update({ showChangelog: true })
    }
  }

  markSeen(): void {
    saveChangelogVersion(CURRENT_VERSION)
    this.store.update({ showChangelog: false })
  }
}
