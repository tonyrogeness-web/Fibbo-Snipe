const fs = require('fs');
const path = require('path');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
const lines = fs.readFileSync(mq5Path, 'utf8').split('\n');

console.log(`Total de linhas: ${lines.length}`);

// 1. Substituir em DesenharPainelDiag (Aba 1 - F.ROMP)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('bool u_r=InpUseFR, c_c=g_CachedFrCdOk')) {
    console.log(`Encontrado FR Diag na linha ${i+1}`);
    lines[i] = '      bool is_fr_rot_ok = IsFRAllowedForCurrentSymbol();\n' +
               '      bool u_r = InpUseFR && is_fr_rot_ok; // No XAUUSD, GBPJPY, GBPUSD -> Uso da Estratégia FR é NÃO\n' +
               '      bool c_c = g_CachedFrCdOk, c_l = (g_CachedFRTop > 0 && g_CachedFRFundo > 0);';
  }
  if (lines[i].includes('DROW_DYN("Uso Estratégia",u_r?"sim":"OFF",!u_r)')) {
    console.log(`Encontrado DROW_DYN Uso Estratégia na linha ${i+1}`);
    lines[i] = '       DROW_DYN("Uso Estratégia", u_r ? "sim" : "não", !u_r)\n' +
               '       DROW_DYN("Roteamento Ativo", is_fr_rot_ok ? "PERMITIDO" : "BLOQUEADO (PAR TENDÊNCIA)", !is_fr_rot_ok)';
  }
  if (lines[i].includes('if(InpUseFR && g_CachedFRTop > 0) {') && i < 2050) {
    console.log(`Encontrado Desenho FR na linha ${i+1}`);
    lines[i] = '   bool show_fr_lines = IsFRAllowedForCurrentSymbol() && InpUseFR && (g_CachedFRTop > 0 && g_CachedFRFundo > 0);\n   if(show_fr_lines) {';
  }
}

// 2. IsSymbolInList com detecção robusta
let funcStart = -1;
let funcEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('bool IsSymbolInList(string symbol_to_check, string list) {')) {
    funcStart = i;
  }
  if (funcStart !== -1 && lines[i].includes('return (StringFind(l, sym) >= 0);')) {
    funcEnd = i + 1;
    break;
  }
}

if (funcStart !== -1 && funcEnd !== -1) {
  console.log(`Substituindo IsSymbolInList das linhas ${funcStart+1} a ${funcEnd+1}`);
  const newFuncCode = [
    'bool IsSymbolInList(string symbol_to_check, string list) {',
    '   if(list == "") return false;',
    '   string sym = symbol_to_check;',
    '   StringToUpper(sym);',
    '   string l = list;',
    '   StringToUpper(l);',
    '   string items[];',
    '   int count = StringSplit(l, \',\', items);',
    '   for(int i = 0; i < count; i++) {',
    '      string itm = items[i];',
    '      StringTrimLeft(itm);',
    '      StringTrimRight(itm);',
    '      if(itm != "" && (StringFind(sym, itm) >= 0 || StringFind(itm, sym) >= 0)) return true;',
    '   }',
    '   return false;',
    '}'
  ];
  lines.splice(funcStart, funcEnd - funcStart + 1, ...newFuncCode);
}

const newContent = lines.join('\n');
fs.writeFileSync(mq5Path, newContent, 'utf8');
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 gravado e modificado com sucesso!');
