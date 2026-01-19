# VISUAL PROTOCOLS: RDP & VNC

## 1. RDP (Remote Desktop Protocol)

### 1.1 Engine Choice: FreeRDP
We wrap `node-freerdp` or essentially spawn `xfreerdp` / build a native node module binding around `libfreerdp`.
**Why not JS?** RDP is too complex and performance-critical for a pure JS implementation.

### 1.2 Integration
- **Output:** The native module writes raw bitmap data to a `SharedArrayBuffer`.
- **Render:** The React component reads this buffer and paints to a `<canvas>` (2D or WebGL context).
- **Input:** Mouse/Keyboard events in the browser are captured, translated to RDP scancodes, and sent to the native module.

### 1.3 Key Features
- **NLA (Network Level Authentication):** Supported by FreeRDP.
- **Resize:** Dynamic resolution changes (Smart Sizing).
- **Clipboard:** Sync text/images between Host OS and RDP Session.

## 2. VNC (RFB Protocol)

### 2.1 Engine: noVNC
Standard library for VNC in browser.

### 2.2 Transport Shim
Browser WebSocket APIs cannot connect to raw TCP ports (standard VNC port 5900).
**The Tcp-to-WebSocket Proxy:**
1. **Worker:** Creates a `net.Socket` to `TargetIP:5900`.
2. **Worker:** Creates a `WebSocket.Server` (local) or uses a direct NodeJS Stream-to-WebSocket shim.
3. **Renderer:** Connects `noVNC` via `ws://localhost:local_proxy_port`.

### 2.3 Encodings
Priority configuration for speed:
1. **Tight:** High compression.
2. **Hextile:** Good balance.
3. **Raw:** Avoid unless on LAN.

## 3. Protocol Detection
- Users often don't know if they need SSH, RDP or VNC.
- **Port Scanner Utility:** A helper that probes ports 22, 3389, 5900 on the target IP and suggests the protocol.
