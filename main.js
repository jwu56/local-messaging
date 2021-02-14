const { app, BrowserWindow, Menu, Tray} = require('electron');
const path = require('path');

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
    win.loadFile(path.join(__dirname,'./renderer/index.html'));
    win.webContents.on('did-finish-load', () => win.show());

    win.webContents.openDevTools();

    win.on('close', function (event) {
        if (!app.isQuitting){
            event.preventDefault();
            win.hide();
        }
        return false;
    });

    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Quit', 
            click:  function(){
                app.isQuitting = true;
                app.quit();
            } 
        }
    ]);

    tray = new Tray(path.join(__dirname,'./imgs/icon.png'));
    tray.setToolTip('Right click for options');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => win.show())
};

app.on('ready', boot);