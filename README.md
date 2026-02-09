# Browser Toolkit

A collection of utility bookmarklets for web development and content management.

## Included Tools

1.  **Target & Edit**: Visually select any element on a webpage, edit it in a clean popup, and download the result as an HTML file.
2.  **Passphrase Generator**: Creates strong, memorable passwords using seasonal themes (e.g., "WinterBlueWolf").
3.  **Temp Password**: Generates simple temporary passwords (e.g., "Sunlight1!").
4.  **PA County Finder**: Look up Pennsylvania county information by ZIP code or city.
5.  **Property Clipper**: A specialized research tool for Realtor.com, Zillow, and Redfin.
    * **Function**: Cleans listing pages (removing ads/popups) to capture raw property data.
    * **Prompt Engine**: Generates sophisticated "Investment Analysis" prompts for Gemini (comparing Septic vs. Sewer, HOA risks, and CapEx).
    * **Output**: Downloads a clean HTML file ready for LLM ingestion.

## Installation

1.  Visit the [GitHub Pages deployment](https://<your-username>.github.io/browser-toolkit/) of this repository.
2.  Drag the buttons to your bookmarks bar.

## Architecture

* `index.html`: The landing page that fetches and compiles the bookmarklets.
* `bookmarklets/`: Source code for each tool.
