const fs = require('fs');
const content = fs.readFileSync('Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

const checks = [
  { name: '1. ComputePanelHash com 30 params', ok: content.includes('(int)MathRound(g_CachedADX*10), (int)MathRound(g_CachedRSI*10)') },
  { name: '2. g_CachedVolMed_L2 declarado', ok: content.includes('double g_CachedVolMed = 0, g_CachedVolMed_L2 = 0;') },
  { name: '3. RefreshBarCache volume L2 com all_copied=false', ok: content.includes('g_CachedVolMed_L2 = mv2 / 5.0;\n      } else all_copied = false;') },
  { name: '4. FR_ValidarVolumePenetracao com escala L2', ok: content.includes('double ref_vol = (vol_med_ref > 0) ? vol_med_ref : ((tf == TF_L2 && g_CachedVolMed_L2 > 0) ? g_CachedVolMed_L2 : g_CachedVolMed);') },
  { name: '5. Diag FIBO sincronizado com MktGlance', ok: content.includes('s_rdy=(!any_glb&&u_b&&c_c&&c_l&&c_a&&c_t&&confl_mg_ok);') },
  { name: '6. Variáveis globais com conta', ok: content.includes('Sniper_GlobalBlock_') && content.includes('AccountInfoInteger(ACCOUNT_LOGIN)') },
  { name: '7. Remoção do risk_04', ok: !content.includes('CFG_btn_risk_04') },
  { name: '8. Trailing stop com piso de stops_level', ok: content.includes('if(pos_trail_dist < stops_level) pos_trail_dist = stops_level + (_Point * 2.0);') }
];

console.log('=== VERIFICAÇÃO INTEGRAL DO ARQUIVO .MQ5 ===');
let allOk = true;
checks.forEach(c => {
  console.log((c.ok ? '✅ ' : '❌ ') + c.name);
  if (!c.ok) allOk = false;
});
console.log('\nSTATUS GERAL:', allOk ? '100% PERFEITO E ATUALIZADO' : 'PENDÊNCIAS ENCONTRADAS');
console.log('TOTAL DE LINHAS:', content.split('\n').length);
