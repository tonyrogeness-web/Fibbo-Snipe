const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== ADICIONANDO LINHA VISUAL DO BREAK EVEN NO GRÁFICO (AZUL ESCURO DISCRETO / PONTILHADO) ===\n');

const oldDrawOrdBlock = `      // TP
      if(tp>0){
         double dtp=MathAbs(tp-cpx)/_Point;
         double vtp=(ts>0&&tv>0)?(dtp*_Point/ts)*tv*lots:0;
         DrawOrdLine("T_"+tk, tp, C'28,170,112', t_lbl, "🎯 TAKE PROFIT | +" + DoubleToString(dtp,0) + " pts | +$" + DoubleToString(vtp,2) + " USD", STYLE_SOLID, 1);
      } else { ObjectDelete(0,ORD_LINE_PFX+"L_T_"+tk); ObjectDelete(0,ORD_LINE_PFX+"T_T_"+tk); }`;

const newDrawOrdBlock = `      // TP
      if(tp>0){
         double dtp=MathAbs(tp-cpx)/_Point;
         double vtp=(ts>0&&tv>0)?(dtp*_Point/ts)*tv*lots:0;
         DrawOrdLine("T_"+tk, tp, C'28,170,112', t_lbl, "🎯 TAKE PROFIT | +" + DoubleToString(dtp,0) + " pts | +$" + DoubleToString(vtp,2) + " USD", STYLE_SOLID, 1);
      } else { ObjectDelete(0,ORD_LINE_PFX+"L_T_"+tk); ObjectDelete(0,ORD_LINE_PFX+"T_T_"+tk); }

      // BREAK EVEN (Linha Visual Azul Escuro Discreto Pontilhada)
      if(InpUseBreakEven && sl > 0) {
         double trigPct = (StringFind(full_comm, "Fibo") >= 0) ? InpBE_Trigger_Fibo : InpBE_Trigger_Normal;
         double trigger = MathAbs(po - sl) * trigPct;
         double be_price = is_buy ? (po + trigger) : (po - trigger);
         bool be_pending = is_buy ? (sl < po) : (sl > po);
         
         if(be_pending && trigger > 0) {
            double d_be = MathAbs(be_price - cpx) / _Point;
            string lbl_be = "🛡️ GATILHO B.E. | +" + DoubleToString(d_be, 0) + " pts";
            DrawOrdLine("BE_"+tk, be_price, C'38,90,165', t_lbl, lbl_be, STYLE_DOT, 1);
         } else {
            ObjectDelete(0, ORD_LINE_PFX + "L_BE_" + tk);
            ObjectDelete(0, ORD_LINE_PFX + "T_BE_" + tk);
         }
      } else {
         ObjectDelete(0, ORD_LINE_PFX + "L_BE_" + tk);
         ObjectDelete(0, ORD_LINE_PFX + "T_BE_" + tk);
      }`;

if (code.includes(oldDrawOrdBlock)) {
  code = code.replace(oldDrawOrdBlock, newDrawOrdBlock);
  console.log('✔ Linha do Break Even adicionada em DesenharLinhasOrdens()!');
} else {
  console.log('❌ oldDrawOrdBlock não encontrado');
}

fs.writeFileSync(file, code);

// Sincroniza com as pastas de Experts do MT5
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

console.log('\n✔ Script executado com sucesso!');
