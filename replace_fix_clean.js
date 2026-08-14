const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const startMarker = '   if(g_FastNPosSymbol > 0) {';
const endMarker = '   // [PROP] Seção Prop Firm no painel';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
  const newBlock = `   if(g_FastNPosSymbol > 0) {
      ObjectDelete(0,PANEL_PREFIX+"btn_pause");
      double c_posOpen=0, c_posSL=0, c_posTP=0, c_posProfit=0; long c_posType=0; double c_lot=0; string c_comm=""; ulong c_ticket=0;
      for(int i=PositionsTotal()-1;i>=0;i--){
         c_ticket=PositionGetTicket(i);
         if(PositionSelectByTicket(c_ticket)&&PositionGetInteger(POSITION_MAGIC)==InpMagic&&PositionGetString(POSITION_SYMBOL)==_Symbol){
            c_posOpen=PositionGetDouble(POSITION_PRICE_OPEN);
            c_posSL=PositionGetDouble(POSITION_SL);
            c_posTP=PositionGetDouble(POSITION_TP);
            c_posProfit=PositionGetDouble(POSITION_PROFIT)+PositionGetDouble(POSITION_SWAP)+PositionGetDouble(POSITION_COMMISSION);
            c_posType=PositionGetInteger(POSITION_TYPE);
            c_lot=PositionGetDouble(POSITION_VOLUME);
            c_comm=PositionGetString(POSITION_COMMENT);
            break;
         }
      }
      double c_curr=(c_posType==POSITION_TYPE_BUY)?SymbolInfoDouble(_Symbol,SYMBOL_BID):SymbolInfoDouble(_Symbol,SYMBOL_ASK);
      double actual_sl_pts = (c_posSL > 0) ? (MathAbs(c_posOpen - c_posSL) / _Point) : g_CachedSlPts;
      double trig_pct = (StringFind(c_comm, "Fibo") >= 0) ? InpBE_Trigger_Fibo : InpBE_Trigger_Normal;
      double dist_be = 0;
      if(c_posSL > 0) {
         double trig_price = (c_posType == POSITION_TYPE_BUY) ? (c_posOpen + (actual_sl_pts * trig_pct * _Point)) : (c_posOpen - (actual_sl_pts * trig_pct * _Point));
         dist_be = (c_posType == POSITION_TYPE_BUY) ? (trig_price - c_curr) : (c_curr - trig_price);
      }
      bool be_triggered=(((c_posSL>=c_posOpen)&&(c_posType==POSITION_TYPE_BUY))||((c_posSL<=c_posOpen)&&(c_posType==POSITION_TYPE_SELL)&&c_posSL>0));
      string be_txt=""; color be_clr=CLR_TXT_LABEL; bool be_close=false;
      if(be_triggered){be_txt=" B.E. ATIVO ✓ ";be_clr=CLR_TEAL;}else if(c_posSL>0){double pt_to_be=dist_be/_Point;if(pt_to_be<=50.0&&dist_be>0){be_close=true;be_txt=StringFormat(" B.E. EM %.0f pts! ",pt_to_be);be_clr=CLR_TEAL;}else{be_txt=StringFormat(" B.E. dist: %.0f pts ",pt_to_be);be_clr=CLR_TXT_DIM;}}else{be_txt=" AGUARDANDO SL ";be_clr=CLR_TXT_DIM;}
      PSectionBadge("s_bata",px,cur,pw,"POSIÇÃO",CLR_AMBER); int be_bx=px+pad+76,be_bw=(int)StringLen(be_txt)*6+4;
      PRect("s_bata_be_bg",be_bx,cur+1,be_bw,12,(be_close||be_triggered)?be_clr:CLR_BG_CARD,-1,215);
      PLabel("s_bata_be",be_bx+4,cur+2,be_txt,(be_close||be_triggered)?CLR_BG_BASE:be_clr,InpPanelFontSize-2,true);
      PButton("btn_col_pos",rx-22,cur+1,20,14,g_ColPosicao?"[+]":"[-]",be_close?CLR_AMBER_DIM:CLR_BG_HEADER,g_ColPosicao?(be_close?CLR_AMBER:CLR_TEAL):CLR_TXT_DIM); cur+=16;
      if(!g_ColPosicao){
         string pnl_str = StringFormat("P&L: %s$%.2f USD", (c_posProfit>=0?"+":""), c_posProfit);
         color pnl_clr = (c_posProfit>=0)?CLR_TEAL:CLR_RED;
         PLabel("bta_n",px+pad+4,cur,(c_posType==POSITION_TYPE_BUY?"▼ COMPRA":"▲ VENDA")+" "+DoubleToString(c_lot,2)+" ("+c_comm+")",(c_posType==POSITION_TYPE_BUY)?CLR_TEAL:CLR_RED,InpPanelFontSize,true);
         PLabelR("bta_pnl",rx-6,cur,pnl_str,pnl_clr,InpPanelFontSize,true);cur+=14;
         string sl_s = (c_posSL>0)?DoubleToString(c_posSL,_Digits):"---";
         string tp_s = (c_posTP>0)?DoubleToString(c_posTP,_Digits):"---";
         string d_left  = StringFormat("Ab: %s  •  At: %s", DoubleToString(c_posOpen,_Digits), DoubleToString(c_curr,_Digits));
         string d_right = StringFormat("SL: %s  •  TP: %s", sl_s, tp_s);
         PLabel("bta_det_l",px+pad+4,cur,d_left,CLR_TXT_LABEL,InpPanelFontSize-1);
         PLabelR("bta_det_r",rx-6,cur,d_right,CLR_TXT_PRIMARY,InpPanelFontSize-1);cur+=14;cur+=2;
      } else {
         ObjectDelete(0,PANEL_PREFIX+"bg_bata");ObjectDelete(0,PANEL_PREFIX+"bta_n");ObjectDelete(0,PANEL_PREFIX+"R_bta_pnl");ObjectDelete(0,PANEL_PREFIX+"bta_det_l");ObjectDelete(0,PANEL_PREFIX+"R_bta_det_r");
      }
   } else {
      ObjectDelete(0,PANEL_PREFIX+"s_bata_la");ObjectDelete(0,PANEL_PREFIX+"s_bata_bg");ObjectDelete(0,PANEL_PREFIX+"s_bata_tx");ObjectDelete(0,PANEL_PREFIX+"s_bata_lb");ObjectDelete(0,PANEL_PREFIX+"s_bata_be");ObjectDelete(0,PANEL_PREFIX+"bg_bata");ObjectDelete(0,PANEL_PREFIX+"bta_n");ObjectDelete(0,PANEL_PREFIX+"R_bta_pnl");ObjectDelete(0,PANEL_PREFIX+"bta_det_l");ObjectDelete(0,PANEL_PREFIX+"R_bta_det_r");ObjectDelete(0,PANEL_PREFIX+"btn_col_pos");
   }

`;
  content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('🎉 PERFECT BLOCK REPLACEMENT!');
} else {
  console.log('Indices not found:', startIndex, endIndex);
}
