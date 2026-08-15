const fs = require('fs');
const { execSync } = require('child_process');

const targetFile = 'Fibbo_Sniper_v28.5_H2.mq5';
const buf = fs.readFileSync(targetFile);
let text = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.toString('utf16le') : buf.toString('utf8');

// Backup original
if (!fs.existsSync('_backup')) fs.mkdirSync('_backup');
fs.writeFileSync('_backup/Fibbo_Sniper_v28.5_H2_before_precision.mq5', buf);

console.log('Original length:', text.length);

// 1. UPDATE INPUTS
const oldInputsFR = `input group "=== FALSO ROMPIMENTO ==="
input bool InpUseFR = true, InpFR_UseRSI = true;
input int InpFR_RSI_Period = 14;
input double InpFR_MagneticZoneATRPct = 15.0;
input bool InpFR_RequireWickRejection = true;
input double InpFR_WickBodyRatio = 0.5;
input double InpFR_WickRangeMinPct = 35.0;
input double InpFR_BodyRangeMinPct = 20.0;
input bool InpFR_AdaptiveRSI = true;
input double InpFR_RSI_LateralRelax = 8.0;
input bool InpFR_NeutralDirByRSI = true;
input double InpFR_NeutralRSI_Sell = 55.0;
input double InpFR_NeutralRSI_Buy = 45.0;
input bool InpFR_ProgressiveZone = true;
input bool InpFR_ZoneCooldown = true;
input int  InpFR_CooldownMinutes = 30; // [R3] Min. entre entradas FR no mesmo nível (0=sem cooldown)`;

const newInputsFR = `input group "=== FALSO ROMPIMENTO (ALTA PRECISÃO) ==="
input bool InpUseFR = true, InpFR_UseRSI = true;
input int InpFR_RSI_Period = 14;
input double InpFR_MagneticZoneATRPct = 15.0;
input bool InpFR_RequireWickRejection = true;
input double InpFR_WickBodyRatio = 0.5;
input double InpFR_WickRangeMinPct = 35.0;
input double InpFR_BodyRangeMinPct = 20.0;
input bool InpFR_RequireQuadrantClose = true; // [PILAR 1] Exigir fechamento no 1/3 extremo (Sniper)
input double InpFR_CloseQuadrantPct = 35.0;   // % máx do range para fechamento (35% = terço extremo)
input double InpFR_MaxPenetrationATR = 0.75;  // [PILAR 2] Teto máx de penetração do falso rompimento (xATR)
input bool InpFR_RequireVolumeAbsorption = true; // [PILAR 3] Exigir absorção de volume na vela de rejeição
input double InpFR_MinVolumeRatio = 0.90;       // Ratio mín de volume vs média (0.90 = 90%)
input bool InpFR_UseStructuralTP2 = true;        // [PILAR 4] TP2 dinâmico no extremo oposto do canal FR
input bool InpFR_AdaptiveRSI = true;
input double InpFR_RSI_LateralRelax = 8.0;
input bool InpFR_NeutralDirByRSI = true;
input double InpFR_NeutralRSI_Sell = 55.0;
input double InpFR_NeutralRSI_Buy = 45.0;
input bool InpFR_ProgressiveZone = true;
input bool InpFR_ZoneCooldown = true;
input int  InpFR_CooldownMinutes = 30; // [R3] Min. entre entradas FR no mesmo nível (0=sem cooldown)`;

const oldInputsProtecao = `input group "=== PROTEÇÃO ==="
input bool InpUseBreakEven = true;
input double InpBE_Trigger_Normal = 0.50, InpBE_Trigger_Fibo = 0.50, InpBE_LockProfitPts = 0.0;
input bool InpUseTrailStop = true;
input double InpTrail_ATR_Multi = 1.0;`;

const newInputsProtecao = `input group "=== PROTEÇÃO ==="
input bool InpUseBreakEven = true;
input double InpBE_Trigger_Normal = 0.50, InpBE_Trigger_Fibo = 0.50, InpBE_LockProfitPts = 0.0;
input bool InpBE_UseATRBreathing = true;   // [PILAR 5] BE com respiro dinâmico no 1º gatilho (ATR)
input double InpBE_BreathingATRPct = 20.0; // Distância de respiro do BE (% do ATR)
input bool InpUseTrailStop = true;
input double InpTrail_ATR_Multi = 1.0;`;

if (!text.includes(oldInputsFR)) {
    console.error('Could not find oldInputsFR!');
} else {
    text = text.replace(oldInputsFR, newInputsFR);
    console.log('Updated Inputs FR!');
}

if (!text.includes(oldInputsProtecao)) {
    console.error('Could not find oldInputsProtecao!');
} else {
    text = text.replace(oldInputsProtecao, newInputsProtecao);
    console.log('Updated Inputs Protecao!');
}

// 2. UPDATE LiberarTodosHandles
const oldLiberarHandles = `void LiberarTodosHandles() {
   int handles[] = {hATR_L1, hADX_L1, hShortEMA_L1, hEMA_L1, hMedEMA_L1, hRSI_L1,
                    hATR_L2, hADX_L2, hShortEMA_L2, hEMA_L2, hMedEMA_L2, hRSI_L2,
                    hATR_H4, hADX_H4, hShortEMA_H4, hEMA_H4,
                    hATR_D1, hADX_D1, hShortEMA_D1, hEMA_D1};
   for(int i = 0; i < ArraySize(handles); i++)
      if(handles[i] != INVALID_HANDLE) IndicatorRelease(handles[i]);
}`;

