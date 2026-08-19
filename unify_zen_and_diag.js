const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== UNIFICANDO FORMATAÇÃO VISUAL (FR & FIBO) E ADICIONANDO VELA H4 NO DIAGNÓSTICO ===\n');

// 1. ATUALIZAR DIAGNÓSTICO (BOX DE REQUISITOS FIBO)
const oldDiagFibo = `      DROW_DYN("Uso Estratégia",u_b?"sim":"OFF",!u_b)DROW_DYN("Cooldown Fibo",c_c?"livre":"AGUARDAR",!c_c)DROW_DYN("Cálculo Níveis H4",c_l?"sim":"NÃO",!c_l)DROW_DYN("Tendência Macro H4",c_t?"alinhado":"NEUTRO",!c_t)DROW_DYN("Força H4 (ADX="+DoubleToString(g_H4_ADX,1)+")",c_a?"ok":"FRACO",!c_a)`;

const newDiagFibo = `      datetime cb_h4_diag = iTime(_Symbol, PERIOD_H4, 0);
      int cd_sec_diag = InpFR_CooldownMinutes * 60;
      bool c_cd_time = (t_h4 == 1) ? (cd_sec_diag <= 0 || (TimeCurrent() - l_fibo_buy_ts >= cd_sec_diag)) : ((t_h4 == -1) ? (cd_sec_diag <= 0 || (TimeCurrent() - l_fibo_sell_ts >= cd_sec_diag)) : true);
      bool c_bar_ok  = (t_h4 == 1) ? (cb_h4_diag != f_h4_buy && c_cd_time) : ((t_h4 == -1) ? (cb_h4_diag != f_h4_sell && c_cd_time) : (cb_h4_diag != f_h4_buy && cb_h4_diag != f_h4_sell && c_cd_time));

      DROW_DYN("Uso Estratégia",u_b?"sim":"OFF",!u_b)
      DROW_DYN("Vela H4 Atual",c_bar_ok?"LIVRE":"JÁ OPERADA",!c_bar_ok)
      DROW_DYN("Cálculo Níveis H4",c_l?"sim":"NÃO",!c_l)
      DROW_DYN("Tendência Macro H4",c_t?"alinhado":"NEUTRO",!c_t)
      DROW_DYN("Força H4 (ADX="+DoubleToString(g_H4_ADX,1)+")",c_a?"ok":"FRACO",!c_a)`;

if (code.includes(oldDiagFibo)) {
  code = code.replace(oldDiagFibo, newDiagFibo);
  console.log('✔ [1/3] Box de Requisitos Fibo atualizado com status da Vela H4 (LIVRE / JÁ OPERADA)!');
} else {
  console.log('❌ [1/3] oldDiagFibo não encontrado');
}

// 2. CORRIGIR DESENHO DE LINHAS CHART (NUNCA SUMIR, FICAR PONTILHADA PADRÃO)
const oldDrawLinesFibo = `      // [TRAVA DE COOLDOWN E BARRA H4]: Se a vela atual de H4 já foi operada, apaga a linha para evitar reentradas visuais
      datetime cb_h4_now = iTime(_Symbol, PERIOD_H4, 0);
      int cd_sec_draw = InpFR_CooldownMinutes * 60;
      bool fb_cd_time_buy  = (cd_sec_draw <= 0 || (TimeCurrent() - l_fibo_buy_ts >= cd_sec_draw));
      bool fb_cd_time_sell = (cd_sec_draw <= 0 || (TimeCurrent() - l_fibo_sell_ts >= cd_sec_draw));

      // [DIRECIONAL ESTRITO ANTI-POLUIÇÃO]
      // Em Baixa: mostra APENAS VENDA (se não foi operada). Em Alta: mostra APENAS COMPRA (se não foi operada).
      bool fb_dir_sell = ((t_dir == -1) || (t_dir == 0 && ask > (g_CachedFiboLow + range * 0.5))) && (cb_h4_now != f_h4_sell) && fb_cd_time_sell;
      bool fb_dir_buy  = ((t_dir == 1)  || (t_dir == 0 && bid < (g_CachedFiboLow + range * 0.5))) && (cb_h4_now != f_h4_buy)  && fb_cd_time_buy;`;

