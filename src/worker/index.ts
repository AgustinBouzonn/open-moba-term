import { parentPort } from 'worker_threads';
import { ConnectionManager } from './ssh/ConnectionManager';
import { VNCService } from './vnc/VNCService';
import { RDPService } from './rdp/RDPService';

const manager = new ConnectionManager();
const vncSessions = new Map<string, VNCService>();
const rdpSessions = new Map<string, RDPService>();

if (parentPort) {
    parentPort.on('message', async (msg: any) => {
        switch (msg.type) {
            case 'CONNECT_SSH':
                handleConnect(msg.payload);
                break;
            case 'SSH_INPUT':
                handleInput(msg.payload);
                break;
            case 'SSH_RESIZE':
                handleResize(msg.payload);
                break;
            case 'SFTP_LIST':
                handleSFTPList(msg.payload);
                break;
            case 'SFTP_DELETE':
                handleSFTPDelete(msg.payload);
                break;
            case 'SFTP_MKDIR':
                handleSFTPMkdir(msg.payload);
                break;
            case 'SFTP_DOWNLOAD':
                handleSFTPDownload(msg.payload);
                break;
            case 'SFTP_UPLOAD':
                handleSFTPUpload(msg.payload);
                break;
            case 'SFTP_READ_FILE':
                handleSFTPReadFile(msg.payload);
                break;
            case 'SFTP_WRITE_FILE':
                handleSFTPWriteFile(msg.payload);
                break;
            case 'VNC_CONNECT':
                handleVNCConnect(msg.payload);
                break;
            case 'VNC_DISCONNECT':
                handleVNCDisconnect(msg.payload);
                break;
            case 'VNC_KEY_EVENT':
                handleVNCKeyEvent(msg.payload);
                break;
            case 'VNC_POINTER_EVENT':
                handleVNCPointerEvent(msg.payload);
                break;
            case 'RDP_CONNECT':
                handleRDPConnect(msg.payload);
                break;
            case 'RDP_DISCONNECT':
                handleRDPDisconnect(msg.payload);
                break;
            case 'RDP_MOUSE_EVENT':
                handleRDPMouseEvent(msg.payload);
                break;
            case 'RDP_KEY_EVENT':
                handleRDPKeyEvent(msg.payload);
                break;
            case 'RDP_WHEEL_EVENT':
                handleRDPWheelEvent(msg.payload);
                break;
            case 'DISCONNECT':
                handleDisconnect(msg.payload);
                break;
        }
    });

    parentPort.postMessage({ type: 'WORKER_READY' });
}

async function handleConnect(payload: any) {
    console.log('[Worker] Handling CONNECT_SSH:', payload.host, payload.username);
    const { sessionId, host, port, username, password, privateKey } = payload;

    try {
        console.log('[Worker] Creating session...');
        const session = await manager.createSession(sessionId, {
            host,
            port: parseInt(port) || 22,
            username,
            password,
            privateKey,
        });
        console.log('[Worker] Session created successfully');

        session.on('data', (data: Buffer | string) => {
            console.log('[Worker] Received data from SSH, length:', data.toString().length);
            parentPort?.postMessage({
                type: 'SSH_DATA',
                payload: { sessionId, data: data.toString() }
            });
        });

        session.on('close', () => {
            console.log('[Worker] SSH session closed');
            parentPort?.postMessage({ type: 'SSH_CLOSE', payload: { sessionId } });
        });

        session.on('error', (err) => {
            console.error('[Worker] SSH session error:', err.message);
            parentPort?.postMessage({
                type: 'SSH_ERROR',
                payload: { sessionId, error: err.message }
            });
        });

        session.on('stats', (stats) => {
            parentPort?.postMessage({
                type: 'SSH_STATS',
                payload: { sessionId, stats }
            });
        });

        console.log('[Worker] Opening shell...');
        await session.openShell();
        console.log('[Worker] Shell opened successfully');

        session.startMonitoring();
        parentPort?.postMessage({ type: 'SSH_READY', payload: { sessionId } });

    } catch (err: any) {
        console.error('[Worker] Connection failed:', err.message);
        parentPort?.postMessage({
            type: 'SSH_ERROR',
            payload: { sessionId, error: err.message }
        });
    }
}

