const symbols = ["EURUSD", "EURCAD", "NZDUSD", "EURAUD", "EURJPY", "AUDNZD", "GBPJPY", "GBPUSD", "XAUUSD"];

const InpFR_BlockedSymbols = "GBPJPY,GBPUSD,XAUUSD,GOLD";
const InpFluxo_BlockedSymbols = "EURUSD,EURJPY,EURCAD,NZDUSD,EURAUD,AUDNZD";

function IsSymbolInList(sym, list) {
  return list.toUpperCase().includes(sym.toUpperCase());
}

function IsFRAllowed(sym) {
  return !IsSymbolInList(sym, InpFR_BlockedSymbols);
}

function IsFluxoAllowed(sym) {
  return !IsSymbolInList(sym, InpFluxo_BlockedSymbols);
}

console.log('=== AUDITORIA DE ROTEAMENTO EXATO POR SÍMBOLO ===\n');
console.log('Símbolo | Falso Rompimento (FR) | Fluxo Institucional | Status da Execução');
console.log('--------------------------------------------------------------------------');

symbols.forEach(s => {
  const fr = IsFRAllowed(s);
  const flx = IsFluxoAllowed(s);
  let status = "";
  if (fr && !flx) status = "🟢 100% FALSO ROMPIMENTO PURO (Fluxo Bloqueado)";
  else if (!fr && flx) status = "🌪️ 100% FLUXO PURO (FR Bloqueado)";
  else if (fr && flx) status = "⚡ HÍBRIDO (FR + Fluxo)";
  else status = "⛔ DESATIVADO";
  
  console.log(`${s.padEnd(7)} | ${fr ? "ATIVO (SIM) ".padEnd(21) : "BLOQUEADO (OFF)".padEnd(21)} | ${flx ? "ATIVO (SIM) ".padEnd(19) : "BLOQUEADO (OFF)".padEnd(19)} | ${status}`);
});
