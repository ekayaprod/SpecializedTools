# ⚡ Bolt+ Log

## Structural Bottlenecks
- `bookmarklets/passphrase-generator.js`: Excessive bundle size due to redundant JSON string storage.
  - **Action**: Implemented string splitting pattern (`S('A|B')` vs `["A","B"]`).
  - **Result**: Reduced size from 56KB to 44KB (~21%).

- `index.html`: Client-side compilation of bookmarklets caused network waterfall and main thread blocking.
  - **Action**: Moved compilation to build time (`scripts/build_bookmarklets.js`).
  - **Result**: Replaced 8+ network requests with 1 (`dist/tools.json`). Eliminated client-side regex parsing/compilation.
