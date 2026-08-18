const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(targetFile, 'utf8');

console.log('Iniciando aplicação das correções auditadas...');
let count = 0;

// 1. Bug #1: ComputePanelHash
const oldHash = `string ComputePanelHash() {
   // [B05 FIX] Estados criticos adicionados: bloqueios, botoes de view, confluencia
   // [C1 FIX] Removemos g_MG_DiagText do hash para evitar redraw total. Usamos mg_state.
   string mg_state = (g_ModoConfluencia > 0) ? IntegerToString(g_ModoConfluencia) : "0";
   // [BUG-M2 FIX] P&L flutuante adicionado ao hash — painel atualiza a cada R$0,10 de variação
   int pl_sym_dec = (int)(g_FloatingPlSym * 10);
   int pl_tot_dec = (int)(g_FloatingPlTot * 10);
   return StringFormat("%d|%d|%d|%d|%d|%s|%s|%d|%d|%d|%d|%s|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d",
      (int)g_ColPosicao,(int)g_ColTerminal,(int)g_ShowDiag,(int)g_ShowConfigPanel,g_DiagTab,
      g_ProximaNoticiaName,g_Log[0],
      g_NPosDay,g_NPosSwing,g_FastNPosSymbol,
      (int)g_ViewZonas,mg_state,
      (int)g_LocalGlobalBlock,(int)g_LocalBlocked,(int)g_BotPaused,
      (int)g_ViewFluxo,(int)g_ViewFR,(int)g_ViewFibo,
      g_LinhasModo,g_ModoConfluencia,
      pl_sym_dec, pl_tot_dec);
}`;

const newHash = `string ComputePanelHash() {
   // [B05 FIX] Estados criticos adicionados: bloqueios, botoes de view, confluencia
   // [C1 FIX] Removemos g_MG_DiagText do hash para evitar redraw total. Usamos mg_state.
   string mg_state = (g_ModoConfluencia > 0) ? IntegerToString(g_ModoConfluencia) : "0";
   // [BUG-M2 FIX] P&L flutuante adicionado ao hash — painel atualiza a cada R$0,10 de variação
   int pl_sym_dec = (int)(g_FloatingPlSym * 10);
   int pl_tot_dec = (int)(g_FloatingPlTot * 10);
   return StringFormat("%d|%d|%d|%d|%d|%s|%s|%d|%d|%d|%d|%s|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d",
      (int)g_ColPosicao,(int)g_ColTerminal,(int)g_ShowDiag,(int)g_ShowConfigPanel,g_DiagTab,
      g_ProximaNoticiaName,g_Log[0],
      g_NPosDay,g_NPosSwing,g_FastNPosSymbol,
      (int)g_ViewZonas,mg_state,
      (int)g_LocalGlobalBlock,(int)g_LocalBlocked,(int)g_BotPaused,
      (int)g_ViewFluxo,(int)g_ViewFR,(int)g_ViewFibo,
      g_LinhasModo,g_ModoConfluencia,
      pl_sym_dec, pl_tot_dec,
      (int)MathRound(g_CachedADX*10), (int)MathRound(g_CachedRSI*10),
      (int)MathRound(g_CachedATR/_Point), g_FastSpread,
      (int)MathRound(g_CachedLot*100), g_CachedTrendDir, g_CachedMedDir,
      (int)g_LocalConsolidation);
}`;

if (content.includes(oldHash)) {
  content = content.replace(oldHash, newHash);
  count++;
  console.log('✔ [1/6] Bug #1 (ComputePanelHash atualizado com indicadores) aplicado!');
} else {
  console.log('❌ [1/6] Bug #1: bloco não encontrado exatamente!');
}

// 2. Bug #2: Volume H4 / L2
if (content.includes('double g_CachedVolMed = 0;')) {
  content = content.replace('double g_CachedVolMed = 0;', 'double g_CachedVolMed = 0, g_CachedVolMed_L2 = 0;');
  console.log('✔ [2a/6] Declaração g_CachedVolMed_L2 aplicada!');
}

