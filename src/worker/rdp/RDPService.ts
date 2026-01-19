import { parentPort } from 'worker_threads';
import rdp from 'node-rdpjs';

interface RDPConnectionConfig {
    host: string;
    port?: number;
    username?: string;
    password?: string;
    domain?: string;
    width: number;
    height: number;
}

export class RDPService {
    private client: any;
    private config: RDPConnectionConfig;

    constructor(config: RDPConnectionConfig) {
        this.config = config;
    }

    public connect() {
        try {
            this.client = rdp.createClient({
                domain: this.config.domain,
                userName: this.config.username,
                password: this.config.password,
                enablePerf: true,
                autoLogin: true,
                screen: {
                    width: this.config.width,
                    height: this.config.height
                },
                locale: 'en',
                logLevel: 'INFO'
            });

            this.client.on('connect', () => {
                parentPort?.postMessage({
                    type: 'RDP_CONNECTED',
                    payload: {}
                });
            });

            this.client.on('close', () => {
                parentPort?.postMessage({
                    type: 'RDP_DISCONNECTED',
                    payload: {}
                });
            });

            this.client.on('error', (err: any) => {
                parentPort?.postMessage({
                    type: 'RDP_ERROR',
                    payload: { error: err.message || err }
                });
            });

            this.client.on('bitmap', (bitmap: any) => {
                // Bitmap data comes as a buffer-like object or array
                // We need to send it to the renderer
                // The renderer will draw it on a canvas
                parentPort?.postMessage({
                    type: 'RDP_BITMAP',
                    payload: {
                        x: bitmap.destLeft,
                        y: bitmap.destTop,
                        width: bitmap.width,
                        height: bitmap.height,
                        data: bitmap.data, // This might be a Uint8Array or Buffer
                        isCompress: bitmap.isCompress // Should be false after decompression
                    }
                });
            });

            this.client.connect(this.config.host, this.config.port || 3389);

        } catch (error: any) {
            parentPort?.postMessage({
                type: 'RDP_ERROR',
                payload: { error: error.message }
            });
        }
    }

    public disconnect() {
        if (this.client) {
            this.client.close();
            this.client = null;
        }
    }

    public sendMouseEvent(x: number, y: number, button: number, isPressed: boolean) {
        if (this.client) {
            this.client.sendPointerEvent(x, y, button, isPressed);
        }
    }

    public sendKeyEvent(code: number, isPressed: boolean) {
        if (this.client) {
            // Scancode vs Unicode? usage depends on node-rdpjs implementation
            // Using scancode is safer for special keys
            this.client.sendKeyEventScancode(code, isPressed, false);
        }
    }

    public sendWheelEvent(x: number, y: number, step: number, isNegative: boolean, isHorizontal: boolean) {
        if (this.client) {
            this.client.sendWheelEvent(x, y, step, isNegative, isHorizontal);
        }
    }
}
