const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Create a JSDOM instance
const dom = new JSDOM(
    `<!DOCTYPE html>
<body>
    <div id="container" style="position: absolute; top: 100px; left: 100px; width: 200px; height: 200px;">
        <div id="handle" style="width: 200px; height: 20px; background: blue;">Header</div>
        Content
    </div>
</body>
`,
    { url: 'http://localhost/' }
);

global.window = dom.window;
global.document = dom.window.document;
global.MouseEvent = dom.window.MouseEvent;

// Mock RAF
global.requestAnimationFrame = (cb) => {
    setTimeout(cb, 0);
    return 1;
};
global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
};

// Execute utils.js
try {
    eval(utilsCode);
} catch (e) {
    console.error('Error evaluating utils.js:', e);
    process.exit(1);
}

// Verify BookmarkletUtils exists
if (!window.BookmarkletUtils) {
    console.error('BookmarkletUtils not found on window');
    process.exit(1);
}

console.log('Running BookmarkletUtils.makeDraggable tests...');

(async function () {
    try {
        const handle = document.getElementById('handle');
        const target = document.getElementById('container');

        // Mock offsetTop/offsetLeft since JSDOM doesn't calculate layout
        Object.defineProperty(target, 'offsetTop', { get: () => parseInt(target.style.top || 0) });
        Object.defineProperty(target, 'offsetLeft', { get: () => parseInt(target.style.left || 0) });

        // Apply makeDraggable
        window.BookmarkletUtils.makeDraggable(handle, target);

        // Helper to trigger mouse event
        function triggerMouseEvent(el, type, clientX, clientY) {
            const event = new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: clientX,
                clientY: clientY,
            });
            el.dispatchEvent(event);
            return event;
        }

        // Test 1: Mousedown attaches listeners
        {
            console.log('Test 1: Mousedown attaches listeners');

            // Spy on document.addEventListener
            let addedListeners = [];
            const originalAddEventListener = document.addEventListener;
            document.addEventListener = (type, listener) => {
                addedListeners.push(type);
                return originalAddEventListener.call(document, type, listener);
            };

            // Trigger mousedown at (110, 110) - inside handle
            const event = triggerMouseEvent(handle, 'mousedown', 110, 110);

            assert.ok(addedListeners.includes('mousemove'), 'Should add mousemove listener');
            assert.ok(addedListeners.includes('mouseup'), 'Should add mouseup listener');
            assert.ok(event.defaultPrevented, 'Should prevent default on mousedown');

            // Restore spy
            document.addEventListener = originalAddEventListener;
            console.log('✅ Mousedown listeners attached');
        }

        // Test 2: Mousemove updates position
        {
            console.log('Test 2: Mousemove updates position');

            // Initial position is top: 100px, left: 100px
            // We started drag at 110, 110.
            // Move to 120, 130.
            // Delta X = 120 - 110 = 10
            // Delta Y = 130 - 110 = 20
            // New Left = 100 + 10 = 110? No wait, let's trace the math in makeDraggable
            /*
                pos3 = e.clientX; // start 110
                pos4 = e.clientY; // start 110

                elementDrag:
                pos1 = pos3 - e.clientX; // 110 - 120 = -10
                pos2 = pos4 - e.clientY; // 110 - 130 = -20
                pos3 = e.clientX; // 120
                pos4 = e.clientY; // 130

                target.style.top = (target.offsetTop - pos2) + "px"; // 100 - (-20) = 120
                target.style.left = (target.offsetLeft - pos1) + "px"; // 100 - (-10) = 110
            */

            triggerMouseEvent(document, 'mousemove', 120, 130);

            // Wait for RAF
            await new Promise(resolve => setTimeout(resolve, 10));

            assert.strictEqual(target.style.top, '120px', 'Top position should update');
            assert.strictEqual(target.style.left, '110px', 'Left position should update');

            console.log('✅ Position updated correctly');
        }

        // Test 3: Mouseup removes listeners
        {
            console.log('Test 3: Mouseup removes listeners');

            // Spy on document.removeEventListener
            let removedListeners = [];
            const originalRemoveEventListener = document.removeEventListener;
            document.removeEventListener = (type, listener) => {
                removedListeners.push(type);
                return originalRemoveEventListener.call(document, type, listener);
            };

            triggerMouseEvent(document, 'mouseup', 120, 130);

            assert.ok(removedListeners.includes('mousemove'), 'Should remove mousemove listener');
            assert.ok(removedListeners.includes('mouseup'), 'Should remove mouseup listener');

            document.removeEventListener = originalRemoveEventListener;
            console.log('✅ Listeners removed');
        }

        // Test 4: Dragging no longer works after mouseup
        {
            console.log('Test 4: Dragging stops after mouseup');

            // Move mouse again to 150, 150
            triggerMouseEvent(document, 'mousemove', 150, 150);

            // Should stay at 120px, 110px
            assert.strictEqual(target.style.top, '120px', 'Top should not change after mouseup');
            assert.strictEqual(target.style.left, '110px', 'Left should not change after mouseup');

            console.log('✅ Dragging stopped correctly');
        }

        console.log('All tests passed!');
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
})();
