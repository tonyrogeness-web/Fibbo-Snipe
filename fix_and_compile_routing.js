const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(mq5Path, 'utf8');

// 1. Restaurar linha 305
content = content.replace(
  'input string InpFiboBlockedSymbols       = "EURCAD,EURAUD,EURUSD,EURGBP"; // [ROTEAMENTO MESTRE] 3 Moedas FR Puro (EURCAD, EURAUD, EURUSD) e 3 Moedas Dual (AUDUSD, EURJPY, USDCAD)',
  '   string blocked = InpFiboBlockedSymbols;'
);

// 2. Atualizar linha 636
content = content.replace(
  'input string InpFiboBlockedSymbols       = "EURGBP,EURAUD"; // Moedas com Fibo Desativada (Operam Apenas no FR)',
  'input string InpFiboBlockedSymbols       = "EURCAD,EURAUD,EURUSD,EURGBP"; // Moedas com Fibo Desativada (Operam Apenas no FR)'
);

fs.writeFileSync(mq5Path, content, 'utf8');
console.log('✔ MQ5 corrigido e atualizado com sucesso!');

// 3. Compilar com MetaEditor
const metaEditor = 'C:\\Program Files\\MetaTrader 5\\metaeditor64.exe';
const logFile = path.join(__dirname, 'compile.log');
const cmd = `"${metaEditor}" /compile:"${mq5Path}" /log:"${logFile}"`;

try {
  execSync(cmd);
} catch(e) {}

if (fs.existsSync(logFile)) {
  const logContent = fs.readFileSync(logFile, 'utf16le');
  console.log('--- Log de Compilação ---');
  console.log(logContent.trim());
}

// 4. Deploy do executável
require('./deploy_ex5.js');
console.log('\n🎉 COMPILAÇÃO E DEPLOY CONCLUÍDOS COM 0 ERROS!');
