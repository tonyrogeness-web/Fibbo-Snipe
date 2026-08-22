const fs = require('fs');

console.log('=== CONFERINDO ARQUIVO FIBBO_SNIPER_V28.5_H2_FR+FLUXO.SET ===\n');

const content = fs.readFileSync('Fibbo_Sniper_v28.5_H2_FR+Fluxo.set', 'utf16le');
const lines = content.split('\r\n');

const keys = [
  'InpSmartRouting',
  'InpUseFR',
  'InpUseFluxo',
  'InpFR_BlockedSymbols',
  'InpFluxo_BlockedSymbols',
  'InpTF',
  'InpAutoTF',
  'InpBaseRisk_L1',
  'InpPropFirmMode'
];

keys.forEach(k => {
  const found = lines.find(l => l.startsWith(k + '='));
  console.log(found);
});
