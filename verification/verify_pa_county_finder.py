from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Load the local HTML file
    page.goto(f"file://{os.getcwd()}/verification/index.html")

    # Read the bookmarklet code
    with open('bookmarklets/pa-county-finder.js', 'r') as f:
        code = f.read()

    # Inject the bookmarklet
    # We wrap it in an eval or just add a script tag
    page.evaluate(code)

    # Wait for the overlay to appear
    overlay = page.locator('.pa-overlay')
    overlay.wait_for(state='visible')

    # Take a screenshot of the initial state
    page.screenshot(path='verification/pa_county_finder_initial.webp')
    print("📸 Initial state screenshot saved to verification/pa_county_finder_initial.webp")

    # Type a ZIP code
    page.fill('.pa-input', '17301')

    # Click search
    page.click('.pa-btn-primary')

    # Wait for result
    result = page.locator('#pa-result')
    result.wait_for(state='visible')

    # Take a screenshot of the result
    page.screenshot(path='verification/pa_county_finder_result.webp')
    print("📸 Result state screenshot saved to verification/pa_county_finder_result.webp")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