function handleInput(payload: { sessionId: string, data: string }) {
    const session = manager.getSession(payload.sessionId);
    if (session) {
        session.write(payload.data);
    }
}

function handleResize(payload: { sessionId: string, rows: number, cols: number }) {
    const session = manager.getSession(payload.sessionId);
    if (session) {
        session.resize(payload.rows, payload.cols);
    }
}

async function handleSFTPList(payload: { sessionId: string, path: string, reqId: string }) {
    // console.log('[Worker] Handling SFTP_LIST for path:', payload.path);
    try {
        const sftp = await manager.getSFTPSession(payload.sessionId);
        const list = await sftp.readdir(payload.path || '.');
        parentPort?.postMessage({
            type: 'SFTP_LIST_SUCCESS',
            payload: { reqId: payload.reqId, list }
        });
    } catch (err: any) {
        console.error('[Worker] SFTP Error:', err);
        parentPort?.postMessage({
            type: 'SFTP_ERROR',
            payload: { reqId: payload.reqId, error: err.message }
        });
    }
}

async function handleSFTPDelete(payload: { sessionId: string, path: string, isDirectory: boolean }) {
    try {
        const sftp = await manager.getSFTPSession(payload.sessionId);
        if (payload.isDirectory) {
            await sftp.rmdir(payload.path);
        } else {
            await sftp.unlink(payload.path);
        }
        parentPort?.postMessage({ type: 'SFTP_ACTION_SUCCESS', payload: { action: 'delete' } });
    } catch (err: any) {
        parentPort?.postMessage({ type: 'SFTP_ERROR', payload: { error: err.message } });
    }
}

async function handleSFTPMkdir(payload: { sessionId: string, path: string }) {
    try {
        const sftp = await manager.getSFTPSession(payload.sessionId);
        await sftp.mkdir(payload.path);
        parentPort?.postMessage({ type: 'SFTP_ACTION_SUCCESS', payload: { action: 'mkdir' } });
    } catch (err: any) {
        parentPort?.postMessage({ type: 'SFTP_ERROR', payload: { error: err.message } });
    }
}

async function handleSFTPDownload(payload: { sessionId: string, remotePath: string, localPath: string }) {
    try {
        const sftp = await manager.getSFTPSession(payload.sessionId);
        let lastUpdate = 0;
        await sftp.download(payload.remotePath, payload.localPath, (transferred, _, total) => {
            const now = Date.now();
            if (now - lastUpdate > 200 || transferred === total) { // Throttle: query every 200ms
                parentPort?.postMessage({
                    type: 'SFTP_PROGRESS',
                    payload: { action: 'download', transferred, total, filename: payload.remotePath }
                });
                lastUpdate = now;
            }
        });
        parentPort?.postMessage({ type: 'SFTP_ACTION_SUCCESS', payload: { action: 'download' } });
    } catch (err: any) {
        parentPort?.postMessage({ type: 'SFTP_ERROR', payload: { error: err.message } });
    }
}

async function handleSFTPUpload(payload: { sessionId: string, localPath: string, remotePath: string }) {
    try {
        const sftp = await manager.getSFTPSession(payload.sessionId);
        let lastUpdate = 0;
        await sftp.upload(payload.localPath, payload.remotePath, (transferred, _, total) => {
            const now = Date.now();
            if (now - lastUpdate > 200 || transferred === total) {
                parentPort?.postMessage({
                    type: 'SFTP_PROGRESS',
                    payload: { action: 'upload', transferred, total, filename: payload.remotePath }
                });
                lastUpdate = now;
            }
        });
        parentPort?.postMessage({ type: 'SFTP_ACTION_SUCCESS', payload: { action: 'upload' } });
    } catch (err: any) {
        parentPort?.postMessage({ type: 'SFTP_ERROR', payload: { error: err.message } });
    }
}

function handleDisconnect(payload: { sessionId: string }) {
    manager.closeSession(payload.sessionId);
}

