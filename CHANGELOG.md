# Changelog

All notable changes to OpenMoba will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-19

### Added
- **Multi-Protocol Support**: SSH, SFTP, VNC, and RDP
- **Zero-Latency IPC**: MessagePort-based terminal communication
- **Worker Architecture**: Background thread for protocol handling
- **Modern UI**: Dark theme with glassmorphism effects
- **Session Management**: Multi-tab interface with session grouping
- **SFTP File Browser**: Upload/download with progress tracking
- **Remote File Editing**: In-app editor for remote files
- **VNC Support**: Remote desktop viewer using rfb2
- **RDP Support**: Windows Remote Desktop using node-rdpjs
- **Secure Credentials**: Encrypted storage via node-keytar
- **WebGL Terminal**: Hardware-accelerated rendering via xterm-addon-webgl

### Fixed
- Legacy octal literals in `rfb2` and `node-rdpjs` dependencies
- TypeScript strict mode compatibility
- Build process optimization

## [Unreleased]

### Planned
- Automated testing suite
- SSH tunneling support
- X11 forwarding
- Multi-select file operations in SFTP
- Clipboard paste protection
- Session import/export
- Custom themes
- Internationalization (i18n)

---

[1.0.0]: https://github.com/YOUR_USERNAME/openmoba/releases/tag/v1.0.0
