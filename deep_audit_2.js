const fs = require('fs');
const code = fs.readFileSync('Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

console.log('=== VERIFICAÇÃO PROFUNDA DE BUGS E DIVERGÊNCIAS ===\n');

// 1. Verificar Normalização de Lote
console.log('--- 1. Cálculo e Normalização de Lotes ---');
const lotMatches = code.match(/double\s+ComputeLot[^{]*\{[\s\S]*?\n\}/g);
if (lotMatches) {
  lotMatches.forEach(m => console.log(m));
}

// 2. Verificar Trailing Stop e Break Even
console.log('\n--- 2. Trailing Stop e Break Even ---');
const beBlock = code.match(/if\(InpUseBreakEven\)[\s\S]*?if\(!be_triggered&&InpUseTrailStop[\s\S]*?\}/);
if (beBlock) {
  console.log(beBlock[0].split('\n').slice(0, 35).join('\n'));
}

// 3. Verificar MarketGlance Zonas / Confluência
console.log('\n--- 3. MarketGlance / Confluência ---');
const mgLines = code.split('\n').filter(l => l.includes('g_MG_') && (l.includes('Allowed') || l.includes('confl')));
console.log('Linhas com regras de confluência:', mgLines.length);
mgLines.slice(0, 10).forEach(l => console.log('  ', l.trim()));

// 4. Verificar Estratégias (Fluxo, FR, Fibo)
console.log('\n--- 4. Filtros das Estratégias ---');
const execMatch = code.match(/void\s+ExecutarOperacoes\s*\(\)\s*\{([\s\S]*?)(void|\/\/\/|$)/);
if (execMatch) {
  console.log('Tamanho ExecutarOperacoes:', execMatch[0].length);
}
