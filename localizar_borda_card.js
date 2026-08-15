const fs = require('fs');

const text = fs.readFileSync('c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

const lines = text.split('\n');

console.log('🔍 Pesquisando onde a borda do card de Falso Rompimento é desenhada...');

lines.forEach((l, i) => {
  if (l.includes('FALSO ROMPIMENTO') || l.includes('100% OK (PRONTO)')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
