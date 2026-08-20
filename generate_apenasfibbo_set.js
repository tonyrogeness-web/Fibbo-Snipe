const fs = require('fs');
const path = require('path');

console.log('=== CRIANDO PRESET: Fibbo_Sniper_v28.5_H2_apenasfibbo.set ===\n');

// 1. Ler o arquivo .set base oficial
const basePath = 'Fibbo_Sniper_v28.5_H2.set';
const baseBuffer = fs.readFileSync(basePath);
let setText = baseBuffer.toString('utf16le');

// 2. Modificar APENAS as flags das estratégias (InpUseFR=false e InpUseFiboPullback=true)
setText = setText.replace(/InpUseFR=true\|\|0\|\|0\|\|0\|\|N/g, 'InpUseFR=false||0||0||0||N');
setText = setText.replace(/InpUseFR=false\|\|0\|\|0\|\|0\|\|N/g, 'InpUseFR=false||0||0||0||N');
setText = setText.replace(/InpUseFiboPullback=false\|\|0\|\|0\|\|0\|\|N/g, 'InpUseFiboPullback=true||0||0||0||N');
setText = setText.replace(/InpUseFiboPullback=true\|\|0\|\|0\|\|0\|\|N/g, 'InpUseFiboPullback=true||0||0||0||N');
setText = setText.replace(/InpUseFluxo=true\|\|0\|\|0\|\|0\|\|N/g, 'InpUseFluxo=false||0||0||0||N');

const fiboBuffer = Buffer.from(setText, 'utf16le');

const targetFiles = [
  'Fibbo_Sniper_v28.5_H2_apenasfibbo.set',
  'Fibbo_Sniper_v28.5_H2_Apenas_Fibbo.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2_apenasfibbo.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Presets\\Fibbo_Sniper_v28.5_H2_apenasfibbo.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2_Apenas_Fibbo.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Presets\\Fibbo_Sniper_v28.5_H2_Apenas_Fibbo.set'
];

targetFiles.forEach(p => {
  try {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, fiboBuffer);
    console.log('✔ Preset salvo em:', p);
  } catch (err) {
    console.log('Erro ao salvar:', p, err.message);
  }
});

console.log('\n=== PRESET Fibbo_Sniper_v28.5_H2_apenasfibbo.set GERADO COM SUCESSO! ===');
