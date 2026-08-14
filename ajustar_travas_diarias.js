const fs = require('fs');

const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
let content = fs.readFileSync(mq5Path, 'utf8');

console.log('🔍 Linha atual de Travas Diárias no MQL5:');
content.split('\n').filter(l => l.includes('InpPerdaMaximaGlobalPct')).forEach(l => console.log('  ', l.trim()));
