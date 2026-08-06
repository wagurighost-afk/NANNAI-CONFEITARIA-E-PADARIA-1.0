const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'electron',
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
})
