const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

// Backup
fs.writeFileSync('_backup/Fibbo_Sniper_v28.5_H2_before_all_fixes.mq5', code);

console.log('Aplicando correções cirúrgicas em ' + file + '...');

// 1. Corrigir AtualizarSensoresAnalise (buffers separados e SanitizeATR)
const oldSensors = `   double buf[1];
   
   // EMA 50 (Micro Tendencia)
   if(g_MG_hEMA50 != INVALID_HANDLE && CopyBuffer(g_MG_hEMA50, 0, 0, 1, buf) > 0) g_MG_EMA50 = buf[0];
   
   // EMA 200 (Macro Tendencia)
   if(g_MG_hEMA200 != INVALID_HANDLE && CopyBuffer(g_MG_hEMA200, 0, 0, 1, buf) > 0) g_MG_EMA200 = buf[0];
   
   // ATR (Volatilidade/Distancia de Alvos)
   if(g_MG_hATR != INVALID_HANDLE && CopyBuffer(g_MG_hATR, 0, 0, 1, buf) > 0) g_MG_ATR = buf[0];`;

const newSensors = `   double buf_e50[1], buf_e200[1], buf_atr[1];
   
   // EMA 50 (Micro Tendencia)
   if(g_MG_hEMA50 != INVALID_HANDLE && CopyBuffer(g_MG_hEMA50, 0, 0, 1, buf_e50) > 0) g_MG_EMA50 = buf_e50[0];
   
   // EMA 200 (Macro Tendencia)
   if(g_MG_hEMA200 != INVALID_HANDLE && CopyBuffer(g_MG_hEMA200, 0, 0, 1, buf_e200) > 0) g_MG_EMA200 = buf_e200[0];
   
   // ATR (Volatilidade/Distancia de Alvos)
   if(g_MG_hATR != INVALID_HANDLE && CopyBuffer(g_MG_hATR, 0, 0, 1, buf_atr) > 0) g_MG_ATR = SanitizeATR(buf_atr[0], g_MG_CurrentTF);`;

if (code.includes(oldSensors)) {
  code = code.replace(oldSensors, newSensors);
  console.log('✔ [1/7] AtualizarSensoresAnalise com buffers dedicados e SanitizeATR');
} else {
  console.log('❌ [1/7] oldSensors não encontrado');
}

// 2. Corrigir Input InpFibLevelBuy = 18.0 -> 61.8
const oldInput = 'input double InpFibLevelSell = 61.8, InpFibLevelBuy = 18.0, InpFibMinRange_ATR_Multi = 2.0, InpFib_MagneticZoneATRPct = 20.0;';
const newInput = 'input double InpFibLevelSell = 61.8, InpFibLevelBuy = 61.8, InpFibMinRange_ATR_Multi = 2.0, InpFib_MagneticZoneATRPct = 20.0;';
if (code.includes(oldInput)) {
  code = code.replace(oldInput, newInput);
  console.log('✔ [2/7] Input InpFibLevelBuy corrigido para 61.8');
} else {
  console.log('❌ [2/7] oldInput não encontrado');
}

// 3. Adicionar SanitizeATR helper acima de PassaFiltroADX/ComputeLot_ByDistance
const sanitizeATRFunc = `//===================================================================
// SANITIZAÇÃO E BLINDAGEM DE ATR CONTRA GLITCHES E HANDLES INVÁLIDOS
//===================================================================
double SanitizeATR(double atr, ENUM_TIMEFRAMES tf = PERIOD_CURRENT) {
   double pt = _Point;
   if(pt <= 0) pt = 0.00001;
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(bid <= 0) bid = 1.0;
   
   // ATR válido em Forex/Ativos não pode ser negativo nem maior que 5% da cotação
   double max_valid_atr = bid * 0.05;
   if(atr > 0 && atr <= max_valid_atr) return atr;
   
   // Fallback seguro: range da vela anterior
   double prev_range = iHigh(_Symbol, tf, 1) - iLow(_Symbol, tf, 1);
   if(prev_range > 0 && prev_range <= max_valid_atr) return prev_range;
   
   return 25.0 * pt; // 25 pips padrão de segurança
}

`;

