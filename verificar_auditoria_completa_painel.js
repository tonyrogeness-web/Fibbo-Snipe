const fs = require('fs');

const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
const content = fs.readFileSync(mq5Path, 'utf8');

console.log('🔍 Auditando variáveis de painel e cálculo de risco...');

const riskLines = content.split('\n').filter(l => l.includes('InpBaseRisk_L1') || l.includes('g_PropMaxRiskPct') || l.includes('InpTF'));
riskLines.forEach(l => console.log('  ', l.trim()));
