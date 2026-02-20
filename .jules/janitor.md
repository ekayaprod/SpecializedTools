## Janitor's Journal

### Foundation Update
- **Deduplication**: Removed redundant `pnpm-lock.yaml` to standardize on `package-lock.json`.
- **Config**: Updated `.gitignore` with standard exclusions (`.DS_Store`, `coverage/`, `.vscode/`, `.idea/`).
- **Stability**: Ran `npm install` to ensure consistent environment.
- **Fix**: Patched `tests/test_macro_builder_runtime.js` to correctly load `utils.js` dependency, resolving a test failure.
