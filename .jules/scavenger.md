# 🧹 Scavenger Log

## [2025-02-27]
- **Deleted:** `verification/` directory (orphaned verification script and artifacts)
- **Deleted:** `verification.log` (stale log file)
- **Reason:** Replaced by `tests/test_pa_county_finder_ui.js` and manual QA. `verify_pa_county_finder.py` was a standalone script not integrated into CI.

## [2026-02-16]
- **Deleted:** `BookmarkletUtils.buildElement` (unused utility function)
- **Deleted:** `tests/test_utils.js` test case (Test 5)
- **Reason:** Function was exported but never used by any bookmarklet. `property-clipper.js` defined its own local version.
