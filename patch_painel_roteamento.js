const fs = require('fs');
const path = require('path');

console.log('=== ATUALIZANDO ATUALIZARPAINEL NO MQ5 ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

const targetStr = 'bool u_r2=InpUseFR, c_c2=g_CachedFrCdOk, c_l2=(g_CachedFRTop>0&&g_CachedFRFundo>0);';
const replaceStr = 'bool u_r2=IsFRAllowedForCurrentSymbol(), c_c2=g_CachedFrCdOk, c_l2=(g_CachedFRTop>0&&g_CachedFRFundo>0);\n   bool tem_flx_pos = TemPosicaoAbertaNoAtivoComPrefixo("Fluxo_");';

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  code = code.replace(
    'bool fr_all_ok=(!glb_blocked && !super_bloq_main && u_r2 && c_c2 && c_l2 && dir_lado_main_ok && confl_mg_main_ok);',
    'bool fr_all_ok=(!glb_blocked && !super_bloq_main && !tem_flx_pos && u_r2 && c_c2 && c_l2 && dir_lado_main_ok && confl_mg_main_ok);'
  );
  code = code.replace(
    'if(!u_r2) s_fr_req = "Requisitos: ✖ Estratégia Desativada";',
    'if(!InpUseFR) s_fr_req = "Requisitos: ✖ Estratégia Desativada";\n      else if(!u_r2) s_fr_req = "Requisitos: ✖ Bloqueado por Roteamento";\n      else if(tem_flx_pos) s_fr_req = "Requisitos: ✖ Posição Fluxo Ativa";'
  );
  fs.writeFileSync(mq5Path, code, 'utf8');
  console.log('✔ AtualizarPainel sincronizado com sucesso!');
} else {
  console.log('⚠ targetStr já atualizado ou não encontrado.');
}
