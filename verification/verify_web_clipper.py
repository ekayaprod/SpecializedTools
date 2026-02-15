from playwright.sync_api import sync_playwright
import os
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Load a simple page
    page.set_content("""
        <html>
            <head>
                <title>Test Page</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    .target { border: 1px solid #ccc; padding: 20px; margin: 20px; background: #f9f9f9; }
                    img { max-width: 100%; }
                </style>
            </head>
            <body>
                <h1>Web Clipper Test</h1>
                <div class="target" id="clip-me">
                    <h2>Content to Clip</h2>
                    <p>This is a paragraph of text.</p>
                    <button>A Button</button>
                </div>
            </body>
        </html>
    """)

    # Read bookmarklet code
    with open("bookmarklets/utils.js", "r") as f:
        utils_code = f.read()

    with open("bookmarklets/web-clipper.js", "r") as f:
        clipper_code = f.read()

    # Inject Utils
    page.evaluate(utils_code)

    # Inject Clipper
    # The clipper code is an IIFE that executes immediately.
    page.evaluate(clipper_code)

    # Now the "Finder" should be active.
    # Hover over #clip-me
    page.hover("#clip-me")

    # Click to open editor
    page.click("#clip-me")

    # Wait for modal
    try:
        page.wait_for_selector("#wc-bookmarklet-modal", state="visible", timeout=5000)
    except Exception as e:
        print(f"Error waiting for modal: {e}")
        # Capture screenshot of current state
        page.screenshot(path="verification/error_state.png")
        browser.close()
        return

    # Check for animation class
    modal = page.locator("#wc-bookmarklet-modal")
    # Get class attribute
    classes = modal.get_attribute("class") or ""
    print(f"Modal classes: {classes}")

    if "wc-animate-in" in classes:
        print("SUCCESS: Animation class found.")
    else:
        print("FAILURE: Animation class NOT found.")

    # Screenshot
    page.screenshot(path="verification/web_clipper_modal.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
