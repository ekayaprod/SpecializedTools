## 2024-05-18 - [Passphrase Generator Retry Loop]
**Learning:** The passphrase generator uses a probabilistic "guess and check" retry loop (`MAX_RETRIES = 500`) to satisfy length constraints (`minLength`, `maxLength`) because word banks contain variable-length words. It is impossible to calculate the exact final length before selecting the random words.
**Action:** When working with generative text constraints, check if length is enforced predictively (math) or probabilistically (retries). Added JSDoc and `// WARN:` comments to protect this loop from being "optimized" into a single pass.
