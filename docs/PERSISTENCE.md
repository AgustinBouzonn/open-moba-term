# PERSISTENCE & STATE MANAGEMENT

## 1. Schema Design

### 1.1 Session Database (`sessions.json`)
A flat list with parent referencing is preferred over deep nesting for performance and searching.

```typescript
type NodeType = 'FOLDER' | 'SESSION';

interface Node {
  id: string; // UUID
  parentId: string | null;
  name: string;
  type: NodeType;
  icon?: string;
  color?: string;
  
  // Connection Config (Optional, can inherit)
  host?: string;
  port?: number;
  username?: string;
  authMethod?: 'PASSWORD' | 'KEY' | 'AGENT';
  keyPath?: string;
  
  // Advanced
  proxyJumpId?: string; // Links to another Session Node
  tunnelConfig?: Tunnel[];
}
```

### 1.2 Unfold/Inheritance Logic
When connecting, we traverse up:
`Session -> Folder A -> Folder B -> Root`.
Properties defined at the leaf win. Properties missing at the leaf are filled by parents. This allows defining "User: root, Key: ~/id_rsa" at Folder A, and all servers inside just define "Host".

## 2. Crash Recovery Strategy

### 2.1 The "Dirty" Flag
- On Start: Check if `app_state.json` has `clean_exit: true`.
- On Exit: Write `clean_exit: true`.
- If on start `clean_exit` is false or missing -> **Crash Detected**.

### 2.2 Session Restore
We maintain a `restore.json` updated every 30-60 seconds and on sensitive events (tab open/close).

```json
{
  "windowBounds": { "x": 0, "y": 0, "width": 1000, "height": 800 },
  "openTabs": [
    { "sessionId": "uuid-1", "cwd": "/var/log", "title": "Prod DB" },
    { "sessionId": "uuid-2", "cwd": "~", "title": "Dev API" }
  ]
}
```

**Recovery Action:**
1. Show toast "App closed unexpectedly."
2. Button "Restore previous session".
3. If clicked -> Loop through `openTabs` and trigger Connection Manager.

## 3. Preferences (`settings.json`)
- **Theme:** `dark` | `light` | `system`
- **Terminal:** `fontSize`, `fontFamily` (with ligature support), `cursorStyle`.
- **Behavior:** `confirmDisconnect`, `scrollbackLines`.
