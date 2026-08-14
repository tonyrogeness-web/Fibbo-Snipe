const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(filePath, 'utf8');

const target = `      double c_curr=(c_posType==POSITION_TYPE_BUY)?SymbolInfoDouble(_Symbol,SYMBOL_BID):SymbolInfoDouble(_Symbol,SYMBOL_ASK);
      double dist_be=0; if(c_posSL>0) dist_be=(c_posType==POSITION_TYPE_BUY)?(c_posOpen+(g_CachedSlPts*InpBE_Trigger_Normal*_Point))-c_curr:c_curr-(c_posOpen-(g_CachedSlPts*InpBE_Trigger_Normal*_Point));`;

const replacement = `      double c_curr=(c_posType==POSITION_TYPE_BUY)?SymbolInfoDouble(_Symbol,SYMBOL_BID):SymbolInfoDouble(_Symbol,SYMBOL_ASK);
      double actual_sl_pts = (c_posSL > 0) ? (MathAbs(c_posOpen - c_posSL) / _Point) : g_CachedSlPts;
      double trig_pct = (StringFind(c_comm, "Fibo") >= 0) ? InpBE_Trigger_Fibo : InpBE_Trigger_Normal;
      double dist_be = 0;
      if(c_posSL > 0) {
         double trig_price = (c_posType == POSITION_TYPE_BUY) ? (c_posOpen + (actual_sl_pts * trig_pct * _Point)) : (c_posOpen - (actual_sl_pts * trig_pct * _Point));
         dist_be = (c_posType == POSITION_TYPE_BUY) ? (trig_price - c_curr) : (c_curr - trig_price);
      }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: BreakEven HUD distance display fixed!');
} else {
  console.log('Target string not found.');
}