if (!code.includes('double SanitizeATR(')) {
  code = code.replace('bool PassaFiltroADX() {', sanitizeATRFunc + 'bool PassaFiltroADX() {');
  console.log('✔ [3/7] Função SanitizeATR adicionada com sucesso');
}

// 4. Proteger ratio em ComputeLot_ByDistance
const oldLotRatio = `   // Proporção ATR atual vs ATR L1 determina o scaling de risco
   double ratio = current_atr / g_CachedATR;`;
const newLotRatio = `   // Proporção ATR atual vs ATR L1 determina o scaling de risco (limitado a faixa segura [0.2, 5.0])
   double ratio = (g_CachedATR > 0) ? (current_atr / g_CachedATR) : 1.0;
   ratio = MathMax(0.2, MathMin(5.0, ratio));`;
if (code.includes(oldLotRatio)) {
  code = code.replace(oldLotRatio, newLotRatio);
  console.log('✔ [4/7] Ratio em ComputeLot_ByDistance protegido contra distorções');
} else {
  console.log('❌ [4/7] oldLotRatio não encontrado');
}

// 5. Blindar AplicarModoFiltro e VerificarRegimeDeMercado contra Handle Thrashing
const oldModoFiltro = `void AplicarModoFiltro(ENUM_FILTER_MODE mode) {
   g_ActiveFilterMode = mode;
   switch(mode) {
      case FILTER_ATUAL:
         cfg_ADX_MinLevel=12.0; cfg_RSI_Overbought=60.0; cfg_RSI_Oversold=40.0;
         cfg_RSI_Period=7; cfg_EMA_Candles=1; cfg_EMA_DistFactor=0.0; cfg_SpreadFactor=0.30; break;
      case FILTER_MEIO_TERMO:
         cfg_ADX_MinLevel=18.0; cfg_RSI_Overbought=63.0; cfg_RSI_Oversold=37.0;
         cfg_RSI_Period=9; cfg_EMA_Candles=2; cfg_EMA_DistFactor=0.05; cfg_SpreadFactor=0.25; break;
      case FILTER_MAXIMO:
         cfg_ADX_MinLevel=25.0; cfg_RSI_Overbought=68.0; cfg_RSI_Oversold=32.0;
         cfg_RSI_Period=14; cfg_EMA_Candles=3; cfg_EMA_DistFactor=0.10; cfg_SpreadFactor=0.20; break;
   }
   if(hRSI_L1 != INVALID_HANDLE) { IndicatorRelease(hRSI_L1); hRSI_L1 = INVALID_HANDLE; }
   if(hRSI_L2 != INVALID_HANDLE) { IndicatorRelease(hRSI_L2); hRSI_L2 = INVALID_HANDLE; }
   hRSI_L1 = iRSI(_Symbol, g_TF_L1, cfg_RSI_Period, PRICE_CLOSE);
   hRSI_L2 = iRSI(_Symbol, TF_L2,   cfg_RSI_Period, PRICE_CLOSE);
   g_CacheBarTime = 0;
}`;

const newModoFiltro = `void AplicarModoFiltro(ENUM_FILTER_MODE mode) {
   if(g_ActiveFilterMode == mode && hRSI_L1 != INVALID_HANDLE && hRSI_L2 != INVALID_HANDLE) return;
   g_ActiveFilterMode = mode;
   int old_rsi_period = cfg_RSI_Period;
   switch(mode) {
      case FILTER_ATUAL:
         cfg_ADX_MinLevel=12.0; cfg_RSI_Overbought=60.0; cfg_RSI_Oversold=40.0;
         cfg_RSI_Period=7; cfg_EMA_Candles=1; cfg_EMA_DistFactor=0.0; cfg_SpreadFactor=0.30; break;
      case FILTER_MEIO_TERMO:
         cfg_ADX_MinLevel=18.0; cfg_RSI_Overbought=63.0; cfg_RSI_Oversold=37.0;
         cfg_RSI_Period=9; cfg_EMA_Candles=2; cfg_EMA_DistFactor=0.05; cfg_SpreadFactor=0.25; break;
      case FILTER_MAXIMO:
         cfg_ADX_MinLevel=25.0; cfg_RSI_Overbought=68.0; cfg_RSI_Oversold=32.0;
         cfg_RSI_Period=14; cfg_EMA_Candles=3; cfg_EMA_DistFactor=0.10; cfg_SpreadFactor=0.20; break;
   }
   if(old_rsi_period != cfg_RSI_Period || hRSI_L1 == INVALID_HANDLE || hRSI_L2 == INVALID_HANDLE) {
      if(hRSI_L1 != INVALID_HANDLE) { IndicatorRelease(hRSI_L1); hRSI_L1 = INVALID_HANDLE; }
      if(hRSI_L2 != INVALID_HANDLE) { IndicatorRelease(hRSI_L2); hRSI_L2 = INVALID_HANDLE; }
      hRSI_L1 = iRSI(_Symbol, g_TF_L1, cfg_RSI_Period, PRICE_CLOSE);
      hRSI_L2 = iRSI(_Symbol, TF_L2,   cfg_RSI_Period, PRICE_CLOSE);
   }
   g_CacheBarTime = 0;
}`;

