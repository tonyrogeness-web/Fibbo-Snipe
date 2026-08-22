const fs = require('fs');
const path = require('path');

console.log('=== APLICANDO CORREÇÕES DEFINITIVAS LINHA POR LINHA ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
const lines = fs.readFileSync(mq5Path, 'utf8').split('\n');

console.log(`Linhas totais antes: ${lines.length}`);

// 1. Remover o código duplicado de g_ReadyFluxo (linhas 3985-3986)
for (let i = 3970; i < 4000 && i < lines.length; i++) {
  if (lines[i].includes('if(!is_lateral) g_ReadyFluxo=(canal_high>0&&ma_buy&&rsi_buy_ok&&parede_buy_ok')) {
    console.log(`Removendo linha duplicada 1 na linha ${i+1}: ${lines[i]}`);
    lines.splice(i, 1);
    i--;
  } else if (lines[i].includes('else{g_FluxoParedeAtiva=false;g_ReadyFluxo=(canal_high>0&&(InpFluxo_UseExhaustion?g_CachedRSI>=p_FluxoRSI_OB:true))')) {
    console.log(`Removendo linha duplicada 2 na linha ${i+1}: ${lines[i]}`);
    lines.splice(i, 1);
    i--;
  }
}

// 2. Corrigir FR Direct L1 (eliminar duplicação com FR Normal)
for (let i = 4050; i < 4110 && i < lines.length; i++) {
  if (lines[i].includes('if(confl_s_ok && tc_sell && pen_dir_s && (iHigh(_Symbol,g_TF_L1,0)>pH')) {
    console.log(`Ajustando FR Direct Venda L1 na linha ${i+1}`);
    const indent = '                ';
    lines[i] = indent + 'bool tc_dir_s = (_fr_cd <= 0 || (TimeCurrent() - l1_fr_sell_ts) >= _fr_cd);\n' +
               indent + 'bool z_v_dir = z_v && !JaExistePosicaoDaEstrategia("FR_Venda_L1") && !JaExistePosicaoDaEstrategia("FR_Dir_V_L1");\n' +
               indent + 'if(confl_s_ok && tc_dir_s && pen_dir_s && (iHigh(_Symbol,g_TF_L1,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_sell&&z_v_dir&&dr_s_ok){';
  }
  if (lines[i].includes('if(confl_b_ok && tc_buy && pen_dir_b && (iLow(_Symbol,g_TF_L1,0)<pL')) {
    console.log(`Ajustando FR Direct Compra L1 na linha ${i+1}`);
    const indent = '                ';
    lines[i] = indent + 'bool tc_dir_b = (_fr_cd <= 0 || (TimeCurrent() - l1_fr_buy_ts) >= _fr_cd);\n' +
               indent + 'bool z_c_dir = z_c && !JaExistePosicaoDaEstrategia("FR_Compra_L1") && !JaExistePosicaoDaEstrategia("FR_Dir_C_L1");\n' +
               indent + 'if(confl_b_ok && tc_dir_b && pen_dir_b && (iLow(_Symbol,g_TF_L1,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_buy&&z_c_dir&&dr_b_ok){';
  }
}

// 3. Corrigir FR Direct L2 (eliminar duplicação com FR Normal L2)
for (let i = 4140; i < 4200 && i < lines.length; i++) {
  if (lines[i].includes('if(confl_l2_s_ok&&pen_dir_s_l2&&(iHigh(_Symbol,TF_L2,0)>pH')) {
    console.log(`Ajustando FR Direct Venda L2 na linha ${i+1}`);
    const indent = '             ';
    lines[i] = indent + 'bool tc_dir_s_l2 = (_fr_cd_l2 <= 0 || (TimeCurrent() - l2_fr_sell_ts) >= _fr_cd_l2);\n' +
               indent + 'bool z_v_dir_l2 = z_v && !JaExistePosicaoDaEstrategia("FR_Venda_L2") && !JaExistePosicaoDaEstrategia("FR_Dir_V_L2");\n' +
               indent + 'if(confl_l2_s_ok && pen_dir_s_l2 && tc_dir_s_l2 && (iHigh(_Symbol,TF_L2,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_sell&&z_v_dir_l2&&dr_s_ok&&fr2_cd_sell){';
  }
  if (lines[i].includes('if(confl_l2_b_ok&&pen_dir_b_l2&&(iLow(_Symbol,TF_L2,0)<pL')) {
    console.log(`Ajustando FR Direct Compra L2 na linha ${i+1}`);
    const indent = '             ';
    lines[i] = indent + 'bool tc_dir_b_l2 = (_fr_cd_l2 <= 0 || (TimeCurrent() - l2_fr_buy_ts) >= _fr_cd_l2);\n' +
               indent + 'bool z_c_dir_l2 = z_c && !JaExistePosicaoDaEstrategia("FR_Compra_L2") && !JaExistePosicaoDaEstrategia("FR_Dir_C_L2");\n' +
               indent + 'if(confl_l2_b_ok && pen_dir_b_l2 && tc_dir_b_l2 && (iLow(_Symbol,TF_L2,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_buy&&z_c_dir_l2&&dr_b_ok&&fr2_cd_buy){';
  }
}

fs.writeFileSync(mq5Path, lines.join('\n'), 'utf8');
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 atualizado diretamente!');
