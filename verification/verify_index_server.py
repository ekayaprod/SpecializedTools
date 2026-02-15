import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright
import os

PORT = 8000

def run_server():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def test_index(page):
    page.goto(f"http://localhost:{PORT}/index.html")

    # Wait for bookmarklets to load
    page.wait_for_selector("#btn-web-clipper:not([aria-busy='true'])")

    # Check that Web Clipper loaded
    web_clipper = page.locator("#btn-web-clipper")
    href = web_clipper.get_attribute("href")

    if "BookmarkletUtils" in href:
        print("✅ Web Clipper has utils.js injected")
    else:
        print("❌ Web Clipper MISSING utils.js")
        exit(1)

    # Check PA County Finder
    pa_county = page.locator("#btn-pa-county")
    pa_href = pa_county.get_attribute("href")

    if "BookmarkletUtils" not in pa_href:
        print("✅ PA County Finder correctly does NOT have utils.js")
    else:
        print("❌ PA County Finder HAS utils.js (unexpected)")

    page.screenshot(path="verification/index_server.png")

if __name__ == "__main__":
    # Start server in background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

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
