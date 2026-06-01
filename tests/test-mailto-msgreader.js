const fs = require('fs');
const path = require('path');
const assert = require('assert');

const codePath = path.join(__dirname, '../mailto-link-generator/js/msgreader.js');
let code = fs.readFileSync(codePath, 'utf8');

// Strip export statement for eval
code = code.replace(/export \{ MsgReader \};/g, '');

const mockConsole = {
    error: () => {},
    warn: () => {},
    log: () => {}
};

const wrappedCode = `
    const { console } = arguments[0];
    ${code}
    return { MsgReader };
`;

const { MsgReader } = new Function(wrappedCode)({ console: mockConsole });

function createBuffer(str) {
    const encoder = new TextEncoder();
    const view = encoder.encode(str);
    return view.buffer;
}

console.log('Running MsgReader Tests...');

// Test 1: Parse simple EML
{
    const emlStr = `To: test@example.com\r\nSubject: Hello World\r\n\r\nThis is a test.`;
    const buffer = createBuffer(emlStr);
    const parsed = MsgReader.read(buffer);

    assert.strictEqual(parsed.subject, 'Hello World', 'Subject should match');
    assert.strictEqual(parsed.body, 'This is a test.', 'Body should match');
    assert.deepStrictEqual(parsed.recipients, [
        { name: '', email: 'test@example.com', recipientType: 1 }
    ], 'Recipients should match');
    console.log('✅ Test 1: Simple EML Passed');
}

// Test 2: Parse EML with multiple recipients (To and CC)
{
    const emlStr = `To: Alice <alice@test.com>, Bob <bob@test.com>\r\nCc: Charlie <charlie@test.com>\r\nSubject: Test CC\r\n\r\nBody`;
    const buffer = createBuffer(emlStr);
    const parsed = MsgReader.read(buffer);

    const emails = parsed.recipients.map(r => r.email).sort();
    assert.deepStrictEqual(emails, ['alice@test.com', 'bob@test.com', 'charlie@test.com'], 'Should extract all emails');

    const cc = parsed.recipients.find(r => r.email === 'charlie@test.com');
    assert.strictEqual(cc.recipientType, 2, 'Charlie should be CC');
    console.log('✅ Test 2: EML Multiple Recipients Passed');
}

// Test 3: Parse EML Quoted-Printable (MsgReader's _scanBufferForMimeText doesn't support complex mime bodies/html right now)
// Instead let's test what parseMime actually does (it scans for To, Cc, Subject, and Bcc and extracts body directly below headers).
{
    const emlStr = `To: test2@example.com\r\nBcc: Secret <secret@test.com>\r\nSubject: Bcc Test\r\n\r\nSecret body`;
    const buffer = createBuffer(emlStr);
    const parsed = MsgReader.read(buffer);

    assert.strictEqual(parsed.body, 'Secret body', 'Plain body should match');
    const bcc = parsed.recipients.find(r => r.email === 'secret@test.com');
    assert.strictEqual(bcc.recipientType, 3, 'Secret should be BCC');
    console.log('✅ Test 3: EML Bcc Passed');
}

// Test 4: getFieldValue
{
    const emlStr = `To: test@example.com\r\nSubject: Hello World\r\n\r\nThis is a test.`;
    const buffer = createBuffer(emlStr);
    const parsed = MsgReader.read(buffer);

    assert.strictEqual(parsed.getFieldValue('subject'), 'Hello World', 'getFieldValue subject');
    assert.strictEqual(parsed.getFieldValue('body'), 'This is a test.', 'getFieldValue body');
    assert.deepStrictEqual(parsed.getFieldValue('recipients'), [{ name: '', email: 'test@example.com', recipientType: 1 }], 'getFieldValue recipients');
    console.log('✅ Test 4: getFieldValue Passed');
}

console.log('All MsgReader tests passed!');
