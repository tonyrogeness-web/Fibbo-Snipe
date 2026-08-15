const fs = require('fs');

const text = fs.readFileSync('c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

const lines = text.split('\n');
console.log('🔍 Auditando loops while/for no código MQL5...');

lines.forEach((l, i) => {
  if (l.includes('while(') || l.includes('while (')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
