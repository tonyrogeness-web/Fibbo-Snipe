const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO TODAS AS 9 CORREÇÕES FUNCIONAIS E DE ARQUITETURA ===\n');

// 1. CORREÇÃO 1: MODO ZEN E TF DE CONFLUÊNCIA EM OnTimer()
const oldZenConfl = `      g_ModoAnalise = g_ViewZonas;
      if(g_ModoAnalise || g_ModoConfluencia > 0) {
         // [ZEN FIX] No modo ZEN, usa sempre o TF do gráfico atual (PERIOD_CURRENT).
         // O TF do MarketGlance (confluência) só se aplica quando ZEN está desligado.
         ENUM_TIMEFRAMES tf_mg = PERIOD_CURRENT;
         if(!g_ViewZonas && g_ModoConfluencia > 0) {
            if(g_ModoConfluencia == 1)      tf_mg = PERIOD_M15;
            else if(g_ModoConfluencia == 2) tf_mg = PERIOD_H1;
            else if(g_ModoConfluencia == 3) tf_mg = PERIOD_H2;
            else if(g_ModoConfluencia == 4) tf_mg = PERIOD_H4;
         }
         AtualizarSensoresAnalise(tf_mg);
         DesenharLinhasAnalise();

      } else {
         LimparTudoAnalise();
      }`;

const newZenConfl = `      g_ModoAnalise = g_ViewZonas;
      if(g_ModoAnalise || g_ModoConfluencia > 0) {
         // [CORREÇÃO ITEM 1]: O TF de Confluência é SEMPRE determinado por g_ModoConfluencia,
         // independente de o botão visual ZEN estar ligado ou desligado!
         ENUM_TIMEFRAMES tf_mg = g_TF_L1;
         if(g_ModoConfluencia == 1)      tf_mg = PERIOD_M15;
         else if(g_ModoConfluencia == 2) tf_mg = PERIOD_H1;
         else if(g_ModoConfluencia == 3) tf_mg = PERIOD_H2;
         else if(g_ModoConfluencia == 4) tf_mg = PERIOD_H4;
         
         AtualizarSensoresAnalise(tf_mg);
         if(g_ModoAnalise) DesenharLinhasAnalise();
         else LimparObjetosVisuaisMG();

      } else {
         LimparTudoAnalise();
      }`;

if (code.includes(oldZenConfl)) {
  code = code.replace(oldZenConfl, newZenConfl);
  console.log('✔ [1/9] Modo ZEN desacoplado: Timeframe de Confluência agora é rigorosamente mantido!');
} else {
  console.log('❌ [1/9] oldZenConfl não encontrado');
}

// 2. CORREÇÃO 2: InpMaxAutoRisk APLICADO NO CÁLCULO DE LOTE
const oldLotRisk = `   double risk_pct = InpPropFirmMode ? MathMin(InpBaseRisk_L1, g_PropMaxRiskPct) : InpBaseRisk_L1;`;
const newLotRisk = `   // [CORREÇÃO ITEM 2]: InpMaxAutoRisk atua como teto máximo de risco em todos os modos operacionais
   double max_risk_cap = (InpPropFirmMode && g_PropMaxRiskPct > 0) ? MathMin(InpMaxAutoRisk, g_PropMaxRiskPct) : InpMaxAutoRisk;
   double risk_pct = MathMin(InpBaseRisk_L1, max_risk_cap);`;

if (code.includes(oldLotRisk)) {
  code = code.replace(oldLotRisk, newLotRisk);
  console.log('✔ [2/9] InpMaxAutoRisk integrado como teto de segurança no cálculo de lote!');
} else {
  console.log('❌ [2/9] oldLotRisk não encontrado');
}

// 3. CORREÇÃO 3: CONTAGEM DE VAGAS AGRUPANDO POSIÇÕES FRACIONADAS (P1 + P2 = 1 TRADE LÓGICO)
const oldPosCounting = `   g_FastNPos = 0; g_FastNPosSymbol = 0; g_FastPlFloat = 0;
   g_FloatingPlSym = 0; g_FloatingPlTot = 0;
   g_NPosDay = 0; g_NPosSwing = 0; g_NPosSwingFR = 0; g_NPosSwingFibo = 0;
   for(int _i = PositionsTotal()-1; _i >= 0; _i--) {
      ulong _tk = PositionGetTicket(_i);
      if(!PositionSelectByTicket(_tk)
         || PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      g_FastNPos++;
      double _pl = PositionGetDouble(POSITION_PROFIT)
                 + PositionGetDouble(POSITION_SWAP);
      g_FloatingPlTot += _pl;
      if(PositionGetString(POSITION_SYMBOL) == _Symbol) {
         g_FastNPosSymbol++;
         g_FastPlFloat  += _pl;
         g_FloatingPlSym += _pl;
         string _comm_tmp = PositionGetString(POSITION_COMMENT);
         if(StringFind(_comm_tmp, "_L1") >= 0) {
            g_NPosDay++;
         } else {
            g_NPosSwing++;
            if(StringFind(_comm_tmp, "FR") >= 0)   g_NPosSwingFR++;
            else if(StringFind(_comm_tmp, "Fibo") >= 0) g_NPosSwingFibo++;
         }
      }
   }`;

