Browser Toolkit

A collection of utility bookmarklets for web development and content management.

Included Tools

Web Clipper: Advanced content capture. Select any element on a webpage, clean it up, and save it as a high-fidelity HTML snapshot, Markdown, Text file, or Image (.png). Perfect for clipping articles, recipes, or invoices without the ads.

Property Clipper: A specialized research tool for Realtor.com, Zillow, and Redfin.

Function: Cleans listing pages (removing ads/popups) to capture raw property data.

Prompt Engine: Generates sophisticated "Investment Analysis" prompts for Gemini. Includes a "Deep Research Verification Protocol" to audit regulatory risks (Septic vs. Sewer, HOA limits) and estimate CapEx from photos.

Output: Downloads a clean HTML file ready for LLM ingestion.

Passphrase Generator: Creates strong, memorable passwords using seasonal themes (e.g., "WinterBlueWolf"). Includes a "Temp Password" mode for generating simple, disposable credentials (e.g., "Sunlight1!").

PA County Finder: Look up Pennsylvania county information by ZIP code or city.

Automation Tools: Advanced browser automation utilities.

Quick Clicker: Single-target auto-clicker with support for delayed start, specific clock time (e.g., 3:00 PM), and text input.

Macro Builder: Record complex sequences of clicks and text inputs to create a custom bookmarklet that replays them automatically.

Interaction Recorder: A debugging tool that logs click targets and their attributes to help troubleshoot automation scripts.

Installation

1. Visit the GitHub Pages deployment of this repository (typically `https://<username>.github.io/<repo-name>`).
   - *Note: If you are the owner, ensure GitHub Pages is enabled in Settings > Pages.*
2. Drag the buttons to your bookmarks bar.

Architecture

index.html: The landing page that fetches and compiles the bookmarklets.

bookmarklets/: Source code for each tool.