async function handleSFTPReadFile(payload: { sessionId: string, path: string }) {
    try {
        const sftp = await manager.getSFTPSession(payload.sessionId);
        const content = await sftp.readFile(payload.path);
        parentPort?.postMessage({
            type: 'SFTP_READ_FILE_SUCCESS',
            payload: { path: payload.path, content }
        });
    } catch (error: any) {
        parentPort?.postMessage({
            type: 'SFTP_ERROR',
            payload: { error: error.message }
        });
    }
}

async function handleSFTPWriteFile(payload: { sessionId: string, path: string, content: string }) {
    try {
        const sftp = await manager.getSFTPSession(payload.sessionId);
        await sftp.writeFile(payload.path, payload.content);
        parentPort?.postMessage({
            type: 'SFTP_WRITE_FILE_SUCCESS',
            payload: { path: payload.path }
        });
    } catch (error: any) {
        parentPort?.postMessage({
            type: 'SFTP_ERROR',
            payload: { error: error.message }
        });
    }
}

// VNC Handlers
function handleVNCConnect(payload: any) {
    const { sessionId, host, port, password } = payload;
    try {
        const vnc = new VNCService({ sessionId, host, port, password });
        vncSessions.set(sessionId, vnc);
    } catch (error: any) {
        parentPort?.postMessage({
            type: 'VNC_ERROR',
            payload: { sessionId, error: error.message }
        });
    }
}

function handleVNCDisconnect(payload: { sessionId: string }) {
    const vnc = vncSessions.get(payload.sessionId);
    if (vnc) {
        vnc.disconnect();
        vncSessions.delete(payload.sessionId);
    }
}

function handleVNCKeyEvent(payload: { sessionId: string, keysym: number, down: boolean }) {
    const vnc = vncSessions.get(payload.sessionId);
    if (vnc) {
        vnc.sendKeyEvent(payload.keysym, payload.down);
    }
}

function handleVNCPointerEvent(payload: { sessionId: string, x: number, y: number, mask: number }) {
    const vnc = vncSessions.get(payload.sessionId);
    if (vnc) {
        vnc.sendPointerEvent(payload.x, payload.y, payload.mask);
    }
}


// RDP Handlers
function handleRDPConnect(payload: any) {
    const { sessionId, host, port, username, password, width, height } = payload;
    // console.log('[Worker] Handling RDP_CONNECT', host);
    try {
        const rdp = new RDPService({ host, port, username, password, width, height });
        rdpSessions.set(sessionId, rdp);
        rdp.connect();
    } catch (error: any) {
        parentPort?.postMessage({
            type: 'RDP_ERROR',
            payload: { sessionId, error: error.message }
        });
    }
}

function handleRDPDisconnect(payload: { sessionId: string }) {
    const rdp = rdpSessions.get(payload.sessionId);
    if (rdp) {
        rdp.disconnect();
        rdpSessions.delete(payload.sessionId);
    }
}

function handleRDPMouseEvent(payload: { sessionId: string, x: number, y: number, button: number, isPressed: boolean }) {
    const rdp = rdpSessions.get(payload.sessionId);
    if (rdp) {
        rdp.sendMouseEvent(payload.x, payload.y, payload.button, payload.isPressed);
    }
}

function handleRDPKeyEvent(payload: { sessionId: string, code: number, isPressed: boolean }) {
    const rdp = rdpSessions.get(payload.sessionId);
    if (rdp) {
        // console.log('[Worker] RDP Key:', payload.code, payload.isPressed);
        rdp.sendKeyEvent(payload.code, payload.isPressed);
    }
}

function handleRDPWheelEvent(payload: { sessionId: string, x: number, y: number, step: number, isNegative: boolean, isHorizontal: boolean }) {
    const rdp = rdpSessions.get(payload.sessionId);
    if (rdp) {
        rdp.sendWheelEvent(payload.x, payload.y, payload.step, payload.isNegative, payload.isHorizontal);
    }
}

console.log('OpenMoba Worker Process Started [VERSION 2.2 - VNC & SFTP & RDP]');
