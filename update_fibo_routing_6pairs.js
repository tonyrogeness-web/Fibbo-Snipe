const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(mq5Path, 'utf8');

// Atualizar InpFiboBlockedSymbols para as 3 moedas de FR puro do portfólio
const oldBlockLine = content.split('\n').find(l => l.includes('InpFiboBlockedSymbols'));
console.log('Linha antiga:', oldBlockLine);

content = content.replace(
  oldBlockLine,
  'input string InpFiboBlockedSymbols       = "EURCAD,EURAUD,EURUSD,EURGBP"; // [ROTEAMENTO MESTRE] 3 Moedas FR Puro (EURCAD, EURAUD, EURUSD) e 3 Moedas Dual (AUDUSD, EURJPY, USDCAD)'
);

fs.writeFileSync(mq5Path, content, 'utf8');
console.log('✔ MQ5 atualizado com sucesso!');

// Compilar com MetaEditor
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

// Atualizar arquivos .set nos perfis do MetaTrader 5
const setDirs = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Profiles\\Tester',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Profiles\\Tester',
  __dirname
];

setDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      if (file.endsWith('.set')) {
        const fullPath = path.join(dir, file);
        const buf = fs.readFileSync(fullPath);
        let str = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.toString('utf16le') : buf.toString('utf8');
        
        // Garante InpUseFiboPullback=true e InpFiboBlockedSymbols="EURCAD,EURAUD,EURUSD,EURGBP"
        str = str.replace(/InpUseFiboPullback=false/g, 'InpUseFiboPullback=true');
        if (str.includes('InpFiboBlockedSymbols=')) {
          str = str.replace(/InpFiboBlockedSymbols=[^\r\n]*/g, 'InpFiboBlockedSymbols=EURCAD,EURAUD,EURUSD,EURGBP||0||0||0||N');
        }
        
        const outBuf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(str, 'utf16le')]);
        fs.writeFileSync(fullPath, outBuf);
        console.log(`✅ Set atualizado: ${file} em ${dir}`);
      }
    });
  }
});

// Deploy do .ex5 atualizado
require('./deploy_ex5.js');
console.log('\n🎉 ROTEAMENTO DE 6 MOEDAS APLICADO COM SUCESSO!');