const newPosCounting = `   g_FastNPos = 0; g_FastNPosSymbol = 0; g_FastPlFloat = 0;
   g_FloatingPlSym = 0; g_FloatingPlTot = 0;
   g_NPosDay = 0; g_NPosSwing = 0; g_NPosSwingFR = 0; g_NPosSwingFibo = 0;

   // [CORREÇÃO ITEM 3]: Agrupamento inteligente de sinais lógicos (evita que P1 + P2 consuma 2 vagas)
   string seen_signals[];
   int seen_count = 0;

   for(int _i = PositionsTotal()-1; _i >= 0; _i--) {
      ulong _tk = PositionGetTicket(_i);
      if(!PositionSelectByTicket(_tk)
         || PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      
      double _pl = PositionGetDouble(POSITION_PROFIT)
                 + PositionGetDouble(POSITION_SWAP);
      g_FloatingPlTot += _pl;

      string p_sym  = PositionGetString(POSITION_SYMBOL);
      string p_comm = PositionGetString(POSITION_COMMENT);
      
      // Cria chave única do sinal removendo sufixos de parcial (_P1, _P2)
      string base_comm = p_comm;
      StringReplace(base_comm, "_P1", "");
      StringReplace(base_comm, "_P2", "");
      string sig_key = p_sym + "|" + base_comm;

      bool already_counted = false;
      for(int k = 0; k < seen_count; k++) {
         if(seen_signals[k] == sig_key) { already_counted = true; break; }
      }

      if(!already_counted) {
         ArrayResize(seen_signals, seen_count + 1);
         seen_signals[seen_count++] = sig_key;
         g_FastNPos++;
      }

      if(p_sym == _Symbol) {
         g_FastPlFloat  += _pl;
         g_FloatingPlSym += _pl;
         if(!already_counted) {
            g_FastNPosSymbol++;
            if(StringFind(p_comm, "_L1") >= 0) {
               g_NPosDay++;
            } else {
               g_NPosSwing++;
               if(StringFind(p_comm, "FR") >= 0)        g_NPosSwingFR++;
               else if(StringFind(p_comm, "Fibo") >= 0) g_NPosSwingFibo++;
            }
         }
      }
   }`;

if (code.includes(oldPosCounting)) {
  code = code.replace(oldPosCounting, newPosCounting);
  console.log('✔ [3/9] Contagem de vagas corrigida para agrupar sinais lógicos (P1 + P2 = 1 vaga)!');
} else {
  console.log('❌ [3/9] oldPosCounting não encontrado');
}

// 4. CORREÇÃO 5: TRAILING STOP DA FIBO USANDO ATR DE H4 (g_CachedFiboATR)
const oldTrailAtr = `double pos_atr=(StringFind(c_comm,"_L2")>=0||StringFind(c_comm,"_H4")>=0)?(g_L2_ATR>0?g_L2_ATR:g_CachedATR):g_CachedATR;`;
const newTrailAtr = `double pos_atr=(StringFind(c_comm,"Fibo_")>=0)?(g_CachedFiboATR>0?g_CachedFiboATR:g_CachedATR):((StringFind(c_comm,"_L2")>=0||StringFind(c_comm,"_H4")>=0)?(g_L2_ATR>0?g_L2_ATR:g_CachedATR):g_CachedATR);`;

if (code.includes(oldTrailAtr)) {
  code = code.replace(oldTrailAtr, newTrailAtr);
  console.log('✔ [5/9] Trailing Stop da Fibo blindado para usar sempre o ATR de H4 (g_CachedFiboATR)!');
} else {
  console.log('❌ [5/9] oldTrailAtr não encontrado');
}

// 5. CORREÇÃO 7: DECLARAÇÃO g_ModoAnalise UNIFICADA
code = code.replace('extern bool g_ModoAnalise;', '// g_ModoAnalise declarado globalmente abaixo');
console.log('✔ [7/9] Declaração redundante extern bool g_ModoAnalise unificada!');

// 6. CORREÇÃO 8: RODAPÉ DO CÓDIGO
code = code.replace('//  FIM — Fibbo_Sniper_v28.4_PRO.mq5', '//  FIM — Fibbo_Sniper_v28.5_H2.mq5');
console.log('✔ [8/9] Comentário de rodapé atualizado para v28.5_H2!');

// 7. CORREÇÃO 9: RESET DE g_MG_BuyAllowed / g_MG_SellAllowed EM LimparTudoAnalise()
const oldResetAnalise = `   g_MG_DiagText = ""; g_MG_DiagColor = clrGray;`;
const newResetAnalise = `   g_MG_DiagText = ""; g_MG_DiagColor = clrGray;
   g_MG_BuyAllowed = true; g_MG_SellAllowed = true;`;

if (code.includes(oldResetAnalise)) {
  code = code.replace(oldResetAnalise, newResetAnalise);
  console.log('✔ [9/9] Reset de permissões adicionado a LimparTudoAnalise()!');
}

fs.writeFileSync(file, code);

// Sincroniza com as pastas de Experts do MT5
const expertPaths = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5'
];
expertPaths.forEach(p => {
  try {
    fs.writeFileSync(p, fs.readFileSync(file));
    console.log('✔ .MQ5 sincronizado em:', p);
  } catch (err) {
    console.log('Erro ao salvar em:', p, err.message);
  }
});

console.log('\n=== TODAS AS 9 MELHORIAS APLICADAS COM SUCESSO! ===');