const newLiberarHandles = `void LiberarTodosHandles() {
   int handles[] = {hATR_L1, hADX_L1, hShortEMA_L1, hEMA_L1, hMedEMA_L1, hRSI_L1,
                    hATR_L2, hADX_L2, hShortEMA_L2, hEMA_L2, hMedEMA_L2, hRSI_L2,
                    hATR_H4, hADX_H4, hShortEMA_H4, hEMA_H4,
                    hATR_D1, hADX_D1, hShortEMA_D1, hEMA_D1};
   for(int i = 0; i < ArraySize(handles); i++) {
      if(handles[i] != INVALID_HANDLE) { IndicatorRelease(handles[i]); }
   }
   hATR_L1=INVALID_HANDLE; hADX_L1=INVALID_HANDLE; hShortEMA_L1=INVALID_HANDLE; hEMA_L1=INVALID_HANDLE; hMedEMA_L1=INVALID_HANDLE; hRSI_L1=INVALID_HANDLE;
   hATR_L2=INVALID_HANDLE; hADX_L2=INVALID_HANDLE; hShortEMA_L2=INVALID_HANDLE; hEMA_L2=INVALID_HANDLE; hMedEMA_L2=INVALID_HANDLE; hRSI_L2=INVALID_HANDLE;
   hATR_H4=INVALID_HANDLE; hADX_H4=INVALID_HANDLE; hShortEMA_H4=INVALID_HANDLE; hEMA_H4=INVALID_HANDLE;
   hATR_D1=INVALID_HANDLE; hADX_D1=INVALID_HANDLE; hShortEMA_D1=INVALID_HANDLE; hEMA_D1=INVALID_HANDLE;
}`;

if (!text.includes(oldLiberarHandles)) {
    console.error('Could not find oldLiberarHandles!');
} else {
    text = text.replace(oldLiberarHandles, newLiberarHandles);
    console.log('Updated LiberarTodosHandles!');
}

// 3. UPDATE AutoSelecionarTF
const oldAutoTF = `void AutoSelecionarTF()
{
   if(!InpAutoTF) return;
   
   string sym = _Symbol;
   // Pares Campeoes em H1 (Euro & Kiwi de Alta Precisao)
   if(sym == "EURUSD" || sym == "NZDUSD" || sym == "EURCAD" || sym == "EURAUD") {
      g_TF_L1 = PERIOD_H1;
      TF_L2   = PERIOD_H4;
   } else if(sym == "USDCAD") {
      g_TF_L1 = PERIOD_M30;
      TF_L2   = PERIOD_H4;
   } else {
      // Pares Campeoes em H2 (AUDUSD, EURJPY, EURGBP, USDCHF, GBPUSD)
      g_TF_L1 = PERIOD_H2;
      TF_L2   = PERIOD_H4;
   }
}`;

const newAutoTF = `void AutoSelecionarTF()
{
   if(!InpAutoTF) {
      g_TF_L1 = InpTF;
      TF_L2   = (g_TF_L1 == PERIOD_H1 || g_TF_L1 < PERIOD_H4) ? PERIOD_H4 : PERIOD_D1;
      return;
   }
   
   string sym = _Symbol;
   StringToUpper(sym);
   // Sanitização robusta para contas com sufixos de corretora (ex: .pro, _raw, .r, .a, m)
   StringReplace(sym, ".PRO", ""); StringReplace(sym, "_RAW", "");
   StringReplace(sym, ".RAW", ""); StringReplace(sym, ".R",   "");
   StringReplace(sym, ".A",   ""); StringReplace(sym, "_SB",  "");
   StringReplace(sym, ".",    "");
   if(StringLen(sym) > 6 && StringSubstr(sym, 6) == "M") sym = StringSubstr(sym, 0, 6);
   
   // Pares Campeoes em H1 (Euro & Kiwi de Alta Precisao)
   if(sym == "EURUSD" || sym == "NZDUSD" || sym == "EURCAD" || sym == "EURAUD") {
      g_TF_L1 = PERIOD_H1;
      TF_L2   = PERIOD_H4;
   } else if(sym == "USDCAD") {
      g_TF_L1 = PERIOD_M30;
      TF_L2   = PERIOD_H4;
   } else {
      // Pares Campeoes em H2 (AUDUSD, EURJPY, EURGBP, USDCHF, GBPUSD)
      g_TF_L1 = PERIOD_H2;
      TF_L2   = PERIOD_H4;
   }
}`;

if (!text.includes(oldAutoTF)) {
    console.error('Could not find oldAutoTF!');
} else {
    text = text.replace(oldAutoTF, newAutoTF);
    console.log('Updated AutoSelecionarTF!');
}

// 4. UPDATE IsVelaReversao & ADD HELPER FUNCTIONS
const oldVelaReversao = `bool IsVelaReversaoVenda(int shift, ENUM_TIMEFRAMES tf) {
   double o=iOpen(_Symbol,tf,shift), c=iClose(_Symbol,tf,shift); double h=iHigh(_Symbol,tf,shift), l=iLow(_Symbol,tf,shift);
   double range = h - l; if(range <= 0 || c >= o) return false;
   double corpo = MathAbs(c-o), wick_top = h - MathMax(c,o);
   return ((wick_top/range*100.0) >= InpFR_WickRangeMinPct && (corpo/range*100.0) >= InpFR_BodyRangeMinPct && (corpo > 0 ? wick_top >= corpo * InpFR_WickBodyRatio : false));
}

bool IsVelaReversaoCompra(int shift, ENUM_TIMEFRAMES tf) {
   double o=iOpen(_Symbol,tf,shift), c=iClose(_Symbol,tf,shift); double h=iHigh(_Symbol,tf,shift), l=iLow(_Symbol,tf,shift);
   double range = h - l; if(range <= 0 || c <= o) return false;
   double corpo = MathAbs(c-o), wick_bot = MathMin(c,o) - l;
   return ((wick_bot/range*100.0) >= InpFR_WickRangeMinPct && (corpo/range*100.0) >= InpFR_BodyRangeMinPct && (corpo > 0 ? wick_bot >= corpo * InpFR_WickBodyRatio : false));
}`;

