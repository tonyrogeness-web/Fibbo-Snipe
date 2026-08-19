const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO CORREÇÃO DEFINITIVA DE LINHAS ACESAS, CORES ZEN E HISTÓRICO ANTI-REABERTURA ===\n');

// 1. ADICIONAR FUNÇÃO RecuperarHistoricoFiboVela()
const funcRecuperar = `//===================================================================
// [ANTI-REABERTURA RECOMPILAÇÃO] RECUPERAÇÃO DE HISTÓRICO DA VELA ATUAL
//===================================================================
void RecuperarHistoricoFiboVela() {
   datetime agora = TimeCurrent();
   datetime bar_h4_open = iTime(_Symbol, PERIOD_H4, 0);
   if(bar_h4_open <= 0) return;
   if(HistorySelect(bar_h4_open, agora)) {
      int total_deals = HistoryDealsTotal();
      for(int i = 0; i < total_deals; i++) {
         ulong ticket = HistoryDealGetTicket(i);
         if(ticket > 0) {
            long magic = HistoryDealGetInteger(ticket, DEAL_MAGIC);
            string sym = HistoryDealGetString(ticket, DEAL_SYMBOL);
            long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
            string comm = HistoryDealGetString(ticket, DEAL_COMMENT);
            datetime d_time = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
            
            if(magic == InpMagic && sym == _Symbol && (entry == DEAL_ENTRY_IN || entry == DEAL_ENTRY_OUT)) {
               if(StringFind(comm, "Fibo_Buy") >= 0 || StringFind(comm, "Fibo_C") >= 0) {
                  f_h4_buy = bar_h4_open;
                  l_fibo_buy_ts = d_time;
               }
               if(StringFind(comm, "Fibo_Sell") >= 0 || StringFind(comm, "Fibo_V") >= 0) {
                  f_h4_sell = bar_h4_open;
                  l_fibo_sell_ts = d_time;
               }
            }
         }
      }
   }
}

`;

if (!code.includes('RecuperarHistoricoFiboVela()')) {
  code = code.replace('void DesenharLinhasChart() {', funcRecuperar + 'void DesenharLinhasChart() {');
  console.log('✔ Função RecuperarHistoricoFiboVela() adicionada com sucesso!');
}

// Chamar RecuperarHistoricoFiboVela() no OnInit()
const oldOnInit = `   if(!InicializarHandles()) { Print("INIT FAILED: Handles base inválidos."); return INIT_FAILED; }`;
const newOnInit = `   RecuperarHistoricoFiboVela();
   if(!InicializarHandles()) { Print("INIT FAILED: Handles base inválidos."); return INIT_FAILED; }`;

if (code.includes(oldOnInit)) {
  code = code.replace(oldOnInit, newOnInit);
  console.log('✔ RecuperarHistoricoFiboVela() integrado ao OnInit()!');
}

// 2. CORRIGIR STATUS DO DIAGNÓSTICO (ESTRUTURA PRONTA X FALTAM REQUISITOS)
const oldDiagSReady = `      s_rdy=(!any_glb&&u_b&&c_c&&c_l&&c_a&&c_t&&confl_mg_ok);`;
const newDiagSReady = `      s_rdy=(!any_glb&&u_b&&c_c&&c_l&&c_a&&c_t&&confl_mg_ok&&c_bar_ok);`;

if (code.includes(oldDiagSReady)) {
  code = code.replace(oldDiagSReady, newDiagSReady);
  console.log('✔ Diagnóstico atualizado: s_rdy agora exige c_bar_ok (Vela H4 Livre)!');
}

// 3. CORRIGIR DESENHAR LINHAS CHART (NUNCA FICAR ACESA SE FALTAR REQUISITO OU VELA JÁ OPERADA)
const oldHlBlock = `      // [APENAS A MAIS PRÓXIMA ACESA]
      if(fb_dir_sell) {
         double ds1 = MathAbs(nSell1 - ask);
         double ds2 = MathAbs(nSell2 - ask);
         double ds3 = MathAbs(nSell3 - ask);
         double min_ds = MathMin(ds1, MathMin(ds2, ds3));
         
         fb_s1_hl = fb_all_ok && (ds1 == min_ds) && (g_ReadyFibo || (ds1/_Point <= zone_pts));
         fb_s2_hl = fb_all_ok && (ds2 == min_ds) && (g_ReadyFibo || (ds2/_Point <= zone_pts));
         fb_s3_hl = fb_all_ok && (ds3 == min_ds) && (g_ReadyFibo || (ds3/_Point <= zone_pts));
      }

      if(fb_dir_buy) {
         double db1 = MathAbs(bid - nBuy1);
         double db2 = MathAbs(bid - nBuy2);
         double db3 = MathAbs(bid - nBuy3);
         double min_db = MathMin(db1, MathMin(db2, db3));
         
         fb_b1_hl = fb_all_ok && (db1 == min_db) && (g_ReadyFibo || (db1/_Point <= zone_pts));
         fb_b2_hl = fb_all_ok && (db2 == min_db) && (g_ReadyFibo || (db2/_Point <= zone_pts));
         fb_b3_hl = fb_all_ok && (db3 == min_db) && (g_ReadyFibo || (db3/_Point <= zone_pts));
      }`;

const newHlBlock = `      // [SINCRONIA RIGOROSA]: A linha só vira CONTÍNUA (highlight=true) se a vela NÃO tiver sido operada e TODOS os requisitos estiverem OK
      bool fb_s_all_ok = fb_all_ok && fb_bar_sell_ok;
      bool fb_b_all_ok = fb_all_ok && fb_bar_buy_ok;

      // [APENAS A MAIS PRÓXIMA ACESA]
      if(fb_dir_sell) {
         double ds1 = MathAbs(nSell1 - ask);
         double ds2 = MathAbs(nSell2 - ask);
         double ds3 = MathAbs(nSell3 - ask);
         double min_ds = MathMin(ds1, MathMin(ds2, ds3));
         
         fb_s1_hl = fb_s_all_ok && (ds1 == min_ds) && (g_ReadyFibo || (ds1/_Point <= zone_pts));
         fb_s2_hl = fb_s_all_ok && (ds2 == min_ds) && (g_ReadyFibo || (ds2/_Point <= zone_pts));
         fb_s3_hl = fb_s_all_ok && (ds3 == min_ds) && (g_ReadyFibo || (ds3/_Point <= zone_pts));
      }

      if(fb_dir_buy) {
         double db1 = MathAbs(bid - nBuy1);
         double db2 = MathAbs(bid - nBuy2);
         double db3 = MathAbs(bid - nBuy3);
         double min_db = MathMin(db1, MathMin(db2, db3));
         
         fb_b1_hl = fb_b_all_ok && (db1 == min_db) && (g_ReadyFibo || (db1/_Point <= zone_pts));
         fb_b2_hl = fb_b_all_ok && (db2 == min_db) && (g_ReadyFibo || (db2/_Point <= zone_pts));
         fb_b3_hl = fb_b_all_ok && (db3 == min_db) && (g_ReadyFibo || (db3/_Point <= zone_pts));
      }`;

if (code.includes(oldHlBlock)) {
  code = code.replace(oldHlBlock, newHlBlock);
  console.log('✔ Linha contínua blindada contra vela já operada (fica pontilhada)!');
} else {
  console.log('❌ oldHlBlock não encontrado');
}

// 4. CORRIGIR CORES ZEN FIBO PARA CORES SUAVES E PROPORCIONAIS AO FR
code = code.split("C'240,185,45' : C'140,110,35'").join("g_ReadyFibo ? C'210,165,45' : C'150,115,40'");

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
