const fs = require('fs');
const path = require('path');

console.log('🔄 Sincronizando todos os arquivos de configuração para a última atualização (H1 / Risco 1.5% / Trava Diária 1.5% / Meta Diária 2.5%)...');

// 1. Atualizar MQL5 Fonte
const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
if (fs.existsSync(mq5Path)) {
  let content = fs.readFileSync(mq5Path, 'utf8');

  // Timeframe H1
  content = content.replace(
    /input ENUM_TIMEFRAMES InpTF = PERIOD_\w+;.*$/m,
    'input ENUM_TIMEFRAMES InpTF = PERIOD_H1; // [H1 CONSERVADOR] TF de execução 1 HORA (H1)'
  );

  // Risco 1.5%
  content = content.replace(
    /input double InpBaseRisk_L1 = \d+\.\d+;.*$/m,
    'input double InpBaseRisk_L1 = 1.5;  // [RISCO 1.5%] Risco base 1.5% por trade ($150 USD em 10k -> Win Cheio = +$300 USD / +3.0%)'
  );

  // Travas Diárias: Loss 1.5% / Meta 2.5%
  content = content.replace(
    /input double InpPerdaMaximaGlobalPct = \d+\.\d+, InpPerdaMaximaMoedaPct = \d+\.\d+, InpLucroAlvoMoedaPct = \d+\.\d+;.*$/m,
    'input double InpPerdaMaximaGlobalPct = 1.5, InpPerdaMaximaMoedaPct = 1.5, InpLucroAlvoMoedaPct = 2.5; // Trava Diária de Loss em 1.5% (-$150 USD) e Meta Diária em 2.5% (+$250 USD em 10k)'
  );

  fs.writeFileSync(mq5Path, content, 'utf8');
  console.log('✅ Arquivo MQ5 sincronizado 100%!');
}

// 2. Helper para atualizar arquivos .set e .ini
function syncSetOrIniFile(filePath) {
  if (!fs.existsSync(filePath)) return false;

  const buf = fs.readFileSync(filePath);
  let isUtf16 = buf[0] === 0xff && buf[1] === 0xfe;
  let str = isUtf16 ? buf.toString('utf16le') : buf.toString('utf8');

  // Ajustes de chaves
  str = str.replace(/InpTF=\d+\|\|/g, 'InpTF=16385||');
  str = str.replace(/InpBaseRisk_L1=\d+\.\d+\|\|/g, 'InpBaseRisk_L1=1.5||');
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
  console.log(`✅ Sincronizado: ${path.basename(filePath)}`);
  return true;
}

// Lista de arquivos a atualizar
const testerDir = 'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester';
const localDir = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper';

const filesToUpdate = [
  path.join(testerDir, 'teste.set'),
  path.join(testerDir, 'Fibbo_Sniper_v28.5_H2.set'),
  path.join(localDir, 'teste.set'),
  path.join(localDir, 'Cenario_C_Fibbo_Sniper.set')
];

if (fs.existsSync(testerDir)) {
  const dirFiles = fs.readdirSync(testerDir);
  dirFiles.forEach(f => {
    if (f.endsWith('.ini') || f.endsWith('.set')) {
      const fullP = path.join(testerDir, f);
      if (!filesToUpdate.includes(fullP)) filesToUpdate.push(fullP);
    }
  });
}

filesToUpdate.forEach(f => syncSetOrIniFile(f));

console.log('\n🎉 SINCRONIZAÇÃO COMPLETA DE TODOS OS ARQUIVOS CONCLUÍDA COM SUCESSO!');