const newVelaReversao = `bool IsVelaReversaoVenda(int shift, ENUM_TIMEFRAMES tf) {
   double o=iOpen(_Symbol,tf,shift), c=iClose(_Symbol,tf,shift); double h=iHigh(_Symbol,tf,shift), l=iLow(_Symbol,tf,shift);
   double range = h - l; if(range <= 0 || c >= o) return false;
   double corpo = MathAbs(c-o), wick_top = h - MathMax(c,o);
   bool wick_ok = ((wick_top/range*100.0) >= InpFR_WickRangeMinPct && (corpo/range*100.0) >= InpFR_BodyRangeMinPct && (corpo > 0 ? wick_top >= corpo * InpFR_WickBodyRatio : false));
   if(!wick_ok) return false;
   // [PILAR 1] Fechamento no 1/3 extremo inferior (Sniper)
   if(InpFR_RequireQuadrantClose) {
      double max_close = l + (range * (InpFR_CloseQuadrantPct / 100.0));
      if(c > max_close) return false;
   }
   return true;
}

bool IsVelaReversaoCompra(int shift, ENUM_TIMEFRAMES tf) {
   double o=iOpen(_Symbol,tf,shift), c=iClose(_Symbol,tf,shift); double h=iHigh(_Symbol,tf,shift), l=iLow(_Symbol,tf,shift);
   double range = h - l; if(range <= 0 || c <= o) return false;
   double corpo = MathAbs(c-o), wick_bot = MathMin(c,o) - l;
   bool wick_ok = ((wick_bot/range*100.0) >= InpFR_WickRangeMinPct && (corpo/range*100.0) >= InpFR_BodyRangeMinPct && (corpo > 0 ? wick_bot >= corpo * InpFR_WickBodyRatio : false));
   if(!wick_ok) return false;
   // [PILAR 1] Fechamento no 1/3 extremo superior (Sniper)
   if(InpFR_RequireQuadrantClose) {
      double min_close = h - (range * (InpFR_CloseQuadrantPct / 100.0));
      if(c < min_close) return false;
   }
   return true;
}

// [PILAR 2 & 3] Validação de Penetração Máxima Anti-Violino e Absorção de Volume
bool FR_ValidarVolumePenetracao(bool is_sell, int shift, ENUM_TIMEFRAMES tf, double level_price, double atr_val) {
   if(atr_val <= 0) return true;
   // [PILAR 2] Teto de penetração máxima (evita entrar contra rompimento violento)
   if(InpFR_MaxPenetrationATR > 0) {
      double max_pen = atr_val * InpFR_MaxPenetrationATR;
      if(is_sell) {
         double h = iHigh(_Symbol, tf, shift);
         if((h - level_price) > max_pen) return false;
      } else {
         double l = iLow(_Symbol, tf, shift);
         if((level_price - l) > max_pen) return false;
      }
   }
   // [PILAR 3] Absorção de volume institucional
   if(InpFR_RequireVolumeAbsorption && g_CachedVolMed > 0) {
      long vb[1];
      if(CopyTickVolume(_Symbol, tf, shift, 1, vb) >= 1) {
         if((double)vb[0] < (g_CachedVolMed * InpFR_MinVolumeRatio)) return false;
      }
   }
   return true;
}

// [PILAR 4] Cálculo de TP2 Estrutural Dinâmico (Extremo Oposto do Range FR)
double CalcularTP2_EstruturalFR(bool is_sell, double entry_price, double pH, double pL, double sl_pts, double atr_val) {
   if(!InpFR_UseStructuralTP2 || sl_pts <= 0 || atr_val <= 0) return InpTP_Final_Multi;
   double buffer = atr_val * 0.15;
   double target_price = is_sell ? (pL + buffer) : (pH - buffer);
   double dist_pts = MathAbs(target_price - entry_price) / _Point;
   if(dist_pts < sl_pts * 0.5) return InpTP_Final_Multi;
   double mult = dist_pts / sl_pts;
   return MathMax(InpTP_Min_Multi, MathMin(InpTP_Final_Multi, mult));
}`;

if (!text.includes(oldVelaReversao)) {
    console.error('Could not find oldVelaReversao!');
} else {
    text = text.replace(oldVelaReversao, newVelaReversao);
    console.log('Updated VelaReversao & added helper functions!');
}

// 5. UPDATE BREAK-EVEN IN ON-TICK
const oldBreakEvenBlock = `         bool be_triggered=false;
         if(InpUseBreakEven) {
            double trigPct=(StringFind(c_comm,"Fibo")>=0)?InpBE_Trigger_Fibo:InpBE_Trigger_Normal;
            double trigger=MathAbs(posOpen-posSL)*trigPct, p_lock=InpBE_LockProfitPts*_Point;
            bool is_p2=(StringFind(c_comm,"_P2")>=0), p1_fechou=false;
            if(is_p2){string bc=StringSubstr(c_comm,0,StringLen(c_comm)-3);p1_fechou=!JaExistePosicaoDaEstrategia(bc+"_P1");}
            bool be_dist=(posType==POSITION_TYPE_BUY&&curr_bid>=(posOpen+trigger))||(posType==POSITION_TYPE_SELL&&curr_ask<=(posOpen-trigger));
            bool be_tp1=(is_p2&&p1_fechou);
            if(be_dist||be_tp1){
               if(posType==POSITION_TYPE_BUY&&posSL<(posOpen+p_lock)-(_Point*2)&&curr_bid>=(posOpen+p_lock+stops_level)){
                  double nsl = NormalizeDouble(posOpen+p_lock, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Compra (+%.0f pts).",be_tp1?"TP1":"Dist",InpBE_LockProfitPts));be_triggered=true;}
               }
               else if(posType==POSITION_TYPE_SELL&&posSL>(posOpen-p_lock)+(_Point*2)&&curr_ask<=(posOpen-p_lock-stops_level)){
                  double nsl = NormalizeDouble(posOpen-p_lock, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Venda (+%.0f pts).",be_tp1?"TP1":"Dist",InpBE_LockProfitPts));be_triggered=true;}
               }
            }
         }`;

const newBreakEvenBlock = `         bool be_triggered=false;
         if(InpUseBreakEven) {
            double trigPct=(StringFind(c_comm,"Fibo")>=0)?InpBE_Trigger_Fibo:InpBE_Trigger_Normal;
            double trigger=MathAbs(posOpen-posSL)*trigPct, p_lock=InpBE_LockProfitPts*_Point;
            bool is_p2=(StringFind(c_comm,"_P2")>=0), p1_fechou=false;
            if(is_p2 && StringLen(c_comm)>=3){string bc=StringSubstr(c_comm,0,StringLen(c_comm)-3);p1_fechou=!JaExistePosicaoDaEstrategia(bc+"_P1");}
            bool be_dist=(posType==POSITION_TYPE_BUY&&curr_bid>=(posOpen+trigger))||(posType==POSITION_TYPE_SELL&&curr_ask<=(posOpen-trigger));
            bool be_tp1=(is_p2&&p1_fechou);
            
            // [PILAR 5] BE com Respiro ATR no primeiro toque (50%), Lock Cheio apenas após P1 fechar
            double target_be_sl_buy  = posOpen + p_lock;
            double target_be_sl_sell = posOpen - p_lock;
            if(InpBE_UseATRBreathing && !be_tp1 && g_CachedATR > 0) {
               double breath_dist = g_CachedATR * (InpBE_BreathingATRPct / 100.0);
               target_be_sl_buy   = posOpen - breath_dist;
               target_be_sl_sell  = posOpen + breath_dist;
            }
            
            if(be_dist||be_tp1){
               if(posType==POSITION_TYPE_BUY&&posSL<(target_be_sl_buy)-(_Point*2)&&curr_bid>=(target_be_sl_buy+stops_level)){
                  double nsl = NormalizeDouble(target_be_sl_buy, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Compra SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));be_triggered=true;}
               }
               else if(posType==POSITION_TYPE_SELL&&posSL>(target_be_sl_sell)+(_Point*2)&&curr_ask<=(target_be_sl_sell-stops_level)){
                  double nsl = NormalizeDouble(target_be_sl_sell, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Venda SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));be_triggered=true;}
               }
            }
         }`;

