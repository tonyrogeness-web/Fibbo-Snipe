const fs = require('fs');
const path = require('path');

console.log('=== APLICANDO ROTEAMENTO INTELIGENTE FR + FLUXO E EXCLUSÃO MÚTUA ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Inserir os Inputs de Roteamento Inteligente
const targetInputs = 'input group "=== TENDÊNCIA E FLUXO ==="';
const newInputs = `input group "=== ROTEAMENTO INTELIGENTE POR ATIVO ==="
input bool   InpSmartRouting         = true; // [ROTEAMENTO AUTOMÁTICO] Ativa estratégia campeã por moeda
input string InpFR_BlockedSymbols    = "GBPJPY,GBPUSD"; // Pares bloqueados para FR (Pares de Tendência/Libra)
input string InpFluxo_BlockedSymbols = "EURUSD,EURJPY,EURCAD,NZDUSD,EURAUD,AUDNZD"; // Pares bloqueados para Fluxo (Pares de Canal)

input group "=== TENDÊNCIA E FLUXO ==="`;

if (!code.includes('InpSmartRouting')) {
  code = code.replace(targetInputs, newInputs);
  console.log('✔ Inputs InpSmartRouting, InpFR_BlockedSymbols, InpFluxo_BlockedSymbols inseridos.');
}

// 2. Inserir Funções Auxiliares de Roteamento e Exclusão Mútua
const helperFunctions = `
//===================================================================
// ROTEAMENTO INTELIGENTE POR SÍMBOLO & EXCLUSÃO MÚTUA
//===================================================================
bool IsSymbolInList(string symbol_to_check, string list) {
   if(list == "") return false;
   string sym = symbol_to_check;
   StringToUpper(sym);
   string l = list;
   StringToUpper(l);
   return (StringFind(l, sym) >= 0);
}

bool IsFRAllowedForCurrentSymbol() {
   if(!InpUseFR) return false;
   if(!InpSmartRouting) return true;
   if(IsSymbolInList(_Symbol, InpFR_BlockedSymbols)) return false;
   return true;
}

bool IsFluxoAllowedForCurrentSymbol() {
   if(!InpUseFluxo) return false;
   if(!InpSmartRouting) return true;
   if(IsSymbolInList(_Symbol, InpFluxo_BlockedSymbols)) return false;
   return true;
}

bool TemPosicaoAbertaNoAtivoComPrefixo(string prefix) {
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetString(POSITION_SYMBOL) == _Symbol) {
         long magic = PositionGetInteger(POSITION_MAGIC);
         if(magic == InpMagic) {
            string comment = PositionGetString(POSITION_COMMENT);
            if(StringFind(comment, prefix) >= 0) return true;
         }
      }
   }
   return false;
}
`;

if (!code.includes('IsFRAllowedForCurrentSymbol')) {
  // Inserir antes de OnTick
  const onTickIndex = code.indexOf('void OnTick()');
  if (onTickIndex !== -1) {
    code = code.slice(0, onTickIndex) + helperFunctions + '\n' + code.slice(onTickIndex);
    console.log('✔ Funções IsFRAllowedForCurrentSymbol, IsFluxoAllowedForCurrentSymbol e TemPosicaoAbertaNoAtivoComPrefixo inseridas.');
  }
}

// 3. Atualizar Execução do FLUXO com IsFluxoAllowedForCurrentSymbol e Trava de Exclusão Mútua contra FR
const fluxoSearch = 'if(InpUseFluxo && !block_day) {';
const fluxoReplace = 'if(IsFluxoAllowedForCurrentSymbol() && !block_day && !TemPosicaoAbertaNoAtivoComPrefixo("FR_")) {';
if (code.includes(fluxoSearch)) {
  code = code.replace(fluxoSearch, fluxoReplace);
  console.log('✔ Execução do Fluxo atualizada com IsFluxoAllowedForCurrentSymbol e trava contra FR.');
}

// 4. Atualizar Execução do FR com IsFRAllowedForCurrentSymbol e Trava de Exclusão Mútua contra Fluxo
const frSearch = 'if(InpUseFR) {';
const frReplace = 'if(IsFRAllowedForCurrentSymbol() && !TemPosicaoAbertaNoAtivoComPrefixo("Fluxo_")) {';
if (code.includes(frSearch)) {
  code = code.replace(frSearch, frReplace);
  console.log('✔ Execução do FR atualizada com IsFRAllowedForCurrentSymbol e trava contra Fluxo.');
}

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 salvo com sucesso!');