if (code.includes(oldModoFiltro)) {
  code = code.replace(oldModoFiltro, newModoFiltro);
  console.log('✔ [5a/7] AplicarModoFiltro protegido contra destruição repetitiva de handles');
} else {
  console.log('❌ [5a/7] oldModoFiltro não encontrado');
}

const oldVerifRegime = `void VerificarRegimeDeMercado() {
   if(!InpAutoRegimeSwitch) return;
   if(IsMercadoLateral()) {
      if(g_ActiveFilterMode != FILTER_MAXIMO) {
         g_ActiveFRMode = FR_CONSERVADOR; AplicarModoFiltro(FILTER_MAXIMO); AddLog(g_LocalConsolidation ? "Regime CAIXOTE ativado." : "Regime LATERAL ativado.");
      }
   } else {
      ENUM_FILTER_MODE pf = (g_CurrentPerfil == PERFIL_CONSERVADOR) ? FILTER_MAXIMO : (g_CurrentPerfil == PERFIL_MODERADO)    ? FILTER_MEIO_TERMO : FILTER_ATUAL;
      if(g_ActiveFilterMode != pf) {
         g_ActiveFRMode = p_ProfileFRMode; AplicarModoFiltro(pf); AddLog("Regime DIRECIONAL retomado.");
      }
   }
}`;

const newVerifRegime = `void VerificarRegimeDeMercado() {
   if(!InpAutoRegimeSwitch) return;
   static datetime s_last_regime_switch = 0;
   if(TimeCurrent() - s_last_regime_switch < 5) return; // Debounce de 5s contra oscilações rápidas tick a tick
   
   if(IsMercadoLateral()) {
      if(g_ActiveFilterMode != FILTER_MAXIMO) {
         s_last_regime_switch = TimeCurrent();
         g_ActiveFRMode = FR_CONSERVADOR; 
         AplicarModoFiltro(FILTER_MAXIMO); 
         AddLog(g_LocalConsolidation ? "Regime CAIXOTE ativado." : "Regime LATERAL ativado.");
      }
   } else {
      ENUM_FILTER_MODE pf = (g_CurrentPerfil == PERFIL_CONSERVADOR) ? FILTER_MAXIMO : (g_CurrentPerfil == PERFIL_MODERADO)    ? FILTER_MEIO_TERMO : FILTER_ATUAL;
      if(g_ActiveFilterMode != pf) {
         s_last_regime_switch = TimeCurrent();
         g_ActiveFRMode = p_ProfileFRMode; 
         AplicarModoFiltro(pf); 
         AddLog("Regime DIRECIONAL retomado.");
      }
   }
}`;

if (code.includes(oldVerifRegime)) {
  code = code.replace(oldVerifRegime, newVerifRegime);
  console.log('✔ [5b/7] VerificarRegimeDeMercado estabilizado com debounce');
} else {
  console.log('❌ [5b/7] oldVerifRegime não encontrado');
}

// 6. RefreshBarCache com SanitizeATR e proteção no Spread Máximo
const oldRefreshATR = `   if(CopyBuffer(hATR_L1, 0, 1, 1, b_atr) > 0) g_CachedATR = b_atr[0]; else all_copied = false;

   g_CachedTrendDir = ComputeTrendDir(hShortEMA_L1, hEMA_L1);
   g_CachedMedDir   = ComputeTrendDir(hShortEMA_L1, hMedEMA_L1);

   if(g_CachedATR > 0) {
      g_CachedSlPts   = (g_CachedATR / _Point) * 1.5;
      g_CachedGatPts  = g_CachedSlPts * 0.25;
      g_CachedBePts   = g_CachedSlPts * InpBE_Trigger_Normal;
      g_CachedMaxSpread = (int)MathCeil((g_CachedATR / _Point) * cfg_SpreadFactor);
   }`;

