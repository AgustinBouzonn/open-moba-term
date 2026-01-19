import { SSHService } from './SSHService';
import { SFTPService } from './SFTPService';
import { ConnectConfig } from 'ssh2';

export class ConnectionManager {
    private sessions: Map<string, SSHService> = new Map();
    private sftpSessions: Map<string, SFTPService> = new Map();

    public async createSession(id: string, config: ConnectConfig): Promise<SSHService> {
        if (this.sessions.has(id)) {
            throw new Error(`Session ${id} already exists`);
        }

        const session = new SSHService(id);

        // Forward events or handle logging here?

        await session.connect(config);
        this.sessions.set(id, session);
        return session;
    }

    public getSession(id: string): SSHService | undefined {
        return this.sessions.get(id);
    }

    public async getSFTPSession(id: string): Promise<SFTPService> {
        let sftp = this.sftpSessions.get(id);
        if (sftp) return sftp;

        const session = this.sessions.get(id);
        if (!session) throw new Error(`Session ${id} not found`);

        const rawSftp = await session.openSFTP();
        sftp = new SFTPService(rawSftp);
        this.sftpSessions.set(id, sftp);
        return sftp;
    }

    public closeSession(id: string) {
        const session = this.sessions.get(id);
        if (session) {
            session.disconnect();
            this.sessions.delete(id);
        }
    }

    public closeAll() {
        for (const session of this.sessions.values()) {
            session.disconnect();
        }
        this.sessions.clear();
    }
}
