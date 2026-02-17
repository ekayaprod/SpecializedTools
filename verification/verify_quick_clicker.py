import os
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Load a simple page
        page.set_content("""
        <!DOCTYPE html>
        <html>
        <head><title>Quick Clicker Verification</title></head>
        <body style="background: #f0f0f0; padding: 20px;">
            <h1>Quick Clicker Test</h1>
            <button id="target-btn" style="padding: 20px; font-size: 20px;">Click Me!</button>
        </body>
        </html>
        """)

        with open('bookmarklets/quick-clicker.js', 'r') as f:
            bookmarklet_code = f.read()

        page.evaluate(bookmarklet_code)

        expect(page.get_by_text("QUICK CLICKER V27")).to_be_visible()

        # 1. Test Toast Error
        print("Clicking 'Pick Target'...")
        page.get_by_role("button", name="Pick Target").click()

        print("Picking target button...")
        page.locator('#target-btn').click()

        start_btn = page.get_by_role("button", name="Start")
        expect(start_btn).to_be_enabled()

        print("Setting invalid time...")
        min_input = page.locator('input[placeholder="Minutes"]')
        min_input.fill("-5")

        print("Clicking Start to trigger error...")
        start_btn.click()

        # Verify Error Toast
        toast = page.locator('.toast.error')
        # Check text first to confirm it was updated
        expect(toast).to_contain_text("Invalid Time")

        # Check opacity explicitly
        expect(toast).to_have_css("opacity", "1")

        # Screenshot Error State
        page.screenshot(path="verification/quick_clicker_error.png")
        print("Screenshot saved: verification/quick_clicker_error.png")

        # 2. Test Success
        print("Testing success flow...")
        min_input.fill("0.02")

        start_btn.click()

        expect(page.locator('.timer')).to_be_visible()

        page.wait_for_timeout(2000)

        success_toast = page.locator('.toast.success')
        expect(success_toast).to_contain_text("Automation Complete!")
        expect(success_toast).to_have_css("opacity", "1")

        page.screenshot(path="verification/quick_clicker_success.png")
        print("Screenshot saved: verification/quick_clicker_success.png")

        browser.close()

if __name__ == "__main__":
    run()
