const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.send('window:maximize-toggle'),
  closeWindow: () => ipcRenderer.send('window:close'),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  downloadAndInstallUpdate: () => ipcRenderer.invoke('updates:download-and-install'),
  openUpdate: (url) => ipcRenderer.invoke('updates:open', url),
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status)

    ipcRenderer.on('updates:status', listener)

    return () => {
      ipcRenderer.removeListener('updates:status', listener)
    }
  },
})
