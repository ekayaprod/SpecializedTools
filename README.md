# ⚡ Browser Toolkit
[![build: passing](https://img.shields.io/badge/build-passing-brightgreen)](#)

Browser Toolkit is a high-velocity, zero-config utility suite designed to accelerate your workflows directly in the browser. Say goodbye to bloated extensions. These are self-contained, powerful bookmarklets that drop right into your browser and execute instantly.

## 🧰 Included Tools

- **Web Clipper**: Advanced content capture. Select any element on a webpage, clean it up, and save it as a high-fidelity HTML snapshot, Markdown, Text file, or Image (.png). Perfect for clipping articles, recipes, or invoices without the ads.
- **Job Post Clipper**: Extract job descriptions to generate resume tailoring prompts for ATS optimization.
- **Property Clipper**: A specialized research tool for Realtor.com, Zillow, and Redfin. Cleans listing pages (removing ads/popups) to capture raw property data. Generates sophisticated "Investment Analysis" prompts for Gemini, including a "Deep Research Verification Protocol" to audit regulatory risks (Septic vs. Sewer, HOA limits) and estimate CapEx from photos. Output downloads as a clean HTML file ready for LLM ingestion.
- **PA County Finder**: Look up Pennsylvania county information by ZIP code or city. Instantly find PA County/Township for any ZIP or City via highlight or prompt.
- **Quick Clicker V27**: Powerful automation. Single-target auto-clicker with support for delayed start, specific clock time (e.g., 3:00 PM), text input, and maintaining wake lock.
- **Macro Builder V22**: Record & Replay. Record complex sequences of clicks and text inputs to create a custom bookmarklet that replays them automatically. Generates robust, comment-free bookmarklets from your actions.
- **Interaction Recorder**: A debugging tool that logs click targets, Shadow DOM paths, and exports analysis to help troubleshoot automation scripts.
- **Delayed Clicker V5**: Simple, stable timer clicker. Set a delay and a target element.
- **Passphrase Generator**: Creates strong, memorable passwords using seasonal themes (e.g., "ArcticBlueWolf"). Includes a "Temp Password" mode for generating simple, disposable credentials (e.g., "Sunlight1!").

## 🚀 Installation
1. Visit the GitHub Pages deployment of this repository.
2. Drag the buttons to your bookmarks bar.
3. Click and run. It's that simple.

## ⚙️ Development & Scripts
The repository is managed via standard npm commands:

- `npm run format`: Formats code using Prettier (`prettier --write .`).
- `npm run lint`: Analyzes and type-checks code (`eslint . && tsc --noEmit`).
- `npm run pretest`: Automatically runs the linter before tests.
- `npm test`: Executes the test suite (`node scripts/run_tests.js`).
- `npm run verify-links`: Validates markdown links (`python3 scripts/verify_links.py`).

*Ensure you are using Node 18+ to build and test this project.*
