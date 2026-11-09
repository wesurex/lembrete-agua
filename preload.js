const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('agua', {
  drink: () => ipcRenderer.send('drink'),
  snooze: () => ipcRenderer.send('snooze'),
  pontoDone: () => ipcRenderer.send('ponto:done'),
  pontoSnooze: () => ipcRenderer.send('ponto:snooze'),
  testAlert: () => ipcRenderer.send('alert:test'),
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: cfg => ipcRenderer.invoke('config:save', cfg),
  getReport: () => ipcRenderer.invoke('report:get'),
  pickSound: () => ipcRenderer.invoke('sound:pick'),
  clearSound: () => ipcRenderer.invoke('sound:clear'),
  setLang: lang => ipcRenderer.invoke('lang:set', lang)
});
