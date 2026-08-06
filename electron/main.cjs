const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')

const isDev = Boolean(process.env.ELECTRON_START_URL)

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    title: 'NANNAI — Food Operations Management System',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    void window.loadURL(process.env.ELECTRON_START_URL)
    window.webContents.openDevTools({ mode: 'detach' })
    return window
  }

  void window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  return window
}

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