const oldRefreshVol = `   if(InpUseVolumeFilter || InpUseDynamicLiquidity) {
      long vol_b[]; ArraySetAsSeries(vol_b, true);
      if(CopyTickVolume(_Symbol, g_TF_L1, 1, 5, vol_b) >= 5) {
         double mv = 0; for(int i = 0; i < 5; i++) mv += (double)vol_b[i]; g_CachedVolMed = mv / 5.0;
      } else all_copied = false;
   }`;

const newRefreshVol = `   if(InpUseVolumeFilter || InpUseDynamicLiquidity || InpFR_RequireVolumeAbsorption) {
      long vol_b[]; ArraySetAsSeries(vol_b, true);
      if(CopyTickVolume(_Symbol, g_TF_L1, 1, 5, vol_b) >= 5) {
         double mv = 0; for(int i = 0; i < 5; i++) mv += (double)vol_b[i]; g_CachedVolMed = mv / 5.0;
      } else all_copied = false;

      long vol_l2[]; ArraySetAsSeries(vol_l2, true);
      if(CopyTickVolume(_Symbol, TF_L2, 1, 5, vol_l2) >= 5) {
         double mv2 = 0; for(int i = 0; i < 5; i++) mv2 += (double)vol_l2[i]; g_CachedVolMed_L2 = mv2 / 5.0;
      }
   }`;

if (content.includes(oldRefreshVol)) {
  content = content.replace(oldRefreshVol, newRefreshVol);
  console.log('✔ [2b/6] RefreshBarCache com cálculo de g_CachedVolMed_L2 aplicado!');
}

const oldFRVolDef = `// [PILAR 2 & 3] Validação de Penetração Máxima Anti-Violino e Absorção de Volume
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
}`;

const newFRVolDef = `// [PILAR 2 & 3] Validação de Penetração Máxima Anti-Violino e Absorção de Volume
bool FR_ValidarVolumePenetracao(bool is_sell, int shift, ENUM_TIMEFRAMES tf, double level_price, double atr_val, double vol_med_ref = 0) {
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
   // [PILAR 3] Absorção de volume institucional (usa média compatível com o TF)
   double ref_vol = (vol_med_ref > 0) ? vol_med_ref : ((tf == TF_L2 && g_CachedVolMed_L2 > 0) ? g_CachedVolMed_L2 : g_CachedVolMed);
   if(InpFR_RequireVolumeAbsorption && ref_vol > 0) {
      long vb[1];
      if(CopyTickVolume(_Symbol, tf, shift, 1, vb) >= 1) {
         if((double)vb[0] < (ref_vol * InpFR_MinVolumeRatio)) return false;
      }
   }
   return true;
}`;

if (content.includes(oldFRVolDef)) {
  content = content.replace(oldFRVolDef, newFRVolDef);
  console.log('✔ [2c/6] FR_ValidarVolumePenetracao atualizado com parâmetro vol_med_ref!');
}

const oldCallL1 = `bool vp_s_ok = FR_ValidarVolumePenetracao(true, 1, g_TF_L1, pH, g_CachedATR);
            bool vp_b_ok = FR_ValidarVolumePenetracao(false, 1, g_TF_L1, pL, g_CachedATR);`;
const newCallL1 = `bool vp_s_ok = FR_ValidarVolumePenetracao(true, 1, g_TF_L1, pH, g_CachedATR, g_CachedVolMed);
            bool vp_b_ok = FR_ValidarVolumePenetracao(false, 1, g_TF_L1, pL, g_CachedATR, g_CachedVolMed);`;

if (content.includes(oldCallL1)) {
  content = content.replace(oldCallL1, newCallL1);
  console.log('✔ [2d/6] Chamada FR L1 atualizada com g_CachedVolMed!');
}

