# Macro Builder 🤖

The **Macro Builder** is a powerful visual automation tool that allows you to record, edit, and export sequences of user interactions (clicks, text input) as standalone bookmarklets.

## Overview

Designed for power users and developers, Macro Builder eliminates the need for manual repetition of complex workflows. Whether you're filling out repetitive forms, navigating through multi-step wizards, or automating daily administrative tasks, Macro Builder captures your actions and packages them into a single click.

## Features

-   **Visual Element Picker**: Select elements directly on the page with a highlighter.
-   **Shadow DOM Support**: Seamlessly pierces through Shadow DOM boundaries to find deeply nested elements.
-   **Sequence Recording**: Record multiple steps, each containing multiple actions.
-   **Text Input Automation**:
    -   **Static Values**: Record hardcoded text.
    -   **Runtime Prompts**: Ask the user for input when the macro runs.
    -   **Secure Password Handling**: Mark inputs as sensitive to prevent saving passwords in the bookmarklet code.
-   **Configurable Delays**: Set custom wait times between steps.
-   **Standalone Export**: Compiles your macro into a completely self-contained `javascript:` URI that runs without external dependencies (other than the browser environment).

## Usage Guide

### 1. Launching the Builder
Click the **Macro Builder** bookmarklet. A control panel will appear in the top-right corner of the screen.

### 2. Recording a Sequence
1.  Click **➕ Add Sequence**.
2.  Confirm the prompt to start picking.
3.  Hover over the element you want to interact with. The purple highlighter will show the selection.
4.  **Click** the element to select it.
    -   **For Buttons/Links**: The action is recorded immediately.
    -   **For Inputs**: You will be prompted to:
        -   Enter a value (or leave empty to just click).
        -   Mark as sensitive (if it's a password).
        -   Confirm if "Enter" should be pressed after typing.
5.  A preview dialog will appear confirming the tag and selector. Click **Confirm** to save the step or **Retry** to pick again.
6.  You can continue picking more elements for the same sequence or click **Cancel** on the "Pick another?" prompt to finish the current sequence.

### 3. Managing Steps
-   **Reorder**: (Currently, steps are executed in the order recorded).
-   **Delays**: Adjust the "Wait(s)" input for each step to ensure the page has time to load between actions.
-   **Delete**: Click the **✕** button next to a step to remove it.

### 4. Exporting
1.  Click **⚡ Export**.
2.  Drag the **🤖 Macro** button from the export area to your bookmarks bar.
3.  **Rename** the new bookmarklet to something descriptive (e.g., "Login to Admin").

## Architecture

The Macro Builder operates in two distinct phases: **Builder** and **Runtime**.

### The Builder (`MacroBuilder` Class)
-   **Role**: Recording and Configuration.
-   **Mechanism**: Uses global event listeners to intercept clicks. It generates robust CSS selectors (`getSel`) by analyzing class names, IDs, and ARIA labels.
-   **Isolation**: The UI runs inside a Shadow DOM (`#mb-xxxx`) to prevent CSS conflicts with the host page.

### The Runtime (`MacroRuntime` Class)
-   **Role**: Execution.
-   **Mechanism**: The `compile()` method takes the recorded `steps` array and embeds it into a template literal.
-   **Execution Flow**:
    1.  **Initialization**: Creates a visual overlay to show progress.
    2.  **Wake Lock**: Requests a screen wake lock to prevent the device from sleeping during long macros.
    3.  **Step Iteration**:
        -   Waits for the specified delay.
        -   **Polling**: Uses `find()` to poll the DOM (up to 15 seconds) until the target element appears. This makes the macro resilient to network lag.
        -   **Action**: Dispatches synthetic `MouseEvent` and `KeyboardEvent`s to simulate user interaction.
    4.  **Completion**: Auto-destroys the runtime overlay after finishing.

## Technical Details

### Selector Strategy
The builder uses a heuristic approach to generate selectors:
1.  **Presence Buttons**: Specific handling for internal "presence" state buttons.
2.  **ARIA Labels**: Prioritized for accessibility-friendly apps.
3.  **IDs**: Used if they don't look like generated hashes (no digits).
4.  **Classes**: specific utility classes (e.g., `.menu-selector`).
5.  **Structural**: Fallback to `tag:nth-child` path if no unique attributes are found.

### Security
-   **PII Redaction**: All internal logs redact keys like `password`, `token`, `auth`.
-   **No Storage**: Passwords typed during recording are **NOT** stored in the exported bookmarklet if marked as "Sensitive". Instead, the macro will prompt you for the password *each time it runs*.

### Dependencies
-   **Builder**: Requires `bookmarklets/utils.js` for `BookmarkletUtils` (Shadow DOM, Logging).
-   **Runtime**: **Zero dependencies**. The exported code includes all necessary logic to run independently.
