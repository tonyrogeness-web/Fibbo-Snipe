const fs = require('fs');
const path = require('path');

console.log('=== CORRIGINDO TODOS OS PONTOS DE COMPILAÇÃO ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Corrigir linhas 290 a 305
const oldHeader = `//===================================================================
// 4. DESENHO PRINCIPAL DAS LINHAS E CANAIS
//===================================================================

//+------------------------------------------------------------------+
//| [ROTEAMENTO INTELIGENTE] Verifica se Fibo é permitida no par     |
//+------------------------------------------------------------------+

   }
   return true; // Permitido Fibo + FR
}`;

code = code.replace(oldHeader, `//===================================================================
// 4. DESENHO PRINCIPAL DAS LINHAS E CANAIS
//===================================================================`);

// Também se sobrou chaves soltas:
code = code.replace(/\n\s*\}\s*\n\s*return true; \/\/ Permitido Fibo \+ FR\s*\n\}/g, '');

// 2. Corrigir fb_all_ok e declarações em DesenharLinhasChart
code = code.replace(/bool fb_all_ok\s*=\s*\(!glb_blocked && IsFiboActiveForSymbol\(\)[^;]+;/g, '');
code = code.replace(/bool fb_adx_ok\s*=[^;]+;/g, '');
code = code.replace(/int\s+t_h4_draw\s*=[^;]+;/g, '');
code = code.replace(/bool fb_trend_ok\s*=[^;]+;/g, '');

// 3. Corrigir desenho das linhas de FLUXO usando DrawVisualLine (como o FR faz)
const oldFluxoDraw = `      // Mira Laser do Fluxo
      if(g_ReadyFluxo && !is_zen && g_FastNPosSymbol == 0) {
         datetime c_t_l1 = iTime(_Symbol, g_TF_L1, 0);
         datetime c_next = c_t_l1 + PeriodSeconds(g_TF_L1);
         int sec_left = (int)(c_next - TimeCurrent());
         if(sec_left < 0) sec_left = 0;
         string s_cd = StringFormat("(Fecha em %02dm %02ds)", sec_left / 60, sec_left % 60);
         
         if(flx_high_hl) {
            MG_HLine("FLX_Trig_Buy", c_high, C'0,255,136', STYLE_DOT, 1, "⚡ Gatilho Compra Fluxo", C'0,255,136');
            MG_Text("FLX_Trig_Buy_LBL", c_next, c_high, "⚡ GATILHO COMPRA FLUXO " + s_cd, C'0,255,136', 8, ANCHOR_LEFT_LOWER);
         } else {
            ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy");
            ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy_LBL");
         }
         
         if(flx_low_hl) {
            MG_HLine("FLX_Trig_Sell", c_low, C'0,255,136', STYLE_DOT, 1, "⚡ Gatilho Venda Fluxo", C'0,255,136');
            MG_Text("FLX_Trig_Sell_LBL", c_next, c_low, "⚡ GATILHO VENDA FLUXO " + s_cd, C'0,255,136', 8, ANCHOR_LEFT_UPPER);
         } else {
            ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell");
            ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell_LBL");
         }
      } else {
         ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy"); ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy_LBL");
         ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell"); ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell_LBL");
      }`;

const newFluxoDraw = `      // Mira Laser do Fluxo
      datetime c_t_l1 = iTime(_Symbol, g_TF_L1, 0);
      int sec_left = (int)((c_t_l1 + PeriodSeconds(g_TF_L1)) - TimeCurrent());
      if(sec_left < 0) sec_left = 0;
      string s_cd = StringFormat("(Fecha em %02dm %02ds)", sec_left / 60, sec_left % 60);
      
      bool show_trig_flx_buy  = (flx_high_hl && !is_zen && draw_lines && g_FastNPosSymbol == 0);
      bool show_trig_flx_sell = (flx_low_hl  && !is_zen && draw_lines && g_FastNPosSymbol == 0);
      
      string lbl_gat_flx_c = "⚡ GATILHO COMPRA FLUXO " + s_cd;
      string lbl_gat_flx_v = "⚡ GATILHO VENDA FLUXO " + s_cd;
      color clr_trig_flx = C'0,230,118';
      
      DrawVisualLine("FLX_Gat_C", c_high, clr_trig_flx, clr_trig_flx, lbl_gat_flx_c, lbl_gat_flx_c, show_trig_flx_buy,  false, ANCHOR_LEFT_LOWER);
      DrawVisualLine("FLX_Gat_V", c_low,  clr_trig_flx, clr_trig_flx, lbl_gat_flx_v, lbl_gat_flx_v, show_trig_flx_sell, false, ANCHOR_LEFT_UPPER);`;

if (code.includes('MG_Text("FLX_Trig_Buy_LBL"')) {
  code = code.replace(oldFluxoDraw, newFluxoDraw);
  code = code.replace('ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy"); ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy_LBL");\n      ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell"); ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell_LBL");',
                      'DrawVisualLine("FLX_Gat_C", 0, clrNONE, clrNONE, "", "", false, false);\n      DrawVisualLine("FLX_Gat_V", 0, clrNONE, clrNONE, "", "", false, false);');
}

// 4. Limpar d_maxpos / InpMaxFiboTrades em qualquer linha
code = code.replace(/&&\s*g_NPosSwingFibo\s*>=\s*InpMaxFiboTrades/g, '');
code = code.replace(/InpMaxFiboTrades/g, '1');

// 5. Limpar linhas antigas de Fibo no painel
code = code.replace(/bool fb_line_solid\s*=[^;]+;/g, '');
code = code.replace(/bool is_ready_fb\s*=[^;]+;/g, '');

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ mq5 corrigido!');