const oldCallL2 = `bool vp_s_ok_l2 = FR_ValidarVolumePenetracao(true, 1, TF_L2, pH, l2_atr);
            bool vp_b_ok_l2 = FR_ValidarVolumePenetracao(false, 1, TF_L2, pL, l2_atr);`;
const newCallL2 = `bool vp_s_ok_l2 = FR_ValidarVolumePenetracao(true, 1, TF_L2, pH, l2_atr, g_CachedVolMed_L2);
            bool vp_b_ok_l2 = FR_ValidarVolumePenetracao(false, 1, TF_L2, pL, l2_atr, g_CachedVolMed_L2);`;

if (content.includes(oldCallL2)) {
  content = content.replace(oldCallL2, newCallL2);
  count++;
  console.log('✔ [2e/6] Chamada FR L2 atualizada com g_CachedVolMed_L2!');
}

// 3. Bug #3: Diagnóstico FIBO
const oldDiagFibo = `      string confl_val="OFF"; if(g_ModoConfluencia>0){ if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val="SO COMPRA"; else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val="SO VENDA"; else confl_val="LIVRE"; } DROW_DYN("Filtro MktGlance",confl_val,false); string not_val=d_not?"BLOQUEADO":"LIVRE"; if(g_ProximaNoticiaName!=""&&g_ProximaNoticiaTime>TimeCurrent()){int m_l=(int)((g_ProximaNoticiaTime-TimeCurrent())/60); not_val=(d_not?"BLOQ ":"")+g_ProximaNoticiaName+" ("+IntegerToString(m_l)+"m)";} DROW_DYN("Filtro Notícia",not_val,d_not)
      s_rdy=(!any_glb&&u_b&&c_c&&c_l&&c_a&&c_t);`;

const newDiagFibo = `      bool confl_mg_ok = true; string confl_val="OFF";
      if(g_ModoConfluencia>0){
         if(t_h4 == 1) { confl_mg_ok = g_MG_BuyAllowed; confl_val = g_MG_BuyAllowed ? "COMPRA (OK)" : "BLOQ (SÓ VENDA)"; }
         else if(t_h4 == -1) { confl_mg_ok = g_MG_SellAllowed; confl_val = g_MG_SellAllowed ? "VENDA (OK)" : "BLOQ (SÓ COMPRA)"; }
         else {
            if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val="SÓ COMPRA";
            else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val="SÓ VENDA";
            else confl_val="LIVRE";
            confl_mg_ok = (g_MG_BuyAllowed || g_MG_SellAllowed);
         }
      }
      DROW_DYN("Filtro MktGlance",confl_val,!confl_mg_ok);
      string not_val=d_not?"BLOQUEADO":"LIVRE"; if(g_ProximaNoticiaName!=""&&g_ProximaNoticiaTime>TimeCurrent()){int m_l=(int)((g_ProximaNoticiaTime-TimeCurrent())/60); not_val=(d_not?"BLOQ ":"")+g_ProximaNoticiaName+" ("+IntegerToString(m_l)+"m)";} DROW_DYN("Filtro Notícia",not_val,d_not)
      s_rdy=(!any_glb&&u_b&&c_c&&c_l&&c_a&&c_t&&confl_mg_ok);`;

if (content.includes(oldDiagFibo)) {
  content = content.replace(oldDiagFibo, newDiagFibo);
  count++;
  console.log('✔ [3/6] Bug #3 (Diagnóstico FIBO com MarketGlance e s_rdy sincronizados) aplicado!');
} else {
  console.log('❌ [3/6] Bug #3: bloco não encontrado!');
}

// 4. Obs #4: Variáveis Globais isoladas por conta
const oldGVInit = `g_GV_Blocked    = "Sniper_Blocked_" + _Symbol;`;
const newGVInit = `g_GV_Blocked     = "Sniper_Blocked_" + _Symbol;
   g_GV_GlobalBlock = "Sniper_GlobalBlock_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   g_GV_GlobalDay   = "Sniper_GlobalDay_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));`;

