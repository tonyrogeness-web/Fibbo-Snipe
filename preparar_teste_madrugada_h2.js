const fs = require('fs');
const path = require('path');

console.log('🔄 Preparando a configuração suprema de H2 (Risco 1.5% / TP2 3.5x / H2) no MQL5 e nos arquivos .set...');

// 1. Atualizar MQL5 Fonte
const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
if (fs.existsSync(mq5Path)) {
  let content = fs.readFileSync(mq5Path, 'utf8');

  // Timeframe H2
  content = content.replace(
    /input ENUM_TIMEFRAMES InpTF = PERIOD_\w+;.*$/m,
    'input ENUM_TIMEFRAMES InpTF = PERIOD_H2; // [H2 OVERNIGHT] TF de execução 2 HORAS (H2)'
  );

  // Risco 1.5%
  content = content.replace(
    /input double InpBaseRisk_L1 = \d+\.\d+;.*$/m,
    'input double InpBaseRisk_L1 = 1.5;  // [RISCO 1.5%] Risco base 1.5% por trade ($150 USD em 10k)'
  );

  // TP2 Final 3.5x (Para H2/H4)
  content = content.replace(
    /input double InpTP_Final_Multi = \d+\.\d+;.*$/m,
    'input double InpTP_Final_Multi = 3.5; // [ALVO EXTENDIDO H2] TP2 em 3.5x (+3.37% no Win Cheio)'
  );

  // AutoTF em H2
  content = content.replace(
    /g_TF_L1 = PERIOD_H1;/g,
    'g_TF_L1 = PERIOD_H2;'
  );

  fs.writeFileSync(mq5Path, content, 'utf8');
  console.log('✅ Arquivo MQ5 atualizado para H2 com TP2 3.5x!');
}

// 2. Helper para atualizar .set e .ini
function updateSetFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const buf = fs.readFileSync(filePath);
  let isUtf16 = buf[0] === 0xff && buf[1] === 0xfe;
  let str = isUtf16 ? buf.toString('utf16le') : buf.toString('utf8');

  // Enum H2 em MT5 = 16386
  str = str.replace(/InpTF=\d+\|\|/g, 'InpTF=16386||');
  str = str.replace(/InpBaseRisk_L1=\d+\.\d+\|\|/g, 'InpBaseRisk_L1=1.5||');
  str = str.replace(/InpTP_Final_Multi=\d+\.\d+\|\|/g, 'InpTP_Final_Multi=3.5||');
  str = str.replace(/InpPerdaMaximaGlobalPct=\d+\.\d+\|\|/g, 'InpPerdaMaximaGlobalPct=1.5||');
  str = str.replace(/InpPerdaMaximaMoedaPct=\d+\.\d+\|\|/g, 'InpPerdaMaximaMoedaPct=1.5||');
  str = str.replace(/InpLucroAlvoMoedaPct=\d+\.\d+\|\|/g, 'InpLucroAlvoMoedaPct=2.5||');
  str = str.replace(/\|\|Y/g, '||N');

  if (isUtf16) {
    const outBuf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(str, 'utf16le')]);
    fs.writeFileSync(filePath, outBuf);
  } else {
    fs.writeFileSync(filePath, str, 'utf8');
  }
  console.log(`✅ Atualizado: ${path.basename(filePath)}`);
}

const testerDir = 'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester';
const localDir = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper';

[
  path.join(testerDir, 'teste.set'),
  path.join(testerDir, 'Fibbo_Sniper_v28.5_H2.set'),
  path.join(localDir, 'teste.set'),
  path.join(localDir, 'Cenario_C_Fibbo_Sniper.set')
].forEach(f => updateSetFile(f));

console.log('\n🎉 CONFIGURAÇÃO SUPREMA PARA TESTE H2 DA MADRUGADA CONCLUÍDA!');
