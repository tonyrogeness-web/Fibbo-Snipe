const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== TURBINANDO MOTOR DO TESTADOR PARA CADA TICK REAL ===\n');

// 1. Otimizar ComputeWinRate para pular consulta de banco de dados pesada no backtest não visual
const oldWinRate = `void ComputeWinRate(string filter, int &wins, int &total) {
   wins = 0; total = 0;`;

const newWinRate = `void ComputeWinRate(string filter, int &wins, int &total) {
   wins = 0; total = 0;
   if(MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE)) return; // [TURBO TESTER] Pula varredura de histórico desnecessária`;

if (code.includes(oldWinRate)) {
  code = code.replace(oldWinRate, newWinRate);
  console.log('✔ ComputeWinRate otimizado para o Testador!');
} else {
  console.log('❌ oldWinRate não encontrado');
}

// 2. Otimizar EscreverCSV no testador não visual
const oldCSV = `void EscreverCSV(string comment, double lot, double price, double sl, double tp) {
   if(!InpLogCSV) return;`;

const newCSV = `void EscreverCSV(string comment, double lot, double price, double sl, double tp) {
   if(!InpLogCSV || (MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE))) return; // [TURBO TESTER] Sem I/O de disco no backtest`;

if (code.includes(oldCSV)) {
  code = code.replace(oldCSV, newCSV);
  console.log('✔ EscreverCSV otimizado para o Testador!');
} else {
  console.log('❌ oldCSV não encontrado');
}

fs.writeFileSync(file, code);

// Sincronizar com as pastas de Experts do MT5
const expertPaths = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5'
];

expertPaths.forEach(p => {
  try {
    fs.writeFileSync(p, fs.readFileSync(file));
    console.log('✔ .MQ5 sincronizado em:', p);
  } catch (err) {
    console.log('Erro ao salvar em:', p, err.message);
  }
});

console.log('\n=== OTIMIZAÇÃO CONCLUÍDA COM SUCESSO! ===');
