## 2024-05-18 - [Passphrase Generator Retry Loop]
**Learning:** The passphrase generator uses a probabilistic "guess and check" retry loop (`MAX_RETRIES = 500`) to satisfy length constraints (`minLength`, `maxLength`) because word banks contain variable-length words. It is impossible to calculate the exact final length before selecting the random words.
**Action:** When working with generative text constraints, check if length is enforced predictively (math) or probabilistically (retries). Added JSDoc and `// WARN:` comments to protect this loop from being "optimized" into a single pass.

## 2024-03-30 - [Image Normalization Async Traversal]
**Learning:** The `normalizeImages` utility uses a custom DFS stack traversal paired with `setTimeout` time-slicing (yielding every `ASYNC_CHUNK_SIZE` or `ASYNC_TIME_SLICE_MS`). This is because standard `querySelectorAll('img, picture')` on massive DOMs can cause severe main thread lockups, and recursive DFS can trigger maximum call stack errors.
**Action:** When writing utilities that process entire document trees, avoid `querySelectorAll` and synchronous recursion. Use time-sliced iterative stack traversal to keep the UI responsive.
