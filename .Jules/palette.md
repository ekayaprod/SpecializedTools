## 2024-05-23 - Bookmarklet UI Pattern
**Learning:** For bookmarklets, replacing native `alert/prompt` with a custom DOM overlay requires careful z-indexing (99999+) and scope isolation (IIFE) to avoid conflicts with host pages.
**Action:** Use the established overlay pattern (fixed div, white card, shadow) for all future bookmarklet interactions.

## 2025-02-10 - Copy Button for Bookmarklets
**Learning:** Users often struggle to drag-and-drop bookmarklets on certain devices or contexts. Providing a "Copy Code" button is a critical accessibility fallback.
**Action:** Always include a way to manually copy the javascript code for bookmarklets alongside the drag handle.
