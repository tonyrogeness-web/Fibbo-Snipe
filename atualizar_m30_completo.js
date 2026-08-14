const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando atualização completa para M30 no código fonte e arquivos .set/.ini...');

// 1. Atualizar MQL5 Fonte
const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
if (fs.existsSync(mq5Path)) {
  let content = fs.readFileSync(mq5Path, 'utf8');

  // Substitui InpTF padrão para PERIOD_M30
  content = content.replace(
    /input ENUM_TIMEFRAMES InpTF = PERIOD_M15;.*$/m,
    'input ENUM_TIMEFRAMES InpTF = PERIOD_M30; // [M30 SWEET SPOT] TF de execução M30 Moderado (Doces Meio Termo)'
  );
  content = content.replace(
    /input ENUM_TIMEFRAMES InpTF = PERIOD_H1;.*$/m,
    'input ENUM_TIMEFRAMES InpTF = PERIOD_M30; // [M30 SWEET SPOT] TF de execução M30 Moderado (Doces Meio Termo)'
  );

  // Se autoTF estiver embutido no código para Forex:
  content = content.replace(
    /g_TF_L1 = PERIOD_H1;   \/\/ Forex: execucao H1/g,
    'g_TF_L1 = PERIOD_M30;  // Forex: execucao M30 (Sweet Spot Prop Firm)'
  );

  fs.writeFileSync(mq5Path, content, 'utf8');
  console.log('✅ Arquivo MQ5 atualizado com sucesso para M30 por padrão!');
}

// Helper para ler/escrever arquivos com detecção de encoding (UTF-16LE ou UTF-8)
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
  { search: 'InpTF=15||', replace: 'InpTF=30||' },
  { search: 'InpTF=16385||', replace: 'InpTF=30||' },
  { search: 'InpTF=15\r', replace: 'InpTF=30\r' },
  { search: 'InpTF=15\n', replace: 'InpTF=30\n' },
  { search: /Period=M15/g, replace: 'Period=M30' },
  { search: /Period=H1/g, replace: 'Period=M30' }
];

filesToUpdate.forEach(f => {
  updateSetOrIniFile(f, replacements);
});

console.log('\n🎉 TODAS AS ALTERAÇÕES PARA M30 FORAM APLICADAS COM SUCESSO!');
