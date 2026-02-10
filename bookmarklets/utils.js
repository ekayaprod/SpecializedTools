/* UTILITIES for Bookmarklets */
(function(w) {
    w.BookmarkletUtils = w.BookmarkletUtils || {
        sanitizeFilename: function(s) {
            return (s || 'snippet').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        },
        triggerDownload: function(f, c, t) {
            var b = new Blob([c], { type: t || 'text/html' });
            var u = URL.createObjectURL(b);
            var a = document.createElement('a');
            a.href = u;
            a.download = f;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            /* Revoke after a short delay */
            setTimeout(function() { w.URL.revokeObjectURL(u); }, 100);
        }
    };
})(window);
