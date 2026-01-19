# NETWORKING & SSH ARCHITECTURE

## 1. The SSH Manager Service
This service runs in the Background Worker and holds the state of all active connections.

### 1.1 Connection Factory
Uses `ssh2` client.

```typescript
const conn = new Client();
conn.on('ready', () => {
    // Authenticated
}).on('tcp connection', () => {
    // TCP Handshake done
}).on('error', (err) => {
    // Handshake failed or socket drop
});
```

### 1.2 Connection Lifecycle (Finite State Machine)

The UI must reflect these states to the user via the tab icon/color.

1.  **IDLE:** Object created, no socket.
2.  **DNS_RESOLVE:** Resolving hostname.
3.  **TCP_CONNECT:** Socket opening (`net.connect`).
4.  **SSH_HANDSHAKE:** Protocol version exchange (`SSH-2.0...`).
5.  **AUTH:** Sending credentials (Password/Key/Agent).
    - *Retry Loop:* If password fails, prompt user again without dropping TCP if possible (partial auth), otherwise restart.
6.  **CHANNEL_ALLOCATION:** Opening main shell channel (`session`).
7.  **ACTIVE:** Ready for user input.
8.  **DISCONNECT:** Graceful close or timeout.
9.  **RECONNECTING:** Auto-reconnect logic active.

## 2. Multiplexing (Connection Sharing)

To avoid overhead and rate-limits, we use a single TCP connection per server.

### 2.1 Channel Management
The `ssh2` library supports multiple channels on one `Client` instance.

- **Shell Channel (`channelType: 'session'`):** The main terminal. PTY request `req.pty(...)` + `req.shell()`.
- **SFTP Channel (`channelType: 'session'` + `subsystem: sftp`):** Initialized immediately after auth.
- **X11 Channel (`channelType: 'x11'`):** Incoming request from server.
- **Port Forwarding (`channelType: 'direct-tcpip'`):** For tunnels.

### 2.2 Race Conditions
**Problem:** User tries to open a file (SFTP) before Auth is complete.
**Solution:** `PromiseQueue`. All channel requests wait on a `connectionReady` promise.

## 3. Keep-Alive Strategy

Firewalls love to kill idle TCP connections.

### 3.1 TCP Level
`socket.setKeepAlive(true, 10000)`: Operating system level probes. Often filtered by routers.

### 3.2 Application Level (SSH_MSG_IGNORE)
We send a dummy packet periodically.

```typescript
setInterval(() => {
  if (connection.authenticated) {
    // ssh2 method to send ignore packet
    connection.openssh_noMoreSessions(); // Abuse low-impact packets or specific ignore method
    // Or just a keepalive request
    connection.ping(); // ssh2 doesn't have raw ping, usually we use GlobalRequest('keepalive@openssh.com')
  }
}, 20000);
```

## 4. Advanced Features

### 4.1 Proxy Jump (Bastion Hosts)
Chaining connections.
`Client A` -> `Bastion B` -> `Target C`.

**Implementation:**
1. Connect to B.
2. `B.forwardOut(srcIP, srcPort, C_IP, C_Port, (err, stream) => ...)`
3. Connect `Client C` using `stream` as the underlying socket.

### 4.2 Agent Forwarding
Allows using local keys on remote servers (e.g., git pull on remote).
* Requires a local Pageant/OpenSSH Agent named pipe.
* `ssh2` supports `agent: process.env.SSH_AUTH_SOCK`.
