# SECURITY & CRYPTOGRAPHY

## 1. Memory Security (RAM)

### 1.1 The Immutability Problem
JavaScript strings are immutable and garbage collected lazily. A password in a variable `const pass = "secret"` may persist in process memory dumps for minutes or hours.

### 1.2 The Buffer Solution
- **Rule:** Never store passwords or private keys as Strings. Use `Uint8Array` or Node `Buffer`.
- **Wiping:**
  ```typescript
  class SecureString {
    private buffer: Uint8Array;
    constructor(str: string) {
      this.buffer = new TextEncoder().encode(str);
    }
    use(callback: (val: Uint8Array) => void) {
      callback(this.buffer);
    }
    dispose() {
      this.buffer.fill(0); // Overwrite with zeros
    }
  }
  ```
- **Library Integration:** `ssh2` accepts Buffers for authentication.

## 2. Storage Security (At Rest)

### 2.1 OS Keychain (Default)
We rely on `node-keytar` (native bindings to Windows Credential Manager / Mac Keychain / Libsecret).
- **Service:** `OpenMoba`
- **Account:** `SessionUUID`
- **Value:** `EncryptedJSON` or just the `Password`.

### 2.2 Portable Mode (USB)
In portable mode, we cannot assume the host machine is safe or that we have access to Credential Manager.
- **Master Password:** Required on startup.
- **Key Derivation:** `Argon2id` (memory hard) to derive KEK (Key Encryption Key) from Master Password.
- **Encryption:** `AES-256-GCM` to encrypt the `sessions.json` file.
- **Key File:** Optionally support a keyfile + password combo.

## 3. Input Security (Sanitization)

### 3.1 Paste Protection
Prevent "Paste Jacking" where a website puts invisible newlines in your clipboard to auto-execute commands.

**Logic:**
If `Clipboard.text` contains `\n` OR `\r`:
  1. **Pause** flow (preventDefault).
  2. **Analyze:** specific keywords like `sudo`, `rm -rf`.
  3. **Alert:** Show modal "You are about to paste XX lines. Do you want to edit before pasting?"

## 4. Updates & Supply Chain
- **Code Signing:** All Electron binaries must be signed (EV Certificate) to prevent tampering.
- **Auto-Update:** Verify signature matches current binary before applying update `electron-updater`.
