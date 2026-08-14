const fs = require('fs');

const fileBuffer = fs.readFileSync('c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5');
console.log('Buffer header bytes:', fileBuffer.subarray(0, 10));

let text = '';
if (fileBuffer[0] === 0xff && fileBuffer[1] === 0xfe) {
  text = fileBuffer.toString('utf16le');
  console.log('Detected UTF-16LE encoding!');
} else {
  text = fileBuffer.toString('utf8');
  console.log('Detected UTF-8 / ASCII encoding!');
}

console.log('Total characters:', text.length);
console.log('Contains OnInit?', text.includes('OnInit'));
console.log('Contains AutoSelecionarTF?', text.includes('AutoSelecionarTF'));

// Let's find lines with inputs
const lines = text.split('\n');
console.log('\n--- First 30 lines of text ---');
lines.slice(0, 30).forEach((l, i) => console.log(`${i+1}: ${l.substring(0, 80)}`));
