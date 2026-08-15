const { execSync } = require('child_process');
const fs = require('fs');

const editor = 'C:\\Program Files\\MetaTrader 5\\metaeditor64.exe';
const target = 'Fibbo_Sniper_v28.5_H2.mq5';
const logFile = 'compile_audit.log';

try {
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
    execSync(`"${editor}" /compile:${target} /log:${logFile}`);
} catch(e) {
    // metaeditor may exit with code 0 or 1
}

if (fs.existsSync(logFile)) {
    const buf = fs.readFileSync(logFile);
    const text = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.toString('utf16le') : buf.toString('utf8');
    console.log('=== COMPILER OUTPUT ===\n' + text);
} else {
    console.log('No log generated.');
}