const newDrawLinesFibo = `      datetime cb_h4_now = iTime(_Symbol, PERIOD_H4, 0);
      int cd_sec_draw = InpFR_CooldownMinutes * 60;
      bool fb_cd_time_buy  = (cd_sec_draw <= 0 || (TimeCurrent() - l_fibo_buy_ts >= cd_sec_draw));
      bool fb_cd_time_sell = (cd_sec_draw <= 0 || (TimeCurrent() - l_fibo_sell_ts >= cd_sec_draw));
      bool fb_bar_buy_ok   = (cb_h4_now != f_h4_buy && fb_cd_time_buy);
      bool fb_bar_sell_ok  = (cb_h4_now != f_h4_sell && fb_cd_time_sell);

      // [DIRECIONAL ESTRITO]: Em Baixa mostra Venda, em Alta mostra Compra (linhas sempre visíveis pontilhadas)
      bool fb_dir_sell = ((t_dir == -1) || (t_dir == 0 && ask > (g_CachedFiboLow + range * 0.5)));
      bool fb_dir_buy  = ((t_dir == 1)  || (t_dir == 0 && bid < (g_CachedFiboLow + range * 0.5)));`;

if (code.includes(oldDrawLinesFibo)) {
  code = code.replace(oldDrawLinesFibo, newDrawLinesFibo);
  console.log('✔ [2/3] Linhas da Fibo restauradas para sempre exibirem no formato padrão pontilhado!');
} else {
  console.log('❌ [2/3] oldDrawLinesFibo não encontrado');
}

// 3. CORRIGIR MODO ZEN (FR E FIBO COM CORES PRÓPRIAS E SEMPRE PADRONIZADOS)
const oldZen = `      if(fr_zen_show) {
         DrawVisualZoneRect("FR_Top", 0, 0, clrNONE, false);
         DrawVisualZoneRect("FR_Bot", 0, 0, clrNONE, false);
         DrawVisualSegment("FR_TxtT", t_col_fr, t_col_fr, g_CachedFRTop - mag_tol, C'190,80,80', "▼ V FR", true, t_col_fr, g_ReadyFR ? C'80,185,120' : C'190,80,80');
         DrawVisualSegment("FR_TxtB", t_col_fr, t_col_fr, g_CachedFRFundo + mag_tol, C'190,80,80', "▲ C FR", true, t_col_fr, g_ReadyFR ? C'80,185,120' : C'190,80,80');
      }`;

const newZen = `      string tf_fr_zen = StringSubstr(EnumToString(g_TF_L1), 7);
      if(fr_zen_show) {
         DrawVisualZoneRect("FR_Top", 0, 0, clrNONE, false);
         DrawVisualZoneRect("FR_Bot", 0, 0, clrNONE, false);
         DrawVisualSegment("FR_TxtT", t_col_fr, t_col_fr, g_CachedFRTop - mag_tol, C'140,55,55', "▼ [FR " + tf_fr_zen + "] Topo", true, t_col_fr, g_ReadyFR ? C'235,75,75' : C'140,55,55');
         DrawVisualSegment("FR_TxtB", t_col_fr, t_col_fr, g_CachedFRFundo + mag_tol, C'140,55,55', "▲ [FR " + tf_fr_zen + "] Fundo", true, t_col_fr, g_ReadyFR ? C'235,75,75' : C'140,55,55');
      }`;

if (code.includes(oldZen)) {
  code = code.replace(oldZen, newZen);
  console.log('✔ [3/3] Nomes e cores do Modo ZEN do FR padronizados em Vermelho institucional!');
} else {
  console.log('❌ [3/3] oldZen não encontrado');
}

// 4. CORRIGIR CORES ZEN FIBO (DOURADO PURO, NUNCA VERDE)
const oldZenFiboCores = `C'80,185,120' : C'255,193,7'`;
if (code.includes(oldZenFiboCores)) {
  code = code.split(oldZenFiboCores).join(`C'240,185,45' : C'140,110,35'`);
  console.log('✔ Cores ZEN da Fibo ajustadas para Amarelo Dourado Ouro!');
}

const oldZenFiboCores2 = `C'80,185,120' : C'255,160,0'`;
if (code.includes(oldZenFiboCores2)) {
  code = code.split(oldZenFiboCores2).join(`C'240,185,45' : C'140,110,35'`);
}

const oldZenFiboCores3 = `C'80,185,120' : C'230,130,20'`;
if (code.includes(oldZenFiboCores3)) {
  code = code.split(oldZenFiboCores3).join(`C'240,185,45' : C'140,110,35'`);
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
