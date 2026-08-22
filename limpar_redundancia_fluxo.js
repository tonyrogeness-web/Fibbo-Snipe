const fs = require('fs');
const path = require('path');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(mq5Path, 'utf8');

const targetOld = `         g_FluxoParedeAtiva = (!parede_buy_ok || !parede_sell_ok);
         if(!is_lateral) {
            g_ReadyFluxo = (canal_high > 0 && ma_buy && rsi_buy_ok && parede_buy_ok && !exaustao_alta) || 
                           (canal_low > 0 && ma_sell && rsi_sell_ok && parede_sell_ok && !exaustao_baixa);
         } else {
            g_FluxoParedeAtiva = false;
            g_ReadyFluxo = false; // [BLINDAGEM CONSERVADORA] Standby total em mercado lateral (sem ruído)
         }
         if(!is_lateral) g_ReadyFluxo=(canal_high>0&&ma_buy&&rsi_buy_ok&&parede_buy_ok&&!exaustao_alta)||(canal_low>0&&ma_sell&&rsi_sell_ok&&parede_sell_ok&&!exaustao_baixa);
         else{g_FluxoParedeAtiva=false;g_ReadyFluxo=(canal_high>0&&(InpFluxo_UseExhaustion?g_CachedRSI>=p_FluxoRSI_OB:true))||(canal_low>0&&(InpFluxo_UseExhaustion?g_CachedRSI<=p_FluxoRSI_OS:true));}`;

const targetNew = `         g_FluxoParedeAtiva = (!parede_buy_ok || !parede_sell_ok);
         if(!is_lateral) {
            g_ReadyFluxo = (canal_high > 0 && ma_buy && rsi_buy_ok && parede_buy_ok && !exaustao_alta) || 
                           (canal_low > 0 && ma_sell && rsi_sell_ok && parede_sell_ok && !exaustao_baixa);
         } else {
            g_FluxoParedeAtiva = false;
            g_ReadyFluxo = false; // [BLINDAGEM CONSERVADORA] Standby total em mercado lateral (sem ruído)
         }`;

content = content.replace(targetOld, targetNew);
fs.writeFileSync(mq5Path, content, 'utf8');
console.log('✔ Limpeza de linhas redundantes do Fluxo concluída!');
