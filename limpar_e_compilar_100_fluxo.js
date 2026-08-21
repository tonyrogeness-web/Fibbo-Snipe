const fs = require('fs');
const path = require('path');

console.log('=== LIMPANDO RESTOS DE FIBO E RECONSTRUINDO FLUXO DRAWING ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Limpar linhas 295-303 (chaves órfãs)
code = code.replace(
`//===================================================================
// 4. DESENHO PRINCIPAL DAS LINHAS E CANAIS
//===================================================================

//+------------------------------------------------------------------+
//| [ROTEAMENTO INTELIGENTE] Verifica se Fibo é permitida no par     |
//+------------------------------------------------------------------+

   }
   return true; // Permitido Fibo + FR
}`,
`//===================================================================
// 4. DESENHO PRINCIPAL DAS LINHAS E CANAIS
//===================================================================`
);

// 2. Limpar d_mpos e fb_all_ok em DesenharLinhasChart
code = code.replace(
  'bool d_mpos = (g_FastNPos >= InpMaxSimultaneousOps || (g_NPosDay >= InpMaxDayTrades && g_NPosSwingFR >= InpMaxFRSwingTrades && g_NPosSwingFibo >= InpMaxFiboTrades));',
  'bool d_mpos = (g_FastNPos >= InpMaxSimultaneousOps || (g_NPosDay >= InpMaxDayTrades && g_NPosSwingFR >= InpMaxFRSwingTrades));'
);

code = code.replace(
`   // [SINCRONIA TOTAL] Fibo só é all_ok se ADX (Força H4) e Tendência H4 estiverem rigorosamente válidos
   bool fb_adx_ok   = p_UsePassaFiltroADXFibo ? (g_H4_ADX >= cfg_ADX_MinLevel) : true;
   int  t_h4_draw   = ComputeTrendDir(hShortEMA_H4, hEMA_H4);
   bool fb_trend_ok = (!p_UseTrendDirFibo || t_h4_draw == 1 || t_h4_draw == -1);
   bool fb_all_ok   = (!glb_blocked && IsFiboActiveForSymbol() && g_CachedFiboCdOk && 
                       (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0) &&
                       fb_adx_ok && fb_trend_ok);`,
`   // Status do Fluxo no gráfico
   bool is_flx_allowed = IsFluxoAllowedForCurrentSymbol();
   bool flx_all_ok = (!glb_blocked && is_flx_allowed && InpUseFluxo && !TemPosicaoAbertaNoAtivoComPrefixo("FR_") && g_CachedFluxoCdOk && g_CachedCanalHigh > 0 && g_CachedCanalLow > 0);`
);

// 3. Substituir todo o bloco de desenho da Fibo (linhas 2025 a 2133) pelas Linhas do FLUXO
const fiboDrawStart = code.indexOf('// --- FIBO (Estrutura Pura Ponto A -> B -> C');
const fiboDrawEnd = code.indexOf('// ZONAS VISUAIS (MODO ZEN SINCRO INTELIGENTE)');

if (fiboDrawStart !== -1 && fiboDrawEnd !== -1) {
  const fluxoDrawBlock = `// --- FLUXO INSTITUCIONAL L1 (CANAIS & MIRA LASER) ---
   bool show_fluxo_lines = is_flx_allowed && InpUseFluxo && g_ViewFluxo && draw_lines;
   double c_high = g_CachedCanalHigh, c_low = g_CachedCanalLow;
   if(show_fluxo_lines && c_high > 0 && c_low > 0) {
      color clr_flx_muted  = C'40,90,140';
      color clr_flx_active = C'0,180,255';
      string tf_flx_str = StringSubstr(EnumToString(g_TF_L1), 7);
      
      bool flx_high_hl = !is_zen && g_ReadyFluxo && (ask >= c_high - g_CachedATR * 0.2);
      bool flx_low_hl  = !is_zen && g_ReadyFluxo && (bid <= c_low + g_CachedATR * 0.2);
      
      DrawVisualLine("FLX_High", c_high, clr_flx_muted, clr_flx_active, "▲", "[FLUXO " + tf_flx_str + "] Romp. Alta", true, flx_high_hl);
      DrawVisualLine("FLX_Low",  c_low,  clr_flx_muted, clr_flx_active, "▼", "[FLUXO " + tf_flx_str + "] Romp. Baixa", true, flx_low_hl);
      
      // Mira Laser do Fluxo
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
      }
   } else {
      ObjectDelete(0, MG_PREFIX + "FLX_High"); ObjectDelete(0, MG_PREFIX + "FLX_Low");
      ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy"); ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy_LBL");
      ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell"); ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell_LBL");
   }

   `;
  code = code.slice(0, fiboDrawStart) + fluxoDrawBlock + code.slice(fiboDrawEnd);
  console.log('✔ Desenho de linhas da Fibo substituído pelas linhas do Fluxo.');
}

// 4. Limpar d_maxpos em AtualizarPainel e DesenharPainelDiag
code = code.replace(/bool\s+d_mpos\s*=\s*\(g_FastNPos>=InpMaxSimultaneousOps\s*\|\|\s*\(g_NPosDay>=InpMaxDayTrades\s*&&\s*g_NPosSwingFR>=InpMaxFRSwingTrades\s*&&\s*g_NPosSwingFibo>=InpMaxFiboTrades\)\);/g, 'bool d_mpos = (g_FastNPos>=InpMaxSimultaneousOps || (g_NPosDay>=InpMaxDayTrades && g_NPosSwingFR>=InpMaxFRSwingTrades));');
code = code.replace(/bool\s+d_maxpos\s*=\s*\(g_FastNPos>=InpMaxSimultaneousOps\s*\|\|\s*\(g_NPosDay>=InpMaxDayTrades\s*&&\s*g_NPosSwingFR>=InpMaxFRSwingTrades\s*&&\s*g_NPosSwingFibo>=InpMaxFiboTrades\)\);/g, 'bool d_maxpos = (g_FastNPos>=InpMaxSimultaneousOps || (g_NPosDay>=InpMaxDayTrades && g_NPosSwingFR>=InpMaxFRSwingTrades));');

// 5. Limpar qualquer resquício de block_fibo
code = code.replace(/bool\s+block_fibo\s*=\s*\(g_NPosSwingFibo\s*>=\s*InpMaxFiboTrades\);/g, '');

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 atualizado!');
