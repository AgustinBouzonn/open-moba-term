# Release Instructions

## Prerequisites
1. Ensure all changes are committed
2. Update `CHANGELOG.md` with new version changes
3. Version bump in `package.json` (if needed)

## Creating a Release

### Option 1: Automated (GitHub Actions)

When you push a tag, GitHub Actions will automatically build and create a release:

```bash
# Create and push a git tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

The workflow will:
- Build for Windows, macOS, and Linux
- Create installers (.exe, .dmg, .AppImage, .deb)
- Create a GitHub Release with all artifacts
- Auto-generate release notes

### Option 2: Manual Build

If you want to build locally:

```bash
# 1. Build the application
npm run build

# 2. Installers will be in the 'release' folder:
# - OpenMoba-1.0.0-Setup.exe (Windows)
# - OpenMoba-1.0.0.dmg (macOS)
# - OpenMoba-1.0.0.AppImage (Linux)
# - openmoba_1.0.0_amd64.deb (Linux)
```

### Creating GitHub Release Manually

1. Go to https://github.com/agustin-fs/openmoba/releases/new
2. Choose tag: `v1.0.0`
3. Release title: `OpenMoba v1.0.0`
4. Description:
   ```markdown
   ## What's New
   - Initial release
   - SSH/SFTP support
   - VNC remote desktop
   - RDP protocol support
   - Multi-tab interface
   - Secure credential storage

   ## Downloads
   - **Windows**: OpenMoba-1.0.0-Setup.exe
   - **macOS**: OpenMoba-1.0.0.dmg
   - **Linux**: OpenMoba-1.0.0.AppImage or .deb

   ## Installation
   See [README](https://github.com/agustin-fs/openmoba#installation) for details.
   ```
5. Upload built artifacts from `release/` folder
6. Click "Publish release"

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.x.x) - Breaking changes
- **MINOR** (x.1.x) - New features (backwards compatible)
- **PATCH** (x.x.1) - Bug fixes

---

**Note**: Replace `agustin-fs` with your actual GitHub username before releasing!
