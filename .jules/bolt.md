# ⚡ Bolt+ Log

## Structural Bottlenecks
- `bookmarklets/passphrase-generator.js`: Excessive bundle size due to redundant JSON string storage.
  - **Action**: Implemented string splitting pattern (`S('A|B')` vs `["A","B"]`).
  - **Result**: Reduced size from 56KB to 44KB (~21%).

- `index.html`: Client-side compilation of bookmarklets caused waterfall network requests and main thread blocking.
  - **Action**: Implemented build-time compilation script (`scripts/build_bookmarklets.js`) and switched frontend to fetch a single static JSON (`dist/tools.json`).
  - **Result**: Eliminated runtime compilation and reduced network requests from N+M (tools + deps) to 1.
