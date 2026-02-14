import os
import time
from playwright.sync_api import sync_playwright

def verify_ux():
    # Paths
    repo_root = os.getcwd()
    utils_path = os.path.join(repo_root, 'bookmarklets', 'utils.js')
    clipper_path = os.path.join(repo_root, 'bookmarklets', 'web-clipper.js')
    html_path = os.path.join(repo_root, 'tests', 'test_page.html')

    # Create test HTML
    with open(html_path, 'w') as f:
        f.write("""
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
    <style>
        .box { width: 100px; height: 100px; background: red; margin: 10px; }
    </style>
</head>
<body>
    <h1>Test Page</h1>
    <div id="container"></div>
    <script>
        const container = document.getElementById('container');
        for (let i = 0; i < 200; i++) {
            const div = document.createElement('div');
            div.className = 'box';
            div.textContent = 'Box ' + i;
            container.appendChild(div);
        }
    </script>
</body>
</html>
        """)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))

        page.goto(f'file://{html_path}')

        # Inject utils
        with open(utils_path, 'r') as f:
            page.evaluate(f.read())

        # Inject web-clipper
        with open(clipper_path, 'r') as f:
            page.evaluate(f.read())

        print("Scripts injected.")

        # Simulate click
        page.locator('#container').click()

        # Wait for modal
        page.locator('#wc-bookmarklet-modal').wait_for(state='visible', timeout=10000)
        print("Modal visible.")
        page.locator('#wc-bookmarklet-modal').screenshot(path='tests/modal_screenshot.png')

        # Select PNG format
        select = page.locator('#wc-bookmarklet-modal select')
        select.select_option(value='png')

        # Mock html2canvas
        page.evaluate("""
            window.html2canvas = (element) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        const canvas = document.createElement('canvas');
                        canvas.toDataURL = () => 'data:image/png;base64,mock';
                        resolve(canvas);
                    }, 2000);
                });
            };
        """)

        # Find the download button using stable locator
        download_btn = page.locator(".wc-footer button").nth(2)
        print(f"Clicking download button: '{download_btn.text_content()}'")
        download_btn.click()

        # Check text immediately
        time.sleep(0.5)
        current_text = download_btn.text_content()
        print(f"Button text after click: '{current_text}'")

        if "Generating" in current_text:
             print("SUCCESS: Button shows 'Generating...' state.")
             page.locator('#wc-bookmarklet-modal').screenshot(path='tests/generating_screenshot.png')
        else:
             print("FAILURE: Button did not show 'Generating...' state.")
             exit(1)

        # Wait for mock to finish
        time.sleep(2.5)

        final_text = download_btn.text_content()
        print(f"Button text after completion: {final_text}")
        if "Download" in final_text:
             print("SUCCESS: Button reverted to 'Download'.")
        else:
             print(f"FAILURE: Button text is '{final_text}'.")
             exit(1)

        browser.close()
        print("Verification script completed successfully.")

if __name__ == "__main__":
    verify_ux()
