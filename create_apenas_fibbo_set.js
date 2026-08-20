const fs = require('fs');
const path = require('path');

console.log('=== CRIANDO PRESET: APENAS FIBBO (Fibbo_Sniper_v28.5_H2_Apenas_Fibbo.set) ===\n');

// Ler o preset base atual
const baseBuffer = fs.readFileSync('Fibbo_Sniper_v28.5_H2.set');
let setText = baseBuffer.toString('utf16le');

// Substituir InpUseFR=true por false e InpUseFiboPullback=false por true
setText = setText.replace(/InpUseFR=true\|\|0\|\|0\|\|0\|\|N/g, 'InpUseFR=false||0||0||0||N');
setText = setText.replace(/InpUseFR=false\|\|0\|\|0\|\|0\|\|N/g, 'InpUseFR=false||0||0||0||N');
setText = setText.replace(/InpUseFiboPullback=false\|\|0\|\|0\|\|0\|\|N/g, 'InpUseFiboPullback=true||0||0||0||N');
setText = setText.replace(/InpUseFiboPullback=true\|\|0\|\|0\|\|0\|\|N/g, 'InpUseFiboPullback=true||0||0||0||N');

const fiboBuffer = Buffer.from(setText, 'utf16le');

const targetPaths = [
  'Fibbo_Sniper_v28.5_H2_Apenas_Fibbo.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2_Apenas_Fibbo.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Presets\\Fibbo_Sniper_v28.5_H2_Apenas_Fibbo.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2_Apenas_Fibbo.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Presets\\Fibbo_Sniper_v28.5_H2_Apenas_Fibbo.set'
];

targetPaths.forEach(p => {
  try {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, fiboBuffer);
    console.log('✔ Preset salvo em:', p);
  } catch (err) {
    console.log('Erro ao salvar em:', p, err.message);
  }
});

console.log('\n=== PRESET APENAS FIBBO CRIADO COM SUCESSO! ===');
