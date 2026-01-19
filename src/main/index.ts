import { app, shell, BrowserWindow } from 'electron'
import path from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import { setupIPC } from './ipc'

function createWindow(): void {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        frame: false, // Frameless for custom titlebar
        autoHideMenuBar: true,
        backgroundColor: '#1a1b26', // Match theme
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    setupIPC(mainWindow);

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    const remoteUrl = process.env['ELECTRON_RENDERER_URL'] || process.env['VITE_DEV_SERVER_URL']

    console.log('Remote URL:', remoteUrl);

    if (is.dev && remoteUrl) {
        mainWindow.loadURL(remoteUrl)
    } else {
        // In production, files are in app.asar
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.openmoba.app')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
