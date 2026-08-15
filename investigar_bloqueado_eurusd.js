const fs = require('fs');

const text = fs.readFileSync('c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5', 'utf8');
const lines = text.split('\n');

console.log('🔍 Pesquisando onde BLOQUEADO é ativado no painel...');

lines.forEach((l, i) => {
  if (l.includes('BLOQUEADO') || l.includes('g_LocalBlocked') || l.includes('g_GV_Blocked')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
