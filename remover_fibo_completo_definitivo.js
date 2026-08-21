const fs = require('fs');
const path = require('path');

console.log('=== REMOVENDO MOTOR FIBO E LIMPEZA TOTAL DO CÓDIGO ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Remover Motor 3 (Fibo) da execução de OnTick (Linhas 4283 a 4436)
const motor3Header = '//================================================================\n   // MOTOR 3: FIBONACCI 2.0 DE ALTA PRECISÃO (5 PILARES SNIPER)\n   //================================================================';
const motor3End = '//+------------------------------------------------------------------+\n//  FIM — Fibbo_Sniper_v28.5_H2.mq5';

const m3StartIdx = code.indexOf(motor3Header);
const m3EndIdx = code.indexOf(motor3End);

if (m3StartIdx !== -1 && m3EndIdx !== -1) {
  code = code.slice(0, m3StartIdx) + code.slice(m3EndIdx);
  console.log('✔ Motor 3 (Fibo) 100% removido da execução real!');
}

// 2. Limpar inputs da Fibo
const fiboInputsStart = code.indexOf('input group "=== FIBONACCI 2.0');
const fiboInputsEnd = code.indexOf('input group "=== HORÁRIOS (SMART SCHEDULE) ==="');

if (fiboInputsStart !== -1 && fiboInputsEnd !== -1) {
  code = code.slice(0, fiboInputsStart) + code.slice(fiboInputsEnd);
  console.log('✔ Inputs da Fibo removidos.');
}

// 3. Remover handler de clique morto D_btn_tab_fb
code = code.replace(/else if\(btn==DP\+"btn_tab_fb"\)\{\s*g_DiagTab=2;\s*\}/g, '');
code = code.replace(/else if\(btn==DP\+"btn_tab_fl" \|\| btn==DP\+"btn_tab_fb"\)\{\s*g_DiagTab=2;\s*\}/g, 'else if(btn==DP+"btn_tab_fl"){ g_DiagTab=2; }');

// 4. Remover IsFiboActiveForSymbol() se existir
const isFiboFuncStart = code.indexOf('bool IsFiboActiveForSymbol(');
if (isFiboFuncStart !== -1) {
  const isFiboFuncEnd = code.indexOf('}', isFiboFuncStart);
  if (isFiboFuncEnd !== -1) {
    code = code.slice(0, isFiboFuncStart) + code.slice(isFiboFuncEnd + 1);
    console.log('✔ Função IsFiboActiveForSymbol() removida.');
  }
}

// 5. Limpar qualquer resquício de InpMaxFiboTrades ou g_NPosSwingFibo
code = code.replace(/input int InpMaxFiboTrades\s*=\s*1;\s*\/\/\s*Limite SW para Fibo H4/g, '');
code = code.replace(/&&\s*g_NPosSwingFibo\s*>=\s*InpMaxFiboTrades/g, '');
code = code.replace(/int\s+g_NPosSwingFibo\s*=\s*0;/g, '');

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 100% limpo e sem resquícios de Fibo!');
