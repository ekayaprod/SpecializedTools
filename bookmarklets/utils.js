/* SHARED BUFFERED RNG UTILS */
const BUFFER_SIZE = 256;
const r = new Uint32Array(BUFFER_SIZE);
let rIdx = BUFFER_SIZE;
function getRand(m) {
    if (rIdx >= BUFFER_SIZE) {
        window.crypto.getRandomValues(r);
        rIdx = 0;
    }
    return r[rIdx++] % m;
}
function R(a) { return a[getRand(a.length)]; }
