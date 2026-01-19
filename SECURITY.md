# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in OpenMoba, please report it by:

1. **DO NOT** open a public issue
2. Email the maintainer at: [YOUR_EMAIL]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Best Practices

### Credentials Storage

- OpenMoba uses `node-keytar` for secure credential storage
- Credentials are encrypted using OS-level keychains:
  - **Windows**: Windows Credential Manager
  - **macOS**: Keychain
  - **Linux**: Secret Service API / libsecret

### SSH Keys

- Private keys are never transmitted or stored by the application
- Private key paths are stored, not the keys themselves
- Always use strong passphrases for SSH keys

### Network Security

- All SSH/SFTP connections use industry-standard encryption
- VNC connections support password authentication
- RDP connections use standard RDP security protocols

### Recommended Practices

1. **Use SSH keys** instead of passwords when possible
2. **Enable 2FA** on remote systems
3. **Regularly update** OpenMoba and dependencies
4. **Use strong passwords** and never share them
5. **Verify host keys** on first connection
6. **Keep your system updated** with latest security patches

## Known Security Considerations

- VNC protocol does not encrypt traffic by default - use over SSH tunnel
- RDP security depends on server configuration
- Ensure you trust the systems you connect to

## Dependencies

OpenMoba relies on established security libraries:
- `ssh2` - Mature SSH/SFTP client
- `node-keytar` - Native credential storage
- `electron` - Security-focused desktop framework

We regularly update dependencies to patch security vulnerabilities.

## Disclosure Policy

- Security issues are disclosed after a fix is available
- Users are notified via GitHub releases and security advisories
- Critical vulnerabilities are patched with priority

---

**Your security is our priority. Thank you for helping keep OpenMoba secure!**
