# Codebase Review Report

## Mode Definitions

- **MODE_A (Critical Startup & Environment Reliability):** Focuses on initialization, dependencies, and environment hazards.
- **MODE_B (Functional Validation & Stress QA):** Focuses on logic errors, boundary conditions, and data integrity.

## 1. `index.html`

- **[MODE_A] Critical Minification Hazard:**
  - The minification logic uses `code.replace(/\s+/g, ' ')` to collapse whitespace.
  - **Risk:** If any source file contains a single-line comment (`//`), this regex will merge the rest of the code into that comment, breaking the bookmarklet.
  - **Recommendation:** Strictly enforce `/* ... */` comments or update the minifier to strip `//` comments safely before collapsing whitespace.

- **[MODE_A] External Dependency:**
  - The page relies on `cdn.tailwindcss.com`.
  - **Risk:** If this CDN fails or is blocked, the UI will render without styles.

## 2. `bookmarklets/pa-county-finder.js`

- **[MODE_B] Logic Error (Split ZIP Codes):**
  - The construction of the ZIP-to-County map (`zM`) handles split ZIP codes incorrectly. The loop iterates through the override object `O` and assigns the county to the ZIP. Since keys in `zM` must be unique, the **last county processed overwrites previous ones**.
  - **Impact:** Users looking up a split ZIP (e.g., 15085) will only see one county.

- **[MODE_B] Heuristic Fallibility:**
  - The default county data (`D`) assumes contiguous ZIP ranges (`d[1]` to `d[2]`). ZIP codes are not always contiguous.

## 3. `bookmarklets/passphrase-generator.js`

- **[MODE_B] Logic Error (Date Calculation):**
  - The `getMemorialDay` function uses `new Date(y, 5, 31)`.
  - **Defect:** In JavaScript, Month 5 is June. June has 30 days. This resolves to **July 1st**. Memorial Day is in May.
  - **Impact:** The "Spring" season definition is incorrect.

- **[MODE_B] Typos:**
  - "Yle" in Winter Noun list (likely "Yule").
  - "Leafy" in Autumn Adjective list.

## 4. `bookmarklets/property-clipper.js`

- **[MODE_A] Environment Reliability:**
  - Safe usage of `window.location.hostname`.
- **[MODE_B] Functional Validation:**
  - Robust DOM cleanup (`noiseSelectors`) and platform targeting.

## 5. `bookmarklets/target-edit.js`

- **[MODE_B] Runtime Hazard (CORS Images):**
  - The `processImages` function uses `canvas.toDataURL()` on external images.
  - **Risk:** This triggers a "Tainted Canvas" error for cross-origin images without CORS headers. The code catches the error and falls back to the original URL, but the downloaded HTML may have broken images if they are protected.

## 6. `bookmarklets/temp-password.js`

- **[MODE_B] Weak Security (Low Entropy):**
  - The generator uses a fixed list of ~100 words, 10 digits, and 4 symbols.
  - **Calculation:** 100 * 10 * 4 = **4,000 combinations**.
  - **Risk:** Extremely weak and vulnerable to brute-force attacks.
