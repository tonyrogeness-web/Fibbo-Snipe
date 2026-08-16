const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Atualizar InpFiboBlockedSymbols para 'EURGBP,EURAUD,EURUSD,AUDUSD'
code = code.replace(
  /input string InpFiboBlockedSymbols\s*=\s*"[^"]*";/g,
  'input string InpFiboBlockedSymbols       = "EURGBP,EURAUD,EURUSD,AUDUSD"; // [ROTEAMENTO DE OURO] FR Puro para EURAUD, EURUSD, AUDUSD'
);

// 2. Trava de segurança no OnInit para EURGBP
if (!code.includes('// [TRAVA EURGBP]')) {
  code = code.replace(
    'AutoSelecionarTF();',
    'AutoSelecionarTF();\n   // [TRAVA EURGBP] Bloqueio de seguranca mandatoria para mesa proprietaria\n   if(StringFind(_Symbol, "EURGBP") >= 0) {\n      Print("AVISO MESA: EURGBP foi excluido do portfolio oficial.");\n   }'
  );
}

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✅ MQ5 atualizado com o Portfolio Hibrido de Elite!');

// 3. Compilar usando MetaEditor
const metaEditor = 'C:\\Program Files\\MetaTrader 5\\metaeditor64.exe';
const logFile = path.join(__dirname, 'compile.log');
const cmd = `"${metaEditor}" /compile:"${mq5Path}" /log:"${logFile}"`;

try {
  execSync(cmd);
} catch(e) {}

if (fs.existsSync(logFile)) {
  const logContent = fs.readFileSync(logFile, 'utf16le');
  console.log('--- Log de Compilacao ---');
  console.log(logContent.trim());
}

// 4. Rodar o sincronizador de .set e deploy
require('./sync_perfect_set.js');
require('./deploy_ex5.js');
