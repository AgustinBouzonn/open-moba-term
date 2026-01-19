# VIRTUAL FILE SYSTEM (VFS) & SFTP

## 1. VFS Interface
A generic abstraction allowing the UI to interact with any filesystem (Local, SFTP, FTP, S3).

```typescript
interface VFS {
  readdir(path: string): Promise<FileEntry[]>;
  stat(path: string): Promise<FileStats>;
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  mkdir(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  unlink(path: string): Promise<void>;
}

interface FileEntry {
  name: string;
  isDirectory: boolean;
  size: number;
  mtime: number;
  permissions: string; // "rwxr-xr-x"
}
```

## 2. SFTP Implementation

### 2.1 Initialization
The SFTP session is treated as a secondary channel of the main SSH Connection. It should be initialized:
- **Lazy:** Only when the user opens the "Files" side panel.
- **Eager (Preferred):** Immediately after login to enable "Follow Terminal" features.

### 2.2 Buffering & Streams
Electron `IPC` cannot handle huge payloads efficiently.
- **Listing:** `readdir` returns JSON. Fine for small dirs. For 10k+ files, execute `ls -l` via exec channel and parse text output (faster than SFTP packet usage).
- **Download/Upload:**
  - **Download:** Stream chunks from SFTP -> Write to `%TEMP%` file via Node `fs` stream in Worker. Notify Renderer of progress. Renderer never touches the file bytes unless small (editor).
  - **Upload:** Read from local FS stream -> Pipe to SFTP write stream.

## 3. Smart Caching
To make directory navigation snappy.
- **TTL Cache:** Cache directory listings for 30 seconds.
- **Invalidation:** Auto-invalidate if the user executes a command that might change files (`rm`, `touch`, `mkdir`), or simply refresh on manual click.

## 4. "Follow Terminal" Implementation

Synchronizing the file explorer with the terminal path `cwd`.

### 4.1 OSC 7 Integration (The Modern Way)
We listen for ANSI Escape Code `OSC 7`.
Format: `\x1b]7;file://HOSTNAME/PATH\x1b\`

1. **Parser:** The Terminal Parser detects this sequence.
2. **Action:** Parses the path.
3. **Dispatch:** Calls `vfs.readdir(newPath)` and updates the UI state.
4. **Setup:** We may need to provide a snippet to users to add to their `.bashrc` / `.zshrc` to emit this code.

```bash
# Example .bashrc snippet
update_terminal_cwd() {
    printf "\e]7;file://%s/%s\e\\" "$HOSTNAME" "$PWD"
}
PROMPT_COMMAND="update_terminal_cwd; $PROMPT_COMMAND"
```

### 4.2 Regex Fallback
If OSC 7 is absent:
1. Scan the active terminal line for `user@host:~/path $`.
2. Extract path.
3. **Validation:** call `sftp.stat(path)` to verify it's a real directory before switching the view.