const newRefreshATR = `   if(CopyBuffer(hATR_L1, 0, 1, 1, b_atr) > 0) g_CachedATR = SanitizeATR(b_atr[0], g_TF_L1); else all_copied = false;

   g_CachedTrendDir = ComputeTrendDir(hShortEMA_L1, hEMA_L1);
   g_CachedMedDir   = ComputeTrendDir(hShortEMA_L1, hMedEMA_L1);

   if(g_CachedATR > 0) {
      g_CachedSlPts   = (g_CachedATR / _Point) * 1.5;
      g_CachedGatPts  = g_CachedSlPts * 0.25;
      g_CachedBePts   = g_CachedSlPts * InpBE_Trigger_Normal;
      g_CachedMaxSpread = (int)MathCeil((g_CachedATR / _Point) * cfg_SpreadFactor);
      if(g_CachedMaxSpread < 15) g_CachedMaxSpread = 15;
      if(g_CachedMaxSpread > 150) g_CachedMaxSpread = 150;
   }`;

if (code.includes(oldRefreshATR)) {
  code = code.replace(oldRefreshATR, newRefreshATR);
  console.log('✔ [6a/7] RefreshBarCache com SanitizeATR e Spread protegido');
} else {
  console.log('❌ [6a/7] oldRefreshATR não encontrado');
}

const oldRefreshFiboATR = `   if(CopyBuffer(hATR_H4, 0, 1, 1, atr_f) > 0) g_CachedFiboATR = atr_f[0]; else all_copied = false;`;
const newRefreshFiboATR = `   if(CopyBuffer(hATR_H4, 0, 1, 1, atr_f) > 0) g_CachedFiboATR = SanitizeATR(atr_f[0], PERIOD_H4); else all_copied = false;`;
if (code.includes(oldRefreshFiboATR)) {
  code = code.replace(oldRefreshFiboATR, newRefreshFiboATR);
  console.log('✔ [6b/7] FiboATR H4 protegido com SanitizeATR');
} else {
  console.log('❌ [6b/7] oldRefreshFiboATR não encontrado');
}

// 7. OnTick variáveis L2 com arrays separados e SanitizeATR
const oldL2Tick = `   double l2_adx=0, l2_rsi=0, l2_atr=0; int l2_trend=0, l2_med=0;
   double d_l2[]; ArraySetAsSeries(d_l2,true);
   if(CopyBuffer(hADX_L2,0,1,1,d_l2)>0) l2_adx=d_l2[0];
   if(CopyBuffer(hRSI_L2,0,1,1,d_l2)>0) l2_rsi=d_l2[0];
   if(CopyBuffer(hATR_L2,0,1,1,d_l2)>0) l2_atr=d_l2[0];`;

const newL2Tick = `   double l2_adx=0, l2_rsi=0, l2_atr=0; int l2_trend=0, l2_med=0;
   double d_adx_l2[], d_rsi_l2[], d_atr_l2[]; 
   ArraySetAsSeries(d_adx_l2,true); ArraySetAsSeries(d_rsi_l2,true); ArraySetAsSeries(d_atr_l2,true);
   if(CopyBuffer(hADX_L2,0,1,1,d_adx_l2)>0) l2_adx=d_adx_l2[0];
   if(CopyBuffer(hRSI_L2,0,1,1,d_rsi_l2)>0) l2_rsi=d_rsi_l2[0];
   if(CopyBuffer(hATR_L2,0,1,1,d_atr_l2)>0) l2_atr=SanitizeATR(d_atr_l2[0], TF_L2);`;

if (code.includes(oldL2Tick)) {
  code = code.replace(oldL2Tick, newL2Tick);
  console.log('✔ [7/7] OnTick L2 buffers isolados e com SanitizeATR');
} else {
  console.log('❌ [7/7] oldL2Tick não encontrado');
}

// Salvar
fs.writeFileSync(file, code);
console.log('\n✔ Arquivo ' + file + ' atualizado com sucesso!');
