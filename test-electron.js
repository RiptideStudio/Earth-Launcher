const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    x: 100,
    y: 100,
    show: true
  });
  win.loadURL('https://example.com');
  win.show();
  win.focus();
  win.setAlwaysOnTop(true);
  setTimeout(() => win.setAlwaysOnTop(false), 2000);
});