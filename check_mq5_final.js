const fs = require('fs');
const content = fs.readFileSync('Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

console.log('Total de linhas:', content.split('\n').length);
console.log('Tamanho em bytes:', Buffer.byteLength(content, 'utf8'));

const checks = [
  { name: '1. InpFiboBlockedSymbols com 4 moedas (EURCAD,EURAUD,EURUSD,EURGBP)', ok: content.includes('input string InpFiboBlockedSymbols       = "EURCAD,EURAUD,EURUSD,EURGBP";') },
  { name: '2. g_GV_Blocked com login da conta', ok: content.includes('g_GV_Blocked     = "Sniper_Blocked_" + _Symbol + "_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));') },
  { name: '3. g_GV_GlobalBlock e Day com login', ok: content.includes('"Sniper_GlobalBlock_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));') },
  { name: '4. Diag Fibo com BLOQ (EMA)', ok: content.includes('"BLOQ (EMA)"') },
  { name: '5. Invalidação volume L2', ok: content.includes('g_CachedVolMed_L2 = mv2 / 5.0;\n      } else all_copied = false;') },
  { name: '6. Trailing stop com piso stops_level', ok: content.includes('if(pos_trail_dist < stops_level) pos_trail_dist = stops_level + (_Point * 2.0);') },
  { name: '7. AutoSelecionarTF padrão H2', ok: content.includes('g_TF_L1 = PERIOD_H2;\n   TF_L2   = PERIOD_H4;') }
];

let allOk = true;
checks.forEach(c => {
  console.log((c.ok ? '✅ ' : '❌ ') + c.name);
  if (!c.ok) allOk = false;
});
console.log('\nSTATUS DO ARQUIVO LOCAL:', allOk ? '100% COMPLETO E DEFINITIVO' : 'DIVERGÊNCIA');
