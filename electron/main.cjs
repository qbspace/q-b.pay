const { app, BrowserWindow, shell, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('node:path')
const packageJson = require('../package.json')

const devServerUrl = process.env.VITE_DEV_SERVER_URL

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

let installAfterDownload = false
let lastManualUpdate = null

function getConfiguredGitHubRepo() {
  const envRepo = process.env.GITHUB_REPOSITORY
  const envOwner = process.env.VITE_GITHUB_OWNER || process.env.GITHUB_OWNER
  const envName = process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO

  if (envRepo && envRepo.includes('/')) {
    const [owner, repo] = envRepo.split('/')
    return { owner, repo }
  }

  if (envOwner && envName) {
    return { owner: envOwner, repo: envName }
  }

  const repository = packageJson.repository
  const repositoryUrl = typeof repository === 'string' ? repository : repository?.url
  const match = repositoryUrl?.match(/github\.com[:/](?<owner>[^/]+)\/(?<repo>[^#?]+?)(?:\.git)?(?:[#?].*)?$/i)

  if (!match?.groups) {
    return null
  }

  return {
    owner: match.groups.owner,
    repo: match.groups.repo,
  }
}

function parseVersion(version) {
  return String(version || '0.0.0')
    .replace(/^v/i, '')
    .split(/[.-]/)
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0))
}

function isVersionGreater(latestVersion, currentVersion) {
  const latestParts = parseVersion(latestVersion)
  const currentParts = parseVersion(currentVersion)
  const length = Math.max(latestParts.length, currentParts.length)

  for (let index = 0; index < length; index += 1) {
    const latestPart = latestParts[index] || 0
    const currentPart = currentParts[index] || 0

    if (latestPart > currentPart) {
      return true
    }

    if (latestPart < currentPart) {
      return false
    }
  }

  return false
}

function getAssetDownloadUrl(release) {
  const assets = Array.isArray(release.assets) ? release.assets : []
  const extensionsByPlatform = {
    win32: ['.exe', '.msi', '.zip'],
    darwin: ['.dmg', '.zip'],
    linux: ['.appimage', '.deb', '.rpm', '.tar.gz', '.zip'],
  }
  const preferredExtensions = extensionsByPlatform[process.platform] || ['.zip']
  const ignoredExtensions = ['.blockmap', '.yml', '.yaml']

  const asset = assets.find((item) => {
    const name = String(item.name || '').toLowerCase()

    return (
      preferredExtensions.some((extension) => name.endsWith(extension)) &&
      !ignoredExtensions.some((extension) => name.endsWith(extension))
    )
  })

  return asset?.browser_download_url || release.html_url
}

function sendUpdateStatus(status) {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('updates:status', status)
  })
}

function getReleaseUrl(version) {
  const repo = getConfiguredGitHubRepo()

  if (!repo || !version) {
    return undefined
  }

  return `https://github.com/${repo.owner}/${repo.repo}/releases/tag/v${String(version).replace(/^v/i, '')}`
}

function toAvailableUpdate(version, releaseName, releaseUrl, downloadUrl, canAutoInstall) {
  return {
    status: 'available',
    currentVersion: app.getVersion(),
    latestVersion: String(version).replace(/^v/i, ''),
    releaseName: releaseName || `v${String(version).replace(/^v/i, '')}`,
    releaseUrl: releaseUrl || getReleaseUrl(version),
    downloadUrl: downloadUrl || releaseUrl || getReleaseUrl(version),
    canAutoInstall,
  }
}

