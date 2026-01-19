# TERMINAL & PTY ENGINE DOCUMENTATION

## 1. PTY Abstraction Layer

### 1.1 Support Matrix
The system must automatically detect and configure the best available shell.

| OS | Priority 1 | Priority 2 | Priority 3 |
| :--- | :--- | :--- | :--- |
| **Windows** | PowerShell Core (`pwsh`) | PowerShell (`powershell`) | CMD (`cmd`) |
| **Linux/Mac** | ZSH (`zsh`) | Bash (`bash`) | Sh (`sh`) |
| **Subsystems** | WSL 2 (Distro default) | Git Bash (Mingw64) | Cygwin |

### 1.2 Windows Specifics (`node-pty` Configuration)
- **ConPTY:** Must use `useConpty: true` for modern Windows (build 18309+). This delegates rendering to the Windows Console API, fixing 99% of ANSI/VT emulator bugs.
- **Environment Variables:**
  ```javascript
  const env = {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    LANG: 'en_US.UTF-8', // Force UTF-8
  };
  ```

## 2. Rendering Pipeline

### 2.1 xterm.js Configuration
- **Addons:**
  - `xterm-addon-webgl`: Essential for 60fps rendering.
  - `xterm-addon-fit`: For initial sizing.
  - `xterm-addon-unicode11`: Better emoji/symbol support.
  - `xterm-addon-search`: Ctrl+F functionality.
  - `xterm-addon-image`: (Optional) Sixel/iTerm2 image protocol support.

### 2.2 Performance Tweaks
- **Scrollback:** Limit to 10,000 lines by default. Infinite scrollback consumes JS Heap.
- **Batching:** `node-pty` output is chunked. Render calls should be batched via `requestAnimationFrame` if the stream is heavy (e.g., `cat huge.log`).

## 3. Link Detection (Hyperlinks)
Custom Regex parsers run **before** data hits xterm.js (or using `registerLinkProvider`).

**Matchers:**
1.  **Web:** `https?://...` -> Opens external browser.
2.  **Files:**
    - `C:\Users\...` or `/home/...`
    - Action: Check if local or remote. If remote, open SFTP browser to that location.
3.  **IPs:** `192.168.x.x` -> Context menu "Connect via SSH".

## 4. Resizing Logic (The Anti-Jank)

Handling `ResizeObserver` correctly to prevent visual artifacts in TUI apps (`vim`, `mc`).

```typescript
// Debounce logic
let resizeTimeout;
const fitAddon = new FitAddon();

const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    fitAddon.fit();
    const { cols, rows } = terminal;
    // Notify Backend PTY
    ipcRenderer.send('resize-pty', { id: sessionId, cols, rows });
  }, 100);
};
```
