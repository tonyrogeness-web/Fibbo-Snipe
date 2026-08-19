const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO AS 4 CORREÇÕES MET PROTOCOLARES NO MQ5 ===\n');

// 1. ITEM A: Desacoplar cálculo do MarketGlance/Confluência do toggle visual ZEN
const oldDrawAnalise = `void DesenharLinhasAnalise() {
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double atrVal = g_MG_ATR;
   
   // Apenas se o Modo Zen estiver desligado a legenda somerá. Em [ NENHUM ], as linhas do gráfico somem mas a Análise Gráfica continua ativa!
   if(!g_ViewZonas) {
      g_ModoAnalise = false;
      LimparTudoAnalise();
      return;
   } else {
      g_ModoAnalise = true;
   }`;

const newDrawAnalise = `void LimparObjetosVisuaisMG() {
   int total = ObjectsTotal(0, 0, -1);
   for(int i = total - 1; i >= 0; i--) {
      string name = ObjectName(0, i, 0, -1);
      if(StringFind(name, MG_PREFIX) == 0)
         ObjectDelete(0, name);
   }
}

void AtualizarPermissoesConfluenciaMG() {
   g_MG_BuyAllowed = true;
   g_MG_SellAllowed = true;
   
   double b5[1], b2[1];
   bool chk_m15 = (g_MG_CurrentTF == PERIOD_M15);
   bool chk_h1  = (g_MG_CurrentTF == PERIOD_M15 || g_MG_CurrentTF == PERIOD_H1);
   bool chk_h2  = (g_MG_CurrentTF == PERIOD_M15 || g_MG_CurrentTF == PERIOD_H1 || g_MG_CurrentTF == PERIOD_H2);
   bool chk_h4  = (g_MG_CurrentTF == PERIOD_M15 || g_MG_CurrentTF == PERIOD_H1 || g_MG_CurrentTF == PERIOD_H2 || g_MG_CurrentTF == PERIOD_H4);

   if(chk_m15 && g_MG_hEMA50_M15 != INVALID_HANDLE && g_MG_hEMA200_M15 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_M15,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_M15,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }
   if(chk_h1 && g_MG_hEMA50_H1 != INVALID_HANDLE && g_MG_hEMA200_H1 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_H1,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_H1,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }
   if(chk_h2 && g_MG_hEMA50_H2 != INVALID_HANDLE && g_MG_hEMA200_H2 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_H2,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_H2,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }
   if(chk_h4 && g_MG_hEMA50_H4 != INVALID_HANDLE && g_MG_hEMA200_H4 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_H4,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_H4,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }

   if(g_MG_EMA50 > 0 && g_MG_EMA200 > 0) {
       if(g_MG_EMA50 <= g_MG_EMA200) g_MG_BuyAllowed = false; // Tendencia Baixa (bloqueia compra)
       if(g_MG_EMA50 >= g_MG_EMA200) g_MG_SellAllowed = false; // Tendencia Alta (bloqueia venda)
   }
}

void DesenharLinhasAnalise() {
   // [ITEM A FIX] Permissões de confluência SEMPRE calculadas, independente do modo visual
   AtualizarPermissoesConfluenciaMG();

   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double atrVal = g_MG_ATR;
   
   // Se o Modo Zen estiver desligado, apenas limpa os objetos visuais do gráfico sem desativar a confluência!
   if(!g_ViewZonas) {
      g_ModoAnalise = false;
      LimparObjetosVisuaisMG();
      return;
   } else {
      g_ModoAnalise = true;
   }`;

if (code.includes(oldDrawAnalise)) {
  code = code.replace(oldDrawAnalise, newDrawAnalise);
  console.log('✔ [1/4] Item A: MarketGlance e Confluência desacoplados do toggle visual ZEN');
} else {
  console.log('❌ [1/4] oldDrawAnalise não encontrado');
}

