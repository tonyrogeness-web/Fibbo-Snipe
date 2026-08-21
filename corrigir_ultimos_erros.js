const fs = require('fs');
const path = require('path');

console.log('=== CORRIGINDO ÚLTIMOS ERROS ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Substituir is_flx_allowed por IsFluxoAllowedForCurrentSymbol() em DesenharLinhasChart
code = code.replace(/bool show_fluxo_lines = is_flx_allowed && InpUseFluxo/g, 'bool show_fluxo_lines = IsFluxoAllowedForCurrentSymbol() && InpUseFluxo');

// 2. Remover linha 2276 (in_rd_fb)
code = code.replace(/bool in_rd_fb=false;\s*if\(IsFiboActiveForSymbol\(\)[^\n]+\n/g, '');

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ mq5 100% corrigido!');