if (!text.includes(oldBreakEvenBlock)) {
    console.error('Could not find oldBreakEvenBlock!');
} else {
    text = text.replace(oldBreakEvenBlock, newBreakEvenBlock);
    console.log('Updated BreakEven Block!');
}

// 6. UPDATE MOTOR 2 FR L1 & L2 IN ON-TICK
const oldFRL1Block = `         double pH=g_CachedFRTop, pL=g_CachedFRFundo;
         double mag_tol=GetFR_MagTol(g_CachedATR,g_CachedADX,g_TF_L1);
         double fr_range=(pH-pL)/_Point, tp1_m=InpTP_Parcial_Multi;
         if(sl_pts>0&&fr_range>=sl_pts*0.5) tp1_m=CalcularTP_Estrutural(fr_range,sl_pts,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);
         bool m_sell=InpFR_RequireWickRejection?(iHigh(_Symbol,g_TF_L1,1)>pH&&iClose(_Symbol,g_TF_L1,1)<pH&&IsVelaReversaoVenda(1,g_TF_L1)):(iHigh(_Symbol,g_TF_L1,1)>pH&&iClose(_Symbol,g_TF_L1,1)<pH&&iClose(_Symbol,g_TF_L1,1)<iOpen(_Symbol,g_TF_L1,1));
         bool m_buy =InpFR_RequireWickRejection?(iLow (_Symbol,g_TF_L1,1)<pL&&iClose(_Symbol,g_TF_L1,1)>pL&&IsVelaReversaoCompra(1,g_TF_L1)):(iLow(_Symbol,g_TF_L1,1)<pL&&iClose(_Symbol,g_TF_L1,1)>pL&&iClose(_Symbol,g_TF_L1,1)>iOpen(_Symbol,g_TF_L1,1));
         bool is_lat=IsMercadoLateral()||g_LocalConsolidation;
         bool d_s_ok,d_b_ok; GetFR_DirecaoOk(medTrendDir,g_CachedRSI,d_s_ok,d_b_ok);
         double r_th_sell=GetFR_RSI_Threshold(true,g_CachedADX), r_th_buy=GetFR_RSI_Threshold(false,g_CachedADX);
         bool r_s_ok=true,r_b_ok=true;
         if(InpFR_UseRSI){r_s_ok=(g_CachedRSI>=r_th_sell);r_b_ok=(g_CachedRSI<=r_th_buy);if(m_sell)r_s_ok=true;if(m_buy)r_b_ok=true;}
         bool z_v=FR_ZonaLivre("L1",true), z_c=FR_ZonaLivre("L1",false);
         
         // [CONFLUENCIA] Trava espacial e direcional para Falso Rompimento
         bool confl_s_ok = true, confl_b_ok = true;
         if(g_ModoConfluencia > 0) {
             if(!g_MG_SellAllowed) confl_s_ok = false;
             if(!g_MG_BuyAllowed) confl_b_ok = false;
             
             if(g_MG_ATR > 0) {
                 // [BUG-C1 FIX] Variáveis declaradas dentro do bloco — escopo correto
                 double dist_mg = g_MG_ATR * 3.0;
                 bool perto_res = false, perto_sup = false;
                 if(g_MG_FR_H4_Res > 0 && MathAbs(pH - g_MG_FR_H4_Res) <= dist_mg) perto_res = true;
                 if(g_MG_FR_D1_Res > 0 && MathAbs(pH - g_MG_FR_D1_Res) <= dist_mg) perto_res = true;
                 if(g_MG_FR_H4_Sup > 0 && MathAbs(pL - g_MG_FR_H4_Sup) <= dist_mg) perto_sup = true;
                 if(g_MG_FR_D1_Sup > 0 && MathAbs(pL - g_MG_FR_D1_Sup) <= dist_mg) perto_sup = true;
                 
                 if((g_MG_FR_H4_Res > 0 || g_MG_FR_D1_Res > 0) && !perto_res) confl_s_ok = false;
                 if((g_MG_FR_H4_Sup > 0 || g_MG_FR_D1_Sup > 0) && !perto_sup) confl_b_ok = false;
             }
         }


         g_ReadyFR=m_sell||m_buy||(is_lat&&((d_s_ok&&r_s_ok)||(d_b_ok&&r_b_ok)));
         // [R3] Cooldown por tempo: bloqueia re-entrada no mesmo nível FR por N minutos
         int _fr_cd=InpFR_CooldownMinutes*60;
         bool tc_sell=(_fr_cd<=0||(TimeCurrent()-l1_fr_sell_ts)>=_fr_cd);
         bool tc_buy =(_fr_cd<=0||(TimeCurrent()-l1_fr_buy_ts )>=_fr_cd);
         if(confl_s_ok && tc_sell && (m_sell||(is_lat&&d_s_ok&&r_s_ok&&iHigh(_Symbol,g_TF_L1,1)>=(pH-mag_tol)&&iClose(_Symbol,g_TF_L1,1)<pH&&iClose(_Symbol,g_TF_L1,1)<iOpen(_Symbol,g_TF_L1,1)))&&z_v&&cb_l1!=l1_fr_sell){if(AbrirSell(lot,bid,sl_pts,tp1_m,InpTP_Final_Multi,"FR_Venda_L1")){l1_fr_sell=cb_l1;l1_fr_sell_ts=TimeCurrent();}}
         if(confl_b_ok && tc_buy  && (m_buy ||(is_lat&&d_b_ok&&r_b_ok&&iLow (_Symbol,g_TF_L1,1)<=(pL+mag_tol)&&iClose(_Symbol,g_TF_L1,1)>pL&&iClose(_Symbol,g_TF_L1,1)>iOpen(_Symbol,g_TF_L1,1)))&&z_c&&cb_l1!=l1_fr_buy) {if(AbrirBuy (lot,ask,sl_pts,tp1_m,InpTP_Final_Multi,"FR_Compra_L1")){l1_fr_buy=cb_l1;l1_fr_buy_ts=TimeCurrent();}}

         if(InpFR_Direct_Entries && g_CachedATR > 0) {
            bool fr_d_atr_ok=(!InpUseOscillationFilter||(g_CachedATR/_Point)>=InpMinATRPts);
            if(fr_d_atr_ok) {
               double d_zone=g_CachedATR*(InpFR_Direct_ZoneATRPct/100.0);
               bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||g_CachedRSI>=r_th_sell)&&!g_LocalConsolidation&&d_s_ok):true;
               bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||g_CachedRSI<=r_th_buy)&&!g_LocalConsolidation&&d_b_ok):true;
               if(confl_s_ok && tc_sell && (iHigh(_Symbol,g_TF_L1,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_sell&&z_v&&dr_s_ok){
                  datetime prev_sell=l1_frd_sell; l1_frd_sell=cb_l1;
                  if(!AbrirSell(lot,bid,sl_pts,tp1_m,InpTP_Final_Multi,"FR_Dir_V_L1")) l1_frd_sell=prev_sell; else l1_fr_sell_ts=TimeCurrent();
               }
               if(confl_b_ok && tc_buy && (iLow(_Symbol,g_TF_L1,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_buy&&z_c&&dr_b_ok){
                  datetime prev_buy=l1_frd_buy; l1_frd_buy=cb_l1;
                  if(!AbrirBuy(lot,ask,sl_pts,tp1_m,InpTP_Final_Multi,"FR_Dir_C_L1")) l1_frd_buy=prev_buy; else l1_fr_buy_ts=TimeCurrent();
               }
            } // [R1] fim filtro ATR
         }`;

