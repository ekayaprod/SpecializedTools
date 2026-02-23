## 2026-02-23 - Bookmarklet Prompt Injection
**Learning:** Prompts are stored as individual `.md` files in `bookmarklets/prompts/` and injected into `bookmarklets/prompts/loader.js` via `/* @include_text ... */` comments within template literals. This allows for modular, compile-time prompt management without runtime fetch overhead.
**Action:** When modifying prompt files, verify that the `@include_text` paths in `loader.js` remain correct and that no JS syntax (like backticks) is introduced into the markdown that could break the template literal.
