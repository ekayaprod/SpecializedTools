export {};

declare global {
    interface Window {
        JSZip: any;
        BookmarkletUtils: any;
        TEMP_PASSWORD_CONFIG: any;
        html2pdf: any;
    }

    const JSZip: any;
    const BookmarkletUtils: any;
    const html2canvas: any;
    const html2pdf: any;
}
