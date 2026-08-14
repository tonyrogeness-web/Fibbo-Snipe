const fs = require('fs');
const path = require('path');

console.log('🔄 Aplicando a Configuração H4 Turbo (Risco 2.0% / Meta 3.5% / TP2 3.5x / H4) no MQL5 e nos arquivos .set...');

// 1. Atualizar MQL5 Fonte
const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
if (fs.existsSync(mq5Path)) {
  let content = fs.readFileSync(mq5Path, 'utf8');

  // Timeframe H4 (PERIOD_H4)
  content = content.replace(
    /input ENUM_TIMEFRAMES InpTF = PERIOD_\w+;.*$/m,
    'input ENUM_TIMEFRAMES InpTF = PERIOD_H4; // [H4 TURBO] TF de execução 4 HORAS (H4)'
  );

  // Risco 2.0%
  content = content.replace(
    /input double InpBaseRisk_L1 = \d+\.\d+;.*$/m,
    'input double InpBaseRisk_L1 = 2.0;  // [RISCO 2.0%] Risco base 2.0% por trade ($200 USD em 10k -> Win Cheio = +$450 USD / +4.5%)'
  );

  // TP2 Final 3.5x
  content = content.replace(
    /input double InpTP_Final_Multi = \d+\.\d+;.*$/m,
    'input double InpTP_Final_Multi = 3.5; // [ALVO H4] TP2 em 3.5x (+3.5% no TP2 + 1.0% no TP1 = +4.5% no Win Cheio)'
  );

  // Travas Diárias: Loss 2.0% / Meta 3.5%
  content = content.replace(
    /input double InpPerdaMaximaGlobalPct = \d+\.\d+, InpPerdaMaximaMoedaPct = \d+\.\d+, InpLucroAlvoMoedaPct = \d+\.\d+;.*$/m,
    'input double InpPerdaMaximaGlobalPct = 2.0, InpPerdaMaximaMoedaPct = 2.0, InpLucroAlvoMoedaPct = 3.5; // Trava Diária de Loss em 2.0% (-$200 USD) e Meta Diária em 3.5% (+$350 USD em 10k)'
  );

  fs.writeFileSync(mq5Path, content, 'utf8');
  console.log('✅ Arquivo MQ5 atualizado para H4 Turbo com Risco 2.0%!');
}

// 2. Helper para atualizar .set e .ini
function updateSetFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const buf = fs.readFileSync(filePath);
  let isUtf16 = buf[0] === 0xff && buf[1] === 0xfe;
  let str = isUtf16 ? buf.toString('utf16le') : buf.toString('utf8');

  // Enum H4 em MQL5 = 16388
  str = str.replace(/InpTF=\d+\|\|/g, 'InpTF=16388||');
  str = str.replace(/InpBaseRisk_L1=\d+\.\d+\|\|/g, 'InpBaseRisk_L1=2.0||');
  str = str.replace(/InpTP_Parcial_Multi=\d+\.\d+\|\|/g, 'InpTP_Parcial_Multi=1.0||');
  str = str.replace(/InpTP_Final_Multi=\d+\.\d+\|\|/g, 'InpTP_Final_Multi=3.5||');
  str = str.replace(/InpPerdaMaximaGlobalPct=\d+\.\d+\|\|/g, 'InpPerdaMaximaGlobalPct=2.0||');
  str = str.replace(/InpPerdaMaximaMoedaPct=\d+\.\d+\|\|/g, 'InpPerdaMaximaMoedaPct=2.0||');
  str = str.replace(/InpLucroAlvoMoedaPct=\d+\.\d+\|\|/g, 'InpLucroAlvoMoedaPct=3.5||');
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

console.log('\n🎉 ATUALIZAÇÃO COMPLETA PARA H4 TURBO (RISCO 2.0% / TP2 3.5x) CONCLUÍDA!');
