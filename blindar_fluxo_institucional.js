const fs = require('fs');
const path = require('path');

console.log('=== BLINDANDO MOTOR DE FLUXO PARA MÁXIMA ASSERTIVIDADE INSTITUCIONAL ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
const lines = fs.readFileSync(mq5Path, 'utf8').split('\n');

console.log(`Total de linhas originais: ${lines.length}`);

for (let i = 0; i < lines.length; i++) {
  // Ajusta g_ReadyFluxo para nunca ficar armado em mercado lateral
  if (lines[i].includes('g_FluxoParedeAtiva=(!parede_buy_ok||!parede_sell_ok);')) {
    console.log(`Encontrado g_ReadyFluxo na linha ${i+1}`);
    lines[i] = '         g_FluxoParedeAtiva = (!parede_buy_ok || !parede_sell_ok);\n' +
               '         if(!is_lateral) {\n' +
               '            g_ReadyFluxo = (canal_high > 0 && ma_buy && rsi_buy_ok && parede_buy_ok && !exaustao_alta) || \n' +
               '                           (canal_low > 0 && ma_sell && rsi_sell_ok && parede_sell_ok && !exaustao_baixa);\n' +
               '         } else {\n' +
               '            g_FluxoParedeAtiva = false;\n' +
               '            g_ReadyFluxo = false; // [BLINDAGEM CONSERVADORA] Standby total em mercado lateral (sem ruído)\n' +
               '         }';
  }
}

// Remove o bloco de reversão lateral (linhas 3992-3998 antigas)
let blockStart = -1;
let blockEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('bool rev_venda_ok=InpFluxo_UseExhaustion?(g_CachedRSI>=p_FluxoRSI_OB):true')) {
    blockStart = i - 1; // pega o "} else {"
  }
  if (blockStart !== -1 && lines[i].includes('if(canal_low>0&&iLow(_Symbol,g_TF_L1,1)<canal_low')) {
    blockEnd = i + 1; // fecha a chave do else
    break;
  }
}

if (blockStart !== -1 && blockEnd !== -1) {
  console.log(`Removendo sub-modo de reversão lateral das linhas ${blockStart+1} a ${blockEnd+1}`);
  lines.splice(blockStart, blockEnd - blockStart + 1, '         }');
}

fs.writeFileSync(mq5Path, lines.join('\n'), 'utf8');
console.log('✔ Motor 1 (Fluxo) blindado com sucesso no Fibbo_Sniper_v28.5_H2.mq5!');