async function checkGitHubReleaseForUpdates() {
  const repo = getConfiguredGitHubRepo()
  const currentVersion = app.getVersion()

  if (!repo) {
    return {
      status: 'unconfigured',
      currentVersion,
      message: 'GitHub repository is not configured.',
    }
  }

  const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/releases/latest`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': `${app.getName()}-${currentVersion}`,
    },
  })

  if (response.status === 404) {
    return {
      status: 'no-release',
      currentVersion,
      message: 'Latest GitHub release was not found.',
    }
  }

  if (!response.ok) {
    return {
      status: 'error',
      currentVersion,
      message: `GitHub responded with ${response.status}.`,
    }
  }

  const release = await response.json()
  const latestVersion = String(release.tag_name || release.name || '').replace(/^v/i, '')

  if (!latestVersion || !isVersionGreater(latestVersion, currentVersion)) {
    return {
      status: 'current',
      currentVersion,
      latestVersion: latestVersion || currentVersion,
    }
  }

  lastManualUpdate = toAvailableUpdate(
    latestVersion,
    release.name || `v${latestVersion}`,
    release.html_url,
    getAssetDownloadUrl(release),
    false,
  )

  return lastManualUpdate
}

async function checkForUpdates() {
  if (!app.isPackaged) {
    return checkGitHubReleaseForUpdates()
  }

  const result = await autoUpdater.checkForUpdates()
  const version = result?.updateInfo?.version

  if (!version || !isVersionGreater(version, app.getVersion())) {
    return {
      status: 'current',
      currentVersion: app.getVersion(),
      latestVersion: version || app.getVersion(),
    }
  }

  return toAvailableUpdate(
    version,
    result.updateInfo.releaseName,
    getReleaseUrl(version),
    undefined,
    true,
  )
}

async function downloadAndInstallUpdate() {
  if (!app.isPackaged) {
    if (lastManualUpdate?.downloadUrl) {
      await shell.openExternal(lastManualUpdate.downloadUrl)

      return {
        status: 'manual-opened',
        currentVersion: app.getVersion(),
        latestVersion: lastManualUpdate.latestVersion,
        message: 'Dev mode cannot install updates automatically.',
      }
    }

    return {
      status: 'error',
      currentVersion: app.getVersion(),
      message: 'Automatic updates work only in the packaged app.',
    }
  }

  installAfterDownload = true
  sendUpdateStatus({
    status: 'downloading',
    currentVersion: app.getVersion(),
    percent: 0,
  })

  await autoUpdater.downloadUpdate()

  return {
    status: 'downloading',
    currentVersion: app.getVersion(),
    message: 'Update download started.',
  }
}

autoUpdater.on('update-available', (info) => {
  sendUpdateStatus(toAvailableUpdate(info.version, info.releaseName, getReleaseUrl(info.version), undefined, true))
})

autoUpdater.on('update-not-available', (info) => {
  sendUpdateStatus({
    status: 'current',
    currentVersion: app.getVersion(),
    latestVersion: info.version || app.getVersion(),
  })
})

autoUpdater.on('download-progress', (progress) => {
  sendUpdateStatus({
    status: 'downloading',
    currentVersion: app.getVersion(),
    percent: Math.round(progress.percent || 0),
  })
})

autoUpdater.on('update-downloaded', (info) => {
  sendUpdateStatus({
    status: 'installing',
    currentVersion: app.getVersion(),
    latestVersion: info.version,
  })

  if (installAfterDownload) {
    setTimeout(() => {
      autoUpdater.quitAndInstall(false, true)
    }, 900)
  }
})

autoUpdater.on('error', (error) => {
  sendUpdateStatus({
    status: 'error',
    currentVersion: app.getVersion(),
    message: error instanceof Error ? error.message : 'Failed to update application.',
  })
})

function createWindow() {
  const windowIcon = devServerUrl
    ? path.join(__dirname, '../public/iconka.png')
    : path.join(__dirname, '../dist/iconka.png')

  const mainWindow = new BrowserWindow({
    width: 1320,
    height: 760,
    minWidth: 1250,
    minHeight: 670,
    title: 'oplata.dev',
    icon: windowIcon,
    backgroundColor: '#0e0e0e',
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
    return
  }

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

ipcMain.on('window:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})

ipcMain.on('window:maximize-toggle', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)

  if (!window) {
    return
  }

  if (window.isMaximized()) {
    window.unmaximize()
    return
  }

  window.maximize()
})

ipcMain.on('window:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})

ipcMain.handle('updates:check', async () => {
  try {
    return await checkForUpdates()
  } catch (error) {
    return {
      status: 'error',
      currentVersion: app.getVersion(),
      message: error instanceof Error ? error.message : 'Failed to check for updates.',
    }
  }
})

ipcMain.handle('updates:download-and-install', async () => {
  try {
    return await downloadAndInstallUpdate()
  } catch (error) {
    return {
      status: 'error',
      currentVersion: app.getVersion(),
      message: error instanceof Error ? error.message : 'Failed to download update.',
    }
  }
})

ipcMain.handle('updates:open', async (_event, url) => {
  if (typeof url !== 'string' || !/^https:\/\/github\.com\//i.test(url)) {
    return false
  }

  await shell.openExternal(url)
  return true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
