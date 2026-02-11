(function(w) {
    /* Shared Random Buffer */
    const BUFFER_SIZE = 256;
    const r = new Uint32Array(BUFFER_SIZE);
    let rIdx = BUFFER_SIZE;

    w.BookmarkletUtils = {
        sanitizeFilename: function(s) {
            /* Replace non-alphanumeric characters with underscores and truncate */
            return (s || 'export').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        },
        downloadFile: function(filename, content, type) {
            /* Create blob and download link */
            var blob = new Blob([content], { type: type || 'text/html' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            /* Revoke URL after short delay to free memory */
            setTimeout(function() { URL.revokeObjectURL(url); }, 100);
        },
        getRand: function(m) {
            if (rIdx >= BUFFER_SIZE) {
                window.crypto.getRandomValues(r);
                rIdx = 0;
            }
            return r[rIdx++] % m;
        }
    };
})(window);
