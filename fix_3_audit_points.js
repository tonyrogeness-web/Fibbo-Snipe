const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== CORRIGINDO OS 3 PONTOS DE AUDITORIA DAS BLINDAGENS DO FR ===\n');

// 1. Corrigir posição do bloco de Super-Tendência no L2 e variável g_H4_ADX
// Remover o bloco anterior que estava antes de pH/pL
const oldL2Block = `         // [CONFLUENCIA] Filtro direcional para FR L2
         if(g_ModoConfluencia > 0) {
             if(!g_MG_SellAllowed) fr2_cd_sell = false;
             if(!g_MG_BuyAllowed) fr2_cd_buy = false;
         }

         // [BLINDAGEM 1] Trava Anti-Super-Tendência L2 (Bloqueia contra rali direcional ADX > 30)
         if(InpFR_BlockAgainstSuperTrend && (l2_adx >= InpFR_SuperTrend_ADX || g_CachedADX_H4 >= InpFR_SuperTrend_ADX)) {
             double e200_l2 = (g_MG_EMA200 > 0) ? g_MG_EMA200 : (g_MG_hEMA200 != INVALID_HANDLE ? g_MG_EMA200 : 0);
             if(e200_l2 > 0) {
                if(bid > e200_l2) { fr2_cd_sell = false; m_sell = false; } // Super-Alta: Proibido vender topo
                if(ask < e200_l2) { fr2_cd_buy  = false; m_buy  = false; } // Super-Baixa: Proibido comprar fundo
             }
         }
         
         double pH=l2_top, pL=l2_bot;
         double mag_tol=GetFR_MagTol(l2_atr,l2_adx,TF_L2);
         double fr_range=(pH-pL)/_Point, tp1_m=InpTP_Parcial_Multi;
         if(l2_sl>0&&fr_range>=l2_sl*0.5) tp1_m=CalcularTP_Estrutural(fr_range,l2_sl,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);
         
         // [PILAR 4] TP2 Estrutural Dinâmico no L2
         double tp2_m_sell_l2 = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(true, bid, pH, pL, l2_sl, l2_atr) : InpTP_Final_Multi;
         double tp2_m_buy_l2  = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(false, ask, pH, pL, l2_sl, l2_atr) : InpTP_Final_Multi;

         bool m_sell=InpFR_RequireWickRejection?(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&IsVelaReversaoVenda(1,TF_L2)):(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&iClose(_Symbol,TF_L2,1)<iOpen(_Symbol,TF_L2,1));
         bool m_buy =InpFR_RequireWickRejection?(iLow (_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&IsVelaReversaoCompra(1,TF_L2)):(iLow(_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&iClose(_Symbol,TF_L2,1)>iOpen(_Symbol,TF_L2,1));`;

const newL2Block = `         // [CONFLUENCIA] Filtro direcional para FR L2
         if(g_ModoConfluencia > 0) {
             if(!g_MG_SellAllowed) fr2_cd_sell = false;
             if(!g_MG_BuyAllowed) fr2_cd_buy = false;
         }
         
         double pH=l2_top, pL=l2_bot;
         double mag_tol=GetFR_MagTol(l2_atr,l2_adx,TF_L2);
         double fr_range=(pH-pL)/_Point, tp1_m=InpTP_Parcial_Multi;
         if(l2_sl>0&&fr_range>=l2_sl*0.5) tp1_m=CalcularTP_Estrutural(fr_range,l2_sl,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);
         
         // [PILAR 4] TP2 Estrutural Dinâmico no L2
         double tp2_m_sell_l2 = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(true, bid, pH, pL, l2_sl, l2_atr) : InpTP_Final_Multi;
         double tp2_m_buy_l2  = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(false, ask, pH, pL, l2_sl, l2_atr) : InpTP_Final_Multi;

         bool m_sell=InpFR_RequireWickRejection?(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&IsVelaReversaoVenda(1,TF_L2)):(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&iClose(_Symbol,TF_L2,1)<iOpen(_Symbol,TF_L2,1));
         bool m_buy =InpFR_RequireWickRejection?(iLow (_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&IsVelaReversaoCompra(1,TF_L2)):(iLow(_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&iClose(_Symbol,TF_L2,1)>iOpen(_Symbol,TF_L2,1));

         // [BLINDAGEM 1] Trava Anti-Super-Tendência L2 (Posicionada após a declaração de m_sell/m_buy e com g_H4_ADX)
         if(InpFR_BlockAgainstSuperTrend && (l2_adx >= InpFR_SuperTrend_ADX || g_H4_ADX >= InpFR_SuperTrend_ADX)) {
             double e200_l2 = (g_MG_EMA200 > 0) ? g_MG_EMA200 : (g_MG_hEMA200 != INVALID_HANDLE ? g_MG_EMA200 : 0);
             if(e200_l2 > 0) {
                if(bid > e200_l2) { fr2_cd_sell = false; m_sell = false; } // Super-Alta: Proibido vender topo
                if(ask < e200_l2) { fr2_cd_buy  = false; m_buy  = false; } // Super-Baixa: Proibido comprar fundo
             }
         }`;

