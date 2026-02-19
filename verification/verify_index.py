from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to index.html...")
        page.goto("http://localhost:8080/index.html")

        print("Waiting for tools to load...")
        # Check if the loading state is gone (Web Clipper button should have text "Web Clipper", not "Loading...")
        # The button has id "btn-web-clipper"

        try:
            # Wait for text "Web Clipper" inside the button
            page.locator("#btn-web-clipper").get_by_text("Web Clipper").wait_for(timeout=5000)
            print("✅ Tools loaded successfully!")
        except Exception as e:
            print(f"❌ Failed to load tools: {e}")
            page.screenshot(path="verification/failed_load.png")
            browser.close()
            return

        # Take screenshot of the grid
        page.screenshot(path="verification/index_loaded.png", full_page=True)
        print("📸 Screenshot saved to verification/index_loaded.png")

        browser.close()

if __name__ == "__main__":
    run()
