# ⚡ Browser Toolkit
[![build: passing](https://img.shields.io/badge/build-passing-brightgreen)](#)

Browser Toolkit is a high-velocity, zero-config utility suite designed to accelerate your workflows directly in the browser. Say goodbye to bloated extensions. These are self-contained, powerful bookmarklets that drop right into your browser and execute instantly.

## 🧰 Included Tools

- **Web Clipper**: Universal content capture. Snapshot articles, recipes, or invoices as clean HTML/Markdown.
- **Job Post Clipper**: Extract job descriptions to generate resume tailoring prompts for ATS optimization.
- **Property Clipper**: Research tool for Zillow/Redfin. Extracts hidden data and generates AI analysis prompts.
- **PA County Finder**: Instantly find PA County/Township for any ZIP or City via highlight or prompt.
- **Quick Clicker V27**: Powerful automation. Schedule clicks (Delay/Clock), fill forms, and maintain wake lock.
- **Macro Builder V22**: Record & Replay. Generate robust, comment-free bookmarklets from your actions.
- **Interaction Recorder**: Troubleshoot automation. Captures clicks, Shadow DOM paths, and exports analysis.
- **Delayed Clicker V5**: Simple, stable timer clicker. Set a delay and a target element.
- **Passphrase Generator**: Create unbreakable, memorable passwords. Includes temporary disposable mode.

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
