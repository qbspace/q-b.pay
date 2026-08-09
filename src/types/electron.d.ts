export {}

type UpdateCheckResult =
  | {
      status: 'available'
      currentVersion: string
      latestVersion: string
      releaseName: string
      releaseUrl?: string
      downloadUrl?: string
      canAutoInstall: boolean
    }
  | {
      status: 'current'
      currentVersion: string
      latestVersion: string
    }
  | {
      status: 'unconfigured' | 'no-release' | 'error' | 'manual-opened' | 'downloading' | 'installing'
      currentVersion: string
      latestVersion?: string
      percent?: number
      message?: string
    }

type UpdateStatus = UpdateCheckResult

declare global {
  interface Window {
    electronAPI?: {
      platform: string
      minimizeWindow: () => void
      toggleMaximizeWindow: () => void
      closeWindow: () => void
      checkForUpdates: () => Promise<UpdateCheckResult>
      downloadAndInstallUpdate: () => Promise<UpdateStatus>
      openUpdate: (url: string) => Promise<boolean>
      onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void
    }
  }
}
