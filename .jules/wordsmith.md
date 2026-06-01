# ✏️ Wordsmith's Journal

## Voice & Tone Patterns

- **Active Voice:** Using imperative verbs for buttons (e.g., "Select Photos" instead of "Photo Strategy").
- **Conciseness:** Removing redundant words (e.g., "Generate PDF" -> "PDF").
- **Clarity:** Expanding abbreviations where space permits (e.g., "Pos" -> "Position").
- **Consistency:** Ensuring consistent capitalization and terminology across tools.

## Inconsistent Terminology Found

- "Download" vs "Save as File" (Standardizing on "Save as File" for file exports to distinguish from "Copy").
- "Refresh" vs "Regenerate" (Standardizing on "Regenerate" for creating new content).

## Audit Log

- [x] Microcopy: Global Audit
## Wordsmith — The Brand Voice
**Learning:** When correcting UI strings such as `showToast`, ensure that accessibility requirements are strictly maintained. Specifically, the "ARIA Exclusivity Rule" dictates that `aria-label` attributes should only be placed on elements that lack visible, readable text (i.e., icon-only buttons). For buttons that do have text, an `aria-label` is redundant and can confuse screen readers; therefore, they should be stripped. Test validations may still point to internal components without relying on precise English text strings if they assert against element classes or IDs instead, meaning UI text changes might not immediately break tests.
**Action:** Always cross-reference the presence of visible button text against the `aria-label` attribute when reviewing semantic labeling. Remove redundant `aria-labels` and ensure that all user-facing success, error, or generic empty state prompts default to an active, empathetic, and actionable tone (e.g., transforming "Unable to load data" into "We could not load your data. Please try again.").
