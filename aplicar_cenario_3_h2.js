const fs = require('fs');
const path = require('path');

console.log('🔄 Aplicando o CENÁRIO 3 (Alvos mais fáceis de pegar: Risco 2.0% / TP2 3.5x / Meta 4.0% / H2)...');

// 1. MQL5 Fonte
const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
if (fs.existsSync(mq5Path)) {
  let content = fs.readFileSync(mq5Path, 'utf8');

  // Timeframe H2
  content = content.replace(
    /input ENUM_TIMEFRAMES InpTF = PERIOD_\w+;.*$/m,
    'input ENUM_TIMEFRAMES InpTF = PERIOD_H2; // [H2 CAMPEÃO CENÁRIO 3] TF de execução 2 HORAS (H2)'
  );

  // Risco 2.0%
  content = content.replace(
    /input double InpBaseRisk_L1 = \d+\.\d+;.*$/m,
    'input double InpBaseRisk_L1 = 2.0;  // [CENÁRIO 3] Risco base 2.0% por trade ($200 USD em 10k -> Win Cheio = +$450 USD / +4.5%)'
  );

  // TP2 Final 3.5x (Alvo mais perto e mais fácil!)
  content = content.replace(
    /input double InpTP_Final_Multi = \d+\.\d+;.*$/m,
    'input double InpTP_Final_Multi = 3.5; // [CENÁRIO 3 - ALVO FÁCIL] TP2 em 3.5x (+3.5% no TP2 + 1.0% no TP1 = +4.5% no Win Cheio)'
  );

  // Travas Diárias: Loss 2.0% / Meta 4.0%
  content = content.replace(
    /input double InpPerdaMaximaGlobalPct = \d+\.\d+, InpPerdaMaximaMoedaPct = \d+\.\d+, InpLucroAlvoMoedaPct = \d+\.\d+;.*$/m,
    'input double InpPerdaMaximaGlobalPct = 2.0, InpPerdaMaximaMoedaPct = 2.0, InpLucroAlvoMoedaPct = 4.0; // Trava Loss 2.0% e Meta 4.0%'
  );

  fs.writeFileSync(mq5Path, content, 'utf8');
  console.log('✅ Arquivo MQ5 atualizado para o CENÁRIO 3 (Alvo fácil 3.5x)!');
}

// 2. Helper para atualizar .set
function updateSetFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const buf = fs.readFileSync(filePath);
  let isUtf16 = buf[0] === 0xff && buf[1] === 0xfe;
  let str = isUtf16 ? buf.toString('utf16le') : buf.toString('utf8');

  str = str.replace(/InpTF=\d+\|\|/g, 'InpTF=16386||');
  str = str.replace(/InpBaseRisk_L1=\d+\.\d+\|\|/g, 'InpBaseRisk_L1=2.0||');
  str = str.replace(/InpTP_Parcial_Multi=\d+\.\d+\|\|/g, 'InpTP_Parcial_Multi=1.0||');
  str = str.replace(/InpTP_Final_Multi=\d+\.\d+\|\|/g, 'InpTP_Final_Multi=3.5||');
  str = str.replace(/InpPerdaMaximaGlobalPct=\d+\.\d+\|\|/g, 'InpPerdaMaximaGlobalPct=2.0||');
  str = str.replace(/InpPerdaMaximaMoedaPct=\d+\.\d+\|\|/g, 'InpPerdaMaximaMoedaPct=2.0||');
  str = str.replace(/InpLucroAlvoMoedaPct=\d+\.\d+\|\|/g, 'InpLucroAlvoMoedaPct=4.0||');
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

updateSetFile(path.join(testerDir, 'teste.set'));
updateSetFile(path.join(testerDir, 'Fibbo_Sniper_v28.5_H2.set'));
updateSetFile(path.join(localDir, 'teste.set'));

console.log('\n🎉 CENÁRIO 3 (ALVO MAIS FÁCIL 3.5x) SALVO COM SUCESSO!');
