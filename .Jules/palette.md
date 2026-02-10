## 2024-05-23 - Bookmarklet UI Pattern
**Learning:** For bookmarklets, replacing native `alert/prompt` with a custom DOM overlay requires careful z-indexing (99999+) and scope isolation (IIFE) to avoid conflicts with host pages.
**Action:** Use the established overlay pattern (fixed div, white card, shadow) for all future bookmarklet interactions.
