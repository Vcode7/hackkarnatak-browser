const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isElectron: true,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  // Add any electron-specific APIs here
  // Example: send/receive messages
  send: (channel, data) => {
    const validChannels = ['toMain', 'open-ai-chat']
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  receive: (channel, func) => {
    const validChannels = ['fromMain', 'ask-ai-with-selection', 'open-link-new-tab']
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  },
  // One-time listener for IPC messages
  once: (channel, func) => {
    const validChannels = ['ask-ai-with-selection', 'open-link-new-tab']
    if (validChannels.includes(channel)) {
      ipcRenderer.once(channel, (event, ...args) => func(...args))
    }
  },
  // Extension management
  getExtensions: () => ipcRenderer.invoke('get-extensions'),
  installExtension: () => ipcRenderer.invoke('install-extension'),
  removeExtension: (extensionId) => ipcRenderer.invoke('remove-extension', extensionId),
  toggleExtension: (extensionId, enabled) => ipcRenderer.invoke('toggle-extension', extensionId, enabled)
})
