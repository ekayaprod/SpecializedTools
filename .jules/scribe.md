## 2024-06-03 - [MsgReader MIME Boundary Parsing]
**Learning:** The fallback MIME text extractor `_scanBufferForMimeText` in `mailto-link-generator/js/msgreader.js` uses manual string indexing (`indexOf`) and slicing (`substring`) instead of regular expressions to parse multipart boundaries. This intentional optimization prevents catastrophic backtracking, call stack limits, and excessive memory allocations from array splits on massive email payloads.
**Action:** When parsing large text blobs (like emails or logs) where boundary offsets are predictable, prefer `indexOf` and `substring` over complex regex splitting. Added JSDoc and `// WARN:` to `_scanBufferForMimeText` to protect this optimization.

## 2024-06-03 - [MsgReader MIME Boundary Parsing]
**Learning:** The fallback MIME text extractor `_scanBufferForMimeText` in `mailto-link-generator/js/msgreader.js` uses manual string indexing (`indexOf`) and slicing (`substring`) instead of regular expressions to parse multipart boundaries. This intentional optimization prevents catastrophic backtracking, call stack limits, and excessive memory allocations from array splits on massive email payloads.
**Action:** When parsing large text blobs (like emails or logs) where boundary offsets are predictable, prefer `indexOf` and `substring` over complex regex splitting. Added JSDoc and `// WARN:` to `_scanBufferForMimeText` to protect this optimization.

## 2024-05-18 - [Passphrase Generator Retry Loop]
**Learning:** The passphrase generator uses a probabilistic "guess and check" retry loop (`MAX_RETRIES = 500`) to satisfy length constraints (`minLength`, `maxLength`) because word banks contain variable-length words. It is impossible to calculate the exact final length before selecting the random words.
**Action:** When working with generative text constraints, check if length is enforced predictively (math) or probabilistically (retries). Added JSDoc and `// WARN:` comments to protect this loop from being "optimized" into a single pass.

## 2024-03-30 - [Image Normalization Async Traversal]
**Learning:** The `normalizeImages` utility uses a custom DFS stack traversal paired with `setTimeout` time-slicing (yielding every `ASYNC_CHUNK_SIZE` or `ASYNC_TIME_SLICE_MS`). This is because standard `querySelectorAll('img, picture')` on massive DOMs can cause severe main thread lockups, and recursive DFS can trigger maximum call stack errors.
**Action:** When writing utilities that process entire document trees, avoid `querySelectorAll` and synchronous recursion. Use time-sliced iterative stack traversal to keep the UI responsive.
## 2025-02-28 - [MsgReader OLE FAT Parsing Logic]
**Learning:** The `readFAT` function in `mailto-link-generator/js/msgreader.js` parses Microsoft OLE Compound Documents by extracting the File Allocation Table (FAT) in three stages (Header, Double Indirect FAT (DIF) sectors, and standard FAT blocks). It relies on magic numbers `0xFFFFFFFE` (End of Chain) and `0xFFFFFFFF` (Free Sector). Traversing the DIF chain requires careful boundary checks against `this.buffer.byteLength` and `header.difTotalSectors` to avoid infinite loops from cyclic chains or buffer overflows from malformed payloads.
**Action:** When parsing binary tree/chain structures like FAT, always include bounds-checking (`<= this.buffer.byteLength`) and explicit limits on `while` loops. Added JSDoc and `// WARN:` to `readFAT` to clarify these edge cases.
