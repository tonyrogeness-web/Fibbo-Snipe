const fs = require('fs');

const targetFile = 'Fibbo_Sniper_v28.5_H2.mq5';
const buf = fs.readFileSync(targetFile);
let text = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.toString('utf16le') : buf.toString('utf8');

const oldFRL1Block = `         double pH=g_CachedFRTop, pL=g_CachedFRFundo;
         double mag_tol=GetFR_MagTol(g_CachedATR,g_CachedADX);
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


         // [R3] Cooldown por tempo: bloqueia re-entrada no mesmo nível FR por N minutos
         int _fr_cd=InpFR_CooldownMinutes*60;
         bool tc_sell=(_fr_cd<=0||(TimeCurrent()-l1_fr_sell_ts)>=_fr_cd);
         bool tc_buy =(_fr_cd<=0||(TimeCurrent()-l1_fr_buy_ts )>=_fr_cd);
         g_ReadyFR_Sell = (confl_s_ok && tc_sell && (m_sell || (is_lat && d_s_ok && r_s_ok)));
          g_ReadyFR_Buy  = (confl_b_ok && tc_buy  && (m_buy  || (is_lat && d_b_ok && r_b_ok)));
          g_ReadyFR = (g_ReadyFR_Sell || g_ReadyFR_Buy);
         if(confl_s_ok && (m_sell||(is_lat&&d_s_ok&&r_s_ok&&iHigh(_Symbol,g_TF_L1,1)>=(pH-mag_tol)&&iClose(_Symbol,g_TF_L1,1)<pH&&iClose(_Symbol,g_TF_L1,1)<iOpen(_Symbol,g_TF_L1,1)))&&z_v&&cb_l1!=l1_fr_sell&&tc_sell){if(AbrirSell(lot,bid,sl_pts,tp1_m,InpTP_Final_Multi,"FR_Venda_L1")){l1_fr_sell=cb_l1;l1_fr_sell_ts=TimeCurrent();}}
         if(confl_b_ok && (m_buy ||(is_lat&&d_b_ok&&r_b_ok&&iLow (_Symbol,g_TF_L1,1)<=(pL+mag_tol)&&iClose(_Symbol,g_TF_L1,1)>pL&&iClose(_Symbol,g_TF_L1,1)>iOpen(_Symbol,g_TF_L1,1)))&&z_c&&cb_l1!=l1_fr_buy&&tc_buy) {if(AbrirBuy (lot,ask,sl_pts,tp1_m,InpTP_Final_Multi,"FR_Compra_L1")){l1_fr_buy=cb_l1;l1_fr_buy_ts=TimeCurrent();}}

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
         double mag_tol=GetFR_MagTol(g_CachedATR,g_CachedADX);
         double fr_range=(pH-pL)/_Point, tp1_m=InpTP_Parcial_Multi;
         if(sl_pts>0&&fr_range>=sl_pts*0.5) tp1_m=CalcularTP_Estrutural(fr_range,sl_pts,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);
         
         // [PILAR 4] TP2 Estrutural Dinâmico no L1
         double tp2_m_sell_l1 = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(true, bid, pH, pL, sl_pts, g_CachedATR) : InpTP_Final_Multi;
         double tp2_m_buy_l1  = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(false, ask, pH, pL, sl_pts, g_CachedATR) : InpTP_Final_Multi;

         bool m_sell=InpFR_RequireWickRejection?(iHigh(_Symbol,g_TF_L1,1)>pH&&iClose(_Symbol,g_TF_L1,1)<pH&&IsVelaReversaoVenda(1,g_TF_L1)):(iHigh(_Symbol,g_TF_L1,1)>pH&&iClose(_Symbol,g_TF_L1,1)<pH&&iClose(_Symbol,g_TF_L1,1)<iOpen(_Symbol,g_TF_L1,1));
         bool m_buy =InpFR_RequireWickRejection?(iLow (_Symbol,g_TF_L1,1)<pL&&iClose(_Symbol,g_TF_L1,1)>pL&&IsVelaReversaoCompra(1,g_TF_L1)):(iLow(_Symbol,g_TF_L1,1)<pL&&iClose(_Symbol,g_TF_L1,1)>pL&&iClose(_Symbol,g_TF_L1,1)>iOpen(_Symbol,g_TF_L1,1));
         
         // [PILAR 2 & 3] Validação de Volume e Penetração Máxima no L1
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


         // [R3] Cooldown por tempo: bloqueia re-entrada no mesmo nível FR por N minutos
         int _fr_cd=InpFR_CooldownMinutes*60;
         bool tc_sell=(_fr_cd<=0||(TimeCurrent()-l1_fr_sell_ts)>=_fr_cd);
         bool tc_buy =(_fr_cd<=0||(TimeCurrent()-l1_fr_buy_ts )>=_fr_cd);
         g_ReadyFR_Sell = (confl_s_ok && tc_sell && (m_sell || (is_lat && d_s_ok && r_s_ok)));
         g_ReadyFR_Buy  = (confl_b_ok && tc_buy  && (m_buy  || (is_lat && d_b_ok && r_b_ok)));
         g_ReadyFR = (g_ReadyFR_Sell || g_ReadyFR_Buy);
         if(confl_s_ok && tc_sell && (m_sell||(is_lat&&d_s_ok&&r_s_ok&&vp_s_ok&&iHigh(_Symbol,g_TF_L1,1)>=(pH-mag_tol)&&iClose(_Symbol,g_TF_L1,1)<pH&&iClose(_Symbol,g_TF_L1,1)<iOpen(_Symbol,g_TF_L1,1)))&&z_v&&cb_l1!=l1_fr_sell){if(AbrirSell(lot,bid,sl_pts,tp1_m,tp2_m_sell_l1,"FR_Venda_L1")){l1_fr_sell=cb_l1;l1_fr_sell_ts=TimeCurrent();}}
         if(confl_b_ok && tc_buy  && (m_buy ||(is_lat&&d_b_ok&&r_b_ok&&vp_b_ok&&iLow (_Symbol,g_TF_L1,1)<=(pL+mag_tol)&&iClose(_Symbol,g_TF_L1,1)>pL&&iClose(_Symbol,g_TF_L1,1)>iOpen(_Symbol,g_TF_L1,1)))&&z_c&&cb_l1!=l1_fr_buy) {if(AbrirBuy (lot,ask,sl_pts,tp1_m,tp2_m_buy_l1,"FR_Compra_L1")){l1_fr_buy=cb_l1;l1_fr_buy_ts=TimeCurrent();}}

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
                  if(!AbrirSell(lot,bid,sl_pts,tp1_m,tp2_m_sell_l1,"FR_Dir_V_L1")) l1_frd_sell=prev_sell; else l1_fr_sell_ts=TimeCurrent();
               }
               if(confl_b_ok && tc_buy && pen_dir_b && (iLow(_Symbol,g_TF_L1,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_buy&&z_c&&dr_b_ok){
                  datetime prev_buy=l1_frd_buy; l1_frd_buy=cb_l1;
                  if(!AbrirBuy(lot,ask,sl_pts,tp1_m,tp2_m_buy_l1,"FR_Dir_C_L1")) l1_frd_buy=prev_buy; else l1_fr_buy_ts=TimeCurrent();
               }
            } // [R1] fim filtro ATR
         }`;

if (!text.includes(oldFRL1Block)) {
    console.error('Could not find exact oldFRL1Block!');
} else {
    text = text.replace(oldFRL1Block, newFRL1Block);
    console.log('Successfully updated FR L1 Block!');
    const utf16leBuf = Buffer.from('\ufeff' + text, 'utf16le');
    fs.writeFileSync(targetFile, utf16leBuf);
}
