const fs = require('fs');
const path = require('path');

const testerPath = 'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester\\teste.set';
const localSetPath = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\teste.set';

[testerPath, localSetPath].forEach(p => {
  if (fs.existsSync(p)) {
    const buf = fs.readFileSync(p);
    let str = '';
    if (buf[0] === 0xff && buf[1] === 0xfe) {
      str = buf.toString('utf16le');
    } else {
      str = buf.toString('utf8');
    }
    console.log(`=== FILE: ${p} ===`);
    const lines = str.split(/\r?\n/);
    lines.filter(l => l.includes('InpTF') || l.includes('TF')).forEach(l => console.log(l));
  } else {
    console.log(`File not found: ${p}`);
  }
});