if (content.includes(oldGVInit)) {
  content = content.replace(oldGVInit, newGVInit);
  count++;
  console.log('✔ [4/6] Obs #4 (Variáveis Globais com escopo de conta) aplicado!');
} else {
  console.log('❌ [4/6] Obs #4: bloco não encontrado!');
}

// 5. Obs #5: Botão órfão CFG_btn_risk_04
const oldRisk04 = `       else if(btn==PANEL_PREFIX+"CFG_btn_risk_04"){ g_PropMaxRiskPct=0.4; g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }\n`;
if (content.includes(oldRisk04)) {
  content = content.replace(oldRisk04, '');
  count++;
  console.log('✔ [5/6] Obs #5 (Remoção do handler órfão CFG_btn_risk_04) aplicado!');
} else {
  console.log('❌ [5/6] Obs #5: linha não encontrada!');
}

// 6. Obs #6: Trailing Stop com piso de stops_level
const oldTrail = `         if(!be_triggered&&InpUseTrailStop&&g_CachedATR>0){
            double pos_atr=(StringFind(c_comm,"_L2")>=0||StringFind(c_comm,"_H4")>=0)?(g_L2_ATR>0?g_L2_ATR:g_CachedATR):g_CachedATR;
            double pos_trail_dist=pos_atr*InpTrail_ATR_Multi;
            double step_trail=pos_atr*0.25;
            if(posType==POSITION_TYPE_BUY){
               double nsl=NormalizeDouble(curr_bid-pos_trail_dist,_Digits);
               if(nsl>posOpen&&nsl>(posSL+step_trail)&&(curr_bid-nsl)>=stops_level) trade.PositionModify(ticket,nsl,posTP);
            }
            else if(posType==POSITION_TYPE_SELL){
               double nsl=NormalizeDouble(curr_ask+pos_trail_dist,_Digits);
               if(nsl<posOpen&&nsl<(posSL-step_trail)&&(nsl-curr_ask)>=stops_level) trade.PositionModify(ticket,nsl,posTP);
            }
         }`;

const newTrail = `         if(!be_triggered&&InpUseTrailStop&&g_CachedATR>0){
            double pos_atr=(StringFind(c_comm,"_L2")>=0||StringFind(c_comm,"_H4")>=0)?(g_L2_ATR>0?g_L2_ATR:g_CachedATR):g_CachedATR;
            double pos_trail_dist=pos_atr*InpTrail_ATR_Multi;
            if(pos_trail_dist < stops_level) pos_trail_dist = stops_level + (_Point * 2.0);
            double step_trail=pos_atr*0.25;
            if(step_trail < _Point) step_trail = _Point;
            if(posType==POSITION_TYPE_BUY){
               double nsl=NormalizeDouble(curr_bid-pos_trail_dist,_Digits);
               if(nsl>posOpen&&nsl>(posSL+step_trail)&&(curr_bid-nsl)>=stops_level) trade.PositionModify(ticket,nsl,posTP);
            }
            else if(posType==POSITION_TYPE_SELL){
               double nsl=NormalizeDouble(curr_ask+pos_trail_dist,_Digits);
               if(nsl<posOpen&&nsl<(posSL-step_trail)&&(nsl-curr_ask)>=stops_level) trade.PositionModify(ticket,nsl,posTP);
            }
         }`;

if (content.includes(oldTrail)) {
  content = content.replace(oldTrail, newTrail);
  count++;
  console.log('✔ [6/6] Obs #6 (Trailing Stop com piso de stops_level e step seguro) aplicado!');
} else {
  console.log('❌ [6/6] Obs #6: bloco não encontrado!');
}

// Salvar com UTF-8 BOM
fs.writeFileSync(targetFile, content, 'utf8');
console.log(`\n🎉 SUCESSO: ${count}/6 correções principais aplicadas no MQ5!`);
