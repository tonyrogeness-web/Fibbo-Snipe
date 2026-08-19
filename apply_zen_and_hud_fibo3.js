const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== ATUALIZANDO MODO ZEN E VERIFICAÇÕES HUD COM A ESTRUTURA 18%, 23.6%, 38.2% ===\n');

// 1. ZONAS ZEN FIBO COM 3 NÍVEIS
const oldZenFibo = `      datetime t_col_fr  = t1_base;
      datetime t_col_fb1 = t1_base + (datetime)(ps * 10);
      datetime t_col_fb2 = t1_base + (datetime)(ps * 15);
      
      double mag_tol = GetFR_MagTol(g_CachedATR, g_CachedADX);
      
      bool in_rd_fr=(g_CachedFRTop>0&&MathAbs(g_CachedFRTop-ask)/_Point<=zone_pts)||(g_CachedFRFundo>0&&MathAbs(bid-g_CachedFRFundo)/_Point<=zone_pts);
      bool in_rd_fb=false;
      if(IsFiboActiveForSymbol() && g_CachedFiboH > 0){
         double r_f=g_CachedFiboH-g_CachedFiboLow;
         if(r_f>=(g_CachedFiboATR*InpFibMinRange_ATR_Multi)){
            double nS=g_CachedFiboLow+r_f*(InpFibLevelSell/100.0),nB=g_CachedFiboH-r_f*(InpFibLevelBuy/100.0);
            if(MathAbs(nS-ask)/_Point<=zone_pts||MathAbs(bid-nB)/_Point<=zone_pts) in_rd_fb=true;
         }
      }
      
      bool fr_zen_show = false;
      if(InpUseFR && g_CachedFRTop > 0 && g_ViewFR) {
         if(g_LinhasModo == 0) fr_zen_show = true;
         else if(g_LinhasModo == 1) fr_zen_show = (g_ReadyFR || in_rd_fr);
      }
      
      if(fr_zen_show) {
         DrawVisualZoneRect("FR_Top", 0, 0, clrNONE, false);
         DrawVisualZoneRect("FR_Bot", 0, 0, clrNONE, false);
         DrawVisualSegment("FR_TxtT", t_col_fr, t_col_fr, g_CachedFRTop - mag_tol, C'190,80,80', "▼ V FR", true, t_col_fr, g_ReadyFR ? C'80,185,120' : C'190,80,80');
         DrawVisualSegment("FR_TxtB", t_col_fr, t_col_fr, g_CachedFRFundo + mag_tol, C'190,80,80', "▲ C FR", true, t_col_fr, g_ReadyFR ? C'80,185,120' : C'190,80,80');
      } else { 
         DrawVisualZoneRect("FR_Top", 0, 0, clrNONE, false); DrawVisualZoneRect("FR_Bot", 0, 0, clrNONE, false); 
         DrawVisualSegment("FR_TxtT",0,0,0,clrNONE,"",false); DrawVisualSegment("FR_TxtB",0,0,0,clrNONE,"",false); 
      }
      
      bool fb_zen_show = false;
      if(IsFiboActiveForSymbol() && g_CachedFiboH > 0 && g_ViewFibo) {
         if(g_LinhasModo == 0) fb_zen_show = true;
         else if(g_LinhasModo == 1) fb_zen_show = (g_ReadyFibo || in_rd_fb);
      }
      
      if(fb_zen_show) {
         DrawVisualRegressionChannel("Fibo_Ch", 0, 0, clrNONE, false);
         
         bool _is_lateral = (g_CachedADX < p_ADX_ConsolidationLevel);
         bool fb_v_ok = (_is_lateral || g_CachedTrendDir == -1);
         bool fb_c_ok = (_is_lateral || g_CachedTrendDir == 1);
         if(g_ModoConfluencia > 0) {
            if(!g_MG_SellAllowed) fb_v_ok = false;
            if(!g_MG_BuyAllowed)  fb_c_ok = false;
         }
         
         // [DIRECIONAL] Em Tendência de BAIXA: exibe V1 e V2 em Amarelo/Âmbar acima do fundo
         if(fb_v_ok) {
            DrawVisualSegment("Fibo_V1", t_col_fb1, t_col_fb1, nSell, C'255,193,7', "▼ V FB1 H4 (" + DoubleToString(InpFibLevelSell, 1) + "%)", true, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'255,193,7');
            if(InpUseFiboH4_2) {
               DrawVisualSegment("Fibo_V2", t_col_fb2, t_col_fb2, nSell2, C'255,160,0', "▼ V FB2 H4 (" + DoubleToString(InpFibLevel2Sell, 1) + "%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            } else {
               DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
            }
         } else {
            DrawVisualSegment("Fibo_V1", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
         }

         // [DIRECIONAL] Em Tendência de ALTA: exibe C1 e C2 em Amarelo/Âmbar abaixo do topo
         if(fb_c_ok) {
            DrawVisualSegment("Fibo_C1", t_col_fb1, t_col_fb1, nBuy, C'255,193,7', "▲ C FB1 H4 (" + DoubleToString(InpFibLevelBuy, 1) + "%)", true, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'255,193,7');
            if(InpUseFiboH4_2) {
               DrawVisualSegment("Fibo_C2", t_col_fb2, t_col_fb2, nBuy2, C'255,160,0', "▲ C FB2 H4 (" + DoubleToString(InpFibLevel2Buy, 1) + "%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            } else {
               DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
            }
         } else {
            DrawVisualSegment("Fibo_C1", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
         }
      } else {`;

