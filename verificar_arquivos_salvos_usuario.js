const fs = require('fs');
const path = require('path');

const testerDir = 'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester';

console.log(`🔍 Verificando o arquivo de parâmetros salvo pelo usuário em: ${testerDir}\n`);

if (fs.existsSync(testerDir)) {
  const files = fs.readdirSync(testerDir);
  files.forEach(file => {
    if (file.endsWith('.set')) {
      const fullPath = path.join(testerDir, file);
      const buf = fs.readFileSync(fullPath);
      let str = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.toString('utf16le') : buf.toString('utf8');
      console.log(`====================================================================`);
      console.log(`📄 ARQUIVO SALVO: ${file}`);
      console.log(`====================================================================`);
      str.split(/\r?\n/).forEach(line => {
        if (
          line.includes('InpTF') ||
          line.includes('InpBaseRisk_L1') ||
          line.includes('InpPerfil') ||
          line.includes('InpPerdaMaximaGlobal') ||
          line.includes('InpPerdaMaximaMoeda') ||
          line.includes('InpLucroAlvoMoeda') ||
          line.includes('InpTP_Final_Multi')
        ) {
          console.log(`   ${line}`);
        }
      });
      console.log(`--------------------------------------------------------------------\n`);
    }
  });
} else {
  console.log('Pasta não encontrada!');
}
