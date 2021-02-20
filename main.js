const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');
const path = require('path');

Menu.setApplicationMenu(null);

let tray;

function boot(){
    const win = new BrowserWindow({
        width: 400,
        height: 550,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadFile('./renderer/index.html');
    win.webContents.on('did-finish-load', () => win.show());

    win.on('close', function (event) {
        if (!app.isQuitting){
            event.preventDefault();
            win.hide();
        }
        return false;
    });

    const contextMenu = Menu.buildFromTemplate(
        [
            { 
                label: 'Quit', 
                click:  function(){
                    app.isQuitting = true;
                    app.quit();
                } 
            },
            {
                label: 'Show Devtools',
                click: () => {
                    win.webContents.openDevTools();
                }
            }
        ]
    );

    tray = new Tray(path.join(app.getAppPath(),'./imgs/tray.png'));
    tray.setToolTip('Right click for options');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => win.show());

    ipcMain.on('ping', () => {
        if (!win.isFocused()){
            win.flashFrame(true);
            tray.setImage(path.join(app.getAppPath(), './imgs/notif.png'));

            win.on('focus', () => {
                win.flashFrame(false);
                tray.setImage(path.join(app.getAppPath(), './imgs/tray.png'));
            });
        };
    });
};

app.on('ready', boot);
app.on('before-quit', () => tray.destroy());