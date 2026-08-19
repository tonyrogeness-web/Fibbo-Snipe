const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== ATUALIZANDO SINCRONISMO DE COOLDOWN E TRAVA DE BARRA (APAGAR LINHA APÓS TRADE) ===\n');

// 1. DESENHAR LINHAS CHART
const oldDrawBar = `      // [DIRECIONAL ESTRITO ANTI-POLUIÇÃO]
      // Em Baixa: mostra APENAS VENDA (nunca compra). Em Alta: mostra APENAS COMPRA (nunca venda).
      bool fb_dir_sell = (t_dir == -1) || (t_dir == 0 && ask > (g_CachedFiboLow + range * 0.5));
      bool fb_dir_buy  = (t_dir == 1)  || (t_dir == 0 && bid < (g_CachedFiboLow + range * 0.5));`;

const newDrawBar = `      // [TRAVA DE COOLDOWN E BARRA H4]: Se a vela atual de H4 já foi operada, apaga a linha para evitar reentradas visuais
      datetime cb_h4_now = iTime(_Symbol, PERIOD_H4, 0);
      int cd_sec_draw = InpFR_CooldownMinutes * 60;
      bool fb_cd_time_buy  = (cd_sec_draw <= 0 || (TimeCurrent() - l_fibo_buy_ts >= cd_sec_draw));
      bool fb_cd_time_sell = (cd_sec_draw <= 0 || (TimeCurrent() - l_fibo_sell_ts >= cd_sec_draw));

      // [DIRECIONAL ESTRITO ANTI-POLUIÇÃO]
      // Em Baixa: mostra APENAS VENDA (se não foi operada). Em Alta: mostra APENAS COMPRA (se não foi operada).
      bool fb_dir_sell = ((t_dir == -1) || (t_dir == 0 && ask > (g_CachedFiboLow + range * 0.5))) && (cb_h4_now != f_h4_sell) && fb_cd_time_sell;
      bool fb_dir_buy  = ((t_dir == 1)  || (t_dir == 0 && bid < (g_CachedFiboLow + range * 0.5))) && (cb_h4_now != f_h4_buy)  && fb_cd_time_buy;`;

if (code.includes(oldDrawBar)) {
  code = code.replace(oldDrawBar, newDrawBar);
  console.log('✔ [1/2] Desenho de Linhas sincronizado com trava de barra e cooldown pós-trade!');
} else {
  console.log('❌ [1/2] oldDrawBar não encontrado');
}

// 2. ATUALIZAR PAINEL HUD (CARD FIBO)
const oldPanelBar = `      bool fb_all_ok = (!glb_blocked && IsFiboActiveForSymbol() && fb_cd && 
                        (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0) &&
                        fb_adx_chk && fb_trend_chk && fb_confl_chk);`;

const newPanelBar = `      datetime cb_h4_card = iTime(_Symbol, PERIOD_H4, 0);
      int cd_sec_card = InpFR_CooldownMinutes * 60;
      bool fb_cd_time_b = (cd_sec_card <= 0 || (TimeCurrent() - l_fibo_buy_ts >= cd_sec_card));
      bool fb_cd_time_s = (cd_sec_card <= 0 || (TimeCurrent() - l_fibo_sell_ts >= cd_sec_card));
      bool fb_bar_ok    = (tDir == 1) ? (cb_h4_card != f_h4_buy && fb_cd_time_b) : ((tDir == -1) ? (cb_h4_card != f_h4_sell && fb_cd_time_s) : ((cb_h4_card != f_h4_buy && fb_cd_time_b) || (cb_h4_card != f_h4_sell && fb_cd_time_s)));

      bool fb_all_ok = (!glb_blocked && IsFiboActiveForSymbol() && fb_cd && fb_bar_ok && 
                        (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0) &&
                        fb_adx_chk && fb_trend_chk && fb_confl_chk);`;

if (code.includes(oldPanelBar)) {
  code = code.replace(oldPanelBar, newPanelBar);
  console.log('✔ [2/2] Card FIBO do Painel HUD sincronizado para apagar status ARMADO após fechamento do trade!');
} else {
  console.log('❌ [2/2] oldPanelBar não encontrado');
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

console.log('\n✔ ' + file + ' salvo e sincronizado com sucesso!');
