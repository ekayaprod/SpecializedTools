from playwright.sync_api import sync_playwright
import time
import urllib.parse

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Load via HTTP
        url = "http://localhost:8000/index.html"
        print(f"Loading {url}")
        page.goto(url)

        # Wait for button to change from "Loading..."
        try:
            btn = page.locator("#btn-web-clipper")
            btn.wait_for(state="visible")

            # Wait for text to update (it says "Web Clipper")
            # The initial text is "Loading..."
            # Wait until it is NOT "Loading..."
            page.wait_for_function("document.getElementById('btn-web-clipper').textContent !== 'Loading...'")

            print("Button text updated.")

            # Verify href
            href = btn.get_attribute("href")
            if not href.startswith("javascript:"):
                 print(f"❌ href does not start with javascript:. Got: {href}")
            else:
                 print("✅ href starts with javascript:")

                 decoded = urllib.parse.unquote(href)
                 if "BookmarkletUtils" in decoded:
                     print("✅ utils.js injected (verified in decoded href)")
                 else:
                     # Maybe utils.js is not needed for web-clipper?
                     # web-clipper.js source has `/** @require utils.js */`?
                     # Let's check if it's there.
                     print(f"⚠️ 'BookmarkletUtils' NOT found in decoded href. Length: {len(decoded)}")
                     # Print first 100 chars
                     print(f"First 100 chars: {decoded[:100]}")

            page.screenshot(path="verification/index_verified.png")
            print("Screenshot saved to verification/index_verified.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")

        browser.close()

if __name__ == "__main__":
    run()
