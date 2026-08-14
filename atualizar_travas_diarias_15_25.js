const fs = require('fs');
const path = require('path');

console.log('🔄 Atualizando Travas Diárias no MQL5 e nos arquivos .set para Trava Diária 1.5% e Meta Diária 2.5%...');

// 1. Atualizar MQL5
const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
if (fs.existsSync(mq5Path)) {
  let content = fs.readFileSync(mq5Path, 'utf8');

  content = content.replace(
    /input double InpPerdaMaximaGlobalPct = \d+\.\d+, InpPerdaMaximaMoedaPct = \d+\.\d+, InpLucroAlvoMoedaPct = \d+\.\d+;.*$/m,
    'input double InpPerdaMaximaGlobalPct = 1.5, InpPerdaMaximaMoedaPct = 1.5, InpLucroAlvoMoedaPct = 2.5; // Trava Diária de Loss em 1.5% (-$150 USD) e Meta Diária em 2.5% (+$250 USD em 10k)'
  );

  fs.writeFileSync(mq5Path, content, 'utf8');
  console.log('✅ Arquivo MQ5 atualizado com Trava Diária de 1.5% e Meta Diária de 2.5%!');
}

// 2. Helper para atualizar .set
function updateSetFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const buf = fs.readFileSync(filePath);
  let isUtf16 = buf[0] === 0xff && buf[1] === 0xfe;
  let str = isUtf16 ? buf.toString('utf16le') : buf.toString('utf8');

  str = str.replace(/InpPerdaMaximaGlobalPct=\d+\.\d+\|\|/g, 'InpPerdaMaximaGlobalPct=1.5||');
  str = str.replace(/InpPerdaMaximaMoedaPct=\d+\.\d+\|\|/g, 'InpPerdaMaximaMoedaPct=1.5||');
  str = str.replace(/InpLucroAlvoMoedaPct=\d+\.\d+\|\|/g, 'InpLucroAlvoMoedaPct=2.5||');

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

console.log('\n🎉 ATUALIZAÇÃO DE TRAVAS DIÁRIAS (LOSS 1.5% / META 2.5%) CONCLUÍDA!');
