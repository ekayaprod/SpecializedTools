from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:8000...")
            page.goto("http://localhost:8000")

            print("Waiting for tools grid...")
            page.wait_for_selector("#tools-grid")

            # Locate Property Clipper button
            # ID: btn-prop-clipper
            btn = page.locator("#btn-prop-clipper")

            print("Waiting for Property Clipper button to update...")
            # It starts with "Loading...", we want it to become "Property Clipper"
            # We can wait for text "Property Clipper" inside the button
            expect(btn).to_have_text("Property Clipper", timeout=10000)

            print("Button updated successfully!")

            # Take screenshot of the button or the card
            # Let's screenshot the whole grid or at least the card
            # Find the card containing the button
            card = btn.locator("xpath=../..")
            card.screenshot(path="verification/property_clipper_card.png")
            print("Screenshot saved to verification/property_clipper_card.png")

            # Also screenshot the whole page just in case
            page.screenshot(path="verification/index_page.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run()
