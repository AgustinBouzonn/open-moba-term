# Git Setup Script for OpenMoba

## Prerequisites

**Install Git**: Download from https://git-scm.com/download/win

## Initialize Repository

Once Git is installed, run these commands in PowerShell:

```powershell
# Navigate to project directory
cd e:\Desarrollo

# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: OpenMoba v1.0.0"

# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/openmoba.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `openmoba`
3. Description: "High-performance multiprotocol session manager for SSH, SFTP, VNC, and RDP"
4. Choose: **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**
7. Follow the instructions above to push your code

## Optional: Add Topics to Repository

After creating the repository, add these topics for better discoverability:
- `electron`
- `typescript`
- `react`
- `ssh`
- `sftp`
- `vnc`
- `rdp`
- `terminal`
- `remote-desktop`

## .gitignore Already Configured

The `.gitignore` file is already configured to exclude:
- `node_modules/`
- `dist/` and `dist-electron/`
- Build outputs
- Log files
- Environment variables
- IDE files

## Important Notes

⚠️ **Before pushing**:
1. Make sure you've replaced `YOUR_USERNAME` in:
   - `package.json` (repository URLs)
   - `README.md` (project links)
   - This setup script

2. Review files to ensure no sensitive data (passwords, API keys) is included

3. Consider adding a `.env.example` file if you use environment variables

## Next Steps After Push

1. Enable GitHub Actions (if you want CI/CD)
2. Add repository description and topics
3. Configure branch protection rules
4. Add collaborators (if working in a team)
5. Create first release tag:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

---

**Ready to share your project with the world! 🚀**
