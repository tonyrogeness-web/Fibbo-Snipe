const fs = require('fs');

console.log('=== CONFERÊNCIA LINHA A LINHA DE SOMENTE_FR.SET ===\n');

const content = fs.readFileSync('Fibbo_Sniper_v28.5_H2_SOMENTE_FR.set', 'utf16le');
const lines = content.split('\r\n');

const checks = ['InpUseFR', 'InpUseFluxo', 'InpSmartRouting'];
checks.forEach(c => {
  const found = lines.find(l => l.startsWith(c + '='));
  console.log(found);
});
