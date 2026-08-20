const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== ATUALIZANDO PAINEL DE DIAGNÓSTICO COM AS 3 BLINDAGENS INSTITUCIONAIS ===\n');

const oldDiagFR = `       DROW_DYN("FR Direct",c_dr?"ativo":"off",false)
       string confl_val="OFF"; 
       if(g_ModoConfluencia>0){ 
          if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val=perto_topo?"BLOQ (SÓ COMPRA)":"SÓ COMPRA (OK)"; 
          else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val=perto_topo?"SÓ VENDA (OK)":"BLOQ (SÓ VENDA)"; 
          else confl_val="LIVRE"; 
       } 
       DROW_DYN("Filtro MktGlance",confl_val,!confl_mg_ok)
       string not_val=d_not?"BLOQUEADO":"LIVRE"; if(g_ProximaNoticiaName!=""&&g_ProximaNoticiaTime>TimeCurrent()){int m_l=(int)((g_ProximaNoticiaTime-TimeCurrent())/60); not_val=(d_not?"BLOQ ":"")+g_ProximaNoticiaName+" ("+IntegerToString(m_l)+"m)";} DROW_DYN("Filtro Notícia",not_val,d_not)
       s_rdy=(!any_glb&&u_r&&c_c&&c_l&&dir_lado_ok&&confl_mg_ok);`;

const newDiagFR = `       DROW_DYN("FR Direct",c_dr?"ativo":"off",false)
       string confl_val="OFF"; 
       if(g_ModoConfluencia>0){ 
          if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val=perto_topo?"BLOQ (SÓ COMPRA)":"SÓ COMPRA (OK)"; 
          else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val=perto_topo?"SÓ VENDA (OK)":"BLOQ (SÓ VENDA)"; 
          else confl_val="LIVRE"; 
       } 
       DROW_DYN("Filtro MktGlance",confl_val,!confl_mg_ok)

       // [BLINDAGEM 1] Diagnóstico de Super-Tendência ADX H4
       bool super_bloq = false; string super_txt = "LIVRE";
       if(InpFR_BlockAgainstSuperTrend) {
          if(g_H4_ADX >= InpFR_SuperTrend_ADX && g_MG_EMA200 > 0) {
             if(perto_topo && ask_c > g_MG_EMA200) { super_bloq = true; super_txt = "BLOQ (ALTA ADX>30)"; }
             else if(!perto_topo && bid_c < g_MG_EMA200) { super_bloq = true; super_txt = "BLOQ (BAIXA ADX>30)"; }
             else { super_txt = "LIVRE (ADX " + DoubleToString(g_H4_ADX, 1) + ")"; }
          } else {
             super_txt = "LIVRE (ADX " + DoubleToString(g_H4_ADX, 1) + ")";
          }
       } else super_txt = "DESATIVADO";
       DROW_DYN("Anti-SuperTrend", super_txt, super_bloq);

       // [BLINDAGEM 2 & 3] Pavio 40% e Mid-Channel Lock
       DROW_DYN("Pavio Mínimo 40%", InpFR_RequireMinWick40 ? "ATIVO" : "OFF", false);
       DROW_DYN("Mid-Channel Lock", InpFR_UseMidChannelLock ? "ATIVO" : "OFF", false);

       string not_val=d_not?"BLOQUEADO":"LIVRE"; if(g_ProximaNoticiaName!=""&&g_ProximaNoticiaTime>TimeCurrent()){int m_l=(int)((g_ProximaNoticiaTime-TimeCurrent())/60); not_val=(d_not?"BLOQ ":"")+g_ProximaNoticiaName+" ("+IntegerToString(m_l)+"m)";} DROW_DYN("Filtro Notícia",not_val,d_not)
       s_rdy=(!any_glb&&u_r&&c_c&&c_l&&dir_lado_ok&&confl_mg_ok&&!super_bloq);`;

if (code.includes(oldDiagFR)) {
  code = code.replace(oldDiagFR, newDiagFR);
  console.log('✔ Diagnóstico do FR atualizado com Anti-SuperTrend, Pavio 40% e Mid-Channel Lock!');
} else {
  console.log('❌ oldDiagFR não encontrado');
}

// Ajustar altura dinâmica do painel de diagnóstico
code = code.replace('static int s_diag_h=250;', 'static int s_diag_h=310;');

fs.writeFileSync(file, code);

// Sincronizar com as pastas de Experts do MT5
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

console.log('\n=== PAINEL DE DIAGNÓSTICO 100% ATUALIZADO! ===');
