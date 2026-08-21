const fs = require('fs');

const p = "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Experts\\Free Robots\\Fibbo_Sniper_v28.5_H2.mq5";
const content = fs.readFileSync(p, 'utf8');

console.log("Size:", content.length);
console.log("Contains IsSymbolInList with StringSplit:", content.includes("StringSplit(l, ',', items)"));
console.log("Contains Uso Estratégia não for FR:", content.includes('DROW_DYN("Uso Estratégia", u_r ? "sim" : "não", !u_r)'));
console.log("Contains show_fr_lines with IsFRAllowed:", content.includes('bool show_fr_lines = IsFRAllowedForCurrentSymbol()'));
