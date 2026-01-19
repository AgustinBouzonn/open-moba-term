# X11 FORWARDING BRIDGE

## 1. Overview
The X11 bridge allows running graphical Linux applications on the remote server and displaying them on the local Windows machine seamlessy.

## 2. Architecture: The Loopback Bridge
Since we cannot easily implement a full X11 Server in JavaScript, we orchestrate an external X Server (`VcXsrv` or `Xming`) and tunnel traffic to it.

### 2.1 The Flow
1. **Remote:** User runs `xclock`.
2. **SSH Channel:** SSH Client requests `x11-req` channel.
3. **Local:** The App receives the new X11 channel.
4. **Bridge:** The App opens a TCP socket to `127.0.0.1:6000` (Local X Server).
5. **Pipe:** Data is piped bidirectionally: `SSH Stream <-> Local TCP Socket`.

## 3. VcXsrv Orchestration
We bundle a minimal version of VcXsrv or download it on demand.

### 3.1 Launch Arguments
```powershell
vcxsrv.exe :0 -AC -terminate -lesspointer -multiwindow -clipboard -wgl
```
- `:0`: Display number (refers to port 6000).
- `-AC`: Disable Access Control (We rely on SSH for security).
- `-multiwindow`: Integration with Windows Taskbar.
- `-wgl`: Enable hardware acceleration.

### 3.2 Display Assignment
We must handle the `DISPLAY` environment variable logic.
- Usually `export DISPLAY=localhost:10.0` on the remote side is handled automatically by the SSH daemon (sshd) when we request X11 forwarding.

## 4. Security (XAuth)
To prevent other users on the multi-user system from hijacking the display.
1. **Generate Magic Cookie:** A random hex string.
2. **Local Auth:** Write cookie to `~/.Xauthority` (locally) or pass to VcXsrv.
3. **Remote Auth:** `xauth add <display> . <cookie>`.

## 5. Performance
- **Compression:** Always enable SSH compression (`-C` equivalent) for X11 channels, as X11 protocol is verbose and compressible.
