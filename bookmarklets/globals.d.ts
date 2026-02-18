export {};

declare global {
    interface BookmarkletUtilsInterface {
        /**
         * Creates a DOM element with specified properties.
         * @param {string} tag - The tag name of the element.
         * @param {Object} [styles={}] - The style object to apply.
         * @param {string} [text=''] - The text content of the element.
         * @param {HTMLElement|null} [parent=null] - The parent element to append to.
         * @param {Object} [props={}] - Additional properties to assign to the element.
         * @returns {HTMLElement} The created element.
         */
        buildElement(tag: string, styles?: Record<string, string>, text?: string, parent?: HTMLElement | null, props?: Record<string, string | number | boolean | Function | null | undefined>): HTMLElement;

        /**
         * Shows a toast notification.
         * @param {string} message - The message to display.
         * @param {'info'|'success'|'error'} [type='info'] - The type of notification.
         * @param {number} [duration=3000] - Duration in ms before auto-dismissing.
         */
        showToast(message: string, type?: 'info' | 'success' | 'error', duration?: number): void;

        /**
         * Cleans a string to be safe for use as a filename.
         * Truncates to 50 chars and replaces special chars with underscores.
         *
         * @param {string|number} s - The input string (e.g., page title).
         * @returns {string} Safe filename string.
         */
        sanitizeFilename(s: string | number): string;

        /**
         * Triggers a download of a file with the given content.
         *
         * @param {string} filename - The name of the file to download.
         * @param {string} content - The content of the file.
         * @param {string} [type='text/html'] - The MIME type of the file.
         * @returns {void}
         */
        downloadFile(filename: string, content: string, type?: string): void;

        /**
         * Loads an external script (library) dynamically if not already present.
         *
         * @param {string} globalVar - The global variable name to check (e.g., 'jspdf').
         * @param {string} url - The URL of the script.
         * @param {string} [integrity] - Optional SRI hash.
         * @param {number} [retries=3] - Number of retry attempts.
         * @param {number} [initialDelay=1000] - Initial delay in ms before first retry.
         * @returns {Promise<void>} Resolves when loaded or already present.
         */
        loadLibrary(globalVar: string, url: string, integrity?: string, retries?: number, initialDelay?: number): Promise<void>;

        /**
         * Stabilizes images for export by resolving lazy loading attributes (data-src)
         * and selecting the highest resolution candidate from srcset.
         * Processes in chunks to avoid blocking the UI.
         *
         * @param {HTMLElement} root - The root element to scan for images.
         * @param {function(number): void} [onProgress] - Callback reporting processed count.
         * @returns {Promise<void>}
         */
        normalizeImages(root: HTMLElement, onProgress?: (count: number) => void): Promise<void>;

        /**
         * Recursively removes dangerous attributes (event handlers, javascript: URIs)
         * from a root element and all its descendants to prevent XSS.
         *
         * @param {HTMLElement} root - The root element to sanitize.
         * @returns {void}
         */
        sanitizeAttributes(root: HTMLElement): void;

        /**
         * Asynchronously applies computed styles from a source element to a target element.
         * Processes elements in chunks to avoid blocking the main thread.
         *
         * @param {HTMLElement} source - The original DOM element.
         * @param {HTMLElement} target - The cloned element.
         * @param {function(number): void} [onProgress] - Callback reporting processed count.
         * @returns {Promise<void>}
         */
        inlineStylesAsync(source: HTMLElement, target: HTMLElement, onProgress?: (count: number) => void): Promise<void>;

        /**
         * Converts an HTML string to Markdown format.
         *
         * @param {string} html - The HTML string to convert.
         * @returns {string} The Markdown representation.
         */
        htmlToMarkdown(html: string): string;

        /**
         * Escapes HTML characters in a string.
         *
         * @param {string|number} s - The input string (e.g., page title).
         * @returns {string} The escaped string.
         */
        escapeHtml(s: string | number): string;

        Prompts?: {
            STANDARD_OUTPUTS: string;
            PROMPT_DATA: Record<string, {
                label: string;
                role: string;
                objective: string;
                noStandardOutput?: boolean;
            }>;
        };
    }

    interface Window {
        JSZip: any;
        BookmarkletUtils: BookmarkletUtilsInterface;
        jspdf: any;
        __dc_v27: any;
        dc_running: any;
        __ir_v1: any;
        __mb_v22: any;
        __mb_run: any;
        __wc_instance: any;
    }

    const JSZip: any;
    const BookmarkletUtils: BookmarkletUtilsInterface;
    const html2canvas: any;
}
