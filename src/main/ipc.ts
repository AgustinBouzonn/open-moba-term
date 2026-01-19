import { ipcMain, BrowserWindow, app } from 'electron';
import { Worker } from 'worker_threads';
import path from 'path';
import { is } from '@electron-toolkit/utils';
import { sessionStore } from './store';

let worker: Worker | null = null;

export function setupIPC(mainWindow: BrowserWindow): void {
    // We need a map for session ports
    const sessionPorts = new Map<string, Electron.MessagePortMain>();

    // Initialize Worker
    const workerPath = is.dev
        ? path.join(__dirname, '../dist-electron/worker.js') // In dev (vite) it builds to same output
        : path.join(__dirname, 'worker.js'); // In prod

    try {
        // Ensure worker exists before spawning?
        // Note: In dev mode, we might need a moment for vite to build it.
        // For now, assume it's built alongside main.

        worker = new Worker(workerPath);

        // Main Worker Message Handler
        worker.on('message', (msg) => {
            // console.log('[Main] Msg:', msg.type); 
            if (msg.type.startsWith('SFTP_') || msg.type.startsWith('VNC_') || msg.type.startsWith('RDP_')) {
                // console.log('[Main] Forwarding SFTP msg to renderer:', msg.type);
                mainWindow.webContents.send('sftp-data', msg);
            } else if (msg.type === 'SSH_DATA' || msg.type === 'SSH_ERROR' || msg.type === 'SSH_CLOSE' || msg.type.startsWith('SSH_')) {
                // Forward SSH data to the dedicated port if available
                const sessionId = msg.payload?.sessionId;
                if (sessionId && sessionPorts.has(sessionId)) {
                    sessionPorts.get(sessionId)?.postMessage(msg);
                } else {
                    // Fallback for legacy or if port missing
                    mainWindow.webContents.send('ssh-data', msg);
                }

                // Cleanup if closed
                if (msg.type === 'SSH_CLOSE' || msg.type === 'SSH_ERROR') {
                    const port = sessionPorts.get(sessionId);
                    if (port) {
                        try {
                            port.close();
                        } catch (e) {
                            console.error('Error closing port:', e);
                        }
                        sessionPorts.delete(sessionId);
                    }
                }
            } else {
                // Default handler for other messages
                mainWindow.webContents.send('ssh-data', msg);
            }
        });

        worker.on('error', (err) => {
            console.error('Worker error:', err);
        });

        worker.on('exit', (code) => {
            console.log(`Worker stopped with exit code ${code}`);
        });

        console.log('Worker spawned:', workerPath);

    } catch (e) {
        console.error('Failed to spawn worker:', e);
    }

    // IPC Handlers: Renderer -> Main -> Worker

    const { MessageChannelMain } = require('electron');

    ipcMain.on('connect-ssh', (event, payload) => {
        console.log('[Main] Received connect-ssh request:', payload.host);

        // Create a dedicated channel for this terminal session (Fast Lane)
        const { port1, port2 } = new MessageChannelMain();

        // Send one end to the renderer
        event.sender.postMessage('ssh-channel-init', { sessionId: payload.sessionId }, [port1]);

        // The other end (port2) stays in Main and brokers data to Worker
        // We map session ID to this port to route data back and forth?
        // Actually, easier: We handle 'message' on port2 and forward to worker.

        port2.on('message', (msg: any) => {
            // Msg from Renderer (Input/Resize) -> Worker
            // We expect msg structure: { type: 'SSH_INPUT', payload: { ... } }
            // But from xterm we might just send raw data? 
            // Let's keep protocol consistent: { type, payload }
            worker?.postMessage(msg.data);
        });

        port2.start();

        // Store port2 reference
        sessionPorts.set(payload.sessionId, port2);

        worker?.postMessage({ type: 'CONNECT_SSH', payload });
    });

    ipcMain.on('sftp-delete', (_, payload) => {
        worker?.postMessage({ type: 'SFTP_DELETE', payload });
    });

    ipcMain.on('sftp-mkdir', (_, payload) => {
        worker?.postMessage({ type: 'SFTP_MKDIR', payload });
    });

    ipcMain.on('sftp-list', (_, payload) => {
        // console.log('[Main] Msg: sftp-list', payload);
        worker?.postMessage({ type: 'SFTP_LIST', payload });
    });

    ipcMain.on('disconnect-ssh', (_, payload) => {
        worker?.postMessage({ type: 'DISCONNECT', payload });
    });

    ipcMain.on('sftp-download', (_, payload) => {
        worker?.postMessage({ type: 'SFTP_DOWNLOAD', payload });
    });

    ipcMain.on('sftp-upload', (_, payload) => {
        worker?.postMessage({ type: 'SFTP_UPLOAD', payload });
    });

    ipcMain.on('sftp-read-file', (_, payload) => {
        worker?.postMessage({ type: 'SFTP_READ_FILE', payload });
    });

    ipcMain.on('sftp-write-file', (_, payload) => {
        worker?.postMessage({ type: 'SFTP_WRITE_FILE', payload });
    });

    ipcMain.on('connect-vnc', (_, payload) => {
        worker?.postMessage({ type: 'VNC_CONNECT', payload });
    });

    ipcMain.on('vnc-key-event', (_, payload) => {
        worker?.postMessage({ type: 'VNC_KEY_EVENT', payload });
    });

    ipcMain.on('vnc-pointer-event', (_, payload) => {
        worker?.postMessage({ type: 'VNC_POINTER_EVENT', payload });
    });

    ipcMain.on('disconnect-vnc', (_, payload) => {
        worker?.postMessage({ type: 'VNC_DISCONNECT', payload });
    });

    ipcMain.on('connect-rdp', (_, payload) => {
        worker?.postMessage({ type: 'RDP_CONNECT', payload });
    });

    ipcMain.on('rdp-key-event', (_, payload) => {
        worker?.postMessage({ type: 'RDP_KEY_EVENT', payload });
    });

    ipcMain.on('rdp-mouse-event', (_, payload) => {
        worker?.postMessage({ type: 'RDP_MOUSE_EVENT', payload });
    });

    ipcMain.on('rdp-wheel-event', (_, payload) => {
        worker?.postMessage({ type: 'RDP_WHEEL_EVENT', payload });
    });

    ipcMain.on('disconnect-rdp', (_, payload) => {
        worker?.postMessage({ type: 'RDP_DISCONNECT', payload });
    });

    // Dialogs
    const { dialog } = require('electron');

    ipcMain.handle('show-save-dialog', async (_, options) => {
        const result = await dialog.showSaveDialog(mainWindow, options);
        return result;
    });

    ipcMain.handle('show-open-dialog', async (_, options) => {
        const result = await dialog.showOpenDialog(mainWindow, options);
        return result;
    });

    // Session Management
    ipcMain.handle('get-sessions', () => {
        return sessionStore.getSessions();
    });

    ipcMain.handle('save-session', (_, session) => {
        sessionStore.saveSession(session);
        return true;
    });

    ipcMain.handle('delete-session', (_, id) => {
        sessionStore.deleteSession(id);
        return true;
    });

    // Window Controls
    ipcMain.on('window-control', (_, action: 'minimize' | 'maximize' | 'close') => {
        switch (action) {
            case 'minimize':
                mainWindow.minimize();
                break;
            case 'maximize':
                if (mainWindow.isMaximized()) {
                    mainWindow.unmaximize();
                } else {
                    mainWindow.maximize();
                }
                break;
            case 'close':
                mainWindow.close();
                break;
        }
    });

    // Example: Ping-Pong
    ipcMain.handle('ping', () => 'pong');
}