const newZenFibo = `      datetime t_col_fr  = t1_base;
      datetime t_col_fb1 = t1_base + (datetime)(ps * 6);
      datetime t_col_fb2 = t1_base + (datetime)(ps * 12);
      datetime t_col_fb3 = t1_base + (datetime)(ps * 18);
      
      double mag_tol = GetFR_MagTol(g_CachedATR, g_CachedADX);
      
      bool in_rd_fr=(g_CachedFRTop>0&&MathAbs(g_CachedFRTop-ask)/_Point<=zone_pts)||(g_CachedFRFundo>0&&MathAbs(bid-g_CachedFRFundo)/_Point<=zone_pts);
      bool in_rd_fb=false;
      if(IsFiboActiveForSymbol() && g_CachedFiboH > 0 && g_CachedFiboLow > 0){
         double r_f=g_CachedFiboH-g_CachedFiboLow;
         if(r_f>=(g_CachedFiboATR*InpFibMinRange_ATR_Multi)){
            double nS=g_CachedFiboH-r_f*(InpFibLevel1/100.0), nB=g_CachedFiboLow+r_f*(InpFibLevel1/100.0);
            if(MathAbs(nS-ask)/_Point<=zone_pts||MathAbs(bid-nB)/_Point<=zone_pts) in_rd_fb=true;
         }
      }
      
      bool fr_zen_show = false;
      if(InpUseFR && g_CachedFRTop > 0 && g_ViewFR) {
         if(g_LinhasModo == 0) fr_zen_show = true;
         else if(g_LinhasModo == 1) fr_zen_show = (g_ReadyFR || in_rd_fr);
      }
      
      if(fr_zen_show) {
         DrawVisualZoneRect("FR_Top", 0, 0, clrNONE, false);
         DrawVisualZoneRect("FR_Bot", 0, 0, clrNONE, false);
         DrawVisualSegment("FR_TxtT", t_col_fr, t_col_fr, g_CachedFRTop - mag_tol, C'190,80,80', "▼ V FR", true, t_col_fr, g_ReadyFR ? C'80,185,120' : C'190,80,80');
         DrawVisualSegment("FR_TxtB", t_col_fr, t_col_fr, g_CachedFRFundo + mag_tol, C'190,80,80', "▲ C FR", true, t_col_fr, g_ReadyFR ? C'80,185,120' : C'190,80,80');
      } else { 
         DrawVisualZoneRect("FR_Top", 0, 0, clrNONE, false); DrawVisualZoneRect("FR_Bot", 0, 0, clrNONE, false); 
         DrawVisualSegment("FR_TxtT",0,0,0,clrNONE,"",false); DrawVisualSegment("FR_TxtB",0,0,0,clrNONE,"",false); 
      }
      
      bool fb_zen_show = false;
      if(IsFiboActiveForSymbol() && g_CachedFiboH > 0 && g_ViewFibo) {
         if(g_LinhasModo == 0) fb_zen_show = true;
         else if(g_LinhasModo == 1) fb_zen_show = (g_ReadyFibo || in_rd_fb);
      }
      
      if(fb_zen_show) {
         DrawVisualRegressionChannel("Fibo_Ch", 0, 0, clrNONE, false);
         
         bool _is_lateral = (g_CachedADX < p_ADX_ConsolidationLevel);
         bool fb_v_ok = (_is_lateral || g_CachedTrendDir == -1);
         bool fb_c_ok = (_is_lateral || g_CachedTrendDir == 1);
         if(g_ModoConfluencia > 0) {
            if(!g_MG_SellAllowed) fb_v_ok = false;
            if(!g_MG_BuyAllowed)  fb_c_ok = false;
         }
         
         // [DIRECIONAL] Em Tendência de BAIXA: exibe V1, V2 e V3 em Amarelo/Âmbar
         if(fb_v_ok) {
            if(InpUseFiboLevel1) DrawVisualSegment("Fibo_V1", t_col_fb1, t_col_fb1, nSell1, C'255,193,7', "▼ V FB1 H4 (18.0%)", true, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'255,193,7');
            else DrawVisualSegment("Fibo_V1", 0, 0, 0, clrNONE, "", false);

            if(InpUseFiboLevel2) DrawVisualSegment("Fibo_V2", t_col_fb2, t_col_fb2, nSell2, C'255,160,0', "▼ V FB2 H4 (23.6%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            else DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);

            if(InpUseFiboLevel3) DrawVisualSegment("Fibo_V3", t_col_fb3, t_col_fb3, nSell3, C'230,130,20', "▼ V FB3 H4 (38.2%)", true, t_col_fb3, g_ReadyFibo ? C'80,185,120' : C'230,130,20');
            else DrawVisualSegment("Fibo_V3", 0, 0, 0, clrNONE, "", false);
         } else {
            DrawVisualSegment("Fibo_V1", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_V3", 0, 0, 0, clrNONE, "", false);
         }

         // [DIRECIONAL] Em Tendência de ALTA: exibe C1, C2 e C3 em Amarelo/Âmbar
         if(fb_c_ok) {
            if(InpUseFiboLevel1) DrawVisualSegment("Fibo_C1", t_col_fb1, t_col_fb1, nBuy1, C'255,193,7', "▲ C FB1 H4 (18.0%)", true, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'255,193,7');
            else DrawVisualSegment("Fibo_C1", 0, 0, 0, clrNONE, "", false);

            if(InpUseFiboLevel2) DrawVisualSegment("Fibo_C2", t_col_fb2, t_col_fb2, nBuy2, C'255,160,0', "▲ C FB2 H4 (23.6%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            else DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);

            if(InpUseFiboLevel3) DrawVisualSegment("Fibo_C3", t_col_fb3, t_col_fb3, nBuy3, C'230,130,20', "▲ C FB3 H4 (38.2%)", true, t_col_fb3, g_ReadyFibo ? C'80,185,120' : C'230,130,20');
            else DrawVisualSegment("Fibo_C3", 0, 0, 0, clrNONE, "", false);
         } else {
            DrawVisualSegment("Fibo_C1", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_C3", 0, 0, 0, clrNONE, "", false);
         }
      } else {`;

