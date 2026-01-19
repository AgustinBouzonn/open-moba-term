import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', {
            ipcRenderer: {
                send: (channel: string, data: any) => ipcRenderer.send(channel, data),
                on: (channel: string, func: any) => {
                    const subscription = (_event: any, ...args: any[]) => func(_event, ...args);
                    ipcRenderer.on(channel, subscription);
                    return () => ipcRenderer.removeListener(channel, subscription);
                },
                once: (channel: string, func: any) => ipcRenderer.once(channel, (_event, ...args) => func(_event, ...args)),
                invoke: (channel: string, data: any) => ipcRenderer.invoke(channel, data),
                removeListener: (channel: string, func: any) => ipcRenderer.removeListener(channel, func),
                removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
            }
        })
        contextBridge.exposeInMainWorld('api', api)

        // Forward MessagePorts for SSH Zero-Latency
        ipcRenderer.on('ssh-channel-init', (event, payload) => {
            // We must use window.postMessage to transfer the port through the context bridge
            window.postMessage({ type: 'ssh-channel-init', payload }, '*', event.ports);
        });

    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
