const fs = require('fs');
const path = require('path');

const targetPath = 'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester\\teste.set';

if (!fs.existsSync(targetPath)) {
  console.log('❌ Arquivo não encontrado no caminho:', targetPath);
  process.exit(1);
}

// MT5 armazena arquivos .set em utf16le ou utf8
let content = '';
try {
  content = fs.readFileSync(targetPath, 'utf16le');
  if (!content.includes('InpPerfil') && !content.includes('InpTF')) {
    content = fs.readFileSync(targetPath, 'utf8');
  }
} catch (e) {
  content = fs.readFileSync(targetPath, 'utf8');
}

console.log('=== LENDO ARQUIVO TESTE.SET SALVO PELO USUÁRIO (MT5 PROFILES) ===\n');

const lines = content.split(/\r?\n/);
const keyCheck = [
  'InpPerfil',
  'InpTF',
  'InpBaseRisk_L1',
  'InpTP_Final_Multi',
  'InpLucroAlvoMoedaPct',
  'InpPerdaMaximaGlobalPct',
  'InpPropMaxRiskPct',
  'InpPropFirmMode',
  'InpUseFR'
];

lines.forEach(line => {
  keyCheck.forEach(k => {
    if (line.startsWith(k + '=')) {
      console.log(`✓ ${line.trim()}`);
    }
  });
});