// 2. ITEM B: GetStrategyLossStatus_ByTag com rastreio de deal de entrada e agrupamento de posição
const oldLossStatus = `int GetStrategyLossStatus_ByTag(string filter1, string filter2="", string excludeFilter="") {
   int losses = 0;
   static datetime last_hs_time = 0;
   if(TimeCurrent() - last_hs_time > 1) {
       HistorySelect(TimeCurrent() - (86400*3), TimeCurrent() + 1);
       last_hs_time = TimeCurrent();
   }
   for(int i = HistoryDealsTotal()-1; i >= 0; i--) {
      ulong tk = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(tk,DEAL_ENTRY) != DEAL_ENTRY_OUT || HistoryDealGetInteger(tk,DEAL_MAGIC) != InpMagic || HistoryDealGetString(tk,DEAL_SYMBOL) != _Symbol) continue;
      string comm = HistoryDealGetString(tk, DEAL_COMMENT);
      if(StringFind(comm, filter1) < 0) continue;
      if(filter2 != "" && StringFind(comm, filter2) < 0) continue;
      if(excludeFilter != "" && StringFind(comm, excludeFilter) >= 0) continue;
      double p = HistoryDealGetDouble(tk, DEAL_PROFIT) + HistoryDealGetDouble(tk, DEAL_SWAP) + HistoryDealGetDouble(tk, DEAL_COMMISSION);
      if(p < -0.01) losses++; else if(p >= -0.01) break;
   }
   return losses;
}`;

const newLossStatus = `int GetStrategyLossStatus_ByTag(string filter1, string filter2="", string excludeFilter="") {
   int losses = 0;
   static datetime last_hs_time = 0;
   if(TimeCurrent() - last_hs_time > 1) {
       HistorySelect(TimeCurrent() - (86400*3), TimeCurrent() + 1);
       last_hs_time = TimeCurrent();
   }
   
   ulong processed_pos[32];
   int proc_count = 0;
   
   for(int i = HistoryDealsTotal()-1; i >= 0; i--) {
      ulong tk = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(tk, DEAL_ENTRY) != DEAL_ENTRY_OUT || 
         HistoryDealGetInteger(tk, DEAL_MAGIC) != InpMagic || 
         HistoryDealGetString(tk, DEAL_SYMBOL) != _Symbol) continue;
      
      ulong pos_id = HistoryDealGetInteger(tk, DEAL_POSITION_ID);
      
      // Evita contar duas vezes posicoes com parciais P1 e P2 fechadas juntas
      bool already_proc = false;
      for(int p_idx = 0; p_idx < proc_count; p_idx++) {
         if(processed_pos[p_idx] == pos_id) { already_proc = true; break; }
      }
      if(already_proc) continue;
      
      string comm = HistoryDealGetString(tk, DEAL_COMMENT);
      
      // [ITEM B FIX] Se o deal de saída foi rotulado pelo MT5 como [sl ...] ou [tp ...], busca a tag original no deal de entrada
      if(StringFind(comm, "[") == 0 || (StringFind(comm, filter1) < 0 && (filter2 == "" || StringFind(comm, filter2) < 0))) {
         if(pos_id > 0) {
            for(int j = HistoryDealsTotal()-1; j >= 0; j--) {
               ulong in_tk = HistoryDealGetTicket(j);
               if(HistoryDealGetInteger(in_tk, DEAL_POSITION_ID) == pos_id && HistoryDealGetInteger(in_tk, DEAL_ENTRY) == DEAL_ENTRY_IN) {
                  comm = HistoryDealGetString(in_tk, DEAL_COMMENT);
                  break;
               }
            }
         }
      }
      
      if(StringFind(comm, filter1) < 0) continue;
      if(filter2 != "" && StringFind(comm, filter2) < 0) continue;
      if(excludeFilter != "" && StringFind(comm, excludeFilter) >= 0) continue;
      
      if(proc_count < 32) processed_pos[proc_count++] = pos_id;
      
      double p = HistoryDealGetDouble(tk, DEAL_PROFIT) + HistoryDealGetDouble(tk, DEAL_SWAP) + HistoryDealGetDouble(tk, DEAL_COMMISSION);
      if(p < -0.01) losses++; 
      else if(p >= -0.01) break;
   }
   return losses;
}`;

if (code.includes(oldLossStatus)) {
  code = code.replace(oldLossStatus, newLossStatus);
  console.log('✔ [2/4] Item B: Contador de perdas consecutivas corrigido (P1/P2 agrupadas e deal IN resolvido)');
} else {
  console.log('❌ [2/4] oldLossStatus não encontrado');
}