const newFRL1Block = `         double pH=g_CachedFRTop, pL=g_CachedFRFundo;
         double mag_tol=GetFR_MagTol(g_CachedATR,g_CachedADX,g_TF_L1);
         double fr_range=(pH-pL)/_Point, tp1_m=InpTP_Parcial_Multi;
         if(sl_pts>0&&fr_range>=sl_pts*0.5) tp1_m=CalcularTP_Estrutural(fr_range,sl_pts,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);
         
         // [PILAR 4] TP2 Estrutural Dinâmico (Extremo oposto do range FR)
         double tp2_m_sell = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(true, bid, pH, pL, sl_pts, g_CachedATR) : InpTP_Final_Multi;
         double tp2_m_buy  = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(false, ask, pH, pL, sl_pts, g_CachedATR) : InpTP_Final_Multi;

         bool m_sell=InpFR_RequireWickRejection?(iHigh(_Symbol,g_TF_L1,1)>pH&&iClose(_Symbol,g_TF_L1,1)<pH&&IsVelaReversaoVenda(1,g_TF_L1)):(iHigh(_Symbol,g_TF_L1,1)>pH&&iClose(_Symbol,g_TF_L1,1)<pH&&iClose(_Symbol,g_TF_L1,1)<iOpen(_Symbol,g_TF_L1,1));
         bool m_buy =InpFR_RequireWickRejection?(iLow (_Symbol,g_TF_L1,1)<pL&&iClose(_Symbol,g_TF_L1,1)>pL&&IsVelaReversaoCompra(1,g_TF_L1)):(iLow(_Symbol,g_TF_L1,1)<pL&&iClose(_Symbol,g_TF_L1,1)>pL&&iClose(_Symbol,g_TF_L1,1)>iOpen(_Symbol,g_TF_L1,1));
         
         // [PILAR 2 & 3] Validação de Volume de Absorção e Teto de Penetração no FR Normal L1
         bool vp_s_ok = FR_ValidarVolumePenetracao(true, 1, g_TF_L1, pH, g_CachedATR);
         bool vp_b_ok = FR_ValidarVolumePenetracao(false, 1, g_TF_L1, pL, g_CachedATR);
         if(!vp_s_ok) m_sell = false;
         if(!vp_b_ok) m_buy  = false;

         bool is_lat=IsMercadoLateral()||g_LocalConsolidation;
         bool d_s_ok,d_b_ok; GetFR_DirecaoOk(medTrendDir,g_CachedRSI,d_s_ok,d_b_ok);
         double r_th_sell=GetFR_RSI_Threshold(true,g_CachedADX), r_th_buy=GetFR_RSI_Threshold(false,g_CachedADX);
         bool r_s_ok=true,r_b_ok=true;
         if(InpFR_UseRSI){r_s_ok=(g_CachedRSI>=r_th_sell);r_b_ok=(g_CachedRSI<=r_th_buy);if(m_sell)r_s_ok=true;if(m_buy)r_b_ok=true;}
         bool z_v=FR_ZonaLivre("L1",true), z_c=FR_ZonaLivre("L1",false);
         
         // [CONFLUENCIA] Trava espacial e direcional para Falso Rompimento
         bool confl_s_ok = true, confl_b_ok = true;
         if(g_ModoConfluencia > 0) {
             if(!g_MG_SellAllowed) confl_s_ok = false;
             if(!g_MG_BuyAllowed) confl_b_ok = false;
             
             if(g_MG_ATR > 0) {
                 // [BUG-C1 FIX] Variáveis declaradas dentro do bloco — escopo correto
                 double dist_mg = g_MG_ATR * 3.0;
                 bool perto_res = false, perto_sup = false;
                 if(g_MG_FR_H4_Res > 0 && MathAbs(pH - g_MG_FR_H4_Res) <= dist_mg) perto_res = true;
                 if(g_MG_FR_D1_Res > 0 && MathAbs(pH - g_MG_FR_D1_Res) <= dist_mg) perto_res = true;
                 if(g_MG_FR_H4_Sup > 0 && MathAbs(pL - g_MG_FR_H4_Sup) <= dist_mg) perto_sup = true;
                 if(g_MG_FR_D1_Sup > 0 && MathAbs(pL - g_MG_FR_D1_Sup) <= dist_mg) perto_sup = true;
                 
                 if((g_MG_FR_H4_Res > 0 || g_MG_FR_D1_Res > 0) && !perto_res) confl_s_ok = false;
                 if((g_MG_FR_H4_Sup > 0 || g_MG_FR_D1_Sup > 0) && !perto_sup) confl_b_ok = false;
             }
         }


         g_ReadyFR=m_sell||m_buy||(is_lat&&((d_s_ok&&r_s_ok)||(d_b_ok&&r_b_ok)));
         // [R3] Cooldown por tempo: bloqueia re-entrada no mesmo nível FR por N minutos
         int _fr_cd=InpFR_CooldownMinutes*60;
         bool tc_sell=(_fr_cd<=0||(TimeCurrent()-l1_fr_sell_ts)>=_fr_cd);
         bool tc_buy =(_fr_cd<=0||(TimeCurrent()-l1_fr_buy_ts )>=_fr_cd);
         if(confl_s_ok && tc_sell && (m_sell||(is_lat&&d_s_ok&&r_s_ok&&vp_s_ok&&iHigh(_Symbol,g_TF_L1,1)>=(pH-mag_tol)&&iClose(_Symbol,g_TF_L1,1)<pH&&iClose(_Symbol,g_TF_L1,1)<iOpen(_Symbol,g_TF_L1,1)))&&z_v&&cb_l1!=l1_fr_sell){if(AbrirSell(lot,bid,sl_pts,tp1_m,tp2_m_sell,"FR_Venda_L1")){l1_fr_sell=cb_l1;l1_fr_sell_ts=TimeCurrent();}}
         if(confl_b_ok && tc_buy  && (m_buy ||(is_lat&&d_b_ok&&r_b_ok&&vp_b_ok&&iLow (_Symbol,g_TF_L1,1)<=(pL+mag_tol)&&iClose(_Symbol,g_TF_L1,1)>pL&&iClose(_Symbol,g_TF_L1,1)>iOpen(_Symbol,g_TF_L1,1)))&&z_c&&cb_l1!=l1_fr_buy) {if(AbrirBuy (lot,ask,sl_pts,tp1_m,tp2_m_buy,"FR_Compra_L1")){l1_fr_buy=cb_l1;l1_fr_buy_ts=TimeCurrent();}}

         if(InpFR_Direct_Entries && g_CachedATR > 0) {
            bool fr_d_atr_ok=(!InpUseOscillationFilter||(g_CachedATR/_Point)>=InpMinATRPts);
            if(fr_d_atr_ok) {
               double d_zone=g_CachedATR*(InpFR_Direct_ZoneATRPct/100.0);
               bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||g_CachedRSI>=r_th_sell)&&!g_LocalConsolidation&&d_s_ok):true;
               bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||g_CachedRSI<=r_th_buy)&&!g_LocalConsolidation&&d_b_ok):true;
               
               // [PILAR 2] Teto de penetração no FR Direct L1
               double max_pen_d = (InpFR_MaxPenetrationATR > 0) ? (g_CachedATR * InpFR_MaxPenetrationATR) : DBL_MAX;
               bool pen_dir_s = ((iHigh(_Symbol,g_TF_L1,0) - pH) <= max_pen_d);
               bool pen_dir_b = ((pL - iLow(_Symbol,g_TF_L1,0)) <= max_pen_d);
               
               if(confl_s_ok && tc_sell && pen_dir_s && (iHigh(_Symbol,g_TF_L1,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_sell&&z_v&&dr_s_ok){
                  datetime prev_sell=l1_frd_sell; l1_frd_sell=cb_l1;
                  if(!AbrirSell(lot,bid,sl_pts,tp1_m,tp2_m_sell,"FR_Dir_V_L1")) l1_frd_sell=prev_sell; else l1_fr_sell_ts=TimeCurrent();
               }
               if(confl_b_ok && tc_buy && pen_dir_b && (iLow(_Symbol,g_TF_L1,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_buy&&z_c&&dr_b_ok){
                  datetime prev_buy=l1_frd_buy; l1_frd_buy=cb_l1;
                  if(!AbrirBuy(lot,ask,sl_pts,tp1_m,tp2_m_buy,"FR_Dir_C_L1")) l1_frd_buy=prev_buy; else l1_fr_buy_ts=TimeCurrent();
               }
            } // [R1] fim filtro ATR
         }`;

