const fs = require('fs');

const text = fs.readFileSync('c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

const lines = text.split('\n');

console.log('🔍 Auditoria Profunda do Módulo Fibonacci...');

lines.forEach((l, i) => {
  if (l.includes('l_fibo_') || l.includes('g_CachedFibo') || l.includes('InpUseFibo')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
