import { Client, ConnectConfig, ClientChannel, SFTPWrapper } from 'ssh2';
import { EventEmitter } from 'events';

export class SSHService extends EventEmitter {
    private client: Client;
    private shellStream: ClientChannel | null = null;
    private keepAliveInterval: NodeJS.Timeout | null = null;
    public id: string;
    public isConnected: boolean = false;

    constructor(id: string) {
        super();
        this.id = id;
        this.client = new Client();
        // Prevent process crash on unhandled 'error' event during connection
        this.on('error', () => { });
        this.setupListeners();
    }

    private setupListeners() {
        this.client.on('ready', () => {
            this.isConnected = true;
            this.emit('ready');
            this.startKeepAlive();
        });

        this.client.on('error', (err) => {
            this.emit('error', err);
            this.cleanup();
        });

        this.client.on('end', () => {
            this.emit('end');
            this.cleanup();
        });

        this.client.on('close', () => {
            this.emit('close');
            this.cleanup();
        });
    }

    public async connect(config: ConnectConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            const onError = (err: Error) => {
                this.client.removeListener('ready', onReady);
                reject(err);
            };

            const onReady = () => {
                this.client.removeListener('error', onError);
                resolve();
            };

            this.client.once('error', onError);
            this.client.once('ready', onReady);

            try {
                this.client.connect(config);
            } catch (err) {
                // Synchronous errors
                reject(err);
            }

            // Catch async auth failures that might not emit 'error' on client but throw in lib
            // Note: ssh2 should emit 'error' for auth failures, but sometimes it throws if listeners aren't set up
            // immediately or if the state is weird. The listener above covers it, but we ensure 'error' event is handled in setupListeners too.

        });
    }

    public async openShell(rows: number = 24, cols: number = 80): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.shell({ term: 'xterm-256color', rows, cols }, (err, stream) => {
                if (err) return reject(err);
                if (!stream) return reject(new Error('Failed to open shell stream'));

                this.shellStream = stream;

                stream.on('close', () => {
                    this.shellStream = null;
                    this.emit('shell-close');
                });

                stream.on('data', (data: Buffer) => {
                    this.emit('data', data);
                });

                resolve();
            });
        });
    }

    public async openSFTP(): Promise<SFTPWrapper> {
        return new Promise((resolve, reject) => {
            this.client.sftp((err, sftp) => {
                if (err) return reject(err);
                if (!sftp) return reject(new Error('Failed to open SFTP session'));
                resolve(sftp);
            });
        });
    }

    public write(data: string | Buffer) {
        if (this.shellStream) {
            this.shellStream.write(data);
        }
    }

    public resize(rows: number, cols: number) {
        if (this.shellStream) {
            this.shellStream.setWindow(rows, cols, 0, 0);
        }
    }

    private startKeepAlive() {
        // App Level Keep-Alive
        this.keepAliveInterval = setInterval(() => {
            if (this.isConnected) {
                // Send ignore packet to keep connection active
                // @ts-ignore: openssh_noMoreSessions is not always typed but exists, or use generic ping
                // logic if specific method unavailable. SSH2 doesn't expose explicit 'ignore' easily on Client 
                // but we can just rely on TCP KeepAlive or re-keying. 
                // A better approach in strict ts with ssh2:
                // We leave this empty for now or implement a dummy exec if needed.
                // Actually, client.openssh_noMoreSessions() is often used but let's stick to standard behavior first.
            }
        }, 30000);
    }

    public disconnect() {
        this.client.end();
        this.cleanup();
    }

    private monitoringInterval: NodeJS.Timeout | null = null;

    public startMonitoring() {
        if (this.monitoringInterval) return;
        this.pollStats();
        this.monitoringInterval = setInterval(() => this.pollStats(), 3000);
    }

    public stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    private async pollStats() {
        if (!this.isConnected || !this.client) return;

        // Lightweight command to get CPU, RAM, Disk
        // Using a single exec to minimize overhead
        // 1. CPU: Top is too heavy. /proc/stat is raw.
        // 2. RAM: free -m
        // 3. Disk: df -h /
        const cmd = `
        echo "STATS_START";
        grep 'cpu ' /proc/stat | awk '{print ($2+$4)*100/($2+$4+$5)}' | head -1;
        free -m | grep Mem | awk '{print $2 " " $3}';
        df -h / | tail -1 | awk '{print $5}';
        uptime -p;
        echo "STATS_END";
        `;

        this.client.exec(cmd, (err, stream) => {
            if (err) return; // Silent fail
            let output = '';
            stream.on('data', (data: any) => {
                output += data.toString();
            });
            stream.on('close', () => {
                this.parseStats(output);
            });
        });
    }

    private parseStats(raw: string) {
        if (!raw.includes('STATS_START') || !raw.includes('STATS_END')) return;

        try {
            const lines = raw.trim().split('\n').map(l => l.trim()).filter(l => l);
            // Index of start
            const startIndex = lines.findIndex(l => l === 'STATS_START');
            if (startIndex === -1) return;

            // Expecting:
            // STATS_START
            // 15.4 (CPU %)
            // 16000 8000 (RAM Total Used)
            // 45% (Disk)
            // up 2 hours (Uptime)
            // STATS_END

            const cpu = parseFloat(lines[startIndex + 1]);
            const ramParts = lines[startIndex + 2]?.split(' ');
            const ramTotal = parseInt(ramParts?.[0] || '0');
            const ramUsed = parseInt(ramParts?.[1] || '0');
            const disk = lines[startIndex + 3]; // "45%"
            const uptime = lines[startIndex + 4];

            this.emit('stats', {
                cpu: isNaN(cpu) ? 0 : cpu,
                ramTotal,
                ramUsed,
                disk,
                uptime
            });
        } catch (e) {
            // Parse error
        }
    }

    private cleanup() {
        this.isConnected = false;
        this.stopMonitoring();
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
        if (this.shellStream) {
            this.shellStream.end();
            this.shellStream = null;
        }
    }
}
