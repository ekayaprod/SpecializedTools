from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to index.html
    print("Navigating to http://localhost:8000/index.html")
    page.goto("http://localhost:8000/index.html")

    # Wait for bookmarklet buttons to appear (they are loaded dynamically)
    # The 'Loading...' text is replaced by the bookmarklet name upon success.
    try:
        # Wait for "Web Clipper" to appear in a bookmarklet button
        # This confirms that fetchWithRetry worked and the code was compiled.
        page.wait_for_selector("a.bookmarklet-btn:has-text('Web Clipper')", timeout=10000)
        print("✅ Web Clipper loaded successfully.")
    except Exception as e:
        print(f"❌ Web Clipper failed to load: {e}")

        # Check for console errors
        # (Playwright doesn't capture console logs by default unless listened to,
        # but we can't easily do that in sync mode without setup.
        # We'll rely on visual inspection of error state if screenshot shows red buttons.)

    # Screenshot
    page.screenshot(path="verification/index_frontend.png", full_page=True)
    print("Screenshot saved to verification/index_frontend.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
