# 🧶 Untangler Journal

## [2026-02-27]

- **Target:** `bookmarklets/property-clipper.js` -> `PropertyExtractor.getData`
- **Metric:** Lines: ~60, Cognitive Complexity: High (Mixed concerns, nested try/catch)
- **Strategy:** Extracted helper functions for each extraction strategy (Hero, JSON, DOM).
- **Status:** Done

## Prune-and-Compress Journal Protocol Axioms
*   **The Inverted Validation Guard**: Refactored Node.js controllers to return early on validation failure rather than wrapping the entire happy-path logic in an outer conditional block.
*   **The Transformation Thread Extraction**: Moved inline data transformation logic into local, flat helper methods to clarify the main execution thread.
