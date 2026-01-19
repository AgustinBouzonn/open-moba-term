# Pre-Publish Checklist for OpenMoba

Before pushing to GitHub, verify the following:

## ✅ Documentation

- [x] `README.md` - Complete and professional
- [x] `LICENSE` - GPL-3.0 license file
- [x] `CONTRIBUTING.md` - Contribution guidelines
- [x] `CHANGELOG.md` - Version history
- [x] `SECURITY.md` - Security policy
- [x] `GIT_SETUP.md` - Git initialization instructions

## ✅ Configuration Files

- [x] `.gitignore` - Properly excludes build artifacts and sensitive files
- [x] `package.json` - Contains repository info and correct metadata
- [x] `.vscode/extensions.json` - Recommended extensions

## ⚠️ TODO: Replace Placeholders

Before pushing, you MUST replace these placeholders:

### In `package.json`:
```json
"homepage": "https://github.com/YOUR_USERNAME/openmoba",
"repository": {
  "url": "https://github.com/YOUR_USERNAME/openmoba.git"
},
"bugs": {
  "url": "https://github.com/YOUR_USERNAME/openmoba/issues"
}
```

### In `README.md`:
- Line ~153: `[https://github.com/YOUR_USERNAME/openmoba](https://github.com/YOUR_USERNAME/openmoba)`

### In `SECURITY.md`:
- Line ~11: `[YOUR_EMAIL]`

### In `GIT_SETUP.md`:
- Multiple references to `YOUR_USERNAME`

## 🔒 Security Check

- [ ] No hardcoded passwords or API keys
- [ ] No `.env` files with secrets
- [ ] No private keys or certificates
- [ ] No database credentials
- [ ] No personal information

### Files to Review:
```bash
# Search for potential secrets
grep -r "password" src/
grep -r "api_key" src/
grep -r "secret" src/
grep -r "token" src/
```

## 🧪 Build Verification

Run these commands to ensure everything works:

```bash
# Install dependencies
npm install

# Development build
npm run dev

# Production build
npm run build
```

Expected: All builds should complete without errors (keytar warning is OK).

## 📦 Files to Include

The following will be committed to GitHub:

```
✅ Source Code
  - src/
  - public/ (if exists)

✅ Configuration
  - package.json
  - tsconfig.json
  - vite.config.ts
  - electron-builder.yml (if exists)

✅ Documentation
  - README.md
  - LICENSE
  - CONTRIBUTING.md
  - CHANGELOG.md
  - SECURITY.md
  - GIT_SETUP.md

✅ Development
  - .gitignore
  - .vscode/extensions.json
```

## 🚫 Files to EXCLUDE (via .gitignore)

```
❌ node_modules/
❌ dist/
❌ dist-electron/
❌ *.log
❌ .env
❌ build outputs
```

## 🎯 After Publishing

1. **Create GitHub Repository**
   - Go to https://github.com/new
   - Name: `openmoba`
   - Public/Private: Your choice
   - DO NOT initialize with README/License

2. **Push Code**
   ```bash
   cd e:\Desarrollo
   git init
   git add .
   git commit -m "Initial commit: OpenMoba v1.0.0"
   git remote add origin https://github.com/YOUR_USERNAME/openmoba.git
   git branch -M main
   git push -u origin main
   ```

3. **Configure Repository**
   - Add description
   - Add topics: `electron`, `typescript`, `react`, `ssh`, `sftp`, `vnc`, `rdp`
   - Enable Issues
   - Configure Pages (optional)

4. **Create Release**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

5. **Announce**
   - Share on social media
   - Reddit: r/programming, r/typescript, r/electron
   - Twitter/X with relevant hashtags
   - Dev.to article (optional)

---

## ✨ You're Ready to Publish!

Once all checkboxes are complete and placeholders replaced, you're ready to share OpenMoba with the world! 🚀
