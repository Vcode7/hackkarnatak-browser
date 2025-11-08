const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return mainWindow;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for communication with renderer
ipcMain.on('ask-ai-with-selection', (event, selectedText) => {
  // Forward to renderer
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    window.webContents.send('ask-ai-with-selection', selectedText);
  });
});

ipcMain.on('open-link-new-tab', (event, url) => {
  // Forward to renderer
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    window.webContents.send('open-link-new-tab', url);
  });
});

