const fs = require('fs');
const path = require('path');

console.log('🔄 Preparando os arquivos de teste para o H2 Campeão com TP2 Expandido...');

// 1. MQL5 Fonte
const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
if (fs.existsSync(mq5Path)) {
  let content = fs.readFileSync(mq5Path, 'utf8');

  // Timeframe H2
  content = content.replace(
    /input ENUM_TIMEFRAMES InpTF = PERIOD_\w+;.*$/m,
    'input ENUM_TIMEFRAMES InpTF = PERIOD_H2; // [H2 CAMPEÃO] TF de execução 2 HORAS (H2)'
  );

  // Risco 1.8%
  content = content.replace(
    /input double InpBaseRisk_L1 = \d+\.\d+;.*$/m,
    'input double InpBaseRisk_L1 = 1.8;  // [RISCO 1.8%] Risco base 1.8% por trade ($180 USD em 10k -> Win Cheio = +$450 USD / +4.5%)'
  );

  // TP2 Final 4.0x
  content = content.replace(
    /input double InpTP_Final_Multi = \d+\.\d+;.*$/m,
    'input double InpTP_Final_Multi = 4.0; // [ALVO EXPANDIDO] TP2 em 4.0x (+3.6% no TP2 + 0.9% no TP1 = +4.5% no Win Cheio)'
  );

  // Travas Diárias: Loss 1.8% / Meta 3.5%
  content = content.replace(
    /input double InpPerdaMaximaGlobalPct = \d+\.\d+, InpPerdaMaximaMoedaPct = \d+\.\d+, InpLucroAlvoMoedaPct = \d+\.\d+;.*$/m,
    'input double InpPerdaMaximaGlobalPct = 1.8, InpPerdaMaximaMoedaPct = 1.8, InpLucroAlvoMoedaPct = 3.5; // Trava Loss 1.8% e Meta 3.5%'
  );

  fs.writeFileSync(mq5Path, content, 'utf8');
  console.log('✅ Arquivo MQ5 atualizado para H2 com Risco 1.8% e TP2 em 4.0x!');
}

// 2. Helper para atualizar .set
function updateSetFile(filePath, risk, tp2, globalLoss, targetProfit) {
  if (!fs.existsSync(filePath)) return;
  const buf = fs.readFileSync(filePath);
  let isUtf16 = buf[0] === 0xff && buf[1] === 0xfe;
  let str = isUtf16 ? buf.toString('utf16le') : buf.toString('utf8');

  str = str.replace(/InpTF=\d+\|\|/g, 'InpTF=16386||');
  str = str.replace(/InpBaseRisk_L1=\d+\.\d+\|\|/g, `InpBaseRisk_L1=${risk.toFixed(1)}||`);
  str = str.replace(/InpTP_Parcial_Multi=\d+\.\d+\|\|/g, 'InpTP_Parcial_Multi=1.0||');
  str = str.replace(/InpTP_Final_Multi=\d+\.\d+\|\|/g, `InpTP_Final_Multi=${tp2.toFixed(1)}||`);
  str = str.replace(/InpPerdaMaximaGlobalPct=\d+\.\d+\|\|/g, `InpPerdaMaximaGlobalPct=${globalLoss.toFixed(1)}||`);
  str = str.replace(/InpPerdaMaximaMoedaPct=\d+\.\d+\|\|/g, `InpPerdaMaximaMoedaPct=${globalLoss.toFixed(1)}||`);
  str = str.replace(/InpLucroAlvoMoedaPct=\d+\.\d+\|\|/g, `InpLucroAlvoMoedaPct=${targetProfit.toFixed(1)}||`);
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

// Criar/atualizar arquivos de teste
updateSetFile(path.join(testerDir, 'teste.set'), 1.8, 4.0, 1.8, 3.5);
updateSetFile(path.join(testerDir, 'Fibbo_Sniper_v28.5_H2.set'), 1.8, 4.0, 1.8, 3.5);
updateSetFile(path.join(localDir, 'teste.set'), 1.8, 4.0, 1.8, 3.5);

console.log('\n🎉 CONFIGURAÇÃO H2 TURBO EXPANDIDO SALVA COM SUCESSO!');
