# 🚀 Quick Start Guide - OpenMoba

This guide will get you up and running with OpenMoba in minutes!

## ⚡ Installation

### Download Pre-built Binaries

**Windows:**
1. Download `OpenMoba-1.0.0-Setup.exe` from [Releases](https://github.com/agustin-fs/openmoba/releases)
2. Run the installer
3. Follow the setup wizard
4. Launch OpenMoba from Start Menu

**macOS:**
1. Download `OpenMoba-1.0.0.dmg`
2. Open the DMG file
3. Drag OpenMoba to Applications
4. Launch from Applications folder

**Linux:**
```bash
# AppImage (works on all distros)
chmod +x OpenMoba-1.0.0.AppImage
./OpenMoba-1.0.0.AppImage

# Or Debian/Ubuntu
sudo dpkg -i openmoba_1.0.0_amd64.deb
```

## 🎯 First Connection

### SSH Connection

1. Click the **"+"** button or press `Ctrl+N`
2. Fill in connection details:
   - **Session Name**: My Server
   - **Protocol**: SSH
   - **Host**: 192.168.1.100
   - **Port**: 22
   - **Username**: root
   - **Authentication**: Password or Private Key
3. Click **"Save Session"**
4. Click on your session to connect

### VNC Connection

1. Create new session
2. Select **VNC** as protocol
3. Enter VNC server details:
   - Host/IP
   - Port (usually 5900)
   - Password
4. Connect and control remote desktop

### RDP Connection

1. Create new session
2. Select **RDP** as protocol
3. Enter Windows server details:
   - Host/IP
   - Username
   - Password
   - Domain optional)
4. Connect to Windows remote desktop

## 🔑 Managing Credentials

### SSH Keys

1. Go to **SSH Settings** tab in session modal
2. Select **"Private Key"** authentication
3. Browse to your private key file (e.g., `~/.ssh/id_rsa`)
4. Save session

### Secure Storage

- All passwords are encrypted using your OS keychain
- Windows: Credential Manager
- macOS: Keychain
- Linux: libsecret

## 📁 Using SFTP

1. Connect to an SSH session
2. Click the **folder icon** 📁 to toggle SFTP browser
3. Navigate files on the right panel
4. **Upload**: Drag files from your computer
5. **Download**: Right-click → Download
6. **Edit**: Double-click text files to edit remotely

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+N` | New session |
| `Ctrl+,` | Settings |
| `Ctrl+F` | Toggle SFTP |

## 🎨 Customization

### Session Colors

1. Edit session
2. Go to **Appearance** tab
3. Choose a color for the tab
4. Select an icon

### Terminal Settings

- Font size: Right-click terminal → Settings
- Copy/Paste: Standard `Ctrl+C` / `Ctrl+V`
- Selection: Click and drag

## 🔧 Troubleshooting

### Connection Failed

- ✅ Check host/IP is correct
- ✅ Verify port is open (SSH: 22, VNC: 5900, RDP: 3389)
- ✅ Confirm credentials are correct
- ✅ Check firewall settings

### SFTP Not Working

- Ensure SSH connection is established first
- Some servers may have SFTP disabled

### VNC/RDP Issues

- Verify remote desktop is enabled on target machine
- Check network connectivity
- Ensure correct password/authentication

## 💡 Pro Tips

1. **Group Sessions**: Use the "Group" field to organize sessions (e.g., "Production/Database")
2. **Quick Connect**: Use the dashboard for quick connections
3. **Multiple Sessions**: Open multiple tabs for different servers
4. **Copy Between Servers**: Use SFTP on both sessions to transfer files

## 📚 Next Steps

- Read full documentation: [docs/](docs/)
- Join community discussions
- Report bugs: [Issues](https://github.com/agustin-fs/openmoba/issues)
- Contribute: [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Need Help?** Check [FAQ](docs/FAQ.md) or open an issue!
