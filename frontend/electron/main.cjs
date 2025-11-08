const { app, BrowserWindow, session, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const axios = require('axios')

let windows = []
const API_URL = 'http://localhost:8000'

// Store loaded extensions
const loadedExtensions = new Map()

// Disable hardware acceleration to prevent black screen issues
app.disableHardwareAcceleration()

function createWindow() {
  const newWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    show: false, // Don't show until ready
    title: 'Lernova',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false,
      sandbox: false,
      devTools: true
    },
    icon: path.join(__dirname, '../public/icon.png')
  })

  // Add to windows array
  windows.push(newWindow)

  // Show window when ready to prevent white/black flash
  newWindow.once('ready-to-show', () => {
    newWindow.show()
  })

  // Load the app
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  
  if (isDev) {
    newWindow.loadURL('http://localhost:5173')
    // Comment out to disable auto-opening DevTools (reduces console noise)
    // newWindow.webContents.openDevTools()
  } else {
    newWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Handle navigation
  newWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
    if (isDev) {
      // Retry in dev mode
      setTimeout(() => {
        newWindow.loadURL('http://localhost:5173')
      }, 1000)
    }
  })

  // Handle new window requests from webview
  newWindow.webContents.on('did-attach-webview', (event, webContents) => {
    // Enable DevTools for webview debugging
    webContents.openDevTools()
    
    // Handle new window requests from the webview
    webContents.setWindowOpenHandler(({ url }) => {
      console.log('New window requested for URL:', url)
      // Open in a new application window
      createWindow()
      return { action: 'deny' }
    })

    // Add context menu to webview
    webContents.on('context-menu', (e, params) => {
      const { Menu, MenuItem } = require('electron')
      const menu = new Menu()

      // Add "Inspect Element" option
      menu.append(new MenuItem({
        label: 'Inspect Element',
        click: () => {
          webContents.inspectElement(params.x, params.y)
        }
      }))

      // If text is selected, add "Ask AI Chat" option
      if (params.selectionText) {
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(new MenuItem({
          label: 'Ask AI Chat',
          click: () => {
            // Send selected text to main window
            newWindow.webContents.send('ask-ai-with-selection', params.selectionText)
          }
        }))
        menu.append(new MenuItem({
          label: 'Copy',
          role: 'copy'
        }))
      }

      // Add standard context menu items
      if (params.linkURL) {
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(new MenuItem({
          label: 'Open Link in New Tab',
          click: () => {
            newWindow.webContents.send('open-link-new-tab', params.linkURL)
          }
        }))
        menu.append(new MenuItem({
          label: 'Copy Link Address',
          click: () => {
            require('electron').clipboard.writeText(params.linkURL)
          }
        }))
      }

      if (params.mediaType === 'image') {
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(new MenuItem({
          label: 'Save Image As...',
          click: () => {
            webContents.downloadURL(params.srcURL)
          }
        }))
        menu.append(new MenuItem({
          label: 'Copy Image',
          click: () => {
            webContents.copyImageAt(params.x, params.y)
          }
        }))
      }

      // Navigation items
      menu.append(new MenuItem({ type: 'separator' }))
      menu.append(new MenuItem({
        label: 'Back',
        enabled: webContents.canGoBack(),
        click: () => webContents.goBack()
      }))
      menu.append(new MenuItem({
        label: 'Forward',
        enabled: webContents.canGoForward(),
        click: () => webContents.goForward()
      }))
      menu.append(new MenuItem({
        label: 'Reload',
        click: () => webContents.reload()
      }))

      menu.popup()
    })
  })

  newWindow.on('closed', () => {
    // Remove from windows array
    windows = windows.filter(w => w !== newWindow)
  })
  newWindow.webContents.openDevTools();

  return newWindow
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Handle downloads
app.whenReady().then(() => {
  session.defaultSession.on('will-download', async (event, item, webContents) => {
    const filename = item.getFilename()
    const url = item.getURL()
    const totalBytes = item.getTotalBytes()
    
    // Create download entry in database
    try {
      const response = await axios.post(`${API_URL}/api/downloads`, {
        filename: filename,
        url: url,
        file_size: totalBytes,
        mime_type: item.getMimeType(),
        save_path: item.getSavePath()
      })
      
      const downloadId = response.data.download_id
      
      // Update progress
      item.on('updated', async (event, state) => {
        if (state === 'progressing') {
          const progress = (item.getReceivedBytes() / totalBytes) * 100
          await axios.put(`${API_URL}/api/downloads/${downloadId}`, {
            progress: progress,
            downloaded_bytes: item.getReceivedBytes(),
            status: 'in_progress'
          })
        }
      })
      
      // Handle completion
      item.once('done', async (event, state) => {
        if (state === 'completed') {
          await axios.put(`${API_URL}/api/downloads/${downloadId}`, {
            status: 'completed',
            progress: 100,
            downloaded_bytes: totalBytes
          })
        } else if (state === 'cancelled') {
          await axios.put(`${API_URL}/api/downloads/${downloadId}`, {
            status: 'cancelled'
          })
        } else if (state === 'interrupted') {
          await axios.put(`${API_URL}/api/downloads/${downloadId}`, {
            status: 'failed',
            error_message: 'Download interrupted'
          })
        }
      })
    } catch (error) {
      console.error('Error tracking download:', error)
    }
  })
})

