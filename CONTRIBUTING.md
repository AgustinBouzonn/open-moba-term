# Contributing to OpenMoba

Thank you for your interest in contributing to OpenMoba! 🎉

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/YOUR_USERNAME/openmoba/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - System information (OS, Node version, etc.)

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its use case
3. Explain why it would be valuable

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**:
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed
4. **Test your changes**:
   ```bash
   npm run dev  # Test in development
   npm run build  # Ensure production build works
   ```
5. **Commit** with clear messages:
   ```bash
   git commit -m "feat: add support for X protocol"
   ```
6. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** with:
   - Description of changes
   - Related issue number (if any)
   - Screenshots/videos (if UI changes)

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/openmoba.git
cd openmoba

# Install dependencies
npm install

# Run in dev mode
npm run dev
```

## Code Style

- Use **TypeScript** for all new code
- Follow existing naming conventions
- Use **functional components** in React
- Prefer **async/await** over promises
- Add **JSDoc comments** for public APIs

## Project Structure

- `src/main/` - Electron main process
- `src/renderer/` - React UI
- `src/worker/` - Background worker (protocols)
- `src/shared/` - Shared types

## Testing

Currently, the project uses manual testing. Automated tests are welcome contributions!

## Questions?

Feel free to open a discussion or reach out via issues.

---

Thank you for contributing! 🚀
