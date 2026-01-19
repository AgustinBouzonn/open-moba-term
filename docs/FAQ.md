# Frequently Asked Questions

## General

### What is OpenMoba?
OpenMoba is a modern, multiprotocol session manager for SSH, SFTP, VNC, and RDP connections. It's perfect for system administrators, developers, and anyone who manages multiple remote servers.

### Is OpenMoba free?
Yes! OpenMoba is open source under GPL-3.0 license and completely free to use.

### What platforms are supported?
- Windows 10/11
- macOS 12+
- Linux (Ubuntu, Debian, Fedora, Arch, etc.)

## Installation & Setup

### Do I need to install anything else?
No, OpenMoba comes with everything bundled. However, for SSH key authentication, you'll need to have your SSH keys already generated.

### How do I generate SSH keys?
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

### Where are my sessions stored?
Sessions are stored in:
- **Windows**: `%APPDATA%/openmoba/`
- **macOS**: `~/Library/Application Support/openmoba/`
- **Linux**: `~/.config/openmoba/`

### Are my passwords secure?
Yes! Passwords are encrypted using your operating system's secure credential storage:
- Windows: Windows Credential Manager
- macOS: Keychain
- Linux: Secret Service API (libsecret)

## Usage

### How do I connect to multiple servers?
Use tabs! Open multiple sessions by clicking the "+" button or creating new sessions from the dashboard.

### Can I transfer files between servers?
Yes! Open SFTP browsers on both sessions and drag files between them.

### Does OpenMoba support SSH tunneling?
Not yet, but it's planned for a future release.

### Can I use OpenMoba for serial connections?
Currently no, but it's on the roadmap.

### How do I copy and paste in the terminal?
- `Ctrl+C` / `Ctrl+V` work as expected
- Right-click for context menu
- Selection auto-copies (like traditional terminals)

## Protocols

### SSH/SFTP

**Q: What authentication methods are supported?**
- Password authentication
- Private key authentication
- Support for passphrased keys

**Q: Can I use custom SSH ports?**
Yes, just specify the port when creating the session.

### VNC

**Q: Is VNC traffic encrypted?**
No, VNC protocol itself is not encrypted. For security, use SSH tunneling (coming soon) or VPN.

**Q: What VNC servers are compatible?**
Any RFB-compatible VNC server (TightVNC, RealVNC, UltraVNC, etc.)

### RDP

**Q: Can I connect to Windows Home editions?**
No, Remote Desktop is only available on Windows Pro, Enterprise, and Server editions.

**Q: What RDP version is supported?**
RDP 5.0 and newer.

## Troubleshooting

### Connection times out
- Check firewall settings
- Verify the host/IP is correct
- Ensure the remote service is running
- Test with `ping` or `telnet` first

### "Module not found" error
Try reinstalling:
```bash
npm install
npm run build
```

### Native module errors on Windows
Install Visual Studio Build Tools:
```bash
npm install --global windows-build-tools
```

### SFTP browser is empty
- Ensure SSH connection is successful first
- Check that SFTP subsystem is enabled on the server
- Verify user permissions on remote directory

### High CPU usage
- Disable WebGL renderer in terminal settings (if experiencing issues)
- Close unused sessions
- Update to latest version

## Development

### How can I contribute?
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### I found a bug, where do I report it?
Open an issue on [GitHub Issues](https://github.com/agustin-fs/openmoba/issues) with:
- Clear description
- Steps to reproduce
- System information
- Logs (if available)

### Can I request features?
Absolutely! Use the Feature Request template on GitHub Issues.

### How do I build from source?
```bash
git clone https://github.com/agustin-fs/openmoba.git
cd openmoba
npm install
npm run dev
```

## Advanced

### Can I customize the UI theme?
Custom themes are planned for future releases.

### Is there a command-line version?
Not currently, OpenMoba is a GUI application.

### Can I automate session creation?
Session configurations are stored in JSON format in the config directory. You can edit them directly or create scripts to generate them.

### Does it support proxies/jump hosts?
Not yet, but it's on the roadmap.

## Still Have Questions?

- Check the full documentation: [docs/](docs/)
- Open a discussion on GitHub
- Contact: [YOUR_EMAIL]

---

Last updated: 2026-01-19
