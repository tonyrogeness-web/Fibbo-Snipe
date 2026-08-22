const fs = require('fs');
const content = fs.readFileSync('Fibbo_Sniper_v28.5_H2_FR+Fluxo.set', 'utf16le');
const lines = content.split('\r\n');

console.log('=== VERIFICANDO PARÂMETROS DO .SET ===\n');
lines.forEach(l => {
  if (l.includes('InpFR_BlockedSymbols') || l.includes('InpFluxo_BlockedSymbols') || l.includes('InpSmartRouting')) {
    console.log(l);
  }
});