if (code.includes(oldL2Block)) {
  code = code.replace(oldL2Block, newL2Block);
  console.log('✔ Itens 1 e 2 corrigidos: g_H4_ADX e ordem de declaração de m_sell/m_buy 100% corretas!');
} else {
  console.log('❌ oldL2Block não encontrado');
}

// 2. Corrigir Item 3: Atualizar variável local posSL após PositionModify no BE e no Mid-Channel Lock
const oldBeModify = `            if(be_dist||be_tp1){
               if(posType==POSITION_TYPE_BUY&&posSL<(target_be_sl_buy)-(_Point*2)&&curr_bid>=(target_be_sl_buy+stops_level)){
                  double nsl = NormalizeDouble(target_be_sl_buy, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Compra SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));be_triggered=true;}
               }
               else if(posType==POSITION_TYPE_SELL&&posSL>(target_be_sl_sell)+(_Point*2)&&curr_ask<=(target_be_sl_sell-stops_level)){
                  double nsl = NormalizeDouble(target_be_sl_sell, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Venda SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));be_triggered=true;}
               }
            }`;

const newBeModify = `            if(be_dist||be_tp1){
               if(posType==POSITION_TYPE_BUY&&posSL<(target_be_sl_buy)-(_Point*2)&&curr_bid>=(target_be_sl_buy+stops_level)){
                  double nsl = NormalizeDouble(target_be_sl_buy, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Compra SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));be_triggered=true; posSL=nsl;}
               }
               else if(posType==POSITION_TYPE_SELL&&posSL>(target_be_sl_sell)+(_Point*2)&&curr_ask<=(target_be_sl_sell-stops_level)){
                  double nsl = NormalizeDouble(target_be_sl_sell, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Venda SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));be_triggered=true; posSL=nsl;}
               }
            }`;

if (code.includes(oldBeModify)) {
  code = code.replace(oldBeModify, newBeModify);
  console.log('✔ BE PositionModify atualizado com posSL=nsl!');
}

const oldMidModify = `         // [BLINDAGEM 3] Trava de Lucro Dinâmico no Meio do Canal (Mid-Channel 50% Lock)
         if(InpFR_UseMidChannelLock && StringFind(c_comm, "FR_") >= 0 && posTP > 0) {
            double total_tp_dist = MathAbs(posTP - posOpen);
            if(total_tp_dist > stops_level * 2.0) {
               if(posType == POSITION_TYPE_BUY && curr_bid >= (posOpen + total_tp_dist * 0.50)) {
                  double lock_sl = posOpen + (total_tp_dist * 0.25);
                  if(posSL < (lock_sl - _Point * 2) && curr_bid >= (lock_sl + stops_level)) {
                     double nsl = NormalizeDouble(lock_sl, _Digits);
                     if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Compra SL travado em +25%% do canal (%.5f).", nsl));
                     }
                  }
               }
               else if(posType == POSITION_TYPE_SELL && curr_ask <= (posOpen - total_tp_dist * 0.50)) {
                  double lock_sl = posOpen - (total_tp_dist * 0.25);
                  if(posSL > (lock_sl + _Point * 2) && curr_ask <= (lock_sl - stops_level)) {
                     double nsl = NormalizeDouble(lock_sl, _Digits);
                     if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Venda SL travado em +25%% do canal (%.5f).", nsl));
                     }
                  }
               }
            }
         }`;

const newMidModify = `         // [BLINDAGEM 3] Trava de Lucro Dinâmico no Meio do Canal (Mid-Channel 50% Lock)
         if(InpFR_UseMidChannelLock && StringFind(c_comm, "FR_") >= 0 && posTP > 0) {
            double total_tp_dist = MathAbs(posTP - posOpen);
            if(total_tp_dist > stops_level * 2.0) {
               if(posType == POSITION_TYPE_BUY && curr_bid >= (posOpen + total_tp_dist * 0.50)) {
                  double lock_sl = posOpen + (total_tp_dist * 0.25);
                  if(posSL < (lock_sl - _Point * 2) && curr_bid >= (lock_sl + stops_level)) {
                     double nsl = NormalizeDouble(lock_sl, _Digits);
                     if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Compra SL travado em +25%% do canal (%.5f).", nsl));
                        posSL = nsl; // [FIX ITEM 3] Atualiza variável local posSL para o trailing não reverter
                     }
                  }
               }
               else if(posType == POSITION_TYPE_SELL && curr_ask <= (posOpen - total_tp_dist * 0.50)) {
                  double lock_sl = posOpen - (total_tp_dist * 0.25);
                  if(posSL > (lock_sl + _Point * 2) && curr_ask <= (lock_sl - stops_level)) {
                     double nsl = NormalizeDouble(lock_sl, _Digits);
                     if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Venda SL travado em +25%% do canal (%.5f).", nsl));
                        posSL = nsl; // [FIX ITEM 3] Atualiza variável local posSL para o trailing não reverter
                     }
                  }
               }
            }
         }`;

if (code.includes(oldMidModify)) {
  code = code.replace(oldMidModify, newMidModify);
  console.log('✔ Mid-Channel Lock atualizado com posSL=nsl!');
}

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

console.log('\n=== CORREÇÕES DA AUDITORIA CONCLUÍDAS COM SUCESSO! ===');
