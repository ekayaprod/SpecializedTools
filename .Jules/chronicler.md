# Chronicler's Journal

## Philosophy
This project is built by a solo developer using AI. Documentation acts as the "System Prompt" for the next AI session. If the Roadmap says a feature is "In Progress" when it's done, the next AI model will try to rebuild it.

## Findings
- **Missing Roadmap:** The `ROADMAP.md` file was missing from the repository. I created it to align the project state with the documentation, marking all currently implemented bookmarklets as "Completed".
- **Temp Password Documentation:** The "Temp Password" feature was listed as a separate tool in `README.md`, but inspection of `bookmarklets/passphrase-generator.js` revealed it is a mode within the Passphrase Generator bookmarklet. I updated `README.md` to reflect this nesting, ensuring the documentation matches the code structure.
- **Web Clipper Documentation:** The `README.md` listed "HTML snapshot, Markdown, or Text file" as export formats for Web Clipper, but the code in `bookmarklets/web-clipper.js` clearly implements PNG export via `html2canvas`. I updated the README to include "Image (.png)".
- **Comment Style Violation:** `bookmarklets/web-clipper.js` contained single-line comments (`//`), which violates the project's rule requiring block comments (`/* ... */`) for bookmarklets. I corrected this to prevent potential compilation issues.
- **Roadmap Alignment:** The `README.md` detailed the "Prompt Engine" feature for Property Clipper, but `ROADMAP.md` did not explicitly list it. I aligned the roadmap to reflect this completed feature.

## Actions Taken
- Added JSDoc to `inlineSafeStyles` in `bookmarklets/web-clipper.js` to explain the complex style inlining logic.
- Created `ROADMAP.md` to track completed features.
- Updated `README.md` to correct the tool hierarchy.
- Added JSDoc to `extractAndEmbedGallery` in `bookmarklets/property-clipper.js` to document the image embedding strategy.
- Updated `README.md` to include "Image (.png)" in the Web Clipper features list.
- Replaced single-line comments in `bookmarklets/web-clipper.js` with block comments to adhere to bookmarklet compilation rules.
- Added JSDoc to `htmlToMarkdown` in `bookmarklets/web-clipper.js` to document Markdown conversion logic.
- Updated `ROADMAP.md` to include "Prompt Engine" as a completed feature of Property Clipper.
