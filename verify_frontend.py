from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:8080/index.html")

        # Wait for the bookmarklets to be compiled and loaded
        # The text changes from "Loading..." to the bookmarklet name.
        # Let's wait for "Web Clipper"
        page.wait_for_selector("text=Web Clipper", timeout=5000)

        # Get the href of the button
        href = page.get_attribute("#btn-web-clipper", "href")

        print(f"Href length: {len(href)}")
        if href.startswith("javascript:"):
            print("Success: Href starts with javascript:")
        else:
            print(f"Error: Href does not start with javascript:. Starts with {href[:20]}")

        # Check that it doesn't contain block comments (simple check)
        if "/*" in href:
            print("Error: Href contains block comments")
        else:
            print("Success: Href does not contain block comments")

        # Check that newlines are preserved (encoded as %0A)
        if "%0A" in href:
            print("Success: Href contains encoded newlines (%0A)")
        else:
            print("Error: Href does not contain encoded newlines (%0A)")

        page.screenshot(path="verification_screenshot_http_2.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