if (code.includes(oldZenFibo)) {
  code = code.replace(oldZenFibo, newZenFibo);
  console.log('✔ [1/2] Modo ZEN atualizado com 3 segmentos (18%, 23.6%, 38.2%)');
} else {
  console.log('❌ [1/2] oldZenFibo não encontrado');
}

// 2. RADAR DO HUD CARD
const oldCardCheck = `      double nSell_chk = 0, nBuy_chk = 0;
      if(g_CachedFiboH > 0) {
         double range_chk = g_CachedFiboH - g_CachedFiboLow;
         if(range_chk >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
            nSell_chk = g_CachedFiboLow + range_chk * (InpFibLevelSell / 100.0);
            nBuy_chk  = g_CachedFiboH   - range_chk * (InpFibLevelBuy / 100.0);
         }
      }`;

const newCardCheck = `      double nSell_chk = 0, nBuy_chk = 0;
      if(g_CachedFiboH > 0 && g_CachedFiboLow > 0) {
         double range_chk = g_CachedFiboH - g_CachedFiboLow;
         if(range_chk >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
            nSell_chk = g_CachedFiboH - range_chk * (InpFibLevel1 / 100.0);
            nBuy_chk  = g_CachedFiboLow + range_chk * (InpFibLevel1 / 100.0);
         }
      }`;

if (code.includes(oldCardCheck)) {
  code = code.replace(oldCardCheck, newCardCheck);
  console.log('✔ [2/2] Radar do Card FIBO sincronizado com a nova estrutura');
} else {
  console.log('❌ [2/2] oldCardCheck não encontrado');
}

fs.writeFileSync(file, code);
console.log('\n✔ ' + file + ' salvo e verificado!');
