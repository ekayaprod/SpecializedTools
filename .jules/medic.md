# Medic Log

## Fragility Patterns Identified
- **Unprotected utility functions:** Core utilities like `htmlToMarkdown` and `downloadFile` assumed valid inputs and environment support (e.g., `DOMParser`, `URL.createObjectURL`), leading to potential crashes or silent failures in edge cases.
- **Test Harness Fragility:** Some tests (`test_macro_builder_runtime.js`) implicitly relied on global state or missing dependencies (`utils.js`), causing failures when environment assumptions changed.

## Resilience Improvements
- **Wrapped `downloadFile`:** Added `try...catch` block to handle Blob creation or URL generation failures, providing user feedback via `showToast`.
- **Hardened `htmlToMarkdown`:** Added input validation (null/type check) and `try...catch` block around `DOMParser` usage to prevent crashes on invalid input or environment issues.
- **Test Robustness:** Fixed `test_macro_builder_runtime.js` to explicitly load required dependencies (`utils.js`), ensuring test stability.
