const fs = require('fs');
const path = require('path');

console.log('🔄 Aplicando OPÇÃO A: 1 HORA (H1) com Risco de 1.8% por trade no código fonte e arquivos .set...');

// 1. Atualizar MQL5 Fonte
const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
if (fs.existsSync(mq5Path)) {
  let content = fs.readFileSync(mq5Path, 'utf8');

  // Ajusta InpTF para PERIOD_H1 por padrão
  content = content.replace(
    /input ENUM_TIMEFRAMES InpTF = PERIOD_M\d+;.*$/m,
    'input ENUM_TIMEFRAMES InpTF = PERIOD_H1; // [OPÇÃO A] TF de execução 1 HORA (H1 Conservador Baixo Ruído)'
  );

  // Ajusta InpBaseRisk_L1 para 1.8% por padrão
  content = content.replace(
    /input double InpBaseRisk_L1 = \d+\.\d+;.*$/m,
    'input double InpBaseRisk_L1 = 1.8;  // [OPÇÃO A] Risco base 1.8% por trade ($180 USD em 10k -> Alvo +3.6% Win / -1.8% Loss)'
  );

  // Ajusta AutoTF Forex para PERIOD_H1
  content = content.replace(
    /if\(sym=="NZDUSD"\) \{[\s\S]*?\} else \{[\s\S]*?\}/,
    'g_TF_L1 = PERIOD_H1;  // [OPÇÃO A] Forex 100% em 1 HORA (H1 Conservador Baixo Ruído)\n         TF_L2   = PERIOD_H4;'
  );

  fs.writeFileSync(mq5Path, content, 'utf8');
  console.log('✅ Arquivo MQ5 atualizado para H1 (1 Hora) e 1.8% de Risco por Padrão!');
}

// 2. Helper para atualizar arquivos .set e .ini
function updateSetOrIniFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return false;

  const buf = fs.readFileSync(filePath);
  let isUtf16 = buf[0] === 0xff && buf[1] === 0xfe;
  let str = isUtf16 ? buf.toString('utf16le') : buf.toString('utf8');

  let modified = false;
  replacements.forEach(({ search, replace }) => {
    if (typeof search === 'string') {
      if (str.includes(search)) {
        str = str.split(search).join(replace);
        modified = true;
      }
    } else if (search instanceof RegExp) {
      if (search.test(str)) {
        str = str.replace(search, replace);
        modified = true;
      }
    }
  });

  if (modified) {
    if (isUtf16) {
      const outBuf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(str, 'utf16le')]);
      fs.writeFileSync(filePath, outBuf);
    } else {
      fs.writeFileSync(filePath, str, 'utf8');
    }
    console.log(`✅ Atualizado: ${path.basename(filePath)}`);
    return true;
  }
  return false;
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

const replacements = [
  // H1 Enum em MT5 = 16385
  { search: 'InpTF=15||', replace: 'InpTF=16385||' },
  { search: 'InpTF=30||', replace: 'InpTF=16385||' },
  { search: 'InpBaseRisk_L1=1.2||', replace: 'InpBaseRisk_L1=1.8||' },
  { search: 'InpBaseRisk_L1=0.6||', replace: 'InpBaseRisk_L1=1.8||' },
  { search: 'InpBaseRisk_L1=1.0||', replace: 'InpBaseRisk_L1=1.8||' },
  { search: /Period=M15/g, replace: 'Period=H1' },
  { search: /Period=M30/g, replace: 'Period=H1' }
];

filesToUpdate.forEach(f => {
  updateSetOrIniFile(f, replacements);
});

console.log('\n🎉 AJUSTE PARA OPÇÃO A (H1 / RISCO 1.8%) CONCLUÍDO COM SUCESSO!');
