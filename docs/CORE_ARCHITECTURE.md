# CORE SYSTEM ARCHITECTURE

## 1. Philosophies & Design Principles
- **Jank-Free UI:** The `Renderer` process (UI) must NEVER perform blocking operations (sync IO, heavy crypto). All heavy lifting is offloaded to Background Workers.
- **Strict Typing:** 100% TypeScript strict mode. No `any` allowed without explicit justification.
- **Dependency Isolation:** Minimizing 3rd party runtime dependencies to reduce bundle size and security surface.

## 2. Process Model (The "Triad")

### 2.1 Main Process (Orchestrator)
The entry point (`src/main/index.ts`).
- **Startup:**
  1. Initializes `sentry` (or crash reporter).
  2. Reads `session_restore.json`.
  3. Spawns `BackgroundWorker` (hidden window or child process).
  4. Creates `MainWindow`.
- **Window Management:**
  - Handles native window frames (custom titlebar logic).
  - Listens for `second-instance` to focus existing window.
- **IPC Hub:**
  - Facilitates routing between `Renderer` and `Worker` if direct MessagePorts aren't established yet.
  - Global shortcuts registration.

### 2.2 Renderer Process (Presentation Layer)
- **Tech:** React 18+ (Concurrency Mode), Emotion.
- **Responsibilities:**
  - **State Management:** Zustand or Redux Toolkit (minimizing boilerplate).
  - **Virtualization:** Rendering lists of thousands of files or log lines efficiently.
  - **Terminal Wrapper:** Wraps `xterm.js` DOM element and handles ResizeObserver.
- **Constraints:**
  - No direct Node.js APIs (contextIsolation: true).
  - No secrets in memory (passwords are in Worker).

### 2.3 Background Worker (The Engine)
- **Type:** Node.js Child Process or Hidden Electron Window (rendering: false).
- **Motivation:** `node-pty` and `ssh2` are CPU intensive. Keeping them off the Main thread prevents UI freeze.
- **Services:**
  - **ConnectionManager:** Holds the `ssh2.Client` instances.
  - **PTYManager:** Spawns `node-pty` processes on Windows.
  - **TunnelManager:** Manages SSH tunnels and Local Forwarding.

## 3. Inter-Process Communication (IPC) detailed

### 3.1 Control Channel (JSON)
Used for meta-operations: "Connect to X", "List Directory", "Get Settings".

**Pattern:** Request/Response over `ipcRenderer.invoke` (to Main) or MessageChannel (to Worker).

```typescript
// Shared Types
interface IpcMessage<T = any> {
  id: string; // UUID v4
  type: 'CONNECT' | 'EXEC' | 'FS_LIST';
  payload: T;
  timestamp: number;
}
```

### 3.2 Data Channel (Stream)
Used for Terminal Data and File Transfers.

**Mechanism:** `MessagePort` (Web API transferred to Node via Electron).
- **Optimization:** Avoids JSON serialization. Sends `Uint8Array` directly.
- **Flow:**
  `node-pty (stdout)` -> `Worker` -> `MessagePort` -> `Renderer` -> `xterm.js.write()`

## 4. Directory Structure Implication

```text
src/
  main/
    managers/
      WindowManager.ts
      AppCyleManager.ts
  renderer/
    store/        # Zustand stores
    components/   # React Components
    router/       # React Router
  worker/
    services/
      SSHService.ts
      PTYService.ts
  shared/
    dtos/         # Data Transfer Objects (Interfaces)
    constants/
```
