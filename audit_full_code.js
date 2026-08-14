const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log(`=== INICIANDO AUDITORIA PROFUNDA DO CÓDIGO (${lines.length} Linhas) ===\n`);

const issues = [];

// 1. Verificar re-declarações de variáveis no mesmo escopo
const varDeclMap = {};
lines.forEach((line, idx) => {
  if (line.includes('POSITION_COMMISSION')) {
    issues.push({ line: idx + 1, type: 'WARNING/DEPRECATED', text: 'Uso de POSITION_COMMISSION (obsoleto em MQL5 moderno)' });
  }
});

// 2. Verificar re-declaração de bw5 / bx5 em DesenharPainelConfig
lines.forEach((line, idx) => {
  if (idx > 2300 && idx < 2390 && line.includes('int bw5 =')) {
    issues.push({ line: idx + 1, type: 'ERROR', text: 'Redeclaração de variável bw5/bx5 no escopo de DesenharPainelConfig()' });
  }
});

// 3. Checar vazamentos de memória ou Handles não liberados
let handlesCreated = 0, handlesReleased = 0;
lines.forEach(line => {
  if (line.includes('iMA(') || line.includes('iATR(') || line.includes('iADX(') || line.includes('iFractals(') || line.includes('iRSI(')) handlesCreated++;
  if (line.includes('IndicatorRelease(')) handlesReleased++;
});

console.log(`Handles Criados: ~${handlesCreated} Ocorrências | Release: ~${handlesReleased} Ocorrências`);
console.log('\n--- PROBLEMAS IDENTIFICADOS NA AUDITORIA ---');
console.table(issues);
