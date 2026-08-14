const fs = require('fs');
const filePath = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
let content = fs.readFileSync(filePath, 'utf8');

let fixesApplied = 0;

// ====================================================================
// FIX A: Trailing Stop Cross-Timeframe
// ====================================================================
const oldTrail = `         if(!be_triggered&&InpUseTrailStop&&g_CachedATR>0){
            double step_trail=g_CachedATR*0.25;
            if(posType==POSITION_TYPE_BUY){
               double nsl=NormalizeDouble(curr_bid-trail_dist,_Digits);
               if(nsl>posOpen&&nsl>(posSL+step_trail)&&(curr_bid-nsl)>=stops_level) trade.PositionModify(ticket,nsl,posTP);
            }
            else if(posType==POSITION_TYPE_SELL){
               double nsl=NormalizeDouble(curr_ask+trail_dist,_Digits);
               if(nsl<posOpen&&(posSL==0||nsl<(posSL-step_trail))&&(nsl-curr_ask)>=stops_level) trade.PositionModify(ticket,nsl,posTP);
            }
         }`;

const newTrail = `         if(!be_triggered&&InpUseTrailStop&&g_CachedATR>0){
            double pos_atr = (StringFind(c_comm,"_L2")>=0||StringFind(c_comm,"_H4")>=0)?(g_L2_ATR>0?g_L2_ATR:g_CachedATR):g_CachedATR;
            double pos_trail_dist = pos_atr * InpTrail_ATR_Multi;
            double pos_step_trail = pos_atr * 0.25;
            if(posType==POSITION_TYPE_BUY){
               double nsl=NormalizeDouble(curr_bid-pos_trail_dist,_Digits);
               if(nsl>posOpen&&nsl>(posSL+pos_step_trail)&&(curr_bid-nsl)>=stops_level) trade.PositionModify(ticket,nsl,posTP);
            }
            else if(posType==POSITION_TYPE_SELL){
               double nsl=NormalizeDouble(curr_ask+pos_trail_dist,_Digits);
               if(nsl<posOpen&&(posSL==0||nsl<(posSL-pos_step_trail))&&(nsl-curr_ask)>=stops_level) trade.PositionModify(ticket,nsl,posTP);
            }
         }`;

if (content.includes(oldTrail)) {
  content = content.replace(oldTrail, newTrail);
  fixesApplied++;
  console.log('✔ Fix A (Trailing Stop Cross-Timeframe) aplicado!');
}

// ====================================================================
// FIX B: ResetDiario Reset de g_BotPaused para Teto Diário
// ====================================================================
const oldReset = `void ResetDiario() {
   MqlDateTime dt; TimeCurrent(dt); int dia = dt.day;
   if(g_LocalGlobalDay != dia) {
      g_LocalGlobalDay = dia; g_LocalGlobalBlock = false; g_LocalBlocked = false;
      GlobalVariableSet(g_GV_GlobalDay, dia); GlobalVariableSet(g_GV_GlobalBlock, 0); GlobalVariableSet(g_GV_Blocked, 0);
   }
}`;

const newReset = `void ResetDiario() {
   MqlDateTime dt; TimeCurrent(dt); int dia = dt.day;
   if(g_LocalGlobalDay != dia) {
      g_LocalGlobalDay = dia; g_LocalGlobalBlock = false; g_LocalBlocked = false;
      if(g_BotPaused && StringFind(g_Log[0], "Teto Diário") >= 0) {
         g_BotPaused = false; AddLog("Retomada diária automática após teto.");
      }
      GlobalVariableSet(g_GV_GlobalDay, dia); GlobalVariableSet(g_GV_GlobalBlock, 0); GlobalVariableSet(g_GV_Blocked, 0);
   }
}`;

if (content.includes(oldReset)) {
  content = content.replace(oldReset, newReset);
  fixesApplied++;
  console.log('✔ Fix B (Reset Diário de Pausa Automática) aplicado!');
}

