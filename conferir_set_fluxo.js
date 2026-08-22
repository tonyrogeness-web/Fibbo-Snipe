const fs = require('fs');

console.log('=== CONFERÊNCIA RIGOROSA DO ARQUIVO SOMENTE_FLUXO.SET ===\n');

const setFluxoContent = fs.readFileSync('Fibbo_Sniper_v28.5_H2_SOMENTE_FLUXO.set', 'utf16le');
const lines = setFluxoContent.split('\r\n');

const keysToVerify = [
  'InpSmartRouting',
  'InpUseFR',
  'InpUseFluxo',
  'InpTF',
  'InpAutoTF',
  'InpUseVolumeFilter',
  'InpUseTrendFilter',
  'InpFluxo_GatilhoPrecoce',
  'InpFluxo_UseExhaustion',
  'InpBaseRisk_L1',
  'InpTP_Parcial_Multi',
  'InpTP_Final_Multi',
  'InpPropFirmMode'
];

keysToVerify.forEach(k => {
  const found = lines.find(l => l.startsWith(k + '='));
  if (found) {
    console.log(`✔ ${found}`);
  } else {
    console.log(`❌ Não encontrado: ${k}`);
  }
});
