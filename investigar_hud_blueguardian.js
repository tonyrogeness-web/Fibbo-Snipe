const fs = require('fs');

const text = fs.readFileSync('c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

const lines = text.split('\n');

console.log('🔍 Pesquisando onde o HUD Blue Guardian é desenhado no código...');

lines.forEach((l, i) => {
  if (l.includes('BLUE GUARDIAN') || l.includes('Watermark') || l.includes('Drawdown Atual') || l.includes('High Watermark') || l.includes('From Peak')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
