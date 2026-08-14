const fs = require('fs');

function fixSetFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const buf = fs.readFileSync(filePath);
  let isUtf16 = buf[0] === 0xff && buf[1] === 0xfe;
  let str = isUtf16 ? buf.toString('utf16le') : buf.toString('utf8');

  // Substitui todas as caixinhas habilitadas (||Y) por desabilitadas (||N)
  str = str.replace(/\|\|Y/g, '||N');

  // Garante InpTF=16385 (H1) e InpBaseRisk_L1=1.8
  str = str.replace(/InpTF=\d+\|\|/g, 'InpTF=16385||');
  str = str.replace(/InpBaseRisk_L1=\d+\.\d+\|\|/g, 'InpBaseRisk_L1=1.8||');

  if (isUtf16) {
    const outBuf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(str, 'utf16le')]);
    fs.writeFileSync(filePath, outBuf);
  } else {
    fs.writeFileSync(filePath, str, 'utf8');
  }
  console.log(`✅ Ajustado com caixinhas DESMARCADAS (||N): ${filePath}`);
}

const testerSet = 'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester\\teste.set';
const localSet = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\teste.set';

fixSetFile(testerSet);
fixSetFile(localSet);
