import { SFTPWrapper } from 'ssh2';
import { Stats } from 'fs';

export interface FileEntry {
    name: string;
    longname: string;
    // attributes: Stats; // Cannot use fs.Stats as it has methods not compatible with postMessage
    attributes: {
        mode: number;
        uid: number;
        gid: number;
        size: number;
        atime: number;
        mtime: number;
    };
    isDirectory: boolean;
}

export class SFTPService {
    private sftp: SFTPWrapper;

    constructor(sftp: SFTPWrapper) {
        this.sftp = sftp;
    }

    public async readdir(path: string): Promise<FileEntry[]> {
        return new Promise((resolve, reject) => {
            this.sftp.readdir(path, (err, list) => {
                if (err) return reject(err);

                const entries = list.map(item => ({
                    name: item.filename,
                    longname: item.longname,
                    // Sanitize attributes to plain object to ensure postMessage compatibility
                    attributes: {
                        mode: item.attrs.mode,
                        uid: item.attrs.uid,
                        gid: item.attrs.gid,
                        size: item.attrs.size,
                        atime: item.attrs.atime,
                        mtime: item.attrs.mtime
                    },
                    // Basic detection, can be refined using attrs.mode
                    isDirectory: item.longname.startsWith('d') || (item.attrs.mode !== undefined && (item.attrs.mode & 0o40000) === 0o40000)
                }));

                resolve(entries);
            });
        });
    }

    public async realpath(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.sftp.realpath(path, (err, target) => {
                if (err) return reject(err);
                resolve(target);
            });
        });
    }

    public async mkdir(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.sftp.mkdir(path, (err) => err ? reject(err) : resolve());
        });
    }

    public async rmdir(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.sftp.rmdir(path, (err) => err ? reject(err) : resolve());
        });
    }

    public async unlink(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.sftp.unlink(path, (err) => err ? reject(err) : resolve());
        });
    }

    public async download(remotePath: string, localPath: string, onProgress?: (transferred: number, chunk: number, total: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            this.sftp.fastGet(remotePath, localPath, {
                step: (transferred: number, chunk: number, total: number) => {
                    if (onProgress) onProgress(transferred, chunk, total);
                }
            }, (err: any) => err ? reject(err) : resolve());
        });
    }

    public async upload(localPath: string, remotePath: string, onProgress?: (transferred: number, chunk: number, total: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            this.sftp.fastPut(localPath, remotePath, {
                step: (transferred: number, chunk: number, total: number) => {
                    if (onProgress) onProgress(transferred, chunk, total);
                }
            }, (err: any) => err ? reject(err) : resolve());
        });
    }

    public async readFile(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const stream = this.sftp.createReadStream(path, { encoding: 'utf8' });
            let data = '';
            stream.on('data', (chunk: string | Buffer) => data += chunk);
            stream.on('end', () => resolve(data));
            stream.on('error', (err: Error) => reject(err));
        });
    }

    public async writeFile(path: string, content: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const stream = this.sftp.createWriteStream(path);
            stream.on('finish', () => resolve());
            stream.on('error', (err: any) => reject(err));
            stream.write(content);
            stream.end();
        });
    }
}
