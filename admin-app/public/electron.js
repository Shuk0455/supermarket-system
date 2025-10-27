// Electron main process for production build created by react-cra preset.
// It will live in build/ after CRA build (public/electron.js -> build/electron.js).
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { contextIsolation: true }
  });

  // In packaged app, this file sits next to index.html inside build/
  const indexPath = path.join(__dirname, "index.html");
  win.loadURL(`file://${indexPath}`);

  // win.webContents.openDevTools(); // enable if needed
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
