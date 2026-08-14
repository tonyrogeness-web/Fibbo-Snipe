const fs = require('fs');
const filePath = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
let content = fs.readFileSync(filePath, 'utf8');

let fixes = 0;

// Fix A: Trailing Stop
if (content.includes('double step_trail=g_CachedATR*0.25;')) {
  content = content.replace(
    'double step_trail=g_CachedATR*0.25;',
    'double pos_atr=(StringFind(c_comm,"_L2")>=0||StringFind(c_comm,"_H4")>=0)?(g_L2_ATR>0?g_L2_ATR:g_CachedATR):g_CachedATR;\n            double pos_trail_dist=pos_atr*InpTrail_ATR_Multi;\n            double step_trail=pos_atr*0.25;'
  );
  content = content.replace(
    'double nsl=NormalizeDouble(curr_bid-trail_dist,_Digits);',
    'double nsl=NormalizeDouble(curr_bid-pos_trail_dist,_Digits);'
  );
  content = content.replace(
    'double nsl=NormalizeDouble(curr_ask+trail_dist,_Digits);',
    'double nsl=NormalizeDouble(curr_ask+pos_trail_dist,_Digits);'
  );
  fixes++;
  console.log('✔ Fix A (Trailing Stop Cross-Timeframe) aplicado!');
}

// Fix B: ResetDiario
if (content.includes('GlobalVariableSet(g_GV_GlobalDay, dia);')) {
  content = content.replace(
    'GlobalVariableSet(g_GV_GlobalDay, dia);',
    'if(g_BotPaused && StringFind(g_Log[0], "Teto Diário") >= 0) { g_BotPaused = false; AddLog("Retomada diária automática."); }\n      GlobalVariableSet(g_GV_GlobalDay, dia);'
  );
  fixes++;
  console.log('✔ Fix B (Reset Diário de Pausa Automática) aplicado!');
}

// Fix C: FR Direct L1 filtros Caixote e Tendência
if (content.includes('bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros&&InpFR_UseRSI)?(g_CachedRSI>=r_th_sell):true;')) {
  content = content.replace(
    'bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros&&InpFR_UseRSI)?(g_CachedRSI>=r_th_sell):true;',
    'bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||g_CachedRSI>=r_th_sell)&&!g_LocalConsolidation&&d_s_ok):true;'
  );
  content = content.replace(
    'bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros&&InpFR_UseRSI)?(g_CachedRSI<=r_th_buy):true;',
    'bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||g_CachedRSI<=r_th_buy)&&!g_LocalConsolidation&&d_b_ok):true;'
  );
  fixes++;
  console.log('✔ Fix C (FR Direct L1 Respeita Caixote e Tendência) aplicado!');
}

// Fix D: FR Direct L2 ATR Mínimo
if (content.includes('if(InpFR_Direct_Entries&&l2_atr>0){')) {
  content = content.replace(
    'if(InpFR_Direct_Entries&&l2_atr>0){',
    'if(InpFR_Direct_Entries&&l2_atr>0&&(!InpUseOscillationFilter||(l2_atr/_Point)>=InpMinATRPts)){'
  );
  fixes++;
  console.log('✔ Fix D (FR Direct L2 Filtro ATR Mínimo) aplicado!');
}

// Fix E: g_ModoConfluencia no OnInit
if (content.includes('if(!InicializarHandles()) { AddLog("ERRO: Falha ao carregar indicadores."); return INIT_FAILED; }')) {
  content = content.replace(
    'if(!InicializarHandles()) { AddLog("ERRO: Falha ao carregar indicadores."); return INIT_FAILED; }',
    'if(GlobalVariableCheck("FS9_ModoConfl")) g_ModoConfluencia = (int)GlobalVariableGet("FS9_ModoConfl");\n   if(!InicializarHandles()) { AddLog("ERRO: Falha ao carregar indicadores."); return INIT_FAILED; }'
  );
  fixes++;
  console.log('✔ Fix E (Persistência g_ModoConfluencia no OnInit) aplicado!');
}

// Fix G: EscreverCSV
if (content.includes('StringReplace(filename, ".", "");')) {
  content = content.replace(
    'string filename = "FibboSniper_Trades_" + _Symbol + "_" + TimeToString(TimeCurrent(), TIME_DATE) + ".csv"; StringReplace(filename, ".", "");',
    'string date_str = TimeToString(TimeCurrent(), TIME_DATE); StringReplace(date_str, ".", ""); string filename = "FibboSniper_Trades_" + _Symbol + "_" + date_str + ".csv";'
  );
  fixes++;
  console.log('✔ Fix G (Nome do Arquivo CSV) aplicado!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n🎉 TOTAL DE CORREÇÕES APLICADAS: ${fixes}/6`);
