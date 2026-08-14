const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('DROW_DYN("Dir. L1 OK",dir_algum?"sim":"NEUTRO BLOQ.",!dir_algum)')) {
    lines[i - 2] = `       bool u_r=InpUseFR, c_c=g_CachedFrCdOk, c_l=(g_CachedFRTop>0&&g_CachedFRFundo>0);
       bool dir_s_ok,dir_b_ok; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok,dir_b_ok);
       double ask_c=SymbolInfoDouble(_Symbol,SYMBOL_ASK), bid_c=SymbolInfoDouble(_Symbol,SYMBOL_BID);
       bool perto_topo=(g_CachedFRTop>0 && MathAbs(g_CachedFRTop-ask_c) < MathAbs(bid_c-g_CachedFRFundo));
       bool confl_mg_ok = perto_topo ? g_MG_SellAllowed : g_MG_BuyAllowed;
       bool dir_lado_ok = perto_topo ? dir_s_ok : dir_b_ok;
       bool c_dr=InpFR_Direct_Entries;`;
    lines[i - 1] = ``;
    lines[i] = `       DROW_DYN("Uso Estratégia",u_r?"sim":"OFF",!u_r)
       DROW_DYN("Cooldown L1",c_c?"livre":"AGUARDAR",!c_c)
       DROW_DYN("Mapeamento L1",c_l?"sim":"NÃO",!c_l)
       DROW_DYN("Dir. L1 OK",dir_lado_ok?"sim":(perto_topo?"NEUTRO (TOPO)":"NEUTRO (FUNDO)"),!dir_lado_ok)
       DROW_DYN("FR Direct",c_dr?"ativo":"off",false)`;
    lines[i + 1] = `       string confl_val="OFF"; 
       if(g_ModoConfluencia>0){ 
          if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val=perto_topo?"BLOQ (SÓ COMPRA)":"SÓ COMPRA (OK)"; 
          else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val=perto_topo?"SÓ VENDA (OK)":"BLOQ (SÓ VENDA)"; 
          else confl_val="LIVRE"; 
       } 
       DROW_DYN("Filtro MktGlance",confl_val,!confl_mg_ok)
       string not_val=d_not?"BLOQUEADO":"LIVRE"; if(g_ProximaNoticiaName!=""&&g_ProximaNoticiaTime>TimeCurrent()){int m_l=(int)((g_ProximaNoticiaTime-TimeCurrent())/60); not_val=(d_not?"BLOQ ":"")+g_ProximaNoticiaName+" ("+IntegerToString(m_l)+"m)";} DROW_DYN("Filtro Notícia",not_val,d_not)`;
    lines[i + 2] = `       s_rdy=(!any_glb&&u_r&&c_c&&c_l&&dir_lado_ok&&confl_mg_ok);`;
    console.log(`Line ${i + 1} diagnostic card sync updated!`);
    break;
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
