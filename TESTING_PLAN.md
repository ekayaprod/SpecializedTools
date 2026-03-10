# Testing Plan

<!-- 🛰️ MAP: Actionable, specific coverage requirement mapped to a file path and exact edge cases. -->
## test_scripts_coverage (`scripts/run_tests.js`)
- [ ] `run_tests.js`: Requires boundary testing for missing directory handling. Needs explicit assert that process exits with 1 when the tests directory does not exist.
- [ ] `run_tests.js`: Must assert that if there are zero test files found, the runner correctly prints a warning and gracefully exits with 0.
- [ ] `run_tests.js`: Requires validation that failure in a test suite subprocess correctly registers a non-zero exit code mapping back to the main runner process and exits with 1.

## test_scripts_coverage (`scripts/bookmarklet-builder.js`)
- [ ] `bookmarklet-builder.js`: Requires execution branch validation for environment isolation. Asserts that when the module environment is missing (e.g. running in a raw browser context lacking `module.exports`), the builder explicitly attaches itself directly to the root global context (e.g. `window.BookmarkletBuilder = BookmarkletBuilder`).