if (!text.includes(oldFRL1Block)) {
    console.error('Could not find oldFRL1Block!');
} else {
    text = text.replace(oldFRL1Block, newFRL1Block);
    console.log('Updated FR L1 Block!');
}

// 7. UPDATE FR L2 IN ON-TICK
const oldFRL2Block = `         double pH=l2_top, pL=l2_bot;
         double mag_tol=GetFR_MagTol(l2_atr,l2_adx,TF_L2);
         double fr_range=(pH-pL)/_Point, tp1_m=InpTP_Parcial_Multi;
         if(l2_sl>0&&fr_range>=l2_sl*0.5) tp1_m=CalcularTP_Estrutural(fr_range,l2_sl,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);
         bool m_sell=InpFR_RequireWickRejection?(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&IsVelaReversaoVenda(1,TF_L2)):(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&iClose(_Symbol,TF_L2,1)<iOpen(_Symbol,TF_L2,1));
         bool m_buy =InpFR_RequireWickRejection?(iLow (_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&IsVelaReversaoCompra(1,TF_L2)):(iLow(_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&iClose(_Symbol,TF_L2,1)>iOpen(_Symbol,TF_L2,1));
         bool is_lat=(l2_adx<p_ADX_ConsolidationLevel); // [B11: esta declaracao esta OK — escopo local do bloco FR L2, diferente da is_lateral do Fluxo]
         bool d_s_ok,d_b_ok; GetFR_DirecaoOk(l2_med,l2_rsi,d_s_ok,d_b_ok);
         double r_th_sell=GetFR_RSI_Threshold(true,l2_adx), r_th_buy=GetFR_RSI_Threshold(false,l2_adx);
         bool r_s_ok=true,r_b_ok=true;
         if(InpFR_UseRSI){r_s_ok=(l2_rsi>=r_th_sell);r_b_ok=(l2_rsi<=r_th_buy);if(m_sell)r_s_ok=true;if(m_buy)r_b_ok=true;}
         bool z_v=FR_ZonaLivre("L2",true), z_c=FR_ZonaLivre("L2",false);
         if((m_sell||(is_lat&&d_s_ok&&r_s_ok&&iHigh(_Symbol,TF_L2,1)>=(pH-mag_tol)&&iClose(_Symbol,TF_L2,1)<pH&&iClose(_Symbol,TF_L2,1)<iOpen(_Symbol,TF_L2,1)))&&z_v&&cb_l2!=l2_fr_sell&&fr2_cd_sell){if(AbrirSell(l2_lot,bid,l2_sl,tp1_m,InpTP_Final_Multi,"FR_Venda_L2")){l2_fr_sell=cb_l2; l2_fr_sell_ts=TimeCurrent();}}
         if((m_buy ||(is_lat&&d_b_ok&&r_b_ok&&iLow (_Symbol,TF_L2,1)<=(pL+mag_tol)&&iClose(_Symbol,TF_L2,1)>pL&&iClose(_Symbol,TF_L2,1)>iOpen(_Symbol,TF_L2,1)))&&z_c&&cb_l2!=l2_fr_buy&&fr2_cd_buy) {if(AbrirBuy (l2_lot,ask,l2_sl,tp1_m,InpTP_Final_Multi,"FR_Compra_L2")){l2_fr_buy=cb_l2; l2_fr_buy_ts=TimeCurrent();}}

         if(InpFR_Direct_Entries&&l2_atr>0&&(!InpUseOscillationFilter||(l2_atr/_Point)>=InpMinATRPts)){
            double d_zone=l2_atr*(InpFR_Direct_ZoneATRPct/100.0);
            bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||l2_rsi>=r_th_sell)&&!g_LocalConsolidation&&d_s_ok):true;
            bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||l2_rsi<=r_th_buy)&&!g_LocalConsolidation&&d_b_ok):true;
            // [BUG-04 FIX] FR Direct L2 agora respeita confluência espacial do MarketGlance
            // Antes, confl_s_ok/confl_b_ok só eram aplicados no FR Normal L2 (linhas acima),
            // mas o FR Direct L2 entrava ignorando os fractais H4/D1 do MarketGlance.
            bool confl_l2_s_ok = true, confl_l2_b_ok = true;
            if(g_ModoConfluencia > 0 && g_MG_ATR > 0) {
               double dist_mg_l2 = g_MG_ATR * 3.0;
               bool perto_res_l2 = (g_MG_FR_H4_Res>0 && MathAbs(pH-g_MG_FR_H4_Res)<=dist_mg_l2) ||
                                   (g_MG_FR_D1_Res>0 && MathAbs(pH-g_MG_FR_D1_Res)<=dist_mg_l2);
               bool perto_sup_l2 = (g_MG_FR_H4_Sup>0 && MathAbs(pL-g_MG_FR_H4_Sup)<=dist_mg_l2) ||
                                   (g_MG_FR_D1_Sup>0 && MathAbs(pL-g_MG_FR_D1_Sup)<=dist_mg_l2);
               if((g_MG_FR_H4_Res>0||g_MG_FR_D1_Res>0) && !perto_res_l2) confl_l2_s_ok = false;
               if((g_MG_FR_H4_Sup>0||g_MG_FR_D1_Sup>0) && !perto_sup_l2) confl_l2_b_ok = false;
            }
            if(confl_l2_s_ok&&(iHigh(_Symbol,TF_L2,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_sell&&z_v&&dr_s_ok&&fr2_cd_sell){
               datetime prev_sell=l2_frd_sell; l2_frd_sell=cb_l2;
               if(!AbrirSell(l2_lot,bid,l2_sl,tp1_m,InpTP_Final_Multi,"FR_Dir_V_L2")) l2_frd_sell=prev_sell; else l2_fr_sell_ts=TimeCurrent();
            }
            if(confl_l2_b_ok&&(iLow(_Symbol,TF_L2,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_buy&&z_c&&dr_b_ok&&fr2_cd_buy){
               datetime prev_buy=l2_frd_buy; l2_frd_buy=cb_l2;
               if(!AbrirBuy(l2_lot,ask,l2_sl,tp1_m,InpTP_Final_Multi,"FR_Dir_C_L2")) l2_frd_buy=prev_buy; else l2_fr_buy_ts=TimeCurrent();
            }
         }`;

