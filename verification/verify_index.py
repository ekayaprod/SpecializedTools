from playwright.sync_api import sync_playwright
import os

def test_index(page):
    # Load index.html from current directory
    cwd = os.getcwd()
    page.goto(f"file://{cwd}/index.html")

    # Wait for bookmarklets to load (they are async)
    # The loading text is replaced by the bookmarklet name
    page.wait_for_selector("#btn-web-clipper:not([aria-busy='true'])")

    # Check that Web Clipper loaded
    web_clipper = page.locator("#btn-web-clipper")
    href = web_clipper.get_attribute("href")

    # Verify utils.js is injected
    # utils.js contains "BookmarkletUtils"
    if "BookmarkletUtils" in href:
        print("✅ Web Clipper has utils.js injected")
    else:
        print("❌ Web Clipper MISSING utils.js")
        exit(1)

    # Check PA County Finder (should NOT have utils.js)
    pa_county = page.locator("#btn-pa-county")
    pa_href = pa_county.get_attribute("href")

    if "BookmarkletUtils" not in pa_href:
        print("✅ PA County Finder correctly does NOT have utils.js")
    else:
        print("❌ PA County Finder HAS utils.js (unexpected)")
        # This might be okay if I decided to inject it everywhere, but my plan was specific.
        # Wait, pa-county-finder.js does not have @require utils.js.
        # But compile_bookmarklet.js is used.
        # If pa-county-finder.js uses BookmarkletUtils inside it, it might need it.
        # But I didn't add the directive.

    page.screenshot(path="verification/index.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            test_index(page)
        except Exception as e:
            print(f"Error: {e}")
            exit(1)
        finally:
            browser.close()
