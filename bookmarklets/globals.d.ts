export {};

declare global {
    interface Window {
        JSZip: any;
        BookmarkletUtils: any;
        TEMP_PASSWORD_CONFIG: any;
    }

    const JSZip: any;
    const BookmarkletUtils: any;
    const html2canvas: any;
}