const newFRL2Block = `         double pH=l2_top, pL=l2_bot;
         double mag_tol=GetFR_MagTol(l2_atr,l2_adx,TF_L2);
         double fr_range=(pH-pL)/_Point, tp1_m=InpTP_Parcial_Multi;
         if(l2_sl>0&&fr_range>=l2_sl*0.5) tp1_m=CalcularTP_Estrutural(fr_range,l2_sl,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);
         
         // [PILAR 4] TP2 Estrutural Dinâmico no L2
         double tp2_m_sell_l2 = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(true, bid, pH, pL, l2_sl, l2_atr) : InpTP_Final_Multi;
         double tp2_m_buy_l2  = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(false, ask, pH, pL, l2_sl, l2_atr) : InpTP_Final_Multi;

         bool m_sell=InpFR_RequireWickRejection?(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&IsVelaReversaoVenda(1,TF_L2)):(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&iClose(_Symbol,TF_L2,1)<iOpen(_Symbol,TF_L2,1));
         bool m_buy =InpFR_RequireWickRejection?(iLow (_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&IsVelaReversaoCompra(1,TF_L2)):(iLow(_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&iClose(_Symbol,TF_L2,1)>iOpen(_Symbol,TF_L2,1));
         
         // [PILAR 2 & 3] Validação de Volume e Penetração Máxima no L2
         bool vp_s_ok_l2 = FR_ValidarVolumePenetracao(true, 1, TF_L2, pH, l2_atr);
         bool vp_b_ok_l2 = FR_ValidarVolumePenetracao(false, 1, TF_L2, pL, l2_atr);
         if(!vp_s_ok_l2) m_sell = false;
         if(!vp_b_ok_l2) m_buy  = false;

         bool is_lat=(l2_adx<p_ADX_ConsolidationLevel); // [B11: esta declaracao esta OK — escopo local do bloco FR L2, diferente da is_lateral do Fluxo]
         bool d_s_ok,d_b_ok; GetFR_DirecaoOk(l2_med,l2_rsi,d_s_ok,d_b_ok);
         double r_th_sell=GetFR_RSI_Threshold(true,l2_adx), r_th_buy=GetFR_RSI_Threshold(false,l2_adx);
         bool r_s_ok=true,r_b_ok=true;
         if(InpFR_UseRSI){r_s_ok=(l2_rsi>=r_th_sell);r_b_ok=(l2_rsi<=r_th_buy);if(m_sell)r_s_ok=true;if(m_buy)r_b_ok=true;}
         bool z_v=FR_ZonaLivre("L2",true), z_c=FR_ZonaLivre("L2",false);
         if((m_sell||(is_lat&&d_s_ok&&r_s_ok&&vp_s_ok_l2&&iHigh(_Symbol,TF_L2,1)>=(pH-mag_tol)&&iClose(_Symbol,TF_L2,1)<pH&&iClose(_Symbol,TF_L2,1)<iOpen(_Symbol,TF_L2,1)))&&z_v&&cb_l2!=l2_fr_sell&&fr2_cd_sell){if(AbrirSell(l2_lot,bid,l2_sl,tp1_m,tp2_m_sell_l2,"FR_Venda_L2")){l2_fr_sell=cb_l2; l2_fr_sell_ts=TimeCurrent();}}
         if((m_buy ||(is_lat&&d_b_ok&&r_b_ok&&vp_b_ok_l2&&iLow (_Symbol,TF_L2,1)<=(pL+mag_tol)&&iClose(_Symbol,TF_L2,1)>pL&&iClose(_Symbol,TF_L2,1)>iOpen(_Symbol,TF_L2,1)))&&z_c&&cb_l2!=l2_fr_buy&&fr2_cd_buy) {if(AbrirBuy (l2_lot,ask,l2_sl,tp1_m,tp2_m_buy_l2,"FR_Compra_L2")){l2_fr_buy=cb_l2; l2_fr_buy_ts=TimeCurrent();}}

         if(InpFR_Direct_Entries&&l2_atr>0&&(!InpUseOscillationFilter||(l2_atr/_Point)>=InpMinATRPts)){
            double d_zone=l2_atr*(InpFR_Direct_ZoneATRPct/100.0);
            bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||l2_rsi>=r_th_sell)&&!g_LocalConsolidation&&d_s_ok):true;
            bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||l2_rsi<=r_th_buy)&&!g_LocalConsolidation&&d_b_ok):true;
            // [BUG-04 FIX] FR Direct L2 agora respeita confluência espacial do MarketGlance
            bool confl_l2_s_ok = true, confl_l2_b_ok = true;
            if(g_ModoConfluencia > 0 && g_MG_ATR > 0) {
               double dist_mg_l2 = g_MG_ATR * 3.0;
               bool perto_res_l2 = (g_MG_FR_H4_Res>0 && MathAbs(pH-g_MG_FR_H4_Res)<=dist_mg_l2) ||
                                   (g_MG_FR_D1_Res>0 && MathAbs(pH-g_MG_FR_D1_Res)<=dist_mg_l2);
               bool perto_sup_l2 = (g_MG_FR_H4_Sup>0 && MathAbs(pL-g_MG_FR_H4_Sup)<=dist_mg_l2) ||
                                   (g_MG_FR_D1_Sup>0 && MathAbs(pL-g_MG_FR_D1_Sup)<=dist_mg_l2);
               if((g_MG_FR_H4_Res>0||g_MG_FR_D1_Res>0) && !perto_res_l2) confl_l2_s_ok = false;
               if((g_MG_FR_H4_Sup>0||g_MG_FR_D1_Sup>0) && !perto_sup_l2) confl_l2_b_ok = false;
            }
            
            // [PILAR 2] Teto de penetração no FR Direct L2
            double max_pen_d_l2 = (InpFR_MaxPenetrationATR > 0) ? (l2_atr * InpFR_MaxPenetrationATR) : DBL_MAX;
            bool pen_dir_s_l2 = ((iHigh(_Symbol,TF_L2,0) - pH) <= max_pen_d_l2);
            bool pen_dir_b_l2 = ((pL - iLow(_Symbol,TF_L2,0)) <= max_pen_d_l2);

            if(confl_l2_s_ok&&pen_dir_s_l2&&(iHigh(_Symbol,TF_L2,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_sell&&z_v&&dr_s_ok&&fr2_cd_sell){
               datetime prev_sell=l2_frd_sell; l2_frd_sell=cb_l2;
               if(!AbrirSell(l2_lot,bid,l2_sl,tp1_m,tp2_m_sell_l2,"FR_Dir_V_L2")) l2_frd_sell=prev_sell; else l2_fr_sell_ts=TimeCurrent();
            }
            if(confl_l2_b_ok&&pen_dir_b_l2&&(iLow(_Symbol,TF_L2,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_buy&&z_c&&dr_b_ok&&fr2_cd_buy){
               datetime prev_buy=l2_frd_buy; l2_frd_buy=cb_l2;
               if(!AbrirBuy(l2_lot,ask,l2_sl,tp1_m,tp2_m_buy_l2,"FR_Dir_C_L2")) l2_frd_buy=prev_buy; else l2_fr_buy_ts=TimeCurrent();
            }
         }`;

if (!text.includes(oldFRL2Block)) {
    console.error('Could not find oldFRL2Block!');
} else {
    text = text.replace(oldFRL2Block, newFRL2Block);
    console.log('Updated FR L2 Block!');
}

// 8. UPDATE VERSION STRING
text = text.replace('#property version   "28.50"', '#property version   "28.60"');
text = text.replace('v28.5 PRO', 'v28.6 ULTRA SNIPER');

// Save as UTF-16LE with BOM
const utf16leBuf = Buffer.from('\ufeff' + text, 'utf16le');
fs.writeFileSync(targetFile, utf16leBuf);
console.log('Successfully written updated UTF-16LE MQ5 file!');