// ====================================================================
// FIX C & D: FR Direct Filtros (Caixote + Tendência + L2 ATR)
// ====================================================================
const oldFRD1 = `               bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros&&InpFR_UseRSI)?(g_CachedRSI>=r_th_sell):true;
               bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros&&InpFR_UseRSI)?(g_CachedRSI<=r_th_buy):true;`;

const newFRD1 = `               bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||g_CachedRSI>=r_th_sell)&&!g_LocalConsolidation&&d_s_ok):true;
               bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||g_CachedRSI<=r_th_buy)&&!g_LocalConsolidation&&d_b_ok):true;`;

if (content.includes(oldFRD1)) {
  content = content.replace(oldFRD1, newFRD1);
  fixesApplied++;
  console.log('✔ Fix C (FR Direct L1 Respeita Caixote e Tendência) aplicado!');
}

const oldFRD2 = `          if(InpFR_Direct_Entries&&l2_atr>0){`;
const newFRD2 = `          if(InpFR_Direct_Entries&&l2_atr>0&&(!InpUseOscillationFilter||(l2_atr/_Point)>=InpMinATRPts)){`;

if (content.includes(oldFRD2)) {
  content = content.replace(oldFRD2, newFRD2);
  fixesApplied++;
  console.log('✔ Fix D (FR Direct L2 Filtro ATR Mínimo) aplicado!');
}

// ====================================================================
// FIX E: Persistência de g_ModoConfluencia no OnInit
// ====================================================================
const oldOnInit = `   AutoSelecionarTF();
   if(!InicializarHandles()) { AddLog("ERRO: Falha ao carregar indicadores."); return INIT_FAILED; }`;

const newOnInit = `   AutoSelecionarTF();
   if(GlobalVariableCheck("FS9_ModoConfl")) g_ModoConfluencia = (int)GlobalVariableGet("FS9_ModoConfl");
   if(!InicializarHandles()) { AddLog("ERRO: Falha ao carregar indicadores."); return INIT_FAILED; }`;

if (content.includes(oldOnInit)) {
  content = content.replace(oldOnInit, newOnInit);
  fixesApplied++;
  console.log('✔ Fix E (Persistência g_ModoConfluencia no OnInit) aplicado!');
}

// ====================================================================
// FIX F: Botões do Painel CONFIG ("risk_12" na lista de limpeza)
// ====================================================================
const oldCfgBtns = `"risk_04","risk_06","risk_10"`;
const newCfgBtns = `"risk_06","risk_10","risk_12"`;

if (content.includes(oldCfgBtns)) {
  content = content.replace(oldCfgBtns, newCfgBtns);
  fixesApplied++;
  console.log('✔ Fix F (Limpeza do Botão 1.2% no Painel CONFIG) aplicado!');
}

// ====================================================================
// FIX G: CSV Formatação de Extensão
// ====================================================================
const oldCSV = `void EscreverCSV(string comment, double lot, double price, double sl, double tp) {
   if(!InpLogCSV) return;
   string filename = "FibboSniper_Trades_" + _Symbol + "_" + TimeToString(TimeCurrent(), TIME_DATE) + ".csv"; StringReplace(filename, ".", "");`;

const newCSV = `void EscreverCSV(string comment, double lot, double price, double sl, double tp) {
   if(!InpLogCSV) return;
   string date_str = TimeToString(TimeCurrent(), TIME_DATE); StringReplace(date_str, ".", "");
   string filename = "FibboSniper_Trades_" + _Symbol + "_" + date_str + ".csv";`;

if (content.includes(oldCSV)) {
  content = content.replace(oldCSV, newCSV);
  fixesApplied++;
  console.log('✔ Fix G (Nome do Arquivo CSV) aplicado!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n🎉 TOTAL DE CORREÇÕES APLICADAS COM SUCESSO: ${fixesApplied}/7`);
