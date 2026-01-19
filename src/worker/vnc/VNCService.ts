import rfb from 'rfb2';
import { parentPort } from 'worker_threads';

interface VNCConnectionConfig {
    host: string;
    port: number;
    password?: string;
    sessionId: string;
}

export class VNCService {
    private connection: any;
    private sessionId: string;
    private width: number = 0;
    private height: number = 0;

    constructor(config: VNCConnectionConfig) {
        this.sessionId = config.sessionId;
        this.connect(config);
    }

    private connect(config: VNCConnectionConfig) {
        try {
            this.connection = rfb.createConnection({
                host: config.host,
                port: config.port,
                password: config.password,
            });

            this.connection.on('connect', () => {
                this.width = this.connection.width;
                this.height = this.connection.height;

                parentPort?.postMessage({
                    type: 'VNC_CONNECTED',
                    payload: {
                        sessionId: this.sessionId,
                        width: this.width,
                        height: this.height,
                        name: this.connection.name
                    }
                });

                // Request initial update
                this.connection.requestUpdate(false, 0, 0, this.width, this.height);
            });

            this.connection.on('rect', (rect: any) => {
                // Send rect data to renderer
                // rect contains: x, y, width, height, data (Buffer)
                // We might need to handle encoding. rfb2 usually gives raw pixels or encodings.
                // For simplicity, let's assume raw or handle it.
                // Actually rfb2 'rect' event gives decoded data if we use standard encodings?
                // Let's forward the raw buffer and let renderer handle or just raw pixels.

                // Optimized approach: Check encoding. 
                // For now, forward everything.

                parentPort?.postMessage({
                    type: 'VNC_FRAME',
                    payload: {
                        sessionId: this.sessionId,
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height,
                        encoding: rect.encoding, // raw, copyRect, etc
                        data: rect.data // Buffer
                    }
                });
            });

            this.connection.on('error', (err: any) => {
                parentPort?.postMessage({
                    type: 'VNC_ERROR',
                    payload: { sessionId: this.sessionId, error: err.message }
                });
            });

            this.connection.on('close', () => {
                parentPort?.postMessage({
                    type: 'VNC_CLOSED',
                    payload: { sessionId: this.sessionId }
                });
            });

        } catch (error: any) {
            parentPort?.postMessage({
                type: 'VNC_ERROR',
                payload: { sessionId: this.sessionId, error: error.message }
            });
        }
    }

    public sendKeyEvent(keysym: number, down: boolean) {
        if (this.connection) {
            this.connection.keyEvent(keysym, down ? 1 : 0);
        }
    }

    public sendPointerEvent(x: number, y: number, mask: number) {
        if (this.connection) {
            this.connection.pointerEvent(x, y, mask);
        }
    }

    public disconnect() {
        if (this.connection) {
            this.connection.end();
        }
    }
}
