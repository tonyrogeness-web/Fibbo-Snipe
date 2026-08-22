const fs = require('fs');
const path = require('path');

console.log('=== APLICANDO CORREÇÕES CRÍTICAS DA AUDITORIA ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Corrigir IsSymbolInList (apenas StringFind(sym, itm) >= 0 para evitar falso positivo)
const oldIsSym = `bool IsSymbolInList(string symbol_to_check, string list) {
   if(list == "") return false;
   string sym = symbol_to_check;
   StringToUpper(sym);
   string l = list;
   StringToUpper(l);
   
   string items[];
   int count = StringSplit(l, ',', items);
   for(int i = 0; i < count; i++) {
      string itm = items[i];
      StringTrimLeft(itm);
      StringTrimRight(itm);
      if(itm != "" && (StringFind(sym, itm) >= 0 || StringFind(itm, sym) >= 0)) return true;
   }
   return false;
}`;

const newIsSym = `bool IsSymbolInList(string symbol_to_check, string list) {
   if(list == "") return false;
   string sym = symbol_to_check;
   StringToUpper(sym);
   string l = list;
   StringToUpper(l);
   
   string items[];
   int count = StringSplit(l, ',', items);
   for(int i = 0; i < count; i++) {
      string itm = items[i];
      StringTrimLeft(itm);
      StringTrimRight(itm);
      if(itm != "" && StringFind(sym, itm) >= 0) return true;
   }
   return false;
}`;

code = code.replace(oldIsSym, newIsSym);
console.log('✔ 1. IsSymbolInList corrigido sem falso positivo!');

// 2. Corrigir FR Direct L1 (elimina risco de entrada dupla na mesma vela / tick)
const oldL1Direct = `                if(confl_s_ok && tc_sell && pen_dir_s && (iHigh(_Symbol,g_TF_L1,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_sell&&z_v&&dr_s_ok){
                   datetime prev_sell=l1_frd_sell; l1_frd_sell=cb_l1;
                   if(!AbrirSell(lot,bid,sl_pts,tp1_m,tp2_m_sell_l1,"FR_Dir_V_L1")) l1_frd_sell=prev_sell; else l1_fr_sell_ts=TimeCurrent();
                }
                if(confl_b_ok && tc_buy && pen_dir_b && (iLow(_Symbol,g_TF_L1,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_buy&&z_c&&dr_b_ok){
                   datetime prev_buy=l1_frd_buy; l1_frd_buy=cb_l1;
                   if(!AbrirBuy(lot,ask,sl_pts,tp1_m,tp2_m_buy_l1,"FR_Dir_C_L1")) l1_frd_buy=prev_buy; else l1_fr_buy_ts=TimeCurrent();
                }`;

const newL1Direct = `                bool tc_dir_s = (_fr_cd <= 0 || (TimeCurrent() - l1_fr_sell_ts) >= _fr_cd);
                bool tc_dir_b = (_fr_cd <= 0 || (TimeCurrent() - l1_fr_buy_ts) >= _fr_cd);
                bool z_v_dir = FR_ZonaLivre("L1", true) && !JaExistePosicaoDaEstrategia("FR_Venda_L1") && !JaExistePosicaoDaEstrategia("FR_Dir_V_L1");
                bool z_c_dir = FR_ZonaLivre("L1", false) && !JaExistePosicaoDaEstrategia("FR_Compra_L1") && !JaExistePosicaoDaEstrategia("FR_Dir_C_L1");

                if(confl_s_ok && tc_dir_s && pen_dir_s && (iHigh(_Symbol,g_TF_L1,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_sell&&z_v_dir&&dr_s_ok){
                   datetime prev_sell=l1_frd_sell; l1_frd_sell=cb_l1;
                   if(!AbrirSell(lot,bid,sl_pts,tp1_m,tp2_m_sell_l1,"FR_Dir_V_L1")) l1_frd_sell=prev_sell; else l1_fr_sell_ts=TimeCurrent();
                }
                if(confl_b_ok && tc_dir_b && pen_dir_b && (iLow(_Symbol,g_TF_L1,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_buy&&z_c_dir&&dr_b_ok){
                   datetime prev_buy=l1_frd_buy; l1_frd_buy=cb_l1;
                   if(!AbrirBuy(lot,ask,sl_pts,tp1_m,tp2_m_buy_l1,"FR_Dir_C_L1")) l1_frd_buy=prev_buy; else l1_fr_buy_ts=TimeCurrent();
                }`;

code = code.replace(oldL1Direct, newL1Direct);
console.log('✔ 2. FR Direct L1 blindado contra abertura dupla!');

// 3. Corrigir FR Direct L2
const oldL2Direct = `            if(confl_l2_s_ok&&pen_dir_s_l2&&(iHigh(_Symbol,TF_L2,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_sell&&z_v&&dr_s_ok&&fr2_cd_sell){
               datetime prev_sell=l2_frd_sell; l2_frd_sell=cb_l2;
               if(!AbrirSell(l2_lot,bid,l2_sl,tp1_m,tp2_m_sell_l2,"FR_Dir_V_L2")) l2_frd_sell=prev_sell; else l2_fr_sell_ts=TimeCurrent();
            }
            if(confl_l2_b_ok&&pen_dir_b_l2&&(iLow(_Symbol,TF_L2,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_buy&&z_c&&dr_b_ok&&fr2_cd_buy){
               datetime prev_buy=l2_frd_buy; l2_frd_buy=cb_l2;
               if(!AbrirBuy(l2_lot,ask,l2_sl,tp1_m,tp2_m_buy_l2,"FR_Dir_C_L2")) l2_frd_buy=prev_buy; else l2_fr_buy_ts=TimeCurrent();
            }`;

const newL2Direct = `            bool tc_dir_s_l2 = (_fr_cd_l2 <= 0 || (TimeCurrent() - l2_fr_sell_ts) >= _fr_cd_l2);
            bool tc_dir_b_l2 = (_fr_cd_l2 <= 0 || (TimeCurrent() - l2_fr_buy_ts) >= _fr_cd_l2);
            bool z_v_dir_l2 = FR_ZonaLivre("L2", true) && !JaExistePosicaoDaEstrategia("FR_Venda_L2") && !JaExistePosicaoDaEstrategia("FR_Dir_V_L2");
            bool z_c_dir_l2 = FR_ZonaLivre("L2", false) && !JaExistePosicaoDaEstrategia("FR_Compra_L2") && !JaExistePosicaoDaEstrategia("FR_Dir_C_L2");

            if(confl_l2_s_ok&&pen_dir_s_l2&&tc_dir_s_l2&&(iHigh(_Symbol,TF_L2,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_sell&&z_v_dir_l2&&dr_s_ok&&fr2_cd_sell){
               datetime prev_sell=l2_frd_sell; l2_frd_sell=cb_l2;
               if(!AbrirSell(l2_lot,bid,l2_sl,tp1_m,tp2_m_sell_l2,"FR_Dir_V_L2")) l2_frd_sell=prev_sell; else l2_fr_sell_ts=TimeCurrent();
            }
            if(confl_l2_b_ok&&pen_dir_b_l2&&tc_dir_b_l2&&(iLow(_Symbol,TF_L2,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_buy&&z_c_dir_l2&&dr_b_ok&&fr2_cd_buy){
               datetime prev_buy=l2_frd_buy; l2_frd_buy=cb_l2;
               if(!AbrirBuy(l2_lot,ask,l2_sl,tp1_m,tp2_m_buy_l2,"FR_Dir_C_L2")) l2_frd_buy=prev_buy; else l2_fr_buy_ts=TimeCurrent();
            }`;

code = code.replace(oldL2Direct, newL2Direct);
console.log('✔ 3. FR Direct L2 blindado contra abertura dupla!');

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ Arquivo Fibbo_Sniper_v28.5_H2.mq5 atualizado!');