// 3. ITEM C: Dimensionamento de lote normalizado
const oldLotComp = `double ComputeLot_ByDistance(double current_sl_pts, double current_atr) {
   double vol_min = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   if(vol_min <= 0) vol_min = 0.01;
   if(g_CachedATR <= 0 || current_atr <= 0) return vol_min;
   
   // Proporção ATR atual vs ATR L1 determina o scaling de risco (limitado a faixa segura [0.2, 5.0])
   double ratio = (g_CachedATR > 0) ? (current_atr / g_CachedATR) : 1.0;
   ratio = MathMax(0.2, MathMin(5.0, ratio));

   // [PROP RECOMENDADO] No Modo Prop Firm, parte do risco base InpBaseRisk_L1 (limitado ao teto da mesa) e escala até g_PropMaxRiskPct no máximo
   double base_risk = InpPropFirmMode ? MathMin(InpBaseRisk_L1, g_PropMaxRiskPct) : InpBaseRisk_L1;
   double max_risk  = InpPropFirmMode ? g_PropMaxRiskPct : InpMaxAutoRisk;
   double dynamic_risk = MathMin(max_risk, base_risk * ratio);
   
   double risk_money = AccountInfoDouble(ACCOUNT_BALANCE) * (dynamic_risk / 100.0);
   double tv = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double ts = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(current_sl_pts <= 0 || tv <= 0 || ts <= 0) return vol_min;
   
   double step    = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(step <= 0) step = 0.01;
   double vol_max = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   if(vol_max <= 0) vol_max = 100.0;

   double lot = MathFloor((risk_money / ((current_sl_pts * _Point / ts) * tv)) / step) * step;
   return MathMax(MathMin(lot, vol_max), vol_min);
}`;

const newLotComp = `double ComputeLot_ByDistance(double current_sl_pts, double current_atr) {
   double vol_min = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   if(vol_min <= 0) vol_min = 0.01;
   if(current_sl_pts <= 0) return vol_min;
   
   // [ITEM C FIX: GESTÃO DE RISCO RIGOROSA]
   // O risco financeiro em dólares é fixado pelo percentual de banca (ex: InpBaseRisk_L1 = 0.5% ou 1.5%).
   // Como o denominador divide por current_sl_pts, o lote se ajusta de forma perfeitamente proporcional à distância do SL sem distorções entre TFs.
   double risk_pct = InpPropFirmMode ? MathMin(InpBaseRisk_L1, g_PropMaxRiskPct) : InpBaseRisk_L1;
   double risk_money = AccountInfoDouble(ACCOUNT_BALANCE) * (risk_pct / 100.0);
   
   double tv = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double ts = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tv <= 0 || ts <= 0) return vol_min;
   
   double step    = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(step <= 0) step = 0.01;
   double vol_max = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   if(vol_max <= 0) vol_max = 100.0;

   double lot = MathFloor((risk_money / ((current_sl_pts * _Point / ts) * tv)) / step) * step;
   return MathMax(MathMin(lot, vol_max), vol_min);
}`;

if (code.includes(oldLotComp)) {
  code = code.replace(oldLotComp, newLotComp);
  console.log('✔ [3/4] Item C: Dimensionamento de lote normalizado por percentual de risco real');
} else {
  console.log('❌ [3/4] oldLotComp não encontrado');
}

// 4. ITEM D: Reset de array anti-colisão de labels
const oldLabelShift = `       // Algoritmo de Shift Vertical Anti-Colisão
       static double s_LabelPrices[10];
       static int s_LabelCount = 0;
       if(name == "FR_TxtT") s_LabelCount = 0;`;

const newLabelShift = `       // Algoritmo de Shift Vertical Anti-Colisão
       static double s_LabelPrices[10];
       static int s_LabelCount = 0;
       static datetime s_LastLabelReset = 0;
       if(TimeCurrent() != s_LastLabelReset || name == "FR_TxtT" || name == "Fibo_V1" || name == "Fibo_C1") {
          s_LabelCount = 0;
          s_LastLabelReset = TimeCurrent();
       }`;

if (code.includes(oldLabelShift)) {
  code = code.replace(oldLabelShift, newLabelShift);
  console.log('✔ [4/4] Item D: Reset de anti-colisão de labels sincronizado a cada ciclo/tag');
} else {
  console.log('❌ [4/4] oldLabelShift não encontrado');
}

// Salvar
fs.writeFileSync(file, code);
console.log('\n✔ ' + file + ' atualizado com sucesso com as 4 melhorias protocoladas!');