// Extension Management IPC Handlers
ipcMain.handle('get-extensions', async () => {
  try {
    const extensions = []
    for (const [id, ext] of loadedExtensions.entries()) {
      extensions.push({
        id: id,
        name: ext.name || 'Unknown Extension',
        version: ext.version || '1.0.0',
        description: ext.description || '',
        enabled: ext.enabled !== false,
        icon: ext.icon || null,
        permissions: ext.permissions || []
      })
    }
    return extensions
  } catch (error) {
    console.error('Error getting extensions:', error)
    return []
  }
})

ipcMain.handle('install-extension', async () => {
  try {
    // Open dialog to select extension folder
    const result = await dialog.showOpenDialog({
      title: 'Select Extension Folder',
      properties: ['openDirectory'],
      message: 'Select an unpacked Chrome extension folder'
    })

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, error: 'Installation cancelled' }
    }

    const extensionPath = result.filePaths[0]

    // Read manifest.json
    const manifestPath = path.join(extensionPath, 'manifest.json')
    if (!fs.existsSync(manifestPath)) {
      return { success: false, error: 'Invalid extension: manifest.json not found' }
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    
    // Load the extension
    try {
      const extensionId = await session.defaultSession.loadExtension(extensionPath, {
        allowFileAccess: true
      })
      
      // Store extension info
      loadedExtensions.set(extensionId, {
        id: extensionId,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description || '',
        path: extensionPath,
        enabled: true,
        icon: manifest.icons ? manifest.icons['128'] || manifest.icons['48'] || manifest.icons['16'] : null,
        permissions: manifest.permissions || []
      })

      console.log('Extension loaded:', manifest.name, 'ID:', extensionId)
      return { success: true, extensionId }
    } catch (err) {
      console.error('Error loading extension:', err)
      return { success: false, error: err.message }
    }
  } catch (error) {
    console.error('Error installing extension:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('remove-extension', async (event, extensionId) => {
  try {
    if (!loadedExtensions.has(extensionId)) {
      return { success: false, error: 'Extension not found' }
    }

    // Remove the extension
    await session.defaultSession.removeExtension(extensionId)
    loadedExtensions.delete(extensionId)

    console.log('Extension removed:', extensionId)
    return { success: true }
  } catch (error) {
    console.error('Error removing extension:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('toggle-extension', async (event, extensionId, enabled) => {
  try {
    const ext = loadedExtensions.get(extensionId)
    if (!ext) {
      return { success: false, error: 'Extension not found' }
    }

    if (enabled) {
      // Re-enable by reloading
      await session.defaultSession.loadExtension(ext.path, {
        allowFileAccess: true
      })
      ext.enabled = true
    } else {
      // Disable by removing
      await session.defaultSession.removeExtension(extensionId)
      ext.enabled = false
    }

    console.log('Extension toggled:', extensionId, enabled)
    return { success: true }
  } catch (error) {
    console.error('Error toggling extension:', error)
    return { success: false, error: error.message }
  }
})
