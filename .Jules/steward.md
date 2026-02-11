# Steward's Log

## Structural Improvements

### 2024-05-24: Centralized DOM Utility Functions
- **Problem**: `normalizeImagesInSubtree` and `inlineSafeStyles` were duplicated in `bookmarklets/web-clipper.js` and `bookmarklets/property-clipper.js` with slight variations.
- **Solution**: Extracted these functions into `bookmarklets/utils.js` under `window.BookmarkletUtils`.
- **Benefit**: Reduces code duplication, ensures consistent image normalization (including `<picture>` support) and safe style inlining across all tools.

## Cleanup Tasks

### 2024-05-24: Removed Dead Tests
- **Removed**: `tests/test_passphrase_gen.js` (redundant legacy test).
- **Removed**: `tests/reproduce_layout_issue.js` (one-off debugging script).
- **Added**: `tests/test_utils.js` to properly unit test the new shared utilities using JSDOM.
