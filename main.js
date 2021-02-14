const { app, BrowserWindow,Menu } = require('electron');

Menu.setApplicationMenu(null);

function boot(){
    const win = new BrowserWindow({
        width: 400,
        height: 450,
        minimizable: false,
        maximizable: false,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadFile('./renderer/index.html');
    win.webContents.on('did-finish-load', () => win.show());

    win.webContents.openDevTools();
};

app.on('ready', boot);