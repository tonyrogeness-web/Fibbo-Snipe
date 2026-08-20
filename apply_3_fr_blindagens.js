const fs = require('fs');
const path = require('path');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO AS 3 BLINDAGENS INSTITUCIONAIS DO FR (V28.6 PRO) ===\n');

// 1. Inserir Novos Inputs no grupo Falso Rompimento
const oldInputs = `input bool InpFR_ZoneCooldown = true;
input int  InpFR_CooldownMinutes = 30; // [R3] Min. entre entradas FR no mesmo nível (0=sem cooldown)`;

const newInputs = `input bool InpFR_ZoneCooldown = true;
input int  InpFR_CooldownMinutes = 30; // [R3] Min. entre entradas FR no mesmo nível (0=sem cooldown)
input bool   InpFR_BlockAgainstSuperTrend = true; // [BLINDAGEM 1] Bloqueio contra Super-Tendência (ADX H4 > 30)
input double InpFR_SuperTrend_ADX         = 30.0; // Nível ADX para bloquear contra-tendência
input bool   InpFR_RequireMinWick40       = true; // [BLINDAGEM 2] Pavio de Rejeição Institucional de 40%
input double InpFR_MinWickRatioPct        = 40.0; // Pavio mínimo da vela de rejeição (% do range)
input bool   InpFR_UseMidChannelLock      = true; // [BLINDAGEM 3] Trava de Lucro Dinâmico no Meio do Canal (50%)`;

if (code.includes(oldInputs)) {
  code = code.replace(oldInputs, newInputs);
  console.log('✔ Novos inputs das 3 Blindagens inseridos com sucesso!');
} else {
  console.log('❌ oldInputs não encontrado');
}

// 2. Blindagem 2: Pavio de 40% em IsVelaReversaoVenda e IsVelaReversaoCompra
const oldVelaVenda = `   // [PILAR 1] Fechamento no 1/3 extremo inferior (Sniper)
   if(InpFR_RequireQuadrantClose) {
      double max_close = l + (range * (InpFR_CloseQuadrantPct / 100.0));
      if(c > max_close) return false;
   }
   return true;`;

const newVelaVenda = `   // [BLINDAGEM 2] Pavio Mínimo Institucional de 40% (Rejeição Bancária Real)
   if(InpFR_RequireMinWick40 && range > 0) {
      if((wick_top / range * 100.0) < InpFR_MinWickRatioPct) return false;
   }
   // [PILAR 1] Fechamento no 1/3 extremo inferior (Sniper)
   if(InpFR_RequireQuadrantClose) {
      double max_close = l + (range * (InpFR_CloseQuadrantPct / 100.0));
      if(c > max_close) return false;
   }
   return true;`;

if (code.includes(oldVelaVenda)) {
  code = code.replace(oldVelaVenda, newVelaVenda);
  console.log('✔ Blindagem 2 aplicada em IsVelaReversaoVenda!');
} else {
  console.log('❌ oldVelaVenda não encontrado');
}

const oldVelaCompra = `   // [PILAR 1] Fechamento no 1/3 extremo superior (Sniper)
   if(InpFR_RequireQuadrantClose) {
      double min_close = h - (range * (InpFR_CloseQuadrantPct / 100.0));
      if(c < min_close) return false;
   }
   return true;`;

const newVelaCompra = `   // [BLINDAGEM 2] Pavio Mínimo Institucional de 40% (Rejeição Bancária Real)
   if(InpFR_RequireMinWick40 && range > 0) {
      if((wick_bot / range * 100.0) < InpFR_MinWickRatioPct) return false;
   }
   // [PILAR 1] Fechamento no 1/3 extremo superior (Sniper)
   if(InpFR_RequireQuadrantClose) {
      double min_close = h - (range * (InpFR_CloseQuadrantPct / 100.0));
      if(c < min_close) return false;
   }
   return true;`;

if (code.includes(oldVelaCompra)) {
  code = code.replace(oldVelaCompra, newVelaCompra);
  console.log('✔ Blindagem 2 aplicada em IsVelaReversaoCompra!');
} else {
  console.log('❌ oldVelaCompra não encontrado');
}

// 3. Blindagem 1: Trava Anti-Super-Tendência em VerificarSinalFR_L1 e L2
const oldConflL2 = `         // [CONFLUENCIA] Filtro direcional para FR L2
         if(g_ModoConfluencia > 0) {
             if(!g_MG_SellAllowed) fr2_cd_sell = false;
             if(!g_MG_BuyAllowed) fr2_cd_buy = false;
         }`;

const newConflL2 = `         // [CONFLUENCIA] Filtro direcional para FR L2
         if(g_ModoConfluencia > 0) {
             if(!g_MG_SellAllowed) fr2_cd_sell = false;
             if(!g_MG_BuyAllowed) fr2_cd_buy = false;
         }

         // [BLINDAGEM 1] Trava Anti-Super-Tendência L2 (Bloqueia contra rali direcional ADX > 30)
         if(InpFR_BlockAgainstSuperTrend && (l2_adx >= InpFR_SuperTrend_ADX || g_CachedADX_H4 >= InpFR_SuperTrend_ADX)) {
             double e200_l2 = (g_MG_EMA200 > 0) ? g_MG_EMA200 : (g_MG_hEMA200 != INVALID_HANDLE ? g_MG_EMA200 : 0);
             if(e200_l2 > 0) {
                if(bid > e200_l2) { fr2_cd_sell = false; m_sell = false; } // Super-Alta: Proibido vender topo
                if(ask < e200_l2) { fr2_cd_buy  = false; m_buy  = false; } // Super-Baixa: Proibido comprar fundo
             }
         }`;

if (code.includes(oldConflL2)) {
  code = code.replace(oldConflL2, newConflL2);
  console.log('✔ Blindagem 1 aplicada em VerificarSinalFR_L2!');
} else {
  console.log('❌ oldConflL2 não encontrado');
}

// 4. Blindagem 3: Mid-Channel 50% Profit Lock em OnTick()
const oldTrailBlock = `         if(!be_triggered&&InpUseTrailStop&&g_CachedATR>0){`;

const newTrailBlock = `         // [BLINDAGEM 3] Trava de Lucro Dinâmico no Meio do Canal (Mid-Channel 50% Lock)
         if(InpFR_UseMidChannelLock && StringFind(c_comm, "FR_") >= 0 && posTP > 0) {
            double total_tp_dist = MathAbs(posTP - posOpen);
            if(total_tp_dist > stops_level * 2.0) {
               if(posType == POSITION_TYPE_BUY && curr_bid >= (posOpen + total_tp_dist * 0.50)) {
                  double lock_sl = posOpen + (total_tp_dist * 0.25);
                  if(posSL < (lock_sl - _Point * 2) && curr_bid >= (lock_sl + stops_level)) {
                     double nsl = NormalizeDouble(lock_sl, _Digits);
                     if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Compra SL travado em +25%% do canal (%.5f).", nsl));
                     }
                  }
               }
               else if(posType == POSITION_TYPE_SELL && curr_ask <= (posOpen - total_tp_dist * 0.50)) {
                  double lock_sl = posOpen - (total_tp_dist * 0.25);
                  if(posSL > (lock_sl + _Point * 2) && curr_ask <= (lock_sl - stops_level)) {
                     double nsl = NormalizeDouble(lock_sl, _Digits);
                     if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Venda SL travado em +25%% do canal (%.5f).", nsl));
                     }
                  }
               }
            }
         }

         if(!be_triggered&&InpUseTrailStop&&g_CachedATR>0){`;

if (code.includes(oldTrailBlock)) {
  code = code.replace(oldTrailBlock, newTrailBlock);
  console.log('✔ Blindagem 3 (Mid-Channel Lock) aplicada em OnTick()!');
} else {
  console.log('❌ oldTrailBlock não encontrado');
}

// 5. Atualizar Requisitos do Painel (HUD)
const oldReqHud = `      else if(!confl_mg_main_ok) s_fr_req = StringFormat("Requisitos: ✖ MktGlance Bloq. (%s)", perto_topo_main ? "Exige Venda" : "Exige Compra");`;

const newReqHud = `      else if(InpFR_BlockAgainstSuperTrend && g_H4_ADX >= InpFR_SuperTrend_ADX && ((perto_topo_main && ask_curr_main > g_MG_EMA200 && g_MG_EMA200 > 0) || (!perto_topo_main && bid_curr_main < g_MG_EMA200 && g_MG_EMA200 > 0)))
         s_fr_req = StringFormat("Requisitos: ✖ Super-Tendência (%s)", perto_topo_main ? "Alta ADX>30" : "Baixa ADX>30");
      else if(!confl_mg_main_ok) s_fr_req = StringFormat("Requisitos: ✖ MktGlance Bloq. (%s)", perto_topo_main ? "Exige Venda" : "Exige Compra");`;

if (code.includes(oldReqHud)) {
  code = code.replace(oldReqHud, newReqHud);
  console.log('✔ Requisitos do Painel HUD atualizados com a Blindagem Anti-Super-Tendência!');
} else {
  console.log('❌ oldReqHud não encontrado');
}

// Salvar código
fs.writeFileSync(file, code);

// Sincronizar com as pastas de Experts do MT5
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

// Regenerar todos os arquivos .SET com as novas entradas
const setEntries = [];
setEntries.push("InpPerfil=1||0||0||0||N");

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if (line.startsWith('input ') && !line.startsWith('input group') && !line.includes('InpPerfil')) {
    let raw = line.substring(6).trim();
    if (raw.includes('//')) raw = raw.split('//')[0].trim();
    if (raw.endsWith(';')) raw = raw.slice(0, -1).trim();

    const firstSpace = raw.indexOf(' ');
    if (firstSpace > 0) {
      const rest = raw.substring(firstSpace).trim();
      const parts = rest.split(',');
      parts.forEach(p => {
        const eq = p.split('=');
        if (eq.length === 2) {
          const name = eq[0].trim();
          let val = eq[1].trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
          }
          if (val === 'PERFIL_CONSERVADOR') val = '0';
          else if (val === 'PERFIL_MODERADO') val = '1';
          else if (val === 'PERFIL_AGRESSIVO') val = '2';
          
          setEntries.push(name + '=' + val + '||0||0||0||N');
        }
      });
    }
  }
}

const setContent = '\ufeff' + setEntries.join('\r\n') + '\r\n';
const setBuffer = Buffer.from(setContent, 'utf16le');

const setPaths = [
  'Fibbo_Sniper_v28.5_H2.set',
  'Fibbo_High_Precision_Dual_Engine.set',
  'Cenario_3_H2_Maior_Lucro.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Presets\\Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Presets\\Fibbo_Sniper_v28.5_H2.set'
];

setPaths.forEach(p => {
  try {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, setBuffer);
    console.log('✔ .SET gravado em:', p);
  } catch (err) {
    console.log('Erro ao salvar em:', p, err.message);
  }
});

console.log('\n=== AS 3 BLINDAGENS FORAM APLICADAS E SINCRONIZADAS COM SUCESSO! ===');
