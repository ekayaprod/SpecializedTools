# Medic Journal

## Fragility Report

### 1. Swallowed Wake Lock Errors (Quick Clicker)
**Pattern:** `try { ... } catch (e) { console.warn(...) }`
**Location:** `bookmarklets/quick-clicker.js`
**Impact:** Silent failure of "No Sleep" feature. User is unaware that their screen might turn off during long-running automation tasks.
**Fix:** Add `showToast` to notify user of failure while keeping the console log for debugging.

### 2. Unsafe Code Generation (Macro Builder)
**Pattern:** `JSON.stringify` inside template literals without robust escaping, generating code that uses `alert` for errors.
**Location:** `bookmarklets/macro-builder.js`
**Status:** Monitored. Lower priority than silent failures in core features.

### 3. DOM Extraction Fallbacks (Property Clipper)
**Pattern:** `try { ... } catch (e) { console.warn(...) }`
**Location:** `bookmarklets/property-clipper.js`
**Status:** Acceptable. This is a fallback mechanism where failure is expected and non-critical (partial data is better than none).
