//+------------------------------------------------------------------+
//|  Fibbo_Sniper_v28.5_PRO.mq5                                     |
//|  Estratégia: Falso Rompimento + Pullback Fibo + Rompimento Vol   |
//|  Modo: UNIFICADO — Conservador / Moderado / Agressivo            |
//|                                                                  |
//|  v28.6 ULTRA SNIPER — MELHORIAS FLUXO/FR + MODO PROP FIRM:              |
//|  - [F1] GatilhoPrecoce: Fluxo entra no candle sem esperar fechar |
//|  - [F2] Canal de Qualidade: exclui todos os spikes > 1.8×ATR    |
//|  - [R1] FR Direct: filtro ATR mínimo adicionado                  |
//|  - [R2] Zona Magnética FR adaptativa à volatilidade relativa      |
//|  - [R3] Cooldown FR por tempo (minutos) em vez de barra           |
//|  - [PROP] Modo Prop Firm: risco, consistência, limite diário      |
//+------------------------------------------------------------------+
#property copyright "Orion Logic & Sniper Strategy (v28.5 PRO)"
#property version   "28.60"

// Variaveis expostas pelo MarketGlance para o painel
string g_MG_DiagText  = "";      // Texto do diagnostico: "FORCA TOTAL", "CORRECAO", etc.
color  g_MG_DiagColor = clrGray; // Cor correspondente ao diagnostico

#include <Trade\Trade.mqh>
//+------------------------------------------------------------------+
//|                  MOTOR DE ANÁLISE VISUAL                         |
//|  (Canais de Regressão, Suporte/Resistência Dinâmicos, Legenda)   |
//+------------------------------------------------------------------+
// COMO USAR EM OUTROS ROBÔS:
// 1. Salve este arquivo na mesma pasta do seu robô.
// 2. No topo do seu robô principal coloque: #include "MarketGlance_Mdl.mqh"
// 3. Declare uma variável: bool g_ModoAnalise = true;
// 4. No evento OnTimer() ou OnTick() chame: Se g_ModoAnalise for true -> AtualizarSensoresAnalise() e DesenharLinhasAnalise()
// 5. No evento OnDeinit() chame: LimparTudoAnalise()

#define MG_PREFIX "AN_VISUAL_" // Prefixo para nao conflitar com os objetos do robo principal

// --- VARIAVEIS GLOBAIS DO MODULO ---
// g_ModoAnalise declarado globalmente abaixo

double g_MG_EMA50  = 0;
double g_MG_EMA200 = 0;
double g_MG_ATR    = 0;

bool g_MG_BuyAllowed = true;
bool g_MG_SellAllowed = true;

double g_MG_FR_H4_Sup = 0, g_MG_FR_H4_Res = 0;
double g_MG_FR_D1_Sup = 0, g_MG_FR_D1_Res = 0;

datetime g_MG_TimeMacroStart, g_MG_TimeMacroEnd;
datetime g_MG_TimeMicroStart, g_MG_TimeMicroEnd;

int g_MG_hEMA50 = INVALID_HANDLE;
int g_MG_hEMA200 = INVALID_HANDLE;
int g_MG_hATR = INVALID_HANDLE;
int g_MG_hFrH4 = INVALID_HANDLE;
int g_MG_hFrD1 = INVALID_HANDLE;
ENUM_TIMEFRAMES g_MG_CurrentTF = PERIOD_CURRENT;

int g_MG_hEMA50_M15 = INVALID_HANDLE; int g_MG_hEMA200_M15 = INVALID_HANDLE;
int g_MG_hEMA50_H1 = INVALID_HANDLE; int g_MG_hEMA200_H1 = INVALID_HANDLE;
int g_MG_hEMA50_H2 = INVALID_HANDLE; int g_MG_hEMA200_H2 = INVALID_HANDLE;
int g_MG_hEMA50_H4 = INVALID_HANDLE; int g_MG_hEMA200_H4 = INVALID_HANDLE;


// Nota: removida dependencia do .mq5

//===================================================================
// 1. LEITURA DE DADOS DOS INDICADORES
//===================================================================
void InicializarSensoresAnalise() {
   if(g_MG_hEMA50 == INVALID_HANDLE) g_MG_hEMA50 = iMA(_Symbol, g_MG_CurrentTF, 50, 0, MODE_EMA, PRICE_CLOSE);
   if(g_MG_hEMA200 == INVALID_HANDLE) g_MG_hEMA200 = iMA(_Symbol, g_MG_CurrentTF, 200, 0, MODE_EMA, PRICE_CLOSE);
   if(g_MG_hATR == INVALID_HANDLE) g_MG_hATR = iATR(_Symbol, g_MG_CurrentTF, 14);
   if(g_MG_hFrH4 == INVALID_HANDLE) g_MG_hFrH4 = iFractals(_Symbol, PERIOD_H4);
   if(g_MG_hFrD1 == INVALID_HANDLE) g_MG_hFrD1 = iFractals(_Symbol, PERIOD_D1);
   
   if(g_MG_hEMA50_M15 == INVALID_HANDLE) g_MG_hEMA50_M15 = iMA(_Symbol, PERIOD_M15, 50, 0, MODE_EMA, PRICE_CLOSE);
   if(g_MG_hEMA200_M15 == INVALID_HANDLE) g_MG_hEMA200_M15 = iMA(_Symbol, PERIOD_M15, 200, 0, MODE_EMA, PRICE_CLOSE);
   if(g_MG_hEMA50_H1 == INVALID_HANDLE) g_MG_hEMA50_H1 = iMA(_Symbol, PERIOD_H1, 50, 0, MODE_EMA, PRICE_CLOSE);
   if(g_MG_hEMA200_H1 == INVALID_HANDLE) g_MG_hEMA200_H1 = iMA(_Symbol, PERIOD_H1, 200, 0, MODE_EMA, PRICE_CLOSE);
   if(g_MG_hEMA50_H2 == INVALID_HANDLE) g_MG_hEMA50_H2 = iMA(_Symbol, PERIOD_H2, 50, 0, MODE_EMA, PRICE_CLOSE);
   if(g_MG_hEMA200_H2 == INVALID_HANDLE) g_MG_hEMA200_H2 = iMA(_Symbol, PERIOD_H2, 200, 0, MODE_EMA, PRICE_CLOSE);
   if(g_MG_hEMA50_H4 == INVALID_HANDLE) g_MG_hEMA50_H4 = iMA(_Symbol, PERIOD_H4, 50, 0, MODE_EMA, PRICE_CLOSE);
   if(g_MG_hEMA200_H4 == INVALID_HANDLE) g_MG_hEMA200_H4 = iMA(_Symbol, PERIOD_H4, 200, 0, MODE_EMA, PRICE_CLOSE);
}

void AtualizarSensoresAnalise(ENUM_TIMEFRAMES tf_escolhido=PERIOD_CURRENT) {
   // [ZEN FIX] Removida guarda "tf_escolhido != 0" porque PERIOD_CURRENT == 0 em MQL5.
   // Antes, trocar para PERIOD_CURRENT nunca atualizava g_MG_CurrentTF, mantendo handles
   // do TF anterior (ex: H2) e desenhando canais no TF errado mesmo com ZEN ativo.
   if(tf_escolhido != g_MG_CurrentTF) {
      LimparTudoAnalise(); // Libera handles velhos e reseta g_MG_CurrentTF = 0
      g_MG_CurrentTF = tf_escolhido;
   }
   InicializarSensoresAnalise();
   double buf_e50[1], buf_e200[1], buf_atr[1];
   
   // EMA 50 (Micro Tendencia)
   if(g_MG_hEMA50 != INVALID_HANDLE && CopyBuffer(g_MG_hEMA50, 0, 0, 1, buf_e50) > 0) g_MG_EMA50 = buf_e50[0];
   
   // EMA 200 (Macro Tendencia)
   if(g_MG_hEMA200 != INVALID_HANDLE && CopyBuffer(g_MG_hEMA200, 0, 0, 1, buf_e200) > 0) g_MG_EMA200 = buf_e200[0];
   
   // ATR (Volatilidade/Distancia de Alvos)
   if(g_MG_hATR != INVALID_HANDLE && CopyBuffer(g_MG_hATR, 0, 0, 1, buf_atr) > 0) g_MG_ATR = SanitizeATR(buf_atr[0], g_MG_CurrentTF);
   
   // CANAIS DE REGRESSAO (Visualização Dinâmica no Timeframe ATUAL da tela: H4, H2, H1, etc.)
   ENUM_TIMEFRAMES tf_vis = _Period; // Pega automaticamente o TF em que o gráfico estiver aberto
   g_MG_TimeMacroEnd = iTime(_Symbol, tf_vis, 0);
   g_MG_TimeMacroStart = iTime(_Symbol, tf_vis, 150); // 150 velas do TF atual da tela
   
   g_MG_TimeMicroEnd = iTime(_Symbol, tf_vis, 0);
   g_MG_TimeMicroStart = iTime(_Symbol, tf_vis, 45);  // 45 velas do TF atual da tela
   
   // FRACTAIS H4 (Suporte e Resistencia Curto Prazo)
   double bufFrUp[], bufFrDn[];
   if(g_MG_hFrH4 != INVALID_HANDLE) {
      int c_up = CopyBuffer(g_MG_hFrH4, UPPER_LINE, 0, 200, bufFrUp);
      if(c_up > 0) {
         for(int i=c_up-1; i>=0; i--) if(bufFrUp[i] != EMPTY_VALUE && bufFrUp[i] > 0) { g_MG_FR_H4_Res = bufFrUp[i]; break; }
      }
      int c_dn = CopyBuffer(g_MG_hFrH4, LOWER_LINE, 0, 200, bufFrDn);
      if(c_dn > 0) {
         for(int i=c_dn-1; i>=0; i--) if(bufFrDn[i] != EMPTY_VALUE && bufFrDn[i] > 0) { g_MG_FR_H4_Sup = bufFrDn[i]; break; }
      }
   }
   
   // FRACTAIS D1 (Suporte e Resistencia Longo Prazo)
   if(g_MG_hFrD1 != INVALID_HANDLE) {
      int c_up = CopyBuffer(g_MG_hFrD1, UPPER_LINE, 0, 200, bufFrUp);
      if(c_up > 0) {
         for(int i=c_up-1; i>=0; i--) if(bufFrUp[i] != EMPTY_VALUE && bufFrUp[i] > 0) { g_MG_FR_D1_Res = bufFrUp[i]; break; }
      }
      int c_dn = CopyBuffer(g_MG_hFrD1, LOWER_LINE, 0, 200, bufFrDn);
      if(c_dn > 0) {
         for(int i=c_dn-1; i>=0; i--) if(bufFrDn[i] != EMPTY_VALUE && bufFrDn[i] > 0) { g_MG_FR_D1_Sup = bufFrDn[i]; break; }
      }
   }
}

//===================================================================
// 2. FUNCOES AUXILIARES DE DESENHO
//===================================================================
void MG_HLine(string id, double price, color clr, ENUM_LINE_STYLE sty, int width, string tooltip, color txt_clr=clrNONE) {
   string nm = MG_PREFIX + id;
   string tx = MG_PREFIX + id + "_TXT";
   if(price <= 0 || !g_ModoAnalise) { ObjectDelete(0, nm); ObjectDelete(0, tx); return; }
   if(ObjectFind(0, nm) < 0) ObjectCreate(0, nm, OBJ_HLINE, 0, 0, price);
   ObjectSetDouble(0, nm, OBJPROP_PRICE, price);
   ObjectSetInteger(0, nm, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, nm, OBJPROP_STYLE, sty);
   ObjectSetInteger(0, nm, OBJPROP_WIDTH, width);
   ObjectSetInteger(0, nm, OBJPROP_BACK, true);
   ObjectSetInteger(0, nm, OBJPROP_SELECTABLE, false);
   ObjectSetString(0, nm, OBJPROP_TOOLTIP, tooltip);
   // [MOD] Remover label flutuante - agora exibido no painel fixo lateral
   ObjectDelete(0, tx);
}

void MG_LevelArrow(string id, double price, bool isResistance, color clr, int time_shift_candles=0) {
   string arrNm = MG_PREFIX + "ARR_" + id;
   if(price <= 0 || !g_ModoAnalise) { ObjectDelete(0, arrNm); return; }
   int safe_shift = time_shift_candles;
   if(safe_shift >= Bars(_Symbol, g_MG_CurrentTF)) safe_shift = 0;
   datetime time = iTime(_Symbol, g_MG_CurrentTF, safe_shift);
   if(ObjectFind(0, arrNm) < 0) ObjectCreate(0, arrNm, OBJ_ARROW, 0, time, price);
   ObjectSetInteger(0, arrNm, OBJPROP_TIME, time);
   ObjectSetDouble(0, arrNm, OBJPROP_PRICE, price);
   ObjectSetInteger(0, arrNm, OBJPROP_ARROWCODE, isResistance ? 234 : 233); // Seta pra baixo ou cima
   ObjectSetInteger(0, arrNm, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, arrNm, OBJPROP_WIDTH, 2);
}

//===================================================================
// 3. DESENHO DA LEGENDA
// USA APENAS OBJ_RECTANGLE_LABEL + OBJ_LABEL (objetos DirectX internos)
// Nunca usa OBJ_BUTTON nem OBJ_EDIT (widgets Win32 que piscam no ChartRedraw)
//===================================================================
void DesenharLegendaAnaliseMG(int count, string &texts[], color &clrs[], string diag_text="", color diag_color=clrGray) {
   // ===== PAINEL FIXO NO CANTO INFERIOR DIREITO =====
   string PNL = MG_PREFIX + "PNL_";
   int panel_w   = 320;
   int row_h     = 20;
   int pad_x     = 10;
   int pad_top   = 10;
   int panel_x   = 4;
   int panel_y   = 20;

   if(!g_ModoAnalise) {
      // Limpar todos os objetos do painel
      ObjectDelete(0, PNL + "BG");
      ObjectDelete(0, PNL + "TITLE_BG");
      ObjectDelete(0, PNL + "TITLE_TX");
      for(int i = 0; i < 15; i++) ObjectDelete(0, PNL + "ROW_" + IntegerToString(i));
      // Limpar legenda antiga (compatibilidade)
      for(int i=0; i<15; i++) ObjectDelete(0, MG_PREFIX + "LEG_" + IntegerToString(i));
      ObjectDelete(0, MG_PREFIX + "LEG_DIAG_BG"); ObjectDelete(0, MG_PREFIX + "LEG_DIAG_TX");
      return;
   }

   // Altura total do painel: titulo + linhas de dados
   int panel_h = pad_top*2 + 16 + (count * row_h);

   // --- Fundo do painel (semi-escuro) ---
   string bg = PNL + "BG";
   if(ObjectFind(0, bg) < 0) {
      ObjectCreate(0, bg, OBJ_RECTANGLE_LABEL, 0, 0, 0);
   ObjectSetInteger(0, bg, OBJPROP_CORNER,       CORNER_RIGHT_LOWER);
      ObjectSetInteger(0, bg, OBJPROP_BORDER_TYPE,  BORDER_FLAT);
      ObjectSetInteger(0, bg, OBJPROP_BACK,         true);
      ObjectSetInteger(0, bg, OBJPROP_SELECTABLE,   false);
      ObjectSetInteger(0, bg, OBJPROP_ZORDER,       5);
      ObjectSetInteger(0, bg, OBJPROP_BGCOLOR,      C'12,16,24');
      ObjectSetInteger(0, bg, OBJPROP_COLOR,        C'35,50,75');
      ObjectSetInteger(0, bg, OBJPROP_WIDTH,        1);
   }
   ObjectSetInteger(0, bg, OBJPROP_XDISTANCE, panel_x);
   ObjectSetInteger(0, bg, OBJPROP_YDISTANCE, panel_y);

   ObjectSetInteger(0, bg, OBJPROP_XSIZE,     panel_w);
   ObjectSetInteger(0, bg, OBJPROP_YSIZE,     panel_h);

   // --- Barra de título ---
   string tbg = PNL + "TITLE_BG";
   if(ObjectFind(0, tbg) < 0) {
      ObjectCreate(0, tbg, OBJ_RECTANGLE_LABEL, 0, 0, 0);
      ObjectSetInteger(0, tbg, OBJPROP_CORNER,      CORNER_RIGHT_LOWER);
      ObjectSetInteger(0, tbg, OBJPROP_BORDER_TYPE, BORDER_FLAT);
      ObjectSetInteger(0, tbg, OBJPROP_BACK,        false);
      ObjectSetInteger(0, tbg, OBJPROP_SELECTABLE,  false);
      ObjectSetInteger(0, tbg, OBJPROP_ZORDER,      6);
      ObjectSetInteger(0, tbg, OBJPROP_BGCOLOR,     C'20,40,70');
      ObjectSetInteger(0, tbg, OBJPROP_COLOR,       C'35,60,110');
      ObjectSetInteger(0, tbg, OBJPROP_WIDTH,       1);
   }
   // Posicionar a barra de titulo no TOPO do painel (dentro do painel - deslocada para cima pela altura do painel)
   ObjectSetInteger(0, tbg, OBJPROP_XDISTANCE, panel_x);
   ObjectSetInteger(0, tbg, OBJPROP_YDISTANCE, panel_y + panel_h - 20); // titulo na base do painel
   ObjectSetInteger(0, tbg, OBJPROP_XSIZE,     panel_w);
   ObjectSetInteger(0, tbg, OBJPROP_YSIZE,     20);

   // --- Texto do título ---
   string ttx = PNL + "TITLE_TX";
   string title_str = "● Market Glance";
   if(diag_text != "") title_str += "  |  " + diag_text;
   if(ObjectFind(0, ttx) < 0) {
      ObjectCreate(0, ttx, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, ttx, OBJPROP_CORNER,    CORNER_RIGHT_LOWER);
      ObjectSetInteger(0, ttx, OBJPROP_ANCHOR,    ANCHOR_RIGHT_LOWER);
      ObjectSetString(0,  ttx, OBJPROP_FONT,      "Calibri Bold");
      ObjectSetInteger(0, ttx, OBJPROP_FONTSIZE,  10);
      ObjectSetInteger(0, ttx, OBJPROP_BACK,      false);
      ObjectSetInteger(0, ttx, OBJPROP_SELECTABLE,false);
      ObjectSetInteger(0, ttx, OBJPROP_ZORDER,    7);
   }
   ObjectSetInteger(0, ttx, OBJPROP_XDISTANCE, panel_x + pad_x);
   ObjectSetInteger(0, ttx, OBJPROP_YDISTANCE, panel_y + panel_h - 16); // texto dentro da barra inferior
   ObjectSetInteger(0, ttx, OBJPROP_COLOR,     diag_color != clrGray ? diag_color : C'100,160,220');
   ObjectSetString(0,  ttx, OBJPROP_TEXT,      title_str);

   // --- Linhas de dados ---
   for(int i = 0; i < 15; i++) {
      string row = PNL + "ROW_" + IntegerToString(i);
      if(i < count) {
         if(ObjectFind(0, row) < 0) {
            ObjectCreate(0, row, OBJ_LABEL, 0, 0, 0);
            ObjectSetInteger(0, row, OBJPROP_CORNER,    CORNER_RIGHT_LOWER);
            ObjectSetInteger(0, row, OBJPROP_ANCHOR,    ANCHOR_RIGHT_LOWER);
            ObjectSetString(0,  row, OBJPROP_FONT,      "Calibri");
            ObjectSetInteger(0, row, OBJPROP_FONTSIZE,  10);
            ObjectSetInteger(0, row, OBJPROP_BACK,      false);
            ObjectSetInteger(0, row, OBJPROP_SELECTABLE,false);
            ObjectSetInteger(0, row, OBJPROP_ZORDER,    8);
         }
         // Linhas crescem para cima a partir do titulo no rodape
         int yd = panel_y + panel_h - 20 - pad_top - ((count - 1 - i) * row_h);
         ObjectSetInteger(0, row, OBJPROP_XDISTANCE, panel_x + pad_x);
         ObjectSetInteger(0, row, OBJPROP_YDISTANCE, yd);
         ObjectSetString(0,  row, OBJPROP_TEXT,      texts[i]);
         ObjectSetInteger(0, row, OBJPROP_COLOR,     clrs[i]);
      } else {
         ObjectDelete(0, row);
      }
   }

   // Limpar legenda antiga da borda direita (compatibilidade retroativa)
   for(int i=0; i<15; i++) ObjectDelete(0, MG_PREFIX + "LEG_" + IntegerToString(i));
   ObjectDelete(0, MG_PREFIX + "LEG_DIAG_BG");
   ObjectDelete(0, MG_PREFIX + "LEG_DIAG_TX");
}


//===================================================================
// 4. DESENHO PRINCIPAL DAS LINHAS E CANAIS
//===================================================================

//+------------------------------------------------------------------+
//| [ROTEAMENTO INTELIGENTE] Verifica se Fibo é permitida no par     |
//+------------------------------------------------------------------+
bool IsFiboActiveForSymbol() {
   if(!InpUseFiboPullback) return false;
   if(!InpSmartFiboSymbolFilter) return true;
   
   string curSym = _Symbol;
   StringToUpper(curSym);
   
   string blocked = InpFiboBlockedSymbols;
   StringToUpper(blocked);
   
   string pairs[];
   int count = StringSplit(blocked, ',', pairs);
   for(int i = 0; i < count; i++) {
      string p = pairs[i];
      StringTrimLeft(p);
      StringTrimRight(p);
      if(p != "" && StringFind(curSym, p) >= 0) {
         return false; // Bloqueado para Fibo! (Opera apenas FR)
      }
   }
   return true; // Permitido Fibo + FR
}

void LimparObjetosVisuaisMG() {
   int total = ObjectsTotal(0, 0, -1);
   for(int i = total - 1; i >= 0; i--) {
      string name = ObjectName(0, i, 0, -1);
      if(StringFind(name, MG_PREFIX) == 0)
         ObjectDelete(0, name);
   }
}

void AtualizarPermissoesConfluenciaMG() {
   g_MG_BuyAllowed = true;
   g_MG_SellAllowed = true;
   
   double b5[1], b2[1];
   bool chk_m15 = (g_MG_CurrentTF == PERIOD_M15);
   bool chk_h1  = (g_MG_CurrentTF == PERIOD_M15 || g_MG_CurrentTF == PERIOD_H1);
   bool chk_h2  = (g_MG_CurrentTF == PERIOD_M15 || g_MG_CurrentTF == PERIOD_H1 || g_MG_CurrentTF == PERIOD_H2);
   bool chk_h4  = (g_MG_CurrentTF == PERIOD_M15 || g_MG_CurrentTF == PERIOD_H1 || g_MG_CurrentTF == PERIOD_H2 || g_MG_CurrentTF == PERIOD_H4);

   if(chk_m15 && g_MG_hEMA50_M15 != INVALID_HANDLE && g_MG_hEMA200_M15 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_M15,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_M15,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }
   if(chk_h1 && g_MG_hEMA50_H1 != INVALID_HANDLE && g_MG_hEMA200_H1 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_H1,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_H1,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }
   if(chk_h2 && g_MG_hEMA50_H2 != INVALID_HANDLE && g_MG_hEMA200_H2 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_H2,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_H2,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }
   if(chk_h4 && g_MG_hEMA50_H4 != INVALID_HANDLE && g_MG_hEMA200_H4 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_H4,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_H4,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }

   if(g_MG_EMA50 > 0 && g_MG_EMA200 > 0) {
       if(g_MG_EMA50 <= g_MG_EMA200) g_MG_BuyAllowed = false; // Tendencia Baixa (bloqueia compra)
       if(g_MG_EMA50 >= g_MG_EMA200) g_MG_SellAllowed = false; // Tendencia Alta (bloqueia venda)
   }
}

void DesenharLinhasAnalise() {
   if(MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE)) return;

   // [ITEM A FIX] Permissões de confluência SEMPRE calculadas, independente do modo visual
   AtualizarPermissoesConfluenciaMG();

   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double atrVal = g_MG_ATR;
   
   // Se o Modo Zen estiver desligado, apenas limpa os objetos visuais do gráfico sem desativar a confluência!
   if(!g_ViewZonas) {
      g_ModoAnalise = false;
      LimparObjetosVisuaisMG();
      return;
   } else {
      g_ModoAnalise = true;
   }
   
   string leg_text[15];
   color  leg_color[15];
   int    leg_count = 0;
   
   leg_text[leg_count] = "--- ELEMENTOS ATIVOS NA TELA ---"; leg_color[leg_count] = clrGray; leg_count++;
   
   // Canais Macro/Micro dependem do filtro FIBO ativo
   if(g_ViewFibo) {
      leg_text[leg_count] = "Canal Macro"; leg_color[leg_count] = C'40,100,160'; leg_count++;
      leg_text[leg_count] = "Canal Micro"; leg_color[leg_count] = clrOrange; leg_count++;
   }

   if(atrVal > 0) {
      // [VIS] Linhas ATR pontilhadas
      MG_HLine("ATR_UP", bid + atrVal, C'50,95,65', STYLE_DOT, 1, "Alvo ATR +1 [" + DoubleToString(bid + atrVal, _Digits) + "]", C'80,170,110');
      leg_text[leg_count] = "Alvo ATR +1 [" + DoubleToString(bid + atrVal, _Digits) + "]"; 
      leg_color[leg_count] = C'80,170,110'; leg_count++;
      
      MG_HLine("ATR_DN", bid - atrVal, C'110,55,55', STYLE_DOT, 1, "Alvo ATR -1 [" + DoubleToString(bid - atrVal, _Digits) + "]", C'190,90,90');
      leg_text[leg_count] = "Alvo ATR -1 [" + DoubleToString(bid - atrVal, _Digits) + "]"; 
      leg_color[leg_count] = C'190,90,90'; leg_count++;
   }

   double max_dist = (atrVal > 0) ? atrVal * 3.0 : SymbolInfoDouble(_Symbol, SYMBOL_POINT) * 500;
   
   // Níveis de Suporte e Resistência FR dependem do filtro FR ativo
   if(g_ViewFR) {
      if(g_MG_FR_H4_Sup > 0 && MathAbs(g_MG_FR_H4_Sup - bid) <= max_dist) {
         bool isRes = (g_MG_FR_H4_Sup > bid);
         string lbl = (isRes ? "Resistência" : "Suporte") + " H4 (Fundo)";
         MG_HLine("FR_SUP", g_MG_FR_H4_Sup, C'120,80,220', STYLE_SOLID, 1, lbl);
         MG_LevelArrow("ARR_SUP_H4", g_MG_FR_H4_Sup, isRes, C'120,80,220', 2);
         if(leg_count < 15) { leg_text[leg_count] = lbl + " [" + DoubleToString(g_MG_FR_H4_Sup, _Digits) + "]"; leg_color[leg_count] = C'120,80,220'; leg_count++; }
      } else { MG_HLine("FR_SUP", 0, clrNONE, STYLE_SOLID, 1, ""); MG_LevelArrow("ARR_SUP_H4", 0, false, clrNONE, 0); }
      
      if(g_MG_FR_H4_Res > 0 && MathAbs(g_MG_FR_H4_Res - bid) <= max_dist) {
         bool isRes = (g_MG_FR_H4_Res > bid);
         string lbl = (isRes ? "Resistência" : "Suporte") + " H4 (Topo)";
         MG_HLine("FR_RES", g_MG_FR_H4_Res, C'220,160,0', STYLE_SOLID, 1, lbl);
         MG_LevelArrow("ARR_RES_H4", g_MG_FR_H4_Res, isRes, C'220,160,0', 2);
         if(leg_count < 15) { leg_text[leg_count] = lbl + " [" + DoubleToString(g_MG_FR_H4_Res, _Digits) + "]"; leg_color[leg_count] = C'220,160,0'; leg_count++; }
      } else { MG_HLine("FR_RES", 0, clrNONE, STYLE_SOLID, 1, ""); MG_LevelArrow("ARR_RES_H4", 0, false, clrNONE, 0); }
      
      if(g_MG_FR_D1_Sup > 0 && MathAbs(g_MG_FR_D1_Sup - bid) <= max_dist) {
         bool isRes = (g_MG_FR_D1_Sup > bid);
         string lbl = (isRes ? "Resistência" : "Suporte") + " D1 (Fundo)";
         MG_HLine("FR_SUP_D1", g_MG_FR_D1_Sup, C'80,50,180', STYLE_SOLID, 1, lbl);
         MG_LevelArrow("ARR_SUP_D1", g_MG_FR_D1_Sup, isRes, C'80,50,180', 22);
         if(leg_count < 15) { leg_text[leg_count] = lbl + " [" + DoubleToString(g_MG_FR_D1_Sup, _Digits) + "]"; leg_color[leg_count] = C'80,50,180'; leg_count++; }
      } else { MG_HLine("FR_SUP_D1", 0, clrNONE, STYLE_SOLID, 1, ""); MG_LevelArrow("ARR_SUP_D1", 0, false, clrNONE, 0); }
      
      if(g_MG_FR_D1_Res > 0 && MathAbs(g_MG_FR_D1_Res - bid) <= max_dist) {
         bool isRes = (g_MG_FR_D1_Res > bid);
         string lbl = (isRes ? "Resistência" : "Suporte") + " D1 (Topo)";
         MG_HLine("FR_RES_D1", g_MG_FR_D1_Res, C'180,130,0', STYLE_SOLID, 1, lbl);
         MG_LevelArrow("ARR_RES_D1", g_MG_FR_D1_Res, isRes, C'180,130,0', 22);
         if(leg_count < 15) { leg_text[leg_count] = lbl + " [" + DoubleToString(g_MG_FR_D1_Res, _Digits) + "]"; leg_color[leg_count] = C'180,130,0'; leg_count++; }
      } else { MG_HLine("FR_RES_D1", 0, clrNONE, STYLE_SOLID, 1, ""); MG_LevelArrow("ARR_RES_D1", 0, false, clrNONE, 0); }
   } else {
      MG_HLine("FR_SUP", 0, clrNONE, STYLE_SOLID, 1, ""); MG_LevelArrow("ARR_SUP_H4", 0, false, clrNONE, 0);
      MG_HLine("FR_RES", 0, clrNONE, STYLE_SOLID, 1, ""); MG_LevelArrow("ARR_RES_H4", 0, false, clrNONE, 0);
      MG_HLine("FR_SUP_D1", 0, clrNONE, STYLE_SOLID, 1, ""); MG_LevelArrow("ARR_SUP_D1", 0, false, clrNONE, 0);
      MG_HLine("FR_RES_D1", 0, clrNONE, STYLE_SOLID, 1, ""); MG_LevelArrow("ARR_RES_D1", 0, false, clrNONE, 0);
   }

   string regNmMacro = MG_PREFIX + "REG_MACRO";
   if(g_ModoAnalise && g_MG_TimeMacroStart > 0 && g_MG_TimeMacroEnd > 0) {
      if(ObjectFind(0, regNmMacro) < 0) {
         ObjectCreate(0, regNmMacro, OBJ_REGRESSION, 0, g_MG_TimeMacroStart, 0, g_MG_TimeMacroEnd, 0);
         ObjectSetInteger(0, regNmMacro, OBJPROP_COLOR, C'40,100,160');
         ObjectSetInteger(0, regNmMacro, OBJPROP_WIDTH, 1);
         ObjectSetInteger(0, regNmMacro, OBJPROP_RAY_RIGHT, false);
         ObjectSetInteger(0, regNmMacro, OBJPROP_BACK, true);
         ObjectSetInteger(0, regNmMacro, OBJPROP_SELECTABLE, false);
      } else {
         if(ObjectGetInteger(0, regNmMacro, OBJPROP_TIME, 0) != g_MG_TimeMacroStart)
            ObjectSetInteger(0, regNmMacro, OBJPROP_TIME, 0, g_MG_TimeMacroStart);
         if(ObjectGetInteger(0, regNmMacro, OBJPROP_TIME, 1) != g_MG_TimeMacroEnd)
            ObjectSetInteger(0, regNmMacro, OBJPROP_TIME, 1, g_MG_TimeMacroEnd);
      }
   } else { ObjectDelete(0, regNmMacro); }

   string regNmMicro = MG_PREFIX + "REG_MICRO";
   if(g_ModoAnalise && g_MG_TimeMicroStart > 0 && g_MG_TimeMicroEnd > 0) {
      if(ObjectFind(0, regNmMicro) < 0) {
         ObjectCreate(0, regNmMicro, OBJ_REGRESSION, 0, g_MG_TimeMicroStart, 0, g_MG_TimeMicroEnd, 0);
         ObjectSetInteger(0, regNmMicro, OBJPROP_COLOR, clrOrange); 
         ObjectSetInteger(0, regNmMicro, OBJPROP_WIDTH, 1);
         ObjectSetInteger(0, regNmMicro, OBJPROP_STYLE, STYLE_DASH);
         ObjectSetInteger(0, regNmMicro, OBJPROP_RAY_RIGHT, false);
         ObjectSetInteger(0, regNmMicro, OBJPROP_BACK, true);
         ObjectSetInteger(0, regNmMicro, OBJPROP_SELECTABLE, false);
      } else {
         if(ObjectGetInteger(0, regNmMicro, OBJPROP_TIME, 0) != g_MG_TimeMicroStart)
            ObjectSetInteger(0, regNmMicro, OBJPROP_TIME, 0, g_MG_TimeMicroStart);
         if(ObjectGetInteger(0, regNmMicro, OBJPROP_TIME, 1) != g_MG_TimeMicroEnd)
            ObjectSetInteger(0, regNmMicro, OBJPROP_TIME, 1, g_MG_TimeMicroEnd);
      }
   } else { ObjectDelete(0, regNmMicro); }

   // Verifica barras no grafico ATUAL (PERIOD_CURRENT = sempre disponivel)
   // Nao usa g_MG_CurrentTF para nao depender de carga de historico do TF de confluencia
   int totalBars = Bars(_Symbol, PERIOD_CURRENT);
   if(totalBars < 151) {
      // Solicita historico se precisar
      datetime t[]; CopyTime(_Symbol, PERIOD_CURRENT, 0, 151, t);
      g_MG_DiagText  = "Carregando barras...";
      g_MG_DiagColor = clrGray;
      DesenharLegendaAnaliseMG(leg_count, leg_text, leg_color, g_MG_DiagText, g_MG_DiagColor);
      return;
   }

   // Diagnostico - INCLINACAO INDEPENDENTE de cada canal
   // Macro: Tendencia das primeiras 105 velas (candle[150] -> candle[46])
   // Micro: Tendencia das ultimas 45 velas   (candle[45] -> candle[0])
   double closeMacroStart = iClose(_Symbol, 0, 150); // Usa PERIOD_CURRENT para ser dinamico
   double closeMacroEnd   = iClose(_Symbol, 0, 46);
   double closeMicroStart = iClose(_Symbol, 0, 45);
   
   bool isMacroUp = (closeMacroStart > 0 && closeMacroEnd > closeMacroStart);
   bool isMicroUp = (closeMicroStart > 0 && bid           > closeMicroStart);

   
   string diag_short = ""; string diag_full = ""; color diagClr = clrWhite;
   
   if(isMacroUp && isMicroUp) {
       diag_short = "FORCA TOTAL (ALTA)"; diag_full = "FORÇA TOTAL (Macro e Micro: ALTA)"; diagClr = clrLimeGreen;
   } else if(!isMacroUp && !isMicroUp) {
       diag_short = "FORCA TOTAL (BAIXA)"; diag_full = "FORÇA TOTAL (Macro e Micro: BAIXA)"; diagClr = clrRed;
   } else if(isMacroUp && !isMicroUp) {
       diag_short = "CORRECAO P/ ALTA"; diag_full = "CORREÇÃO (Micro: Baixa | Macro: Alta)"; diagClr = clrGold;
   } else if(!isMacroUp && isMicroUp) {
       diag_short = "REPIQUE P/ BAIXA"; diag_full = "REPIQUE (Micro: Alta | Macro: Baixa)"; diagClr = clrGold;
   }

   // Armazena diagnostico em variaveis globais para o painel principal ler
   g_MG_DiagText  = diag_short;
   g_MG_DiagColor = diagClr;
   
   DesenharLegendaAnaliseMG(leg_count, leg_text, leg_color, diag_full, diagClr);
}

//===================================================================
// 5. FUNCAO DE LIMPEZA
//===================================================================
void LimparTudoAnalise() {
   // Libera handles dos indicadores antes de varrer objetos
   if(g_MG_hEMA50  != INVALID_HANDLE) { IndicatorRelease(g_MG_hEMA50);  g_MG_hEMA50  = INVALID_HANDLE; }
   if(g_MG_hEMA200 != INVALID_HANDLE) { IndicatorRelease(g_MG_hEMA200); g_MG_hEMA200 = INVALID_HANDLE; }
   if(g_MG_hATR    != INVALID_HANDLE) { IndicatorRelease(g_MG_hATR);    g_MG_hATR    = INVALID_HANDLE; }
   if(g_MG_hFrH4   != INVALID_HANDLE) { IndicatorRelease(g_MG_hFrH4);   g_MG_hFrH4   = INVALID_HANDLE; }
   if(g_MG_hFrD1   != INVALID_HANDLE) { IndicatorRelease(g_MG_hFrD1);   g_MG_hFrD1   = INVALID_HANDLE; }

   if(g_MG_hEMA50_M15 != INVALID_HANDLE) { IndicatorRelease(g_MG_hEMA50_M15); g_MG_hEMA50_M15 = INVALID_HANDLE; }
   if(g_MG_hEMA200_M15 != INVALID_HANDLE) { IndicatorRelease(g_MG_hEMA200_M15); g_MG_hEMA200_M15 = INVALID_HANDLE; }
   if(g_MG_hEMA50_H1 != INVALID_HANDLE) { IndicatorRelease(g_MG_hEMA50_H1); g_MG_hEMA50_H1 = INVALID_HANDLE; }
   if(g_MG_hEMA200_H1 != INVALID_HANDLE) { IndicatorRelease(g_MG_hEMA200_H1); g_MG_hEMA200_H1 = INVALID_HANDLE; }
   if(g_MG_hEMA50_H2 != INVALID_HANDLE) { IndicatorRelease(g_MG_hEMA50_H2); g_MG_hEMA50_H2 = INVALID_HANDLE; }
   if(g_MG_hEMA200_H2 != INVALID_HANDLE) { IndicatorRelease(g_MG_hEMA200_H2); g_MG_hEMA200_H2 = INVALID_HANDLE; }
   if(g_MG_hEMA50_H4 != INVALID_HANDLE) { IndicatorRelease(g_MG_hEMA50_H4); g_MG_hEMA50_H4 = INVALID_HANDLE; }
   if(g_MG_hEMA200_H4 != INVALID_HANDLE) { IndicatorRelease(g_MG_hEMA200_H4); g_MG_hEMA200_H4 = INVALID_HANDLE; }

   // Remove apenas os objetos com o prefixo exclusivo do modulo (sub-grafico 0)
   int total = ObjectsTotal(0, 0, -1);
   for(int i = total - 1; i >= 0; i--) {
      string name = ObjectName(0, i, 0, -1);
      if(StringFind(name, MG_PREFIX) == 0)
         ObjectDelete(0, name);
   }
   // Reseta variaveis de dados para evitar exibir valores obsoletos
   g_MG_EMA50 = 0; g_MG_EMA200 = 0; g_MG_ATR = 0;
   g_MG_FR_H4_Sup = 0; g_MG_FR_H4_Res = 0;
   g_MG_FR_D1_Sup = 0; g_MG_FR_D1_Res = 0;
   g_MG_TimeMacroStart = 0; g_MG_TimeMacroEnd = 0;
   g_MG_TimeMicroStart = 0; g_MG_TimeMicroEnd = 0;
   g_MG_DiagText = ""; g_MG_DiagColor = clrGray;
   g_MG_BuyAllowed = true; g_MG_SellAllowed = true;
}


enum ENUM_PERFIL_OPERACIONAL { PERFIL_CONSERVADOR, PERFIL_MODERADO, PERFIL_AGRESSIVO };
enum ENUM_FILTER_MODE { FILTER_ATUAL, FILTER_MEIO_TERMO, FILTER_MAXIMO };
enum ENUM_FR_MODE { FR_AGRESSIVO, FR_CONSERVADOR };

input group "=== PERFIL E RISCO AUTOMATIZADO ==="
input ENUM_PERFIL_OPERACIONAL InpPerfil = PERFIL_MODERADO; // [RECOMENDADO] Melhor equilíbrio lucro/segurança para 7 pares Forex
input bool InpAutoRegimeSwitch = true;
input double InpBaseRisk_L1 = 1.25; // [MEIO TERMO RECOMENDADO] Risco base 1.25% por trade ($125 USD em 10k -> Win Cheio = +$293.75 USD)
input double InpMaxAutoRisk = 3.0;   // Teto máximo de risco automático (%)
input double InpVolPartialPct = 50.0;
input double InpTP_Parcial_Multi = 1.0; // [TP1 PARCIAL] 1.0x SL (+1.5% na Parcial)
input double InpTP_Final_Multi = 3.5; // [ALVO ESTRUTURAL] TP2 em 3.5x (+5.25% no TP2 -> Média de +3.5% a +5.0% no trade completo)
input int InpMagic = 111;
input int InpMaxSimultaneousOps = 6; // Trava Global Máxima

input group "=== GESTÃO DE VAGAS (DAY vs SWING) ==="
input int InpMaxDayTrades     = 2; // Limite de posições curtas (H1 / L1)
input int InpMaxFRSwingTrades = 1; // Limite SW para FR L2 (H4)
input int InpMaxFiboTrades    = 1; // Limite SW para Fibo H4

input group "=== ESCUDO ANTI-VIOLINO (CONTROLE DE LOSS) ==="
input int InpMaxConsecLosses = 3;

input group "=== PROTEÇÃO DE TP ==="
input double InpTP_Min_Multi = 0.3;
input double InpTP_Max_Multi = 5.0;

input group "=== FILTRO DE VIABILIDADE (TIRO CURTO) ==="
input double InpMinViableATR_Multi = 1.0;

input group "=== TENDÊNCIA E FLUXO ==="
input bool InpAutoTF = true;             // Seleção Automática de TF por Moeda (Opção C Mestre)
input ENUM_TIMEFRAMES InpTF = PERIOD_H2; // [H2 CAMPEÃO CENÁRIO 3] TF de execução 2 HORAS (H2)
input int InpCandlesToLook = 14;
input bool InpUseTrendFilter = true;
input int InpShortEMA_Period = 9;
input bool InpUseFluxo = false, InpFluxo_GatilhoPrecoce = true, InpFluxo_IgnoreWallStrong = true, InpUseVolumeFilter = true, InpFluxo_UseExhaustion = true; // [OTIMIZADO PROP] Fluxo desativado para máxima assertividade (FR)

input group "=== FALSO ROMPIMENTO (ALTA PRECISÃO) ==="
input bool InpUseFR = true, InpFR_UseRSI = true;
input int InpFR_RSI_Period = 14;
input double InpFR_MagneticZoneATRPct = 15.0;
input bool InpFR_RequireWickRejection = true;
input double InpFR_WickBodyRatio = 0.5;
input double InpFR_WickRangeMinPct = 35.0;
input double InpFR_BodyRangeMinPct = 20.0;
input bool InpFR_RequireQuadrantClose = true; // [PILAR 1] Exigir fechamento no 1/3 extremo (Sniper)
input double InpFR_CloseQuadrantPct = 35.0;   // % máx do range para fechamento (35% = terço extremo)
input double InpFR_MaxPenetrationATR = 0.75;  // [PILAR 2] Teto máx de penetração do falso rompimento (xATR)
input bool InpFR_RequireVolumeAbsorption = true; // [PILAR 3] Exigir absorção de volume na vela de rejeição
input double InpFR_MinVolumeRatio = 0.90;       // Ratio mín de volume vs média (0.90 = 90%)
input bool InpFR_UseStructuralTP2 = true;        // [PILAR 4] TP2 dinâmico no extremo oposto do canal FR
input bool InpFR_AdaptiveRSI = true;
input double InpFR_RSI_LateralRelax = 8.0;
input bool InpFR_NeutralDirByRSI = true;
input double InpFR_NeutralRSI_Sell = 55.0;
input double InpFR_NeutralRSI_Buy = 45.0;
input bool InpFR_ProgressiveZone = true;
input bool InpFR_ZoneCooldown = true;
input int  InpFR_CooldownMinutes = 30; // [R3] Min. entre entradas FR no mesmo nível (0=sem cooldown)
input bool   InpFR_BlockAgainstSuperTrend = true; // [BLINDAGEM 1] Bloqueio contra Super-Tendência (ADX H4 > 30)
input double InpFR_SuperTrend_ADX         = 30.0; // Nível ADX para bloquear contra-tendência
input bool   InpFR_RequireMinWick40       = true; // [BLINDAGEM 2] Pavio de Rejeição Institucional de 40%
input double InpFR_MinWickRatioPct        = 40.0; // Pavio mínimo da vela de rejeição (% do range)
input bool   InpFR_UseMidChannelLock      = true; // [BLINDAGEM 3] Trava de Lucro Dinâmico no Meio do Canal (50%)

input group "=== FR DIRETO (SMART TRAP NA LINHA) ==="
input bool InpFR_Direct_Entries = true;
input double InpFR_Direct_ZoneATRPct = 20.0;
input bool InpFR_Direct_IgnoreFiltros = false; // [SEGURANÇA] Respeita os filtros de RSI, Caixote e Tendência por padrão

input group "=== PROTEÇÃO ==="
input bool InpUseBreakEven = true;
input double InpBE_Trigger_Normal = 0.50, InpBE_Trigger_Fibo = 0.50, InpBE_LockProfitPts = 0.0;
input bool InpBE_UseATRBreathing = true;   // [PILAR 5] BE com respiro dinâmico no 1º gatilho (ATR)
input double InpBE_BreathingATRPct = 20.0; // Distância de respiro do BE (% do ATR)
input bool InpUseTrailStop = true;
input double InpTrail_ATR_Multi = 1.0;

input group "=== FILTROS ADICIONAIS ==="
input bool InpUseADX = true;
input int InpADX_Period = 14; 
input bool InpUseFechamentoMoeda = true;
input double InpPerdaMaximaGlobalPct = 2.5, InpPerdaMaximaMoedaPct = 2.5, InpLucroAlvoMoedaPct = 4.0; // Trava Loss 2.5% (Permite 2 stops cheios) e Meta 4.0%

input group "=== FIBONACCI 2.0 (ALTA PRECISÃO - NÍVEIS 18%, 28%, 38.2%) ==="
input bool   InpUseFiboPullback          = false; // [FIBO 2.0] Desativado (Modo Oficial: APENAS FR 100% Ativo)
input bool   InpSmartFiboSymbolFilter    = false; // [ROTEAMENTO INTELIGENTE] false = Opera FIBO em TODAS as Moedas
input string InpFiboBlockedSymbols       = ""; // Nenhuma moeda bloqueada (FIBO + FR 100% ativas em todas as 6 moedas)
input double InpFibLevel1                = 18.0;  // Nível 1 Sniper (% base C)
input double InpFibLevel2                = 28.0;  // Nível 2 Médio (% base C - entre 18% e 38.2%)
input double InpFibLevel3                = 38.2;  // Nível 3 Clássico (% base C)
input bool   InpUseFiboLevel1            = true;  // Ativar Nível 1 (18.0%)
input bool   InpUseFiboLevel2            = true;  // Ativar Nível 2 (28.0%)
input bool   InpUseFiboLevel3            = true;  // Ativar Nível 3 (38.2%)
input double InpFibMinRange_ATR_Multi    = 2.0;
input double InpFib_MagneticZoneATRPct   = 20.0;
input bool   InpFib_RequireWickRejection = true; // [PILAR 1] Exigir rejeição com pavio no nível Fibo
input bool   InpFib_RequireQuadrantClose = true; // [PILAR 1] Fechamento no 1/3 extremo a favor da tendência
input double InpFib_MaxPenetrationATR    = 0.75; // [PILAR 2] Teto máx de penetração contra o nível Fibo (xATR)
input bool   InpFib_RequireVolumeAbsorption = true; // [PILAR 3] Exigir absorção de volume na retração Fibo
input double InpFib_MinVolumeRatio       = 0.90; // Ratio mín de volume vs média (90%)
input bool   InpFib_UseStructuralTP2     = true; // [PILAR 4] TP2 dinâmico no topo/fundo anterior (0.0%)

input group "=== HORÁRIOS (SMART SCHEDULE) ==="
input bool InpUseSessionFilter = true;
input int InpSessionStartHour = 10;
input int InpSessionEndHour = 22;
input bool InpSession_IgnoreOnSpike = true;
input bool InpCloseDaily = false; // [RECOMENDADO FOREX] Desativado para permitir que posições busquem TP2 completo de noite
input int InpDailyCloseHour = 23;
input int InpDailyCloseMinute = 30;
input int InpFridayCloseHour = 23;
input int InpFridayCloseMinute = 30;

input group "=== OUTROS ==="
input int InpATR_Period = 14;
input double InpAntiExaustao_ATR_Multi = 2.5;
input bool InpShowPanel = true;
input int InpPanelX = 20, InpPanelY = 20, InpPanelFontSize = 9;
input bool InpBlockLowLiquidity = true, InpBlockRollover = true, InpUseDynamicLiquidity = true; 
input int InpMinTickVolume = 20;
input bool InpUseCaixoteFilter = true;
input int InpCaixoteBars = 13;
input double InpCaixoteATR_Multi = 0.8;
input bool InpUseOscillationFilter = true;
input double InpMinATRPts = 30.0; // [RECOMENDADO] 30 pts compatível com EURGBP/EURCHF de baixa volatilidade
input bool InpUseNewsFilter = true;
input int InpNewsMinutesBefore = 30, InpNewsMinutesAfter = 30;
input bool InpSendPushAlert = false, InpLogCSV = true;

input group "=== MODO PROP FIRM (Blue Guardian / FTMO) ==="
// DEIXE false NA CONTA PESSOAL. Ative apenas ao operar em Mesa Proprietária.
input bool   InpPropFirmMode          = true;  // [OTIMIZADO PROP] Ativar Modo Mesa Proprietária
input double InpPropMaxDailyLossPct   = 2.5;   // [MEIO TERMO RECOMENDADO] Perda Diária Máx. Prop 2.5% da conta (-$250 USD em 10k)
input double InpPropFirmDailyLimitPct = 4.0;   // Teto Limite Diário da Mesa (%) (ex: 4.0% Blue Guardian, 5.0% FTMO)
input double InpPropFirmMaxDDLimitPct = 10.0;  // Drawdown Máximo Total da Mesa (%) (10.0% Blue Guardian Trailing DD)
input double InpPropFase1TargetPct    = 10.0;  // Meta Fase 1 Prop Firm (%) (ex: 10.0% Blue Guardian / FTMO)
input double InpPropFase2TargetPct    = 4.0;   // Meta Fase 2 Prop Firm (%) (ex: 4.0% Blue Guardian, 5.0% FTMO)
input double InpPropMaxRiskPct        = 1.25;  // [MEIO TERMO RECOMENDADO] Risco Máx. por Trade 1.25% ($125 USD em 10k)
input int    InpPropMaxPos            = 2;     // [OTIMIZADO PROP] Máx. 2 Posições Simultâneas
input double InpPropConsistencyPct    = 35.0;  // Limite Consistência (% lucro hoje vs período)

#define PANEL_PREFIX "FS9_"
#define ORD_LINE_PFX "SniperOrd_"  // prefixo das linhas customizadas de SL/TP/Entrada
#define PANEL_W 340
#define CLR_BG_BASE      C'11,13,17'
#define CLR_BG_SECTION   C'16,20,26'
#define CLR_BG_CARD      C'20,25,33'
#define CLR_BG_HEADER    C'8,10,14'
#define CLR_BG_BTN       C'24,30,40'
#define CLR_BG_BTN_PAUSE C'24,40,55'
#define CLR_BG_BTN_PANIC C'55,18,18'
#define CLR_LINE_HARD    C'30,38,50'
#define CLR_LINE_SOFT    C'22,28,38'
#define CLR_TXT_PRIMARY  C'230,236,248'
#define CLR_TXT_LABEL    C'108,118,135'
#define CLR_TXT_DIM      C'60,68,80'
#define CLR_TXT_WHITE    C'248,250,255'
#define CLR_TEAL         C'28,170,112'
#define CLR_TEAL_DIM     C'18,80,55'
#define CLR_RED          C'210,68,68'
#define CLR_RED_DIM      C'65,18,18'
#define CLR_AMBER        C'224,155,0'
#define CLR_AMBER_DIM    C'60,40,0'
#define CLR_BLUE         C'52,140,238'
#define CLR_BLUE_DIM     C'14,38,80'
#define CLR_PURPLE       C'138,92,238'
#define CLR_PURPLE_DIM   C'38,18,75'
#define CLR_LIGHT_GRAY   C'180,180,180'
#define CLR_MUTED        C'58,68,82'

//===================================================================
// VARIÁVEIS GLOBAIS DE PERFIL E ESTADO
//===================================================================
ENUM_PERFIL_OPERACIONAL g_CurrentPerfil;
datetime g_InitTime = 0;
double p_ADX_ConsolidationLevel, p_Fluxo_StrongADX;
ENUM_TIMEFRAMES p_FluxoConfirmTF;
double p_FluxoRSI_OB, p_FluxoRSI_OS, p_FluxoFR_MinDistFactor;
int p_CooldownBars, p_CanalFluxoBars, p_PA_Criterios;
bool p_UseMedTrendDirFR, p_UseTrendDirFibo, p_UsePassaFiltroADXFibo;
double p_FR_RSI_OB, p_FR_RSI_OS;
ENUM_FR_MODE p_ProfileFRMode;
double cfg_ADX_MinLevel, cfg_RSI_Overbought, cfg_RSI_Oversold, cfg_EMA_DistFactor, cfg_SpreadFactor;
int cfg_RSI_Period, cfg_EMA_Candles;

string g_Log[3] = {"Aguardando mercado...", "---", "---"};
bool g_BotPaused = false, g_Minimized = false, g_ViewFluxo = true, g_ViewFR = true, g_ViewFibo = true, g_ViewZonas = false, g_ModoAnalise = false;
int g_ModoConfluencia = 3; // [MOD] Padrao H2 (Market Glance CONSERVADOR)
bool g_ReadyFluxo = false, g_ReadyFR = false, g_ReadyFR_Sell = false, g_ReadyFR_Buy = false, g_ReadyFibo = false, g_FluxoParedeAtiva = false;
int g_LinhasModo = 0; // [PADRÃO] Modo TODAS as linhas ativado por padrão
bool g_ColPosicao = false, g_ColTerminal = false, g_ShowDiag = false, g_ShowPropFirmHUD = false, g_ShowConfigPanel = false;
bool g_AutoTF = false;
double g_PropMaxRiskPct = 1.2;
int g_DiagTab = 0;
CTrade trade;

ENUM_TIMEFRAMES TF_L2;
ENUM_TIMEFRAMES g_TF_L1;  // [AUTO-TF] TF de execução efetivo (pode diferir de InpTF)

int hATR_L1 = INVALID_HANDLE, hADX_L1 = INVALID_HANDLE, hShortEMA_L1 = INVALID_HANDLE;
int hEMA_L1 = INVALID_HANDLE, hMedEMA_L1 = INVALID_HANDLE, hRSI_L1 = INVALID_HANDLE;

int hATR_L2 = INVALID_HANDLE, hADX_L2 = INVALID_HANDLE, hShortEMA_L2 = INVALID_HANDLE;
int hEMA_L2 = INVALID_HANDLE, hMedEMA_L2 = INVALID_HANDLE, hRSI_L2 = INVALID_HANDLE;

int hATR_H4 = INVALID_HANDLE, hADX_H4 = INVALID_HANDLE;
int hShortEMA_H4 = INVALID_HANDLE, hEMA_H4 = INVALID_HANDLE;

int hATR_D1 = INVALID_HANDLE, hADX_D1 = INVALID_HANDLE;
int hShortEMA_D1 = INVALID_HANDLE, hEMA_D1 = INVALID_HANDLE;

string g_GV_Blocked = "", g_GV_GlobalBlock = "Sniper_GlobalBlock", g_GV_GlobalDay = "Sniper_GlobalDay";
bool g_LocalGlobalBlock = false, g_LocalBlocked = false, g_LocalConsolidation = false;
int g_LocalGlobalDay = -1;
ENUM_FILTER_MODE g_ActiveFilterMode = FILTER_MEIO_TERMO;
ENUM_FR_MODE g_ActiveFRMode = FR_CONSERVADOR;

datetime l1_fr_buy = 0, l1_fr_sell = 0, l2_fr_buy = 0, l2_fr_sell = 0;
datetime l1_fr_buy_ts = 0, l1_fr_sell_ts = 0, l2_fr_buy_ts = 0, l2_fr_sell_ts = 0; // [R3] Timestamps para cooldown FR por tempo
double   g_StartBalance   = 0;                  // [PROP] Saldo inicial para cálculo de consistência
double   g_ConsistencyPct = 0;                  // [PROP] % do lucro de hoje vs total do período
datetime l1_frd_buy = 0, l1_frd_sell = 0, l2_frd_buy = 0, l2_frd_sell = 0;
datetime l1_flx_buy = 0, l1_flx_sell = 0;
datetime f_h4_buy = 0, f_h4_sell = 0;
datetime l_fibo_buy_ts = 0, l_fibo_sell_ts = 0; // [COOLDOWN FIBO] Previne overtrading

int g_PanelHeight = 460;
datetime g_CacheBarTime = 0;

double g_CachedADX = 0, g_CachedRSI = 0, g_CachedATR = 0;
int g_CachedTrendDir = 0, g_CachedMedDir = 0;
double g_CachedSlPts = 350, g_CachedGatPts = 87, g_CachedBePts = 175, g_CachedLot = 0.01;
double g_CachedCanalHigh = 0, g_CachedCanalLow = 0;
double g_CachedFRTop = 0, g_CachedFRFundo = 0;
bool g_CachedFluxoCdOk = true, g_CachedFrCdOk = true;

int g_CachedFluxoL = 0, g_CachedFrL = 0, g_CachedFiboL = 0;
double g_CachedFiboH = 0, g_CachedFiboLow = 0, g_CachedFiboATR = 0;
bool g_CachedFiboCdOk = true;

double g_L2_ADX = 0, g_L2_RSI = 0, g_L2_ATR = 0;
int g_L2_TrendDir = 0, g_L2_MedDir = 0;
double g_H4_ADX = 0;

double g_CachedPlSymReal = 0, g_CachedPlTotReal = 0;
double g_FloatingPlSym = 0, g_FloatingPlTot = 0;
int g_CachedMaxSpread = 40;
double g_CachedVolMed = 0, g_CachedVolMed_L2 = 0;

double g_FastPlFloat = 0;
int g_FastSpread = 0, g_FastSecsNext = 0, g_FastNPos = 0, g_FastNPosSymbol = 0;
int g_NPosDay = 0, g_NPosSwing = 0, g_NPosSwingFR = 0, g_NPosSwingFibo = 0; // Contadores de Vagas

int g_FluxoWins = 0, g_FluxoTotal = 0, g_FrWins = 0, g_FrTotal = 0, g_FiboWins = 0, g_FiboTotal = 0;
bool g_CachedNoticiaBlock = false;
datetime g_LastNewsCheckTime = 0, g_ProximaNoticiaTime = 0;
string g_ProximaNoticiaName = "", g_TooltipNoticias = "", g_PanelHash = "";

//===================================================================
// FUNÇÕES UTILITÁRIAS BASE
//===================================================================
void AddLog(string msg) {
   g_Log[2] = g_Log[1]; g_Log[1] = g_Log[0];
   g_Log[0] = TimeToString(TimeCurrent(), TIME_SECONDS) + " " + msg;
   if(InpSendPushAlert && (StringFind(msg,"COMPRA")>=0 || StringFind(msg,"VENDA")>=0 ||
      StringFind(msg,"BLOQUEADO")>=0 || StringFind(msg,"PANICO")>=0))
      SendNotification(_Symbol + " | " + msg);
}

string MQLProgressBar(double pt_atual, double limite, int width = 10) {
   if(limite <= 0) return "[          ]";
   double pct = MathMax(0.0, MathMin(1.0, MathAbs(pt_atual) / limite));
   int blocks = (int)MathRound(pct * width);
   string res = "[";
   for(int i = 0; i < width; i++) res += (i < blocks) ? "=" : "-";
   return res + "]";
}

string GetMktSession() {
   MqlDateTime dt; TimeGMT(dt); int h = dt.hour;
   if(h >= 22 || h < 7)  return "SYDNEY/TOKYO";
   if(h >= 7  && h < 12) return "LONDRES";
   if(h >= 12 && h < 16) return "LONDRES/NY";
   if(h >= 16 && h < 22) return "NOVA YORK";
   return "---";
}

bool IsMercadoLateral() { return (g_CachedADX < p_ADX_ConsolidationLevel); }

double CalcularTP_Estrutural(double pts_to_target, double sl_pts, double tp_min, double tp_max, double tp_fallback) {
   if(sl_pts <= 0) return tp_fallback;
   double mult = (pts_to_target * 0.5) / sl_pts; // [OTIMIZAÇÃO 50%] TP1 projetado na metade exata da distância do alvo
   return MathMax(tp_min, MathMin(tp_max, mult));
}

//===================================================================
// SANITIZAÇÃO E BLINDAGEM DE ATR CONTRA GLITCHES E HANDLES INVÁLIDOS
//===================================================================
double SanitizeATR(double atr, ENUM_TIMEFRAMES tf = PERIOD_CURRENT) {
   double pt = _Point;
   if(pt <= 0) pt = 0.00001;
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(bid <= 0) bid = 1.0;
   
   // ATR válido em Forex/Ativos não pode ser negativo nem maior que 5% da cotação
   double max_valid_atr = bid * 0.05;
   if(atr > 0 && atr <= max_valid_atr) return atr;
   
   // Fallback seguro: range da vela anterior
   double prev_range = iHigh(_Symbol, tf, 1) - iLow(_Symbol, tf, 1);
   if(prev_range > 0 && prev_range <= max_valid_atr) return prev_range;
   
   return 25.0 * pt; // 25 pips padrão de segurança
}

bool PassaFiltroADX() {
   if(!InpUseADX) return true;
   if(g_LocalConsolidation) return false;
   return (g_CachedADX >= cfg_ADX_MinLevel);
}

//===================================================================
// [NOVO] MOTOR DE LOTE PROPORCIONAL À DISTÂNCIA (RISK AUTO-SCALING)
//===================================================================
double ComputeLot_ByDistance(double current_sl_pts, double current_atr) {
   double vol_min = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   if(vol_min <= 0) vol_min = 0.01;
   if(current_sl_pts <= 0) return vol_min;
   
   // [ITEM C FIX: GESTÃO DE RISCO RIGOROSA]
   // O risco financeiro em dólares é fixado pelo percentual de banca (ex: InpBaseRisk_L1 = 0.5% ou 1.5%).
   // Como o denominador divide por current_sl_pts, o lote se ajusta de forma perfeitamente proporcional à distância do SL sem distorções entre TFs.
   // [CORREÇÃO ITEM 2]: InpMaxAutoRisk atua como teto máximo de risco em todos os modos operacionais
   double max_risk_cap = (InpPropFirmMode && g_PropMaxRiskPct > 0) ? MathMin(InpMaxAutoRisk, g_PropMaxRiskPct) : InpMaxAutoRisk;
   double risk_pct = MathMin(InpBaseRisk_L1, max_risk_cap);
   double risk_money = AccountInfoDouble(ACCOUNT_BALANCE) * (risk_pct / 100.0);
   
   double tv = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double ts = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tv <= 0 || ts <= 0) return vol_min;
   
   double step    = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(step <= 0) step = 0.01;
   double vol_max = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   if(vol_max <= 0) vol_max = 100.0;

   double lot = MathFloor((risk_money / ((current_sl_pts * _Point / ts) * tv)) / step) * step;
   return MathMax(MathMin(lot, vol_max), vol_min);
}

//===================================================================
// INICIALIZAÇÃO DE HANDLES
//===================================================================
void LiberarTodosHandles() {
   int handles[] = {hATR_L1, hADX_L1, hShortEMA_L1, hEMA_L1, hMedEMA_L1, hRSI_L1,
                    hATR_L2, hADX_L2, hShortEMA_L2, hEMA_L2, hMedEMA_L2, hRSI_L2,
                    hATR_H4, hADX_H4, hShortEMA_H4, hEMA_H4,
                    hATR_D1, hADX_D1, hShortEMA_D1, hEMA_D1};
   for(int i = 0; i < ArraySize(handles); i++) {
      if(handles[i] != INVALID_HANDLE) { IndicatorRelease(handles[i]); }
   }
   hATR_L1=INVALID_HANDLE; hADX_L1=INVALID_HANDLE; hShortEMA_L1=INVALID_HANDLE; hEMA_L1=INVALID_HANDLE; hMedEMA_L1=INVALID_HANDLE; hRSI_L1=INVALID_HANDLE;
   hATR_L2=INVALID_HANDLE; hADX_L2=INVALID_HANDLE; hShortEMA_L2=INVALID_HANDLE; hEMA_L2=INVALID_HANDLE; hMedEMA_L2=INVALID_HANDLE; hRSI_L2=INVALID_HANDLE;
   hATR_H4=INVALID_HANDLE; hADX_H4=INVALID_HANDLE; hShortEMA_H4=INVALID_HANDLE; hEMA_H4=INVALID_HANDLE;
   hATR_D1=INVALID_HANDLE; hADX_D1=INVALID_HANDLE; hShortEMA_D1=INVALID_HANDLE; hEMA_D1=INVALID_HANDLE;
}

//===================================================================
// [AUTO-TF] DETECCAO AUTOMATICA DE TIMEFRAME POR SIMBOLO (PADRÃO H2 UNIFICADO)
//===================================================================
void AutoSelecionarTF()
{
   if(!InpAutoTF) {
      g_TF_L1 = InpTF;
      TF_L2   = (g_TF_L1 == PERIOD_H1 || g_TF_L1 < PERIOD_H4) ? PERIOD_H4 : PERIOD_D1;
      return;
   }
   
   string sym = _Symbol;
   StringToUpper(sym);
   // Sanitização robusta para contas com sufixos de corretora (ex: .pro, _raw, .r, .a, m)
   StringReplace(sym, ".PRO", ""); StringReplace(sym, "_RAW", "");
   StringReplace(sym, ".RAW", ""); StringReplace(sym, ".R",   "");
   StringReplace(sym, ".A",   ""); StringReplace(sym, "_SB",  "");
   StringReplace(sym, ".",    "");
   if(StringLen(sym) > 6 && StringSubstr(sym, 6) == "M") sym = StringSubstr(sym, 0, 6);
   
   // [H2 UNIFICADO CAMPEÃO] Todos os 7 pares de elite operam no H2 com filtro H4
   g_TF_L1 = PERIOD_H2;
   TF_L2   = PERIOD_H4;
}


bool InicializarHandles() {
   LiberarTodosHandles();
   hATR_L1      = iATR(_Symbol, g_TF_L1, InpATR_Period);
   hADX_L1      = iADX(_Symbol, g_TF_L1, InpADX_Period);
   hShortEMA_L1 = iMA(_Symbol, g_TF_L1, InpShortEMA_Period, 0, MODE_EMA, PRICE_CLOSE);

   hATR_L2      = iATR(_Symbol, TF_L2, InpATR_Period);
   hADX_L2      = iADX(_Symbol, TF_L2, InpADX_Period);
   hShortEMA_L2 = iMA(_Symbol, TF_L2, InpShortEMA_Period, 0, MODE_EMA, PRICE_CLOSE);

   hATR_H4      = iATR(_Symbol, PERIOD_H4, InpATR_Period);
   hADX_H4      = iADX(_Symbol, PERIOD_H4, InpADX_Period);
   hShortEMA_H4 = iMA(_Symbol, PERIOD_H4, InpShortEMA_Period, 0, MODE_EMA, PRICE_CLOSE);

   hATR_D1      = iATR(_Symbol, PERIOD_D1, InpATR_Period);
   hADX_D1      = iADX(_Symbol, PERIOD_D1, InpADX_Period);
   hShortEMA_D1 = iMA(_Symbol, PERIOD_D1, InpShortEMA_Period, 0, MODE_EMA, PRICE_CLOSE);

   return (hATR_L1 != INVALID_HANDLE && hADX_L1 != INVALID_HANDLE &&
           hShortEMA_L1 != INVALID_HANDLE && hATR_H4 != INVALID_HANDLE);
}

//===================================================================
// APLICAR MODO FILTRO E PERFIL
//===================================================================
void AplicarModoFiltro(ENUM_FILTER_MODE mode) {
   if(g_ActiveFilterMode == mode && hRSI_L1 != INVALID_HANDLE && hRSI_L2 != INVALID_HANDLE) return;
   g_ActiveFilterMode = mode;
   int old_rsi_period = cfg_RSI_Period;
   switch(mode) {
      case FILTER_ATUAL:
         cfg_ADX_MinLevel=12.0; cfg_RSI_Overbought=60.0; cfg_RSI_Oversold=40.0;
         cfg_RSI_Period=7; cfg_EMA_Candles=1; cfg_EMA_DistFactor=0.0; cfg_SpreadFactor=0.30; break;
      case FILTER_MEIO_TERMO:
         cfg_ADX_MinLevel=18.0; cfg_RSI_Overbought=63.0; cfg_RSI_Oversold=37.0;
         cfg_RSI_Period=9; cfg_EMA_Candles=2; cfg_EMA_DistFactor=0.05; cfg_SpreadFactor=0.25; break;
      case FILTER_MAXIMO:
         cfg_ADX_MinLevel=25.0; cfg_RSI_Overbought=68.0; cfg_RSI_Oversold=32.0;
         cfg_RSI_Period=14; cfg_EMA_Candles=3; cfg_EMA_DistFactor=0.10; cfg_SpreadFactor=0.20; break;
   }
   if(old_rsi_period != cfg_RSI_Period || hRSI_L1 == INVALID_HANDLE || hRSI_L2 == INVALID_HANDLE) {
      if(hRSI_L1 != INVALID_HANDLE) { IndicatorRelease(hRSI_L1); hRSI_L1 = INVALID_HANDLE; }
      if(hRSI_L2 != INVALID_HANDLE) { IndicatorRelease(hRSI_L2); hRSI_L2 = INVALID_HANDLE; }
      hRSI_L1 = iRSI(_Symbol, g_TF_L1, cfg_RSI_Period, PRICE_CLOSE);
      hRSI_L2 = iRSI(_Symbol, TF_L2,   cfg_RSI_Period, PRICE_CLOSE);
   }
   g_CacheBarTime = 0;
}

void AplicarPerfil(ENUM_PERFIL_OPERACIONAL perfil) {
   // [B01 FIX] Libera as globais diretamente — array local nao propaga INVALID_HANDLE
   if(hEMA_L1    != INVALID_HANDLE) { IndicatorRelease(hEMA_L1);    hEMA_L1    = INVALID_HANDLE; }
   if(hMedEMA_L1 != INVALID_HANDLE) { IndicatorRelease(hMedEMA_L1); hMedEMA_L1 = INVALID_HANDLE; }
   if(hEMA_L2    != INVALID_HANDLE) { IndicatorRelease(hEMA_L2);    hEMA_L2    = INVALID_HANDLE; }
   if(hMedEMA_L2 != INVALID_HANDLE) { IndicatorRelease(hMedEMA_L2); hMedEMA_L2 = INVALID_HANDLE; }
   if(hEMA_H4    != INVALID_HANDLE) { IndicatorRelease(hEMA_H4);    hEMA_H4    = INVALID_HANDLE; }
   if(hEMA_D1    != INVALID_HANDLE) { IndicatorRelease(hEMA_D1);    hEMA_D1    = INVALID_HANDLE; }

   switch(perfil) {
      case PERFIL_CONSERVADOR:
         p_ADX_ConsolidationLevel=30.0; p_Fluxo_StrongADX=40.0; p_FluxoConfirmTF=PERIOD_M30;
         p_FluxoRSI_OB=80.0; p_FluxoRSI_OS=20.0; p_FluxoFR_MinDistFactor=0.75;
         p_CanalFluxoBars=6; p_UseMedTrendDirFR=true; p_UseTrendDirFibo=true; p_UsePassaFiltroADXFibo=true;
         hEMA_L1    = iMA(_Symbol, g_TF_L1,   200, 0, MODE_EMA, PRICE_CLOSE);
         hMedEMA_L1 = iMA(_Symbol, g_TF_L1,    72, 0, MODE_EMA, PRICE_CLOSE);
         hEMA_L2    = iMA(_Symbol, TF_L2,      200, 0, MODE_EMA, PRICE_CLOSE);
         hMedEMA_L2 = iMA(_Symbol, TF_L2,       72, 0, MODE_EMA, PRICE_CLOSE);
         hEMA_H4    = iMA(_Symbol, PERIOD_H4, 200, 0, MODE_EMA, PRICE_CLOSE);
         hEMA_D1    = iMA(_Symbol, PERIOD_D1, 200, 0, MODE_EMA, PRICE_CLOSE);
         p_PA_Criterios=3; p_ProfileFRMode=FR_CONSERVADOR; p_FR_RSI_OB=70.0; p_FR_RSI_OS=30.0; p_CooldownBars=3;
         AplicarModoFiltro(FILTER_MAXIMO); break;

      case PERFIL_MODERADO:
         p_ADX_ConsolidationLevel=26.0; p_Fluxo_StrongADX=35.0; p_FluxoConfirmTF=PERIOD_M15;
         p_FluxoRSI_OB=85.0; p_FluxoRSI_OS=15.0; p_FluxoFR_MinDistFactor=0.50;
         p_CanalFluxoBars=6; p_UseMedTrendDirFR=true; p_UseTrendDirFibo=true; p_UsePassaFiltroADXFibo=true;
         hEMA_L1    = iMA(_Symbol, g_TF_L1,   144, 0, MODE_EMA, PRICE_CLOSE);
         hMedEMA_L1 = iMA(_Symbol, g_TF_L1,    50, 0, MODE_EMA, PRICE_CLOSE);
         hEMA_L2    = iMA(_Symbol, TF_L2,      144, 0, MODE_EMA, PRICE_CLOSE);
         hMedEMA_L2 = iMA(_Symbol, TF_L2,       50, 0, MODE_EMA, PRICE_CLOSE);
         hEMA_H4    = iMA(_Symbol, PERIOD_H4, 144, 0, MODE_EMA, PRICE_CLOSE);
         hEMA_D1    = iMA(_Symbol, PERIOD_D1, 144, 0, MODE_EMA, PRICE_CLOSE);
         p_PA_Criterios=2; p_ProfileFRMode=FR_CONSERVADOR; p_FR_RSI_OB=75.0; p_FR_RSI_OS=25.0; p_CooldownBars=2;
         AplicarModoFiltro(FILTER_MEIO_TERMO); break;

      case PERFIL_AGRESSIVO:
         p_ADX_ConsolidationLevel=24.0; p_Fluxo_StrongADX=30.0; p_FluxoConfirmTF=PERIOD_M5;
         p_FluxoRSI_OB=90.0; p_FluxoRSI_OS=10.0; p_FluxoFR_MinDistFactor=0.25;
         p_CanalFluxoBars=3; p_UseMedTrendDirFR=true; p_UseTrendDirFibo=true; p_UsePassaFiltroADXFibo=true;
         hEMA_L1    = iMA(_Symbol, g_TF_L1,    72, 0, MODE_EMA, PRICE_CLOSE);
         hMedEMA_L1 = iMA(_Symbol, g_TF_L1,    21, 0, MODE_EMA, PRICE_CLOSE);
         hEMA_L2    = iMA(_Symbol, TF_L2,       72, 0, MODE_EMA, PRICE_CLOSE);
         hMedEMA_L2 = iMA(_Symbol, TF_L2,       21, 0, MODE_EMA, PRICE_CLOSE);
         hEMA_H4    = iMA(_Symbol, PERIOD_H4,   72, 0, MODE_EMA, PRICE_CLOSE);
         hEMA_D1    = iMA(_Symbol, PERIOD_D1,   72, 0, MODE_EMA, PRICE_CLOSE);
         p_PA_Criterios=1; p_ProfileFRMode=FR_AGRESSIVO; p_FR_RSI_OB=80.0; p_FR_RSI_OS=20.0; p_CooldownBars=1;
         AplicarModoFiltro(FILTER_ATUAL); break;
   }
   g_ActiveFRMode = p_ProfileFRMode;
   g_CacheBarTime = 0;
}

void VerificarRegimeDeMercado() {
   if(!InpAutoRegimeSwitch) return;
   static datetime s_last_regime_switch = 0;
   if(TimeCurrent() - s_last_regime_switch < 5) return; // Debounce de 5s contra oscilações rápidas tick a tick
   
   if(IsMercadoLateral()) {
      if(g_ActiveFilterMode != FILTER_MAXIMO) {
         s_last_regime_switch = TimeCurrent();
         g_ActiveFRMode = FR_CONSERVADOR; 
         AplicarModoFiltro(FILTER_MAXIMO); 
         AddLog(g_LocalConsolidation ? "Regime CAIXOTE ativado." : "Regime LATERAL ativado.");
      }
   } else {
      ENUM_FILTER_MODE pf = (g_CurrentPerfil == PERFIL_CONSERVADOR) ? FILTER_MAXIMO : (g_CurrentPerfil == PERFIL_MODERADO)    ? FILTER_MEIO_TERMO : FILTER_ATUAL;
      if(g_ActiveFilterMode != pf) {
         s_last_regime_switch = TimeCurrent();
         g_ActiveFRMode = p_ProfileFRMode; 
         AplicarModoFiltro(pf); 
         AddLog("Regime DIRECIONAL retomado.");
      }
   }
}

//===================================================================
// FUNÇÕES DE POSIÇÃO E HISTÓRICO
//===================================================================
bool JaExistePosicaoDaEstrategia(string tipo) {
   for(int i = PositionsTotal()-1; i >= 0; i--)
      if(PositionSelectByTicket(PositionGetTicket(i)))
         if(PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagic)
            if(StringFind(PositionGetString(POSITION_COMMENT), tipo) >= 0) return true;
   return false;
}

void FecharPosicoesDoSymbol() {
   for(int i = PositionsTotal()-1; i >= 0; i--) {
      ulong t = PositionGetTicket(i);
      if(t > 0 && PositionSelectByTicket(t) && PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagic) trade.PositionClose(t);
   }
}

void FecharTodasPosicoesDoRobo() {
   for(int i = PositionsTotal()-1; i >= 0; i--) {
      ulong t = PositionGetTicket(i);
      if(t > 0 && PositionSelectByTicket(t) && PositionGetInteger(POSITION_MAGIC) == InpMagic) trade.PositionClose(t);
   }
}

void FecharDayTradesDoSymbol() {
   for(int i = PositionsTotal()-1; i >= 0; i--) {
      ulong t = PositionGetTicket(i);
      if(t > 0 && PositionSelectByTicket(t) && PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagic) {
         string comm = PositionGetString(POSITION_COMMENT);
         if(StringFind(comm, "_L1") >= 0) {
            trade.PositionClose(t);
            AddLog("Fechamento Seletivo: Ordem DayTrade (_L1) encerrada no fim do dia.");
         }
      }
   }
}

// Fecha APENAS posições DayTrade (_L1) que estão em LUCRO.
// Posições em prejuízo permanecem abertas até o SL/TP natural.
void FecharDayTradesLucroDoSymbol() {
   for(int i = PositionsTotal()-1; i >= 0; i--) {
      ulong t = PositionGetTicket(i);
      if(t <= 0 || !PositionSelectByTicket(t)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      string comm = PositionGetString(POSITION_COMMENT);
      if(StringFind(comm, "_L1") < 0) continue;
      double pl = PositionGetDouble(POSITION_PROFIT) + PositionGetDouble(POSITION_SWAP);
      if(pl > 0) {
         trade.PositionClose(t);
         AddLog(StringFormat("Fim do Dia: DayTrade em lucro (%.2f) encerrado.", pl));
      } else {
         AddLog(StringFormat("Fim do Dia: DayTrade em prejuízo (%.2f) MANTIDO.", pl));
      }
   }
}

void ResetDiario() {
   MqlDateTime dt; TimeCurrent(dt); int dia = dt.day;
   if(g_LocalGlobalDay != dia) {
      g_LocalGlobalDay = dia; g_LocalGlobalBlock = false; g_LocalBlocked = false;
      if(g_BotPaused && StringFind(g_Log[0], "Teto Diário") >= 0) { g_BotPaused = false; AddLog("Retomada diária automática."); }
      GlobalVariableSet(g_GV_GlobalDay, dia); GlobalVariableSet(g_GV_GlobalBlock, 0); GlobalVariableSet(g_GV_Blocked, 0);
   }
}

void ComputeWinRate(string filter, int &wins, int &total) {
   wins = 0; total = 0;
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   dt.hour = 0; dt.min = 0; dt.sec = 0;
   HistorySelect(StructToTime(dt), TimeCurrent() + 1);
   for(int i = 0; i < HistoryDealsTotal(); i++) {
      ulong tk = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(tk,DEAL_ENTRY) != DEAL_ENTRY_OUT || HistoryDealGetInteger(tk,DEAL_MAGIC) != InpMagic || HistoryDealGetString(tk,DEAL_SYMBOL) != _Symbol) continue;
      if(StringFind(HistoryDealGetString(tk, DEAL_COMMENT), filter) < 0) continue;
      double p = HistoryDealGetDouble(tk, DEAL_PROFIT) + HistoryDealGetDouble(tk, DEAL_SWAP) + HistoryDealGetDouble(tk, DEAL_COMMISSION);
      total++; if(p > 0) wins++;
   }
}

void ScanPLHoje(double &sym_out, double &tot_out) {
   MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
   dt.hour = 0; dt.min = 0; dt.sec = 0;
   HistorySelect(StructToTime(dt), TimeCurrent() + 1);
   sym_out = 0; tot_out = 0;
   for(int i = HistoryDealsTotal()-1; i >= 0; i--) {
      ulong tk = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(tk,DEAL_ENTRY) != DEAL_ENTRY_OUT || HistoryDealGetInteger(tk,DEAL_MAGIC) != InpMagic) continue;
      double p = HistoryDealGetDouble(tk, DEAL_PROFIT) + HistoryDealGetDouble(tk, DEAL_SWAP) + HistoryDealGetDouble(tk, DEAL_COMMISSION);
      tot_out += p;
      if(HistoryDealGetString(tk, DEAL_SYMBOL) == _Symbol) sym_out += p;
   }
}

void RefreshFastCache() {
   g_FastSpread    = (int)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   g_FastSecsNext  = PeriodSeconds(g_TF_L1) - (int)(TimeCurrent() % PeriodSeconds(g_TF_L1));
   g_LocalGlobalBlock = (GlobalVariableGet(g_GV_GlobalBlock) == 1.0);
   g_LocalBlocked     = (GlobalVariableGet(g_GV_Blocked) == 1.0);
   g_LocalGlobalDay   = (int)GlobalVariableGet(g_GV_GlobalDay);

   // [FIX-01] Recontagem de posições e P&L flutuante a cada segundo.
   // Antes desta correção, g_FloatingPlSym/Tot eram SEMPRE ZERO,
   // tornando as travas financeiras cegas para drawdown flutuante.
   g_FastNPos = 0; g_FastNPosSymbol = 0; g_FastPlFloat = 0;
   g_FloatingPlSym = 0; g_FloatingPlTot = 0;
   g_NPosDay = 0; g_NPosSwing = 0; g_NPosSwingFR = 0; g_NPosSwingFibo = 0;

   // [CORREÇÃO ITEM 3]: Agrupamento inteligente de sinais lógicos (evita que P1 + P2 consuma 2 vagas)
   string seen_signals[];
   int seen_count = 0;

   for(int _i = PositionsTotal()-1; _i >= 0; _i--) {
      ulong _tk = PositionGetTicket(_i);
      if(!PositionSelectByTicket(_tk)
         || PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      
      double _pl = PositionGetDouble(POSITION_PROFIT)
                 + PositionGetDouble(POSITION_SWAP);
      g_FloatingPlTot += _pl;

      string p_sym  = PositionGetString(POSITION_SYMBOL);
      string p_comm = PositionGetString(POSITION_COMMENT);
      
      // Cria chave única do sinal removendo sufixos de parcial (_P1, _P2)
      string base_comm = p_comm;
      StringReplace(base_comm, "_P1", "");
      StringReplace(base_comm, "_P2", "");
      string sig_key = p_sym + "|" + base_comm;

      bool already_counted = false;
      for(int k = 0; k < seen_count; k++) {
         if(seen_signals[k] == sig_key) { already_counted = true; break; }
      }

      if(!already_counted) {
         ArrayResize(seen_signals, seen_count + 1);
         seen_signals[seen_count++] = sig_key;
         g_FastNPos++;
      }

      if(p_sym == _Symbol) {
         g_FastPlFloat  += _pl;
         g_FloatingPlSym += _pl;
         if(!already_counted) {
            g_FastNPosSymbol++;
            if(StringFind(p_comm, "_L1") >= 0) {
               g_NPosDay++;
            } else {
               g_NPosSwing++;
               if(StringFind(p_comm, "FR") >= 0)        g_NPosSwingFR++;
               else if(StringFind(p_comm, "Fibo") >= 0) g_NPosSwingFibo++;
            }
         }
      }
   }
}

int GetStrategyLossStatus_ByTag(string filter1, string filter2="", string excludeFilter="") {
   int losses = 0;
   static datetime last_hs_time = 0;
   if(TimeCurrent() - last_hs_time > 1) {
       HistorySelect(TimeCurrent() - (86400*3), TimeCurrent() + 1);
       last_hs_time = TimeCurrent();
   }
   
   ulong processed_pos[32];
   datetime processed_open_times[32];
   int proc_count = 0;
   
   for(int i = HistoryDealsTotal()-1; i >= 0; i--) {
      ulong tk = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(tk, DEAL_ENTRY) != DEAL_ENTRY_OUT || 
         HistoryDealGetInteger(tk, DEAL_MAGIC) != InpMagic || 
         HistoryDealGetString(tk, DEAL_SYMBOL) != _Symbol) continue;
      
      ulong pos_id = HistoryDealGetInteger(tk, DEAL_POSITION_ID);
      
      bool already_proc = false;
      for(int p_idx = 0; p_idx < proc_count; p_idx++) {
         if(processed_pos[p_idx] == pos_id) { already_proc = true; break; }
      }
      if(already_proc) continue;
      
      string comm = HistoryDealGetString(tk, DEAL_COMMENT);
      datetime in_time = (datetime)HistoryDealGetInteger(tk, DEAL_TIME);
      
      // [ITEM B FIX] Se o deal de saída foi rotulado pelo MT5 como [sl ...] ou [tp ...], busca a tag original e timestamp no deal de entrada
      if(pos_id > 0) {
         for(int j = HistoryDealsTotal()-1; j >= 0; j--) {
            ulong in_tk = HistoryDealGetTicket(j);
            if(HistoryDealGetInteger(in_tk, DEAL_POSITION_ID) == pos_id && HistoryDealGetInteger(in_tk, DEAL_ENTRY) == DEAL_ENTRY_IN) {
               comm = HistoryDealGetString(in_tk, DEAL_COMMENT);
               in_time = (datetime)HistoryDealGetInteger(in_tk, DEAL_TIME);
               break;
            }
         }
      }
      
      if(StringFind(comm, filter1) < 0) continue;
      if(filter2 != "" && StringFind(comm, filter2) < 0) continue;
      if(excludeFilter != "" && StringFind(comm, excludeFilter) >= 0) continue;
      
      // Agrupamento de P1 e P2: se ambas foram abertas no mesmo trade (dentro de 15 segundos), conta como 1 único loss
      bool same_trade_group = false;
      for(int p_idx = 0; p_idx < proc_count; p_idx++) {
         if(MathAbs(processed_open_times[p_idx] - in_time) <= 15) { same_trade_group = true; break; }
      }
      
      if(proc_count < 32) {
         processed_pos[proc_count] = pos_id;
         processed_open_times[proc_count] = in_time;
         proc_count++;
      }
      
      double p = HistoryDealGetDouble(tk, DEAL_PROFIT) + HistoryDealGetDouble(tk, DEAL_SWAP) + HistoryDealGetDouble(tk, DEAL_COMMISSION);
      if(p < -0.01) {
         if(!same_trade_group) losses++;
      } else if(p >= -0.01) {
         break;
      }
   }
   return losses;
}

int ComputeTrendDir(int hShort, int hLong) {
   double s[], l[]; ArraySetAsSeries(s, true); ArraySetAsSeries(l, true);
   if(CopyBuffer(hShort,0,1,1,s) <= 0 || CopyBuffer(hLong,0,1,1,l) <= 0) return 0;
   if(s[0] > l[0]) return 1; if(s[0] < l[0]) return -1; return 0;
}

//===================================================================
// REFRESH CACHE DA BARRA E AUTOMATIZAÇÃO DE LOTE
//===================================================================
void RefreshBarCache() {
   datetime cb = iTime(_Symbol, g_TF_L1, 0);
   if(cb == g_CacheBarTime) return;
   bool all_copied = true;

   double b_adx[], b_rsi[], b_atr[];
   ArraySetAsSeries(b_adx, true); ArraySetAsSeries(b_rsi, true); ArraySetAsSeries(b_atr, true);

   if(CopyBuffer(hADX_L1, 0, 1, 1, b_adx) > 0) g_CachedADX = b_adx[0]; else all_copied = false;
   if(CopyBuffer(hRSI_L1, 0, 1, 1, b_rsi) > 0) g_CachedRSI = b_rsi[0]; else all_copied = false;
   if(CopyBuffer(hATR_L1, 0, 1, 1, b_atr) > 0) g_CachedATR = SanitizeATR(b_atr[0], g_TF_L1); else all_copied = false;

   g_CachedTrendDir = ComputeTrendDir(hShortEMA_L1, hEMA_L1);
   g_CachedMedDir   = ComputeTrendDir(hShortEMA_L1, hMedEMA_L1);

   if(g_CachedATR > 0) {
      g_CachedSlPts   = (g_CachedATR / _Point) * 1.5;
      g_CachedGatPts  = g_CachedSlPts * 0.25;
      g_CachedBePts   = g_CachedSlPts * InpBE_Trigger_Normal;
      g_CachedMaxSpread = (int)MathCeil((g_CachedATR / _Point) * cfg_SpreadFactor);
      if(g_CachedMaxSpread < 15) g_CachedMaxSpread = 15;
      if(g_CachedMaxSpread > 150) g_CachedMaxSpread = 150;
   }
   
   // [H3 FIX] Usar o range da vela anterior vs ATR para volatilidade relativa no L1
   double curr_range = iHigh(_Symbol, g_TF_L1, 1) - iLow(_Symbol, g_TF_L1, 1);
   double effective_atr = (curr_range > 0) ? (curr_range + g_CachedATR) / 2.0 : g_CachedATR;
   g_CachedLot = ComputeLot_ByDistance(g_CachedSlPts, effective_atr);

   int cdl_fl1 = GetStrategyLossStatus_ByTag("Fluxo_");
   int cdl_fr1 = GetStrategyLossStatus_ByTag("FR_", "", "_L2");
   int cdl_fb1 = GetStrategyLossStatus_ByTag("Fibo_");
   g_CachedFluxoL = cdl_fl1; g_CachedFrL = cdl_fr1; g_CachedFiboL = cdl_fb1;
   g_CachedFluxoCdOk = (cdl_fl1 < InpMaxConsecLosses); 
   g_CachedFrCdOk    = (cdl_fr1 < InpMaxConsecLosses); 
   g_CachedFiboCdOk  = (cdl_fb1 < InpMaxConsecLosses);

   double h_canal[], l_canal[];
   ArraySetAsSeries(h_canal, true); ArraySetAsSeries(l_canal, true);
   int bars_needed = (p_CanalFluxoBars < 1) ? 6 : p_CanalFluxoBars;
   if(CopyHigh(_Symbol,g_TF_L1,2,bars_needed,h_canal)>=bars_needed && CopyLow (_Symbol,g_TF_L1,2,bars_needed,l_canal)>=bars_needed) {
      // [F2] Canal de Qualidade: exclui TODAS as velas spike (range > 1.8×ATR)
      // Melhoria: antes excluía só o 1 maior spike; agora qualquer vela anômala sai
      double spike_thr = (g_CachedATR > 0) ? (g_CachedATR * 1.8) : DBL_MAX;
      double ch = -1, cl = DBL_MAX; int valid = 0;
      for(int k = 0; k < bars_needed; k++) {
         double r = h_canal[k] - l_canal[k];
         if(r > spike_thr) continue; // exclui spike
         if(h_canal[k] > ch) ch = h_canal[k];
         if(l_canal[k] < cl) cl = l_canal[k];
         valid++;
      }
      if(valid >= 2) { g_CachedCanalHigh = ch; g_CachedCanalLow = cl; }
      // se < 2 barras válidas, mantém canal anterior (nunca gera canal inválido)
   } else all_copied = false;

   if(InpUseCaixoteFilter && g_CachedATR > 0 && InpCaixoteBars > 0) {
      double lh[], ll[]; ArraySetAsSeries(lh, true); ArraySetAsSeries(ll, true);
      if(CopyHigh(_Symbol,g_TF_L1,1,InpCaixoteBars,lh) >= InpCaixoteBars && CopyLow (_Symbol,g_TF_L1,1,InpCaixoteBars,ll) >= InpCaixoteBars) {
         double local_range = lh[ArrayMaximum(lh)] - ll[ArrayMinimum(ll)]; g_LocalConsolidation = (local_range <= (g_CachedATR * InpCaixoteATR_Multi));
      } else g_LocalConsolidation = false;
   } else g_LocalConsolidation = false;

   double h_fr[], l_fr[]; ArraySetAsSeries(h_fr, true); ArraySetAsSeries(l_fr, true);
   if(CopyHigh(_Symbol,g_TF_L1,1,InpCandlesToLook,h_fr) >= InpCandlesToLook && CopyLow (_Symbol,g_TF_L1,1,InpCandlesToLook,l_fr) >= InpCandlesToLook) {
      g_CachedFRTop   = h_fr[ArrayMaximum(h_fr)]; g_CachedFRFundo = l_fr[ArrayMinimum(l_fr)];
   } else all_copied = false;

   double high_h4[], low_h4[]; ArraySetAsSeries(high_h4, true); ArraySetAsSeries(low_h4, true);
   if(CopyHigh(_Symbol,PERIOD_H4,1,InpCandlesToLook,high_h4) >= InpCandlesToLook && CopyLow (_Symbol,PERIOD_H4,1,InpCandlesToLook,low_h4)  >= InpCandlesToLook) {
      g_CachedFiboH   = high_h4[ArrayMaximum(high_h4)]; g_CachedFiboLow = low_h4[ArrayMinimum(low_h4)];
   } else all_copied = false;

   double atr_f[]; ArraySetAsSeries(atr_f, true);
   if(CopyBuffer(hATR_H4, 0, 1, 1, atr_f) > 0) g_CachedFiboATR = SanitizeATR(atr_f[0], PERIOD_H4); else all_copied = false;

   double adx_h4[]; ArraySetAsSeries(adx_h4, true);
   if(CopyBuffer(hADX_H4, 0, 1, 1, adx_h4) > 0) g_H4_ADX = adx_h4[0];

   if(InpUseVolumeFilter || InpUseDynamicLiquidity || InpFR_RequireVolumeAbsorption) {
      long vol_b[]; ArraySetAsSeries(vol_b, true);
      if(CopyTickVolume(_Symbol, g_TF_L1, 1, 5, vol_b) >= 5) {
         double mv = 0; for(int i = 0; i < 5; i++) mv += (double)vol_b[i]; g_CachedVolMed = mv / 5.0;
      } else all_copied = false;

      long vol_l2[]; ArraySetAsSeries(vol_l2, true);
      if(CopyTickVolume(_Symbol, TF_L2, 1, 5, vol_l2) >= 5) {
         double mv2 = 0; for(int i = 0; i < 5; i++) mv2 += (double)vol_l2[i]; g_CachedVolMed_L2 = mv2 / 5.0;
      } else all_copied = false;
   }

   if(!all_copied) g_CacheBarTime = 0;
   else {
      g_CacheBarTime = cb;
      ComputeWinRate("Fluxo", g_FluxoWins, g_FluxoTotal); ComputeWinRate("FR", g_FrWins, g_FrTotal); ComputeWinRate("Fibo", g_FiboWins, g_FiboTotal);
   }
}

//===================================================================
// NOTÍCIAS E FILTROS DE MERCADO
//===================================================================
bool TemNoticiaProxima() {
   if(!InpUseNewsFilter) return false;
   datetime agora = TimeCurrent();
   if(agora - g_LastNewsCheckTime < 60 && g_LastNewsCheckTime != 0) return g_CachedNoticiaBlock;
   g_LastNewsCheckTime = agora; g_CachedNoticiaBlock = false; g_ProximaNoticiaName = ""; g_ProximaNoticiaTime = 0; g_TooltipNoticias = "";
   datetime start_blk = agora - (InpNewsMinutesAfter * 60), end_blk = agora + (InpNewsMinutesBefore * 60);
   MqlDateTime dt_d; TimeToStruct(agora, dt_d); dt_d.hour = 0; dt_d.min = 0; dt_d.sec = 0;
   datetime start_day = StructToTime(dt_d), end_day = start_day + 86400;
   MqlCalendarValue values[];
   if(CalendarValueHistory(values, start_day, end_day, NULL, _Symbol)) {
      string tip_lines = ""; int ev_count = 0;
      for(int i = 0; i < ArraySize(values); i++) {
         MqlCalendarEvent ev;
         if(CalendarEventById(values[i].event_id, ev)) {
            if(ev.importance == CALENDAR_IMPORTANCE_HIGH) {
               datetime ev_time = values[i].time;
               if(!g_CachedNoticiaBlock && ev_time >= start_blk && ev_time <= end_blk) g_CachedNoticiaBlock = true;
               if(ev_time > agora && (g_ProximaNoticiaTime == 0 || ev_time < g_ProximaNoticiaTime)) {
                  g_ProximaNoticiaTime = ev_time; g_ProximaNoticiaName = StringSubstr(ev.name, 0, 14) + (StringLen(ev.name) > 15 ? "." : "");
               }
               string s_hm = TimeToString(ev_time, TIME_MINUTES);
               string pfx  = (ev_time < agora) ? "[--] " : (ev_time >= start_blk && ev_time <= end_blk) ? "[!!] " : "[>>] ";
               tip_lines += pfx + s_hm + "  " + StringSubstr(ev.name,0,21) + (StringLen(ev.name)>22?".":"") + "\n"; ev_count++;
            }
         }
      }
      g_TooltipNoticias = (ev_count > 0) ? ("HIGH NEWS -- " + TimeToString(agora, TIME_DATE) + "\n---------------------\n" + tip_lines + "---------------------\n[--]=passado  [!!]=bloqueio  [>>]=futuro") : ("Sem noticias HIGH hoje");
   }
   return g_CachedNoticiaBlock;
}

bool IsLowLiquidityWindow() {
   if(InpBlockRollover) { MqlDateTime dt; TimeCurrent(dt); if(dt.hour >= 0 && dt.hour < 2) { if(InpSession_IgnoreOnSpike && g_CachedADX >= p_Fluxo_StrongADX) {} else return true; } }
   if(!InpBlockLowLiquidity) return false;
   if(InpUseDynamicLiquidity && g_CachedVolMed > 0 && g_CachedVolMed < InpMinTickVolume) return true;
   return false;
}

bool IsLowOscillationWindow() {
   if(!InpUseOscillationFilter) return false;
   if(g_CachedATR > 0 && (g_CachedATR / _Point) < InpMinATRPts) return true;
   if(InpMinViableATR_Multi > 0 && g_CachedATR > 0) {
      double min_atr_pts = (SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) * InpMinViableATR_Multi);
      if((g_CachedATR / _Point) < min_atr_pts) return true;
   }
   return false;
}

void EscreverCSV(string comment, double lot, double price, double sl, double tp) {
   if(!InpLogCSV) return;
   string date_str = TimeToString(TimeCurrent(), TIME_DATE); StringReplace(date_str, ".", ""); string filename = "FibboSniper_Trades_" + _Symbol + "_" + date_str + ".csv";
   bool needsHeader = !FileIsExist(filename); int fh = FileOpen(filename, FILE_WRITE|FILE_CSV|FILE_READ|FILE_ANSI, ';');
   if(fh != INVALID_HANDLE) {
      FileSeek(fh, 0, SEEK_END); if(needsHeader) FileWrite(fh,"Data","Hora","Simbolo","Comentario","Lote","Preco","SL","TP","ResultadoFinal");
      FileWrite(fh, TimeToString(TimeCurrent(),TIME_DATE), TimeToString(TimeCurrent(),TIME_MINUTES|TIME_SECONDS), _Symbol, comment, DoubleToString(lot,2), DoubleToString(price,_Digits), DoubleToString(sl,_Digits), DoubleToString(tp,_Digits), "0");
      FileClose(fh);
   }
}

//===================================================================
// TRAVAS FINANCEIRAS
//===================================================================
void VerificarTravasFinanceiras() {
   ResetDiario();
   
   // [M5 FIX] Cache do P&L Diário para aliviar HistorySelect em todos os ticks
   static datetime s_last_scan = 0;
   if(TimeCurrent() - s_last_scan > 10) {
      s_last_scan = TimeCurrent();
      ScanPLHoje(g_CachedPlSymReal, g_CachedPlTotReal);
   }

   // [C4 FIX] Checar primeiro se a perda superou, E DEPOIS retornar se já estiver bloqueado
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double pl_tot_total = g_CachedPlTotReal + g_FloatingPlTot;

   if(!g_LocalGlobalBlock) {
      if(pl_tot_total <= -(balance * (InpPerdaMaximaGlobalPct / 100.0))) { 
         g_LocalGlobalBlock = true; GlobalVariableSet(g_GV_GlobalBlock, 1.0); FecharTodasPosicoesDoRobo(); return; 
      }
   }
   if(g_LocalGlobalBlock) return;
   
   if(g_LocalBlocked) return;
   if(InpUseFechamentoMoeda) {
      double pl_sym_total = g_CachedPlSymReal + g_FloatingPlSym;
      if(pl_sym_total <= -(balance * (InpPerdaMaximaMoedaPct / 100.0)) || pl_sym_total >= (balance * (InpLucroAlvoMoedaPct / 100.0))) {
         FecharPosicoesDoSymbol(); g_LocalBlocked = true; GlobalVariableSet(g_GV_Blocked, 1.0);
      }
   }
}

//===================================================================
// ABERTURA DE ORDENS COM GUARD DE MARGEM E BLINDAGEM DE PREÇO
//===================================================================
bool AbrirBuy(double lot, double ask, double sl_pts, double tp1, double tp2, string comment) {
   double margem_req = 0;
   bool calc_ok = OrderCalcMargin(ORDER_TYPE_BUY, _Symbol, lot, ask, margem_req);
   if((calc_ok && AccountInfoDouble(ACCOUNT_MARGIN_FREE) < margem_req * 1.2) || (!calc_ok && AccountInfoDouble(ACCOUNT_MARGIN_FREE) < 50.0)) {
      AddLog("Margem insuficiente - bloqueado."); return false;
   }
   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP); double ml = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double lp = MathMax(MathFloor((lot * (InpVolPartialPct/100.0)) / step) * step, ml); double lr = lot - lp;

   double norm_sl  = NormalizeDouble(ask - (sl_pts * _Point), _Digits);
   double norm_tp1 = NormalizeDouble(ask + (sl_pts * tp1 * _Point), _Digits);
   double norm_tp2 = NormalizeDouble(ask + (sl_pts * tp2 * _Point), _Digits);

   if(!trade.Buy(lp, _Symbol, ask, norm_sl, norm_tp1, comment+"_P1")) { AddLog("Falha Corretora P1 (" + IntegerToString(trade.ResultRetcode()) + ")"); return false; }
   if(lr >= ml) {
      if(!trade.Buy(lr, _Symbol, ask, norm_sl, norm_tp2, comment+"_P2")) {
         AddLog("Aviso Corretora P2 (" + IntegerToString(trade.ResultRetcode()) + ")");
      }
   }
   EscreverCSV(comment, lot, ask, norm_sl, norm_tp1); return true;
}

bool AbrirSell(double lot, double bid, double sl_pts, double tp1, double tp2, string comment) {
   double margem_req = 0;
   bool calc_ok = OrderCalcMargin(ORDER_TYPE_SELL, _Symbol, lot, bid, margem_req);
   if((calc_ok && AccountInfoDouble(ACCOUNT_MARGIN_FREE) < margem_req * 1.2) || (!calc_ok && AccountInfoDouble(ACCOUNT_MARGIN_FREE) < 50.0)) {
      AddLog("Margem insuficiente - bloqueado."); return false;
   }
   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP); double ml = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double lp = MathMax(MathFloor((lot * (InpVolPartialPct/100.0)) / step) * step, ml); double lr = lot - lp;

   double norm_sl  = NormalizeDouble(bid + (sl_pts * _Point), _Digits);
   double norm_tp1 = NormalizeDouble(bid - (sl_pts * tp1 * _Point), _Digits);
   double norm_tp2 = NormalizeDouble(bid - (sl_pts * tp2 * _Point), _Digits);

   if(!trade.Sell(lp, _Symbol, bid, norm_sl, norm_tp1, comment+"_P1")) { AddLog("Falha Corretora P1 (" + IntegerToString(trade.ResultRetcode()) + ")"); return false; }
   if(lr >= ml) {
      if(!trade.Sell(lr, _Symbol, bid, norm_sl, norm_tp2, comment+"_P2")) {
         AddLog("Aviso Corretora P2 (" + IntegerToString(trade.ResultRetcode()) + ")");
      }
   }
   EscreverCSV(comment, lot, bid, norm_sl, norm_tp1); return true;
}

bool FiltroCurtoPrazo(int direcao, int shift, ENUM_TIMEFRAMES tf, int hEMA_handle) {
   double ema_buf[], close_buf[]; ArraySetAsSeries(ema_buf, true); ArraySetAsSeries(close_buf, true);
   if(CopyBuffer(hEMA_handle,0,shift,1,ema_buf) <= 0 || CopyClose(_Symbol,tf,shift,1,close_buf) <= 0) return false;
   double preco = (shift == 0) ? ((direcao == 1) ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID)) : close_buf[0];
   return (direcao == 1) ? (preco > ema_buf[0]) : (preco < ema_buf[0]);
}

bool ValidarEstruturaVelas(int direcao, ENUM_TIMEFRAMES tf) {
   double c1 = iClose(_Symbol,tf,1), o1 = iOpen(_Symbol,tf,1);
   if(direcao == 1 && c1 <= o1) return false; if(direcao == -1 && c1 >= o1) return false;
   if(p_PA_Criterios == 1) return true;
   double h1=iHigh(_Symbol,tf,1), l1=iLow(_Symbol,tf,1); double h2=iHigh(_Symbol,tf,2), l2=iLow(_Symbol,tf,2);
   if(direcao == 1 && h1 <= h2) return false; if(direcao == -1 && l1 >= l2) return false;
   if(p_PA_Criterios == 2) return true;
   double h3=iHigh(_Symbol,tf,3), l3=iLow(_Symbol,tf,3); double h4=iHigh(_Symbol,tf,4), l4=iLow(_Symbol,tf,4);
   if(direcao == 1)  return (l1 >= l3 && l2 >= l4); if(direcao == -1) return (h1 <= h3 && h2 <= h4);
   return false;
}

bool VelaAltaAtual()  { return (iClose(_Symbol,g_TF_L1,0) > iOpen(_Symbol,g_TF_L1,0)); }
bool VelaBaixaAtual() { return (iClose(_Symbol,g_TF_L1,0) < iOpen(_Symbol,g_TF_L1,0)); }

//===================================================================
// FUNÇÕES AUXILIARES DO MÓDULO FR MTF
//===================================================================
double GetFR_RSI_Threshold(bool is_sell, double adx_val) {
   double base = is_sell ? p_FR_RSI_OB : p_FR_RSI_OS;
   if(!InpFR_AdaptiveRSI) return base;
   if(adx_val < p_ADX_ConsolidationLevel) return is_sell ? (base - InpFR_RSI_LateralRelax) : (base + InpFR_RSI_LateralRelax);
   return base;
}

void GetFR_DirecaoOk(int medTrendDir, double rsi_val, bool &dir_sell_ok, bool &dir_buy_ok) {
   if(!p_UseMedTrendDirFR) { dir_sell_ok = true; dir_buy_ok = true; return; }
   if(medTrendDir == -1) { dir_sell_ok = true;  dir_buy_ok = false; }
   else if(medTrendDir == 1) { dir_sell_ok = false; dir_buy_ok = true; }
   else { if(InpFR_NeutralDirByRSI) { dir_sell_ok = (rsi_val >= InpFR_NeutralRSI_Sell); dir_buy_ok  = (rsi_val <= InpFR_NeutralRSI_Buy); } else { dir_sell_ok = false; dir_buy_ok = false; } }
}

double GetFR_MagTol(double atr_val, double adx_val, ENUM_TIMEFRAMES tf = PERIOD_CURRENT) {
   // [B10 FIX] fallback mínimo sensato se ATR for 0 (evita zona de largura 0)
   if(atr_val <= 0) return SymbolInfoDouble(_Symbol, SYMBOL_POINT) * 50;

   // [R2 FIX] Usa o TF recebido como parâmetro em vez de hardcoded g_TF_L1
   ENUM_TIMEFRAMES target_tf = (tf == PERIOD_CURRENT) ? g_TF_L1 : tf;
   double pct = InpFR_MagneticZoneATRPct;
   double curr_range = iHigh(_Symbol, target_tf, 1) - iLow(_Symbol, target_tf, 1);
   double vol_ratio  = (curr_range > 0) ? (curr_range / atr_val) : 1.0;
   if(vol_ratio > 1.5) pct = pct * 1.33;       // vela grande → zona mais larga
   else if(vol_ratio < 0.6) pct = pct * 0.80;  // vela pequena → zona mais estreita
   double base_mag = atr_val * (pct / 100.0);
   if(!InpFR_ProgressiveZone) return base_mag;
   double f = 1.0; if(adx_val < p_ADX_ConsolidationLevel * 0.6) f = 2.0; else if(adx_val < p_ADX_ConsolidationLevel) f = 1.5;
   return base_mag * f;
}

bool IsVelaReversaoVenda(int shift, ENUM_TIMEFRAMES tf) {
   double o=iOpen(_Symbol,tf,shift), c=iClose(_Symbol,tf,shift); double h=iHigh(_Symbol,tf,shift), l=iLow(_Symbol,tf,shift);
   double range = h - l; if(range <= 0 || c >= o) return false;
   double corpo = MathAbs(c-o), wick_top = h - MathMax(c,o);
   bool wick_ok = ((wick_top/range*100.0) >= InpFR_WickRangeMinPct && (corpo/range*100.0) >= InpFR_BodyRangeMinPct && (corpo > 0 ? wick_top >= corpo * InpFR_WickBodyRatio : false));
   if(!wick_ok) return false;
   // [BLINDAGEM 2] Pavio Mínimo Institucional de 40% (Rejeição Bancária Real)
   if(InpFR_RequireMinWick40 && range > 0) {
      if((wick_top / range * 100.0) < InpFR_MinWickRatioPct) return false;
   }
   // [PILAR 1] Fechamento no 1/3 extremo inferior (Sniper)
   if(InpFR_RequireQuadrantClose) {
      double max_close = l + (range * (InpFR_CloseQuadrantPct / 100.0));
      if(c > max_close) return false;
   }
   return true;
}

bool IsVelaReversaoCompra(int shift, ENUM_TIMEFRAMES tf) {
   double o=iOpen(_Symbol,tf,shift), c=iClose(_Symbol,tf,shift); double h=iHigh(_Symbol,tf,shift), l=iLow(_Symbol,tf,shift);
   double range = h - l; if(range <= 0 || c <= o) return false;
   double corpo = MathAbs(c-o), wick_bot = MathMin(c,o) - l;
   bool wick_ok = ((wick_bot/range*100.0) >= InpFR_WickRangeMinPct && (corpo/range*100.0) >= InpFR_BodyRangeMinPct && (corpo > 0 ? wick_bot >= corpo * InpFR_WickBodyRatio : false));
   if(!wick_ok) return false;
   // [BLINDAGEM 2] Pavio Mínimo Institucional de 40% (Rejeição Bancária Real)
   if(InpFR_RequireMinWick40 && range > 0) {
      if((wick_bot / range * 100.0) < InpFR_MinWickRatioPct) return false;
   }
   // [PILAR 1] Fechamento no 1/3 extremo superior (Sniper)
   if(InpFR_RequireQuadrantClose) {
      double min_close = h - (range * (InpFR_CloseQuadrantPct / 100.0));
      if(c < min_close) return false;
   }
   return true;
}

// [PILAR 2 & 3] Validação de Penetração Máxima Anti-Violino e Absorção de Volume
bool FR_ValidarVolumePenetracao(bool is_sell, int shift, ENUM_TIMEFRAMES tf, double level_price, double atr_val, double vol_med_ref = 0) {
   if(atr_val <= 0) return true;
   // [PILAR 2] Teto de penetração máxima (evita entrar contra rompimento violento)
   if(InpFR_MaxPenetrationATR > 0) {
      double max_pen = atr_val * InpFR_MaxPenetrationATR;
      if(is_sell) {
         double h = iHigh(_Symbol, tf, shift);
         if((h - level_price) > max_pen) return false;
      } else {
         double l = iLow(_Symbol, tf, shift);
         if((level_price - l) > max_pen) return false;
      }
   }
   // [PILAR 3] Absorção de volume institucional (usa média compatível com o TF)
   double ref_vol = (vol_med_ref > 0) ? vol_med_ref : ((tf == TF_L2 && g_CachedVolMed_L2 > 0) ? g_CachedVolMed_L2 : g_CachedVolMed);
   if(InpFR_RequireVolumeAbsorption && ref_vol > 0) {
      long vb[1];
      if(CopyTickVolume(_Symbol, tf, shift, 1, vb) >= 1) {
         if((double)vb[0] < (ref_vol * InpFR_MinVolumeRatio)) return false;
      }
   }
   return true;
}

// [PILAR 4] Cálculo de TP2 Estrutural Dinâmico (Extremo Oposto do Range FR)
double CalcularTP2_EstruturalFR(bool is_sell, double entry_price, double pH, double pL, double sl_pts, double atr_val) {
   if(!InpFR_UseStructuralTP2 || sl_pts <= 0 || atr_val <= 0) return InpTP_Final_Multi;
   double buffer = atr_val * 0.15;
   double target_price = is_sell ? (pL + buffer) : (pH - buffer);
   double dist_pts = MathAbs(target_price - entry_price) / _Point;
   if(dist_pts < sl_pts * 0.5) return InpTP_Final_Multi;
   double mult = dist_pts / sl_pts;
   return MathMax(InpTP_Min_Multi, MathMin(InpTP_Final_Multi, mult));
}

bool FR_ZonaLivre(string tag, bool is_sell) {
   if(!InpFR_ZoneCooldown) return true;
   if(is_sell) return (!JaExistePosicaoDaEstrategia("FR_Venda_"+tag) && !JaExistePosicaoDaEstrategia("FR_Dir_V_"+tag));
   else        return (!JaExistePosicaoDaEstrategia("FR_Compra_"+tag) && !JaExistePosicaoDaEstrategia("FR_Dir_C_"+tag));
}

//===================================================================
// DESENHO DE LINHAS NO GRÁFICO E PAINÉIS UI
//===================================================================
void DrawVisualZoneRect(string name, double price_high, double price_low, color clr, bool show=true) {
   string on = "SniperZone_" + name;
   if(price_high <= 0 || price_low <= 0 || !show) { ObjectDelete(0, on); return; }
   
   // T1 = Tempo REAL da estratégia (passado). T2 = Projeção visual pro futuro adaptada ao gráfico
   datetime t1 = iTime(_Symbol, g_TF_L1, InpCandlesToLook); 
   datetime t2 = iTime(_Symbol, g_TF_L1, 0) + (datetime)(PeriodSeconds(g_TF_L1)*100); 
   
   if(ObjectFind(0, on) < 0) {
      ObjectCreate(0, on, OBJ_RECTANGLE, 0, t1, price_high, t2, price_low);
      ObjectSetInteger(0, on, OBJPROP_COLOR, clr);
      ObjectSetInteger(0, on, OBJPROP_BACK, true);
      ObjectSetInteger(0, on, OBJPROP_FILL, true);
      ObjectSetInteger(0, on, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, on, OBJPROP_HIDDEN, true);
   } else {
      ObjectSetDouble(0, on, OBJPROP_PRICE, 0, price_high);
      ObjectSetDouble(0, on, OBJPROP_PRICE, 1, price_low);
      ObjectSetInteger(0, on, OBJPROP_TIME, 0, t1);
      ObjectSetInteger(0, on, OBJPROP_TIME, 1, t2);
   }
}

void DrawVisualRegressionChannel(string name, datetime t1, datetime t2, color clr, bool show=true) {
   string on = "SniperZone_" + name;
   if(!show) { ObjectDelete(0, on); return; }
   if(ObjectFind(0, on) < 0) {
      ObjectCreate(0, on, OBJ_REGRESSION, 0, t1, 0, t2, 0);
      ObjectSetInteger(0, on, OBJPROP_COLOR, clr);
      ObjectSetInteger(0, on, OBJPROP_STYLE, STYLE_DOT);
      ObjectSetInteger(0, on, OBJPROP_WIDTH, 1);
      ObjectSetInteger(0, on, OBJPROP_BACK, true);
      ObjectSetInteger(0, on, OBJPROP_RAY_RIGHT, true);
      ObjectSetInteger(0, on, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, on, OBJPROP_HIDDEN, true);
   } else {
      ObjectSetInteger(0, on, OBJPROP_TIME, 0, t1);
      ObjectSetInteger(0, on, OBJPROP_TIME, 1, t2);
   }
}

void DrawVisualSegment(string name, datetime t1, datetime t2, double price, color clr, string lbl="", bool show=true, datetime t_text=0, color txt_clr=clrNONE, int style=STYLE_DASH, int width=1) {
   string on = "SniperZone_" + name;
   string ot = "SniperZoneTxt_" + name;
   ObjectDelete(0, on);
   if(price <= 0 || !show || g_LinhasModo == 2) { ObjectDelete(0, ot); return; }

   if(lbl != "") {
      datetime t_lbl = (t_text == 0) ? t1 : t_text;
      color final_txt_clr = (txt_clr == clrNONE) ? clr : txt_clr;
      
      // Algoritmo de Shift Vertical Anti-Colisão
      static double s_LabelPrices[10];
      static int s_LabelCount = 0;
      static datetime s_LastLabelReset = 0;
      if(TimeCurrent() != s_LastLabelReset || name == "FR_TxtT" || name == "Fibo_V1" || name == "Fibo_C1") {
         s_LabelCount = 0;
         s_LastLabelReset = TimeCurrent();
      }
      
      double effective_price = price;
      int x_px = 0, y_px = 0;
      if(ChartTimePriceToXY(0, 0, t_lbl, price, x_px, y_px)) {
         for(int k = 0; k < s_LabelCount; k++) {
            int k_x = 0, k_y = 0;
            if(ChartTimePriceToXY(0, 0, t_lbl, s_LabelPrices[k], k_x, k_y)) {
               if(MathAbs(y_px - k_y) < 18) {
                  double p_shift = (_Point * 25.0);
                  effective_price += (price >= s_LabelPrices[k]) ? p_shift : -p_shift;
                  ChartTimePriceToXY(0, 0, t_lbl, effective_price, x_px, y_px);
               }
            }
         }
      }
      if(s_LabelCount < 10) s_LabelPrices[s_LabelCount++] = effective_price;

      if(ObjectFind(0, ot) < 0) {
         ObjectCreate(0, ot, OBJ_TEXT, 0, t_lbl, effective_price);
         ObjectSetString(0, ot, OBJPROP_TEXT, lbl);
         ObjectSetString(0, ot, OBJPROP_FONT, "Arial Bold");
         ObjectSetInteger(0, ot, OBJPROP_FONTSIZE, 9);
         ObjectSetInteger(0, ot, OBJPROP_COLOR, final_txt_clr);
         ObjectSetInteger(0, ot, OBJPROP_ANCHOR, ANCHOR_LEFT_LOWER);
         ObjectSetInteger(0, ot, OBJPROP_SELECTABLE, false);
         ObjectSetInteger(0, ot, OBJPROP_HIDDEN, true);
      } else {
         ObjectSetDouble(0, ot, OBJPROP_PRICE, effective_price);
         ObjectSetInteger(0, ot, OBJPROP_TIME, t_lbl);
         ObjectSetInteger(0, ot, OBJPROP_COLOR, final_txt_clr);
         ObjectSetString(0, ot, OBJPROP_TEXT, lbl);
      }
   } else {
      ObjectDelete(0, ot);
   }
}

void DrawVisualText(string name, datetime t, double price, string text, color clr, bool show=true) {
   string on = "SniperZoneTxt_" + name;
   if(price <= 0 || !show || text == "" || g_LinhasModo == 2) { ObjectDelete(0, on); return; }
   if(ObjectFind(0, on) < 0) {
      ObjectCreate(0, on, OBJ_TEXT, 0, t, price);
      ObjectSetString(0, on, OBJPROP_FONT, "Arial Bold");
      ObjectSetInteger(0, on, OBJPROP_FONTSIZE, 9);
      ObjectSetInteger(0, on, OBJPROP_ANCHOR, ANCHOR_LEFT_LOWER);
      ObjectSetInteger(0, on, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, on, OBJPROP_HIDDEN, true);
   } else {
      ObjectSetDouble(0, on, OBJPROP_PRICE, price);
      ObjectSetInteger(0, on, OBJPROP_TIME, t);
   }
   ObjectSetString(0, on, OBJPROP_TEXT, text);
   ObjectSetInteger(0, on, OBJPROP_COLOR, clr);
}

void DrawVisualLine(string name, double price, color clr_muted, color clr_active, string sym, string tip, bool show=true, bool highlight=false) {
   string oh = "SniperLine_"+name, ot = "SniperText_"+name;
   if(price <= 0 || !show || g_LinhasModo == 2) { ObjectDelete(0,oh); ObjectDelete(0,ot); return; }
   datetime ta = iTime(_Symbol,g_TF_L1,0) + (datetime)(PeriodSeconds(g_TF_L1)*5);
   
   // Tonalidades proporcionais: clr_active quando armada/acesa, clr_muted quando pontilhada/espera
   color line_clr = highlight ? clr_active : clr_muted;
   int line_style = highlight ? STYLE_SOLID : STYLE_DOT;
   int width = 1; // Sempre espessura 1 perfeitamente proporcional entre FR e Fibo

   if(ObjectFind(0,oh) < 0) { ObjectCreate(0,oh,OBJ_HLINE,0,0,price); ObjectSetInteger(0,oh,OBJPROP_BACK,true); ObjectSetInteger(0,oh,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,oh,OBJPROP_HIDDEN,true); }
   ObjectSetDouble(0,oh,OBJPROP_PRICE,price); ObjectSetInteger(0,oh,OBJPROP_COLOR,line_clr); ObjectSetInteger(0,oh,OBJPROP_STYLE,line_style); ObjectSetInteger(0,oh,OBJPROP_WIDTH,width); ObjectSetString(0,oh,OBJPROP_TOOLTIP,tip);
   
   if(ObjectFind(0,ot) < 0) { ObjectCreate(0,ot,OBJ_TEXT,0,ta,price); ObjectSetString(0,ot,OBJPROP_FONT,"Arial"); ObjectSetInteger(0,ot,OBJPROP_BACK,false); ObjectSetInteger(0,ot,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,ot,OBJPROP_HIDDEN,true); }
   ObjectSetInteger(0,ot,OBJPROP_FONTSIZE,11);
   ObjectSetString(0,ot,OBJPROP_FONT,"Arial");
   ObjectSetDouble(0,ot,OBJPROP_PRICE,price); ObjectSetInteger(0,ot,OBJPROP_TIME,ta); ObjectSetInteger(0,ot,OBJPROP_COLOR,line_clr); ObjectSetString(0,ot,OBJPROP_TEXT,sym);
}

//===================================================================
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

void DesenharLinhasChart() {
   if(MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE)) return;

   if(g_LocalGlobalBlock || g_LocalBlocked || g_BotPaused) return;
   bool is_lateral = IsMercadoLateral(); int t_dir = g_CachedTrendDir;
   color cor_h = C'28,85,58', cor_l = C'28,85,58'; string sym_h = is_lateral ? "▼" : "▲", sym_l = is_lateral ? "▲" : "▼";
   double ask = SymbolInfoDouble(_Symbol,SYMBOL_ASK), bid = SymbolInfoDouble(_Symbol,SYMBOL_BID); double zone_pts = (g_CachedATR > 0) ? (g_CachedATR / _Point) * 2.0 : 0;
   
   // --- CHECAGEM GERAL DE REQUISITOS (SE HOUVER BLOQUEIO, NENHUMA LINHA VIRA CONTÍNUA) ---
   int cur_spread = g_FastSpread, max_spread = g_CachedMaxSpread;
   bool d_sess = false;
   if(InpUseSessionFilter) {
      MqlDateTime dts;
      TimeCurrent(dts);
      d_sess = !((InpSessionEndHour > InpSessionStartHour) ? (dts.hour >= InpSessionStartHour && dts.hour < InpSessionEndHour) : (dts.hour >= InpSessionStartHour || dts.hour < InpSessionEndHour));
   }
   bool d_spr = (cur_spread > max_spread);
   bool d_liq = IsLowLiquidityWindow(), d_osc = IsLowOscillationWindow(), d_not = g_CachedNoticiaBlock, d_cax = g_LocalConsolidation;
   bool d_mpos = (g_FastNPos >= InpMaxSimultaneousOps || (g_NPosDay >= InpMaxDayTrades && g_NPosSwingFR >= InpMaxFRSwingTrades && g_NPosSwingFibo >= InpMaxFiboTrades));
   bool glb_blocked = (d_sess || d_spr || d_liq || d_osc || d_not || d_cax || d_mpos);

   bool fr_all_ok = (!glb_blocked && InpUseFR && g_CachedFrCdOk && (g_CachedFRTop > 0 && g_CachedFRFundo > 0));
   
   // [SINCRONIA TOTAL] Fibo só é all_ok se ADX (Força H4) e Tendência H4 estiverem rigorosamente válidos
   bool fb_adx_ok   = p_UsePassaFiltroADXFibo ? (g_H4_ADX >= cfg_ADX_MinLevel) : true;
   int  t_h4_draw   = ComputeTrendDir(hShortEMA_H4, hEMA_H4);
   bool fb_trend_ok = (!p_UseTrendDirFibo || t_h4_draw == 1 || t_h4_draw == -1);
   bool fb_all_ok   = (!glb_blocked && IsFiboActiveForSymbol() && g_CachedFiboCdOk && 
                       (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0) &&
                       fb_adx_ok && fb_trend_ok);

   // As linhas são desenhadas tanto no modo normal quanto no Modo ZEN (onde ficam 100% pontilhadas e discretas)
   bool draw_lines = (g_LinhasModo != 2);
   bool is_zen = g_ViewZonas;
   
   // --- FR (Falso Rompimento) ---
   bool fr_dir_sell = true, fr_dir_buy = true;
   GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, fr_dir_sell, fr_dir_buy);
   bool fr_sell_confl_ok = (g_ModoConfluencia > 0) ? g_MG_SellAllowed : true;
   bool fr_buy_confl_ok  = (g_ModoConfluencia > 0) ? g_MG_BuyAllowed : true;

   // Linha só vira CONTÍNUA (SOLID) se TODOS os requisitos estiverem válidos e NÃO estiver em Modo ZEN
   bool fr_top_hl = !is_zen && fr_all_ok && fr_dir_sell && fr_sell_confl_ok && 
                    (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask)/_Point <= zone_pts));
   bool fr_bot_hl = !is_zen && fr_all_ok && fr_dir_buy && fr_buy_confl_ok && 
                    (g_ReadyFR_Buy  || (MathAbs(bid-g_CachedFRFundo)/_Point <= zone_pts));
   
   bool fr_show_top = false, fr_show_bot = false;
   if(draw_lines) {
      if(g_LinhasModo == 0 && g_ViewFR) {
         fr_show_top = true;
         fr_show_bot = true;
      } else if(g_LinhasModo == 1 && g_ViewFR) {
         if(fr_top_hl) fr_show_top = true;
         if(fr_bot_hl) fr_show_bot = true;
      }
   }
   // FR (Paleta Vermelha Proporcional: Muted=Suave, Active=Aceso)
   color clr_fr_muted  = C'140,55,55';
   color clr_fr_active = C'235,75,75';
   string tf_fr_str = StringSubstr(EnumToString(g_TF_L1), 7); // ex: H2, H4, H1
   if(InpUseFR && g_CachedFRTop > 0) {
      DrawVisualLine("FR_Topo",  g_CachedFRTop,   clr_fr_muted, clr_fr_active, "▼", "[FR " + tf_fr_str + "] Topo",  fr_show_top, fr_top_hl);
      DrawVisualLine("FR_Fundo", g_CachedFRFundo, clr_fr_muted, clr_fr_active, "▲", "[FR " + tf_fr_str + "] Fundo", fr_show_bot, fr_bot_hl);
   } else {
      DrawVisualLine("FR_Topo",  0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Fundo", 0, clrNONE, clrNONE, "", "", false, false);
   }

   // --- FIBO (Estrutura Pura Ponto A -> B -> C: Níveis 18%, 28%, 38.2%) ---
   color clr_fb_muted  = C'140,110,35';
   color clr_fb_active = C'240,185,45';
   
   double nSell1=0, nBuy1=0, nSell2=0, nBuy2=0, nSell3=0, nBuy3=0;
   bool fb_show_sell = false, fb_show_buy = false;
   bool fb_s1_hl = false, fb_s2_hl = false, fb_s3_hl = false;
   bool fb_b1_hl = false, fb_b2_hl = false, fb_b3_hl = false;

   if(IsFiboActiveForSymbol() && g_CachedFiboH > 0 && g_CachedFiboLow > 0) {
      double range = g_CachedFiboH - g_CachedFiboLow;
      if(range >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
         // Em ALTA: Compra na base do pullback C (18%, 28%, 38.2% a partir do fundo A)
         nBuy1 = g_CachedFiboLow + range * (InpFibLevel1 / 100.0);
         nBuy2 = g_CachedFiboLow + range * (InpFibLevel2 / 100.0);
         nBuy3 = g_CachedFiboLow + range * (InpFibLevel3 / 100.0);

         // Em BAIXA: Venda no topo do repique C (18%, 28%, 38.2% a partir do topo A)
         nSell1 = g_CachedFiboH - range * (InpFibLevel1 / 100.0);
         nSell2 = g_CachedFiboH - range * (InpFibLevel2 / 100.0);
         nSell3 = g_CachedFiboH - range * (InpFibLevel3 / 100.0);
      }
      
      datetime cb_h4_now = iTime(_Symbol, PERIOD_H4, 0);
      int cd_sec_draw = InpFR_CooldownMinutes * 60;
      bool fb_cd_time_buy  = (cd_sec_draw <= 0 || (TimeCurrent() - l_fibo_buy_ts >= cd_sec_draw));
      bool fb_cd_time_sell = (cd_sec_draw <= 0 || (TimeCurrent() - l_fibo_sell_ts >= cd_sec_draw));
      bool fb_bar_buy_ok   = (cb_h4_now != f_h4_buy && fb_cd_time_buy);
      bool fb_bar_sell_ok  = (cb_h4_now != f_h4_sell && fb_cd_time_sell);

      // [DIRECIONAL ESTRITO]: Em Baixa mostra Venda, em Alta mostra Compra (linhas sempre visíveis pontilhadas)
      bool fb_dir_sell = ((t_dir == -1) || (t_dir == 0 && ask > (g_CachedFiboLow + range * 0.5)));
      bool fb_dir_buy  = ((t_dir == 1)  || (t_dir == 0 && bid < (g_CachedFiboLow + range * 0.5)));
      
      if(fb_dir_sell) fb_dir_buy = false;
      else if(fb_dir_buy) fb_dir_sell = false;

      // [CONFLUÊNCIA DE ENTRADA]: Confluência bloqueia apenas a linha contínua/ordem, mas NUNCA apaga a linha pontilhada do gráfico
      bool fb_confl_s_ok = (g_ModoConfluencia > 0) ? g_MG_SellAllowed : true;
      bool fb_confl_b_ok = (g_ModoConfluencia > 0) ? g_MG_BuyAllowed  : true;

      // [SINCRONIA RIGOROSA]: A linha só vira CONTÍNUA (highlight=true) se Confluência OK, vela NÃO operada e TODOS os requisitos válidos
      bool fb_s_all_ok = fb_all_ok && fb_bar_sell_ok && fb_confl_s_ok;
      bool fb_b_all_ok = fb_all_ok && fb_bar_buy_ok && fb_confl_b_ok;

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
      }

      if(draw_lines) {
         if(g_LinhasModo == 0 && g_ViewFibo) {
            fb_show_sell = fb_dir_sell;
            fb_show_buy  = fb_dir_buy;
         } else if(g_LinhasModo == 1 && g_ViewFibo) {
            if(fb_s1_hl || fb_s2_hl || fb_s3_hl) fb_show_sell = true;
            if(fb_b1_hl || fb_b2_hl || fb_b3_hl) fb_show_buy  = true;
         }
      }
      
      // Limpa nomes antigos
      ObjectDelete(0, "SniperLine_Fibo_Venda"); ObjectDelete(0, "SniperText_Fibo_Venda");
      ObjectDelete(0, "SniperLine_Fibo_Compra"); ObjectDelete(0, "SniperText_Fibo_Compra");

      // Níveis 18.0%, 28.0% e 38.2% desenhados no gráfico principal com precisão direcional
      if(InpUseFiboLevel1 && fb_show_sell) DrawVisualLine("Fibo_V1", nSell1, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] V1 (18.0%)", true, fb_s1_hl);
      else DrawVisualLine("Fibo_V1", 0, clrNONE, clrNONE, "", "", false, false);

      if(InpUseFiboLevel1 && fb_show_buy)  DrawVisualLine("Fibo_C1", nBuy1,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] C1 (18.0%)", true, fb_b1_hl);
      else DrawVisualLine("Fibo_C1", 0, clrNONE, clrNONE, "", "", false, false);

      if(InpUseFiboLevel2 && fb_show_sell) DrawVisualLine("Fibo_V2", nSell2, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] V2 (28.0%)", true, fb_s2_hl);
      else DrawVisualLine("Fibo_V2", 0, clrNONE, clrNONE, "", "", false, false);

      if(InpUseFiboLevel2 && fb_show_buy)  DrawVisualLine("Fibo_C2", nBuy2,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] C2 (28.0%)", true, fb_b2_hl);
      else DrawVisualLine("Fibo_C2", 0, clrNONE, clrNONE, "", "", false, false);

      if(InpUseFiboLevel3 && fb_show_sell) DrawVisualLine("Fibo_V3", nSell3, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] V3 (38.2%)", true, fb_s3_hl);
      else DrawVisualLine("Fibo_V3", 0, clrNONE, clrNONE, "", "", false, false);

      if(InpUseFiboLevel3 && fb_show_buy)  DrawVisualLine("Fibo_C3", nBuy3,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] C3 (38.2%)", true, fb_b3_hl);
      else DrawVisualLine("Fibo_C3", 0, clrNONE, clrNONE, "", "", false, false);
   } else {
      DrawVisualLine("Fibo_V1", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_C1", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_V2", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_C2", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_V3", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_C3", 0, clrNONE, clrNONE, "", "", false, false);
   }
   
   // ZONAS VISUAIS (MODO ZEN SINCRO INTELIGENTE)
   // Limpeza rigorosa de quaisquer textos ou segmentos soltos sobre o gráfico
   ObjectsDeleteAll(0, "SniperZoneTxt_");
   ObjectsDeleteAll(0, "SniperZone_FR_");
   ObjectsDeleteAll(0, "SniperZone_Fibo_");

   if(!g_ViewZonas) {
      // Quando ZEN desativado, apaga canal de regressão e limpa tudo da análise
      DrawVisualRegressionChannel("Fibo_Ch", 0, 0, clrNONE, false);
      LimparTudoAnalise();
   }
}

void PRect(string nm, int x, int y, int w, int h, color bg, long border=-1, int zorder=200) { string n=PANEL_PREFIX+nm; if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_RECTANGLE_LABEL,0,0,0); ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x); ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y); ObjectSetInteger(0,n,OBJPROP_XSIZE,w);      ObjectSetInteger(0,n,OBJPROP_YSIZE,h); ObjectSetInteger(0,n,OBJPROP_BGCOLOR,bg);  ObjectSetInteger(0,n,OBJPROP_BORDER_TYPE,BORDER_FLAT); ObjectSetInteger(0,n,OBJPROP_COLOR,border>=0?(color)border:bg); ObjectSetInteger(0,n,OBJPROP_WIDTH,border>=0?1:0); ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER); ObjectSetInteger(0,n,OBJPROP_BACK,false); ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,n,OBJPROP_HIDDEN,true); ObjectSetInteger(0,n,OBJPROP_ZORDER,zorder); ObjectSetString(0,n,OBJPROP_TOOLTIP,"\n"); }
void PLabel(string nm, int x, int y, string txt, color clr, int sz=0, bool bold=false, string tip="") { string n=PANEL_PREFIX+nm; if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_LABEL,0,0,0); ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x); ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y); ObjectSetString(0,n,OBJPROP_TEXT,txt); ObjectSetInteger(0,n,OBJPROP_COLOR,clr); ObjectSetString(0,n,OBJPROP_FONT,bold?"Arial Bold":"Arial"); ObjectSetInteger(0,n,OBJPROP_FONTSIZE,sz>0?sz:InpPanelFontSize); ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER); ObjectSetInteger(0,n,OBJPROP_ANCHOR,ANCHOR_LEFT_UPPER); ObjectSetInteger(0,n,OBJPROP_BACK,false); ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,n,OBJPROP_HIDDEN,true); ObjectSetInteger(0,n,OBJPROP_ZORDER,250); ObjectSetString(0,n,OBJPROP_TOOLTIP,tip!=""?tip:"\n"); }
void PLabelR(string nm, int x, int y, string txt, color clr, int sz=0, bool bold=false, string tip="") { string n=PANEL_PREFIX+"R_"+nm; if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_LABEL,0,0,0); ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x); ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y); ObjectSetString(0,n,OBJPROP_TEXT,txt); ObjectSetInteger(0,n,OBJPROP_COLOR,clr); ObjectSetString(0,n,OBJPROP_FONT,bold?"Arial Bold":"Arial"); ObjectSetInteger(0,n,OBJPROP_FONTSIZE,sz>0?sz:InpPanelFontSize); ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER); ObjectSetInteger(0,n,OBJPROP_ANCHOR,ANCHOR_RIGHT_UPPER); ObjectSetInteger(0,n,OBJPROP_BACK,false); ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,n,OBJPROP_HIDDEN,true); ObjectSetInteger(0,n,OBJPROP_ZORDER,250); ObjectSetString(0,n,OBJPROP_TOOLTIP,tip!=""?tip:"\n"); }
void PButton(string nm, int x, int y, int w, int h, string txt, color bg, color clr, string tip="") { string n=PANEL_PREFIX+nm; if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_BUTTON,0,0,0); ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x); ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y); ObjectSetInteger(0,n,OBJPROP_XSIZE,w); ObjectSetInteger(0,n,OBJPROP_YSIZE,h); ObjectSetString(0,n,OBJPROP_TEXT,txt); ObjectSetInteger(0,n,OBJPROP_BGCOLOR,bg); ObjectSetInteger(0,n,OBJPROP_COLOR,clr); ObjectSetInteger(0,n,OBJPROP_BORDER_COLOR,CLR_LINE_HARD); ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER); ObjectSetString(0,n,OBJPROP_FONT,"Arial Bold"); ObjectSetInteger(0,n,OBJPROP_FONTSIZE,8); ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,n,OBJPROP_HIDDEN,true); ObjectSetInteger(0,n,OBJPROP_STATE,false); ObjectSetInteger(0,n,OBJPROP_ZORDER,300); ObjectSetString(0,n,OBJPROP_TOOLTIP,tip!=""?tip:"\n"); }
void PSectionBadge(string id, int px, int y, int pw, string label, color accent) { int pad=10, lw=(int)StringLen(label)*6+12; PRect(id+"_la",px+pad,y+5,3,1,accent,-1,212); PRect(id+"_bg",px+pad+6,y+1,lw,12,accent,-1,212); PLabel(id+"_tx",px+pad+10,y+2,label,CLR_BG_BASE,InpPanelFontSize-2,true); PRect(id+"_lb",px+pad+6+lw+3,y+5,pw-(pad*2)-lw-20,1,CLR_LINE_SOFT,-1,212); }
void PModuleCardH(string id, int x, int y, int w, int h, color accent, color bg_clr=CLR_BG_CARD) { PRect(id+"_bg",x,y,w,h,bg_clr,accent,205); PRect(id+"_acc",x,y,2,h,accent,-1,206); }
void PRow(string id, int lx, int rx, int y, string lbl, string val, color clr_val, string tip="", color clr_lbl=CLR_TXT_LABEL, bool bold_lbl=false) { PLabel(id+"_l",lx,y,lbl,clr_lbl,InpPanelFontSize,bold_lbl,tip); PLabelR(id+"_v",rx,y,val,clr_val,InpPanelFontSize,false,tip); }
void PLabelC(string nm, int cx, int y, string txt, color clr, int sz=0, bool bold=false, string tip="") { string n=PANEL_PREFIX+nm; if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_LABEL,0,0,0); ObjectSetInteger(0,n,OBJPROP_XDISTANCE,cx); ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y); ObjectSetString(0,n,OBJPROP_TEXT,txt); ObjectSetInteger(0,n,OBJPROP_COLOR,clr); ObjectSetString(0,n,OBJPROP_FONT,bold?"Arial Bold":"Arial"); ObjectSetInteger(0,n,OBJPROP_FONTSIZE,sz>0?sz:InpPanelFontSize); ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER); ObjectSetInteger(0,n,OBJPROP_ANCHOR,ANCHOR_UPPER); ObjectSetInteger(0,n,OBJPROP_BACK,false); ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,n,OBJPROP_HIDDEN,true); ObjectSetInteger(0,n,OBJPROP_ZORDER,250); ObjectSetString(0,n,OBJPROP_TOOLTIP,tip!=""?tip:"\n"); }
void LimparPainel() { for(int i=ObjectsTotal(0,0,-1)-1;i>=0;i--) { string nm=ObjectName(0,i,0,-1); if(StringFind(nm,PANEL_PREFIX)==0) ObjectDelete(0,nm); } }
void LimparGrafico() { for(int i=ObjectsTotal(0,0,-1)-1;i>=0;i--) { string nm=ObjectName(0,i,0,-1); if(StringFind(nm,"SniperLine_")==0||StringFind(nm,"SniperText_")==0||StringFind(nm,"SniperZone_")==0) ObjectDelete(0,nm); } }
void LimparLixoGUI() { for(int i=ObjectsTotal(0,0,0)-1;i>=0;i--) { string nm=ObjectName(0,i,0,0); int type=(int)ObjectGetInteger(0,nm,OBJPROP_TYPE); if(type==OBJ_LABEL||type==OBJ_TEXT||type==OBJ_RECTANGLE_LABEL||type==OBJ_BUTTON) { if(StringFind(nm,PANEL_PREFIX)==0) continue; if(StringFind(nm,"SniperLine_")==0||StringFind(nm,"SniperText_")==0) continue; ObjectDelete(0,nm); } } }

string ComputePanelHash() {
   // [B05 FIX] Estados criticos adicionados: bloqueios, botoes de view, confluencia
   // [C1 FIX] Removemos g_MG_DiagText do hash para evitar redraw total. Usamos mg_state.
   string mg_state = (g_ModoConfluencia > 0) ? IntegerToString(g_ModoConfluencia) : "0";
   // [BUG-M2 FIX] P&L flutuante adicionado ao hash — painel atualiza a cada R$0,10 de variação
   int pl_sym_dec = (int)(g_FloatingPlSym * 10);
   int pl_tot_dec = (int)(g_FloatingPlTot * 10);
   return StringFormat("%d|%d|%d|%d|%d|%s|%s|%d|%d|%d|%d|%s|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d",
      (int)g_ColPosicao,(int)g_ColTerminal,(int)g_ShowDiag,(int)g_ShowConfigPanel,g_DiagTab,
      g_ProximaNoticiaName,g_Log[0],
      g_NPosDay,g_NPosSwing,g_FastNPosSymbol,
      (int)g_ViewZonas,mg_state,
      (int)g_LocalGlobalBlock,(int)g_LocalBlocked,(int)g_BotPaused,
      (int)g_ViewFluxo,(int)g_ViewFR,(int)g_ViewFibo,
      g_LinhasModo,g_ModoConfluencia,
      pl_sym_dec, pl_tot_dec,
      (int)MathRound(g_CachedADX*10), (int)MathRound(g_CachedRSI*10),
      (int)MathRound(g_CachedATR/_Point), g_FastSpread,
      (int)MathRound(g_CachedLot*100), g_CachedTrendDir, g_CachedMedDir,
      (int)g_LocalConsolidation);
}

void DesenharPainel() {
   if(MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE)) return;

   if(!InpShowPanel) return;
   int px=InpPanelX, py=InpPanelY, pw=PANEL_W, pad=10, lx=px+pad+4, rx=px+pw-pad;
   double adx_val=g_CachedADX, rsi_v=g_CachedRSI, atr_val=g_CachedATR; int tDir=g_CachedTrendDir, mDir=g_CachedMedDir, nPos=g_FastNPos;
   double plSym=g_CachedPlSymReal+g_FloatingPlSym, plTot=g_CachedPlTotReal+g_FloatingPlTot; double balance=AccountInfoDouble(ACCOUNT_BALANCE);
   int cur_spread=g_FastSpread, max_spread=g_CachedMaxSpread; double sl_pts=g_CachedSlPts, lot_next=g_CachedLot;
   bool fl_cd=g_CachedFluxoCdOk, fr_cd=g_CachedFrCdOk, fb_cd=g_CachedFiboCdOk;
   bool f_osc=IsLowOscillationWindow(), f_liq=IsLowLiquidityWindow(), f_cax=g_LocalConsolidation;
   bool f_not=g_CachedNoticiaBlock, f_spr=(cur_spread>max_spread), f_cd=(!fl_cd||!fr_cd||!fb_cd);
   int n_blocked=(f_osc?1:0)+(f_liq?1:0)+(f_cax?1:0)+(f_not?1:0)+(f_spr?1:0)+(f_cd?1:0);
   bool any_flt=(n_blocked>0), blocked=(GlobalVariableGet(g_GV_GlobalBlock)==1.0||GlobalVariableGet(g_GV_Blocked)==1.0||f_not||f_liq||f_osc||f_spr);
   string s_perfil=(g_CurrentPerfil==PERFIL_CONSERVADOR)?"CONSERVADOR":(g_CurrentPerfil==PERFIL_MODERADO)?"MODERADO":"AGRESSIVO";
   string s_filter=(g_ActiveFilterMode==FILTER_MAXIMO)?"MÁX":(g_ActiveFilterMode==FILTER_MEIO_TERMO)?"MED":"ATU";
   string s_fr_mode=(g_ActiveFRMode==FR_CONSERVADOR)?"CONS":"AGRE";
   bool mkt_lateral=(adx_val<p_ADX_ConsolidationLevel||g_LocalConsolidation);
   string s_regime=mkt_lateral?(g_LocalConsolidation?"LAT. CAIXOTE":"LATERAL"):"DIRECIONAL";
   string s_tdir=(tDir==1)?"^ ALTA":(tDir==-1)?"v BAIXA":"- NEUTRO"; string s_mdir=(mDir==1)?"^ ALTA":(mDir==-1)?"v BAIXA":"- NEUTRO";
   string st_bl="BLOQUEADO"; if(f_not)st_bl="NOTICIA"; else if(f_liq)st_bl="LIQ.BAIXA"; else if(f_osc)st_bl="PARADO"; else if(f_spr)st_bl="SPREAD";
   string s_status=blocked?st_bl:(g_BotPaused?"PAUSADO":"ATIVO");
   string s_next=IntegerToString(g_FastSecsNext/60)+"m "+IntegerToString(g_FastSecsNext%60)+"s";
   int uptime_sec=(int)(TimeCurrent()-g_InitTime); string s_up=IntegerToString(uptime_sec/3600)+"h "+IntegerToString((uptime_sec%3600)/60)+"m";
   color c_tdir=(tDir==1)?CLR_TEAL:(tDir==-1)?CLR_RED:CLR_TXT_LABEL; color c_mdir=(mDir==1)?CLR_TEAL:(mDir==-1)?CLR_RED:CLR_TXT_LABEL;
   color c_adx=(adx_val>=p_ADX_ConsolidationLevel&&!g_LocalConsolidation)?CLR_TEAL:CLR_AMBER; color c_regime=mkt_lateral?(g_LocalConsolidation?CLR_RED:CLR_AMBER):CLR_TEAL;
   color c_status=blocked?CLR_RED:(g_BotPaused?CLR_AMBER:CLR_TEAL); color c_plSym=(plSym>=0)?CLR_TEAL:CLR_RED, c_plTot=(plTot>=0)?CLR_TEAL:CLR_RED;
   // [B12 FIX] removido c_spread nao utilizado
   // [B06 FIX] removido c_pos daqui para usar g_FastNPosSymbol mais embaixo
   color c_perfil=(g_CurrentPerfil==PERFIL_CONSERVADOR)?CLR_TEAL:(g_CurrentPerfil==PERFIL_MODERADO)?CLR_BLUE:CLR_AMBER; color c_pb=(g_CurrentPerfil==PERFIL_CONSERVADOR)?CLR_TEAL_DIM:(g_CurrentPerfil==PERFIL_MODERADO)?CLR_BLUE_DIM:CLR_AMBER_DIM;
   color c_rsi=(rsi_v>=cfg_RSI_Overbought)?CLR_RED:(rsi_v<=cfg_RSI_Oversold)?CLR_TEAL:CLR_TXT_PRIMARY;
   string s_pls_pct=(balance>0)?(" ("+DoubleToString(MathAbs(plSym/balance*100),1)+"%)"):""; string s_plt_pct=(balance>0)?(" ("+DoubleToString(MathAbs(plTot/balance*100),1)+"%)"):"";
   int cur=py;

   PRect("border",px-1,py-1,pw+2,g_PanelHeight+2,CLR_LINE_HARD,CLR_LINE_HARD,198); PRect("bg_main",px,py,pw,g_PanelHeight,CLR_BG_BASE,-1,199);
   // HEADER: 50px — título centralizado H+V na área esquerda, subtítulo na 2ª linha
   PRect("hdr_bg",px,cur,pw,50,CLR_BG_HEADER,-1,200); PRect("hdr_top",px,cur,pw,2,CLR_BLUE,-1,201); cur+=2;
   string tf_str=EnumToString(g_TF_L1); StringReplace(tf_str,"PERIOD_",""); string tf_l2=EnumToString(TF_L2); StringReplace(tf_l2,"PERIOD_","");
   // Área esquerda: px até pill_x(≈px+198). Centro horizontal ≈ px+99. Centro vertical linha1 ≈ cur+13.
   int hdr_cx = px + (pw-100)/2;  // centro H excluindo controles da direita
   PLabel("hdr_ico",px+pad,cur+12,"*",CLR_BLUE,11,true);
   PLabelC("hdr_title",hdr_cx,cur+11,"ORION LOGIC PRO",CLR_TXT_WHITE,10,true);
   PLabelC("hdr_ver",  hdr_cx,cur+28,"v28.5  •  "+_Symbol+"  •  L1:"+tf_str+" | L2:"+tf_l2,CLR_BLUE,InpPanelFontSize-1,false);
   // Controles no topo-direita
   color c_pill=blocked?CLR_RED_DIM:(g_BotPaused?CLR_AMBER_DIM:CLR_TEAL_DIM); int pill_x=rx-140, pill_w=92, pill_cx=pill_x+pill_w/2; PRect("hdr_pill",pill_x,cur+5,pill_w,17,c_pill,c_status,202);
   {string n=PANEL_PREFIX+"hdr_stat"; if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_LABEL,0,0,0); ObjectSetInteger(0,n,OBJPROP_XDISTANCE,pill_cx); ObjectSetInteger(0,n,OBJPROP_YDISTANCE,cur+8); ObjectSetString(0,n,OBJPROP_TEXT,"* "+s_status); ObjectSetInteger(0,n,OBJPROP_COLOR,c_status); ObjectSetString(0,n,OBJPROP_FONT,"Arial Bold"); ObjectSetInteger(0,n,OBJPROP_FONTSIZE,InpPanelFontSize-2); ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER); ObjectSetInteger(0,n,OBJPROP_ANCHOR,ANCHOR_UPPER); ObjectSetInteger(0,n,OBJPROP_BACK,false); ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,n,OBJPROP_HIDDEN,true); ObjectSetInteger(0,n,OBJPROP_ZORDER,252); ObjectSetString(0,n,OBJPROP_TOOLTIP,"\n");}
   PButton("btn_config",pill_x,cur+26,pill_w,17,g_ShowConfigPanel?"[X CONFIG]":"⚙ CONFIG",g_ShowConfigPanel?CLR_BLUE:CLR_BLUE_DIM,CLR_TXT_WHITE,"CONTROLE MASTER"); PButton("btn_diag",rx-42,cur+5,20,17,g_ShowDiag?"X":"[?]",g_ShowDiag?CLR_PURPLE:CLR_PURPLE_DIM,CLR_TXT_WHITE,"DIAGNOSTICO"); PButton("btn_min",rx-20,cur+5,18,17,g_Minimized?"v":"^",CLR_BG_CARD,CLR_TXT_LABEL,"Min/Max"); cur+=50;

   // [H4 FIX] Garantir subjanela 0 explícita para deleção de objetos em modo minimizado
   if(g_Minimized) { for(int i=ObjectsTotal(0,0,0)-1;i>=0;i--) { string nm=ObjectName(0,i,0,0); if(StringFind(nm,PANEL_PREFIX)==0&&nm!=PANEL_PREFIX+"border"&&nm!=PANEL_PREFIX+"bg_main"&&nm!=PANEL_PREFIX+"hdr_bg"&&nm!=PANEL_PREFIX+"hdr_top"&&StringFind(nm,PANEL_PREFIX+"hdr_")<0&&nm!=PANEL_PREFIX+"btn_min") ObjectDelete(0,nm); } g_PanelHeight=cur-py; ObjectSetInteger(0,PANEL_PREFIX+"border",OBJPROP_YSIZE,g_PanelHeight+2); ObjectSetInteger(0,PANEL_PREFIX+"bg_main",OBJPROP_YSIZE,g_PanelHeight); return; }

   PRect("prof_bg",px+pad-2,cur,pw-(pad*2)+4,38,c_pb,c_perfil,201); PRect("prof_acc",px+pad-2,cur,3,38,c_perfil,-1,202);
   PLabel("prof_val",px+pad+6,cur+4,s_perfil,c_perfil,11,true); PLabel("prof_sub",px+pad+6,cur+20,"Filtro:"+s_filter+"  FR:"+s_fr_mode+"  PA:"+(string)p_PA_Criterios,CLR_TXT_LABEL,InpPanelFontSize-2); cur+=44;

   PSectionBadge("s_mkt",px,cur,pw,"MERCADO",c_regime); cur+=16;
   // Regime + ADX fundidos: label esq. com status ADX, valor dir. com Regime
PRow("reg",lx,rx,cur,"Regime  |  ADX "+DoubleToString(adx_val,1)+" (>="+StringFormat("%.0f",p_ADX_ConsolidationLevel)+")",s_regime,c_regime,"",c_adx,c_adx!=CLR_AMBER); cur+=14;
   ObjectDelete(0,PANEL_PREFIX+"adx_r_l"); ObjectDelete(0,PANEL_PREFIX+"R_adx_r_v"); 
   PRow("rsi_r",lx,rx,cur,"RSI L1  "+DoubleToString(rsi_v,1),StringFormat("(%.0f/%.0f)",cfg_RSI_Oversold,cfg_RSI_Overbought),CLR_MUTED,"",c_rsi,c_rsi!=CLR_TXT_PRIMARY); cur+=14;
   PRow("tma",lx,rx,cur,"Macro L1",s_tdir,c_tdir,"",c_tdir!=CLR_TXT_LABEL?c_tdir:CLR_TXT_LABEL); cur+=14; PRow("tme",lx,rx,cur,"Média L1",s_mdir,c_mdir,"",c_mdir!=CLR_TXT_LABEL?c_mdir:CLR_TXT_LABEL); cur+=14;

   string s_l2_tdir=(g_L2_TrendDir==1)?"^ ALTA":(g_L2_TrendDir==-1)?"v BAIXA":"- NEUTRO"; color c_l2_tdir=(g_L2_TrendDir==1)?CLR_TEAL:(g_L2_TrendDir==-1)?CLR_RED:CLR_TXT_LABEL; color c_l2_adx=(g_L2_ADX>=p_ADX_ConsolidationLevel)?CLR_TEAL:CLR_AMBER;
   PRow("adx_l2",lx,rx,cur,"ADX "+EnumToString(TF_L2)+"  "+DoubleToString(g_L2_ADX,1)," ",c_l2_adx); cur+=14; PRow("tma_l2",lx,rx,cur,"Macro "+EnumToString(TF_L2),s_l2_tdir,c_l2_tdir); cur+=14;

   PRow("osc",lx,rx,cur,"Oscilação",DoubleToString(atr_val/_Point,0)+" pts", (!InpUseOscillationFilter||atr_val==0)?CLR_TXT_LABEL:(f_osc?CLR_RED:CLR_TEAL)); cur+=14;
   ObjectDelete(0,PANEL_PREFIX+"mkt_spr_l"); ObjectDelete(0,PANEL_PREFIX+"R_mkt_spr_v"); 
   if(InpBlockLowLiquidity){string s_vol=(g_CachedVolMed>0)?(DoubleToString(g_CachedVolMed,0)+" tk"):"—";PRow("vol_tk",lx,rx,cur,"Vol. Tick",s_vol,f_liq?CLR_RED:CLR_TEAL);cur+=14;}else{ObjectDelete(0,PANEL_PREFIX+"vol_tk_l");ObjectDelete(0,PANEL_PREFIX+"R_vol_tk_v");}
   if(InpUseCaixoteFilter){PRow("caixote",lx,rx,cur,"Caixote",f_cax?"ATIVO":"OK",f_cax?CLR_RED:CLR_TEAL);cur+=14;}else{ObjectDelete(0,PANEL_PREFIX+"caixote_l");ObjectDelete(0,PANEL_PREFIX+"R_caixote_v");}
   if(InpUseNewsFilter){string s_not=f_not?"BLOQUEADO":"Livre";PRow("noticia",lx,rx,cur,"Noticia",s_not,f_not?CLR_RED:CLR_TEAL,g_TooltipNoticias);cur+=14;if(g_ProximaNoticiaName!=""&&g_ProximaNoticiaTime>TimeCurrent()){int mins_left=(int)((g_ProximaNoticiaTime-TimeCurrent())/60);string s_ni="  -> "+g_ProximaNoticiaName+" ("+IntegerToString(mins_left)+"m)";PLabel("noticia_sub",lx,cur,s_ni,(mins_left<=InpNewsMinutesBefore)?CLR_RED:CLR_TXT_DIM,InpPanelFontSize-2,false,g_TooltipNoticias);cur+=11;}else ObjectDelete(0,PANEL_PREFIX+"noticia_sub");}else{ObjectDelete(0,PANEL_PREFIX+"noticia_l");ObjectDelete(0,PANEL_PREFIX+"R_noticia_v");ObjectDelete(0,PANEL_PREFIX+"noticia_sub");}

   {string s_cdl="FR:"+IntegerToString(g_CachedFrL)+" FB:"+IntegerToString(g_CachedFiboL);PRow("consec",lx,rx,cur,"Consec.",s_cdl,f_cd?CLR_RED:CLR_TEAL);cur+=14;}

   bool mg_ativo = (g_ViewZonas || g_ModoConfluencia > 0);
   if(mg_ativo) {
      string mg_tf=""; if(g_ModoConfluencia==1)mg_tf="M15"; else if(g_ModoConfluencia==2)mg_tf="H1"; else if(g_ModoConfluencia==3)mg_tf="H2"; else if(g_ModoConfluencia==4)mg_tf="H4"; else mg_tf="Tela";
      string mg_val=(g_MG_DiagText!="")?g_MG_DiagText:"Aguardando...";
      color mg_clr=(g_MG_DiagColor==clrGray)?CLR_TXT_DIM:((g_MG_DiagColor==clrLimeGreen)?CLR_TEAL:(g_MG_DiagColor==clrRed)?CLR_RED:CLR_AMBER);
      PRow("mg_stat",lx,rx,cur,"MktGlance ["+mg_tf+"]",mg_val,mg_clr); cur+=14;
   } else { ObjectDelete(0,PANEL_PREFIX+"mg_stat_l"); ObjectDelete(0,PANEL_PREFIX+"R_mg_stat_v"); }

   color c_stbar=any_flt?CLR_RED_DIM:CLR_TEAL_DIM, c_stbar_tx=any_flt?CLR_RED:CLR_TEAL; string s_stbar;
   if(!any_flt) s_stbar="PRONTO PARA OPERAR"; else{s_stbar="BLOQ:";if(f_osc)s_stbar+=" OSCILAÇÃO";if(f_liq)s_stbar+=(s_stbar=="BLOQ:"?"":" |")+" LIQUIDEZ";if(f_cax)s_stbar+=(s_stbar=="BLOQ:"?"":" |")+" CAIXOTE";if(f_not)s_stbar+=(s_stbar=="BLOQ:"?"":" |")+" NOTÍCIA";if(f_spr)s_stbar+=(s_stbar=="BLOQ:"?"":" |")+" SPREAD";if(f_cd)s_stbar+=(s_stbar=="BLOQ:"?"":" |")+" CONSEC.";}
   PRect("mkt_bar",px+pad-2,cur,pw-(pad*2)+4,18,c_stbar,c_stbar_tx,201); PLabelC("mkt_bar_tx",px+pw/2,cur+2,s_stbar,c_stbar_tx,InpPanelFontSize,true); cur+=22;

   double lim_perda_m=balance*(InpPerdaMaximaMoedaPct/100.0), lim_lucro_m=balance*(InpLucroAlvoMoedaPct/100.0);
   PSectionBadge("s_res",px,cur,pw,"RESULTADO DIÁRIO",(plTot>=0?CLR_TEAL:CLR_RED)); cur+=16;
   PRow("bal_acc",lx,rx,cur,"Saldo Conta",DoubleToString(balance,2)+" "+AccountInfoString(ACCOUNT_CURRENCY),CLR_TXT_WHITE); cur+=14;
   double tot_profit_acc = (g_StartBalance > 0) ? (balance - g_StartBalance) : 0.0;
   double tot_profit_pct = (g_StartBalance > 0) ? (tot_profit_acc / g_StartBalance * 100.0) : 0.0;
   string s_tot_acc_pct  = StringFormat(" (%.1f%%)", tot_profit_pct);
   color c_totAcc        = (tot_profit_acc > 0) ? CLR_TEAL : ((tot_profit_acc < 0) ? CLR_RED : CLR_TXT_PRIMARY);
   PRow("pl_tot_acc",lx,rx,cur,"Global (Total)",(tot_profit_acc>=0?"+":"")+DoubleToString(tot_profit_acc,2)+" "+AccountInfoString(ACCOUNT_CURRENCY)+s_tot_acc_pct,c_totAcc); cur+=14;
   PRow("pl_tot",lx,rx,cur,"Global (Dia)",(plTot>=0?"+":"")+DoubleToString(plTot,2)+" "+AccountInfoString(ACCOUNT_CURRENCY)+s_plt_pct,c_plTot); cur+=14;
   PRow("pl_sym",lx,rx,cur,_Symbol+" (Par Dia)",(plSym>=0?"+":"")+DoubleToString(plSym,2)+" "+AccountInfoString(ACCOUNT_CURRENCY)+s_pls_pct,c_plSym); cur+=14;
   int bar_w = 70, bar_h = 7, bar_x = rx - bar_w;
   if(lim_lucro_m > 0 && InpUseFechamentoMoeda) {
      double m_pct = MathMin(100.0, MathMax(0.0, (plSym > 0 ? plSym : 0) / lim_lucro_m * 100.0));
      int m_fill = (int)((bar_w * m_pct) / 100.0);
      PLabel("t_meta", lx, cur, "Meta (+"+DoubleToString(InpLucroAlvoMoedaPct,1)+"%)", CLR_TXT_DIM, InpPanelFontSize-1);
      PLabelR("m_meta_v", bar_x - 6, cur, (plSym>0?("+"+DoubleToString(plSym,2)):("$0.00")), C'0,230,118', InpPanelFontSize-2);
      PRect("meta_tr", bar_x, cur + 3, bar_w, bar_h, CLR_BG_CARD, CLR_LINE_SOFT, 204);
      if(m_fill > 0) PRect("meta_fl", bar_x, cur + 3, m_fill, bar_h, C'0,230,118', -1, 205);
      else ObjectDelete(0, PANEL_PREFIX + "meta_fl");
      cur += 14;
   } else {
      ObjectDelete(0, PANEL_PREFIX + "t_meta"); ObjectDelete(0, PANEL_PREFIX + "R_m_meta_v");
      ObjectDelete(0, PANEL_PREFIX + "meta_tr"); ObjectDelete(0, PANEL_PREFIX + "meta_fl");
   }

   if(lim_perda_m > 0 && InpUseFechamentoMoeda) {
      double r_pct = MathMin(100.0, MathMax(0.0, (plSym < 0 ? -plSym : 0) / lim_perda_m * 100.0));
      int r_fill = (int)((bar_w * r_pct) / 100.0);
      PLabel("t_ddm", lx, cur, "Risco (-"+DoubleToString(InpPerdaMaximaMoedaPct,1)+"%)", CLR_TXT_DIM, InpPanelFontSize-1);
      PLabelR("m_ddm_v", bar_x - 6, cur, (plSym<0?("-"+DoubleToString(MathAbs(plSym),2)):("$0.00")), C'255,107,107', InpPanelFontSize-2);
      PRect("ddm_tr", bar_x, cur + 3, bar_w, bar_h, CLR_BG_CARD, CLR_LINE_SOFT, 204);
      if(r_fill > 0) PRect("ddm_fl", bar_x, cur + 3, r_fill, bar_h, C'255,107,107', -1, 205);
      else ObjectDelete(0, PANEL_PREFIX + "ddm_fl");
      cur += 14;
   } else {
      ObjectDelete(0, PANEL_PREFIX + "t_ddm"); ObjectDelete(0, PANEL_PREFIX + "R_m_ddm_v");
      ObjectDelete(0, PANEL_PREFIX + "ddm_tr"); ObjectDelete(0, PANEL_PREFIX + "ddm_fl");
   }

   if(InpPropFirmMode) {
      double eq = AccountInfoDouble(ACCOUNT_EQUITY);
      double maxDDUsd = (g_StartBalance > 0) ? (g_StartBalance - eq) : 0; if(maxDDUsd < 0) maxDDUsd = 0;
      double baseCap = (g_StartBalance > 0) ? g_StartBalance : balance;
      double distMaxLossUsd = (baseCap * (InpPropFirmMaxDDLimitPct / 100.0)) - maxDDUsd;
      double distMaxLossPct = (balance > 0) ? (distMaxLossUsd / balance * 100.0) : 0;
      double totalProfitUsd = balance - g_StartBalance;
      double fase1TargetUsd = g_StartBalance * (InpPropFase1TargetPct / 100.0);
      double fase1FaltaUsd = MathMax(0, fase1TargetUsd - MathMax(0, totalProfitUsd));
      double fase1FaltaPct = (balance > 0) ? (fase1FaltaUsd / balance * 100.0) : 0;
      
      PRow("prop_dist", lx, rx, cur, "Dist. Perda Máx", StringFormat("+$%.2f (%.1f%% livre)", distMaxLossUsd, distMaxLossPct), CLR_TEAL); cur+=14;
      PRow("prop_f1",   lx, rx, cur, "Falta p/ Meta F1", StringFormat("+$%.2f (%.1f%%)", fase1FaltaUsd, fase1FaltaPct), CLR_AMBER); cur+=14;
   } else {
      ObjectDelete(0, PANEL_PREFIX + "prop_dist_l"); ObjectDelete(0, PANEL_PREFIX + "R_prop_dist_v");
      ObjectDelete(0, PANEL_PREFIX + "prop_f1_l");   ObjectDelete(0, PANEL_PREFIX + "R_prop_f1_v");
   }
   
   string s_vagas = StringFormat("DT %d/%d | FR %d/%d | Fb %d/%d", g_NPosDay, InpMaxDayTrades, g_NPosSwingFR, InpMaxFRSwingTrades, g_NPosSwingFibo, InpMaxFiboTrades);
   color c_pos = (g_NPosDay>=InpMaxDayTrades && g_NPosSwingFR>=InpMaxFRSwingTrades && g_NPosSwingFibo>=InpMaxFiboTrades) ? CLR_RED : ((g_FastNPosSymbol>0)?CLR_BLUE:CLR_TXT_LABEL);
   PRow("pos",lx,rx,cur,"Vagas Moeda",s_vagas,c_pos); cur+=16;

   PSectionBadge("s_tec",px,cur,pw,"TÉCNICO (L1)",c_perfil); cur+=16; int cx2=px+pw/2+4;
   PLabel("sl_l",lx,cur,"SL Base",CLR_TXT_LABEL,InpPanelFontSize); PLabelR("sl_v",px+pw/2-2,cur,DoubleToString(sl_pts,0)+" pts",CLR_TXT_PRIMARY,InpPanelFontSize);
   PLabel("atr_l",cx2,cur,"ATR",CLR_TXT_LABEL,InpPanelFontSize);   PLabelR("atr_v",rx,cur,DoubleToString(atr_val/_Point,0)+" pts",CLR_TXT_PRIMARY,InpPanelFontSize); cur+=14;
   color c_spread2=(cur_spread<=max_spread)?CLR_TXT_PRIMARY:CLR_RED;
   PLabel("spr_l",lx,cur,"Spread",CLR_TXT_LABEL,InpPanelFontSize); PLabelR("spr_v",px+pw/2-2,cur,(string)cur_spread+"/"+(string)max_spread,c_spread2,InpPanelFontSize);
   PLabel("lot_l",cx2,cur,"Lote",CLR_TXT_LABEL,InpPanelFontSize);  PLabelR("lot_v",rx,cur,DoubleToString(lot_next,2),CLR_AMBER,InpPanelFontSize,true); cur+=14;
   PLabel("prx_l",lx,cur,"Próx.",CLR_TXT_LABEL,InpPanelFontSize);  PLabelR("prx_v",px+pw/2-2,cur,s_next,CLR_TXT_DIM,InpPanelFontSize);
   PLabel("up_l",cx2,cur,"Up",CLR_TXT_LABEL,InpPanelFontSize);     PLabelR("up_v",rx,cur,s_up,CLR_TXT_DIM,InpPanelFontSize); cur+=14;
   PLabel("ses_l",lx,cur,"Sessão",CLR_TXT_LABEL,InpPanelFontSize); PLabelR("ses_v",rx,cur,GetMktSession(),CLR_AMBER,InpPanelFontSize); cur+=16;

   PSectionBadge("s_str",px,cur,pw,"ESTRATÉGIAS [MTF L1+L2]",CLR_TEAL); cur+=16;
   int ch=72, ico_x=6, nome_y=6, st_y=22, req_y=38, wr_y=54;
   double ask_p=SymbolInfoDouble(_Symbol,SYMBOL_ASK), bid_p=SymbolInfoDouble(_Symbol,SYMBOL_BID);
   double zone_p=(atr_val>0)?(atr_val/_Point)*2.0:0;
   bool in_rd_fr=(g_CachedFRTop>0&&MathAbs(g_CachedFRTop-ask_p)/_Point<=zone_p)||(g_CachedFRFundo>0&&MathAbs(bid_p-g_CachedFRFundo)/_Point<=zone_p);
   bool in_rd_fb=false; if(IsFiboActiveForSymbol() && g_CachedFiboH > 0 && g_CachedFiboLow > 0){double r_f=g_CachedFiboH-g_CachedFiboLow;if(r_f>=(atr_val*InpFibMinRange_ATR_Multi)){double nS=g_CachedFiboH-r_f*(InpFibLevel1/100.0),nB=g_CachedFiboLow+r_f*(InpFibLevel1/100.0);if(MathAbs(nS-ask_p)/_Point<=zone_p||MathAbs(bid_p-nB)/_Point<=zone_p)in_rd_fb=true;}}
   string m_dir = " [C/V]"; if(g_ModoConfluencia > 0) { if(g_MG_BuyAllowed && !g_MG_SellAllowed) m_dir = " [ C ]"; else if(!g_MG_BuyAllowed && g_MG_SellAllowed) m_dir = " [ V ]"; }
   ObjectDelete(0, PANEL_PREFIX + "fl_card"); ObjectDelete(0, PANEL_PREFIX + "fl_card_bg"); ObjectDelete(0, PANEL_PREFIX + "fl_card_acc");
   ObjectDelete(0, PANEL_PREFIX + "fl_n1"); ObjectDelete(0, PANEL_PREFIX + "fl_st"); ObjectDelete(0, PANEL_PREFIX + "fl_wr");

   // DIAGNÓSTICO INTEGRADO DE REQUISITOS F.ROMP
   bool d_sess=false; if(InpUseSessionFilter){MqlDateTime dts;TimeCurrent(dts);d_sess=!((InpSessionEndHour>InpSessionStartHour)?(dts.hour>=InpSessionStartHour&&dts.hour<InpSessionEndHour):(dts.hour>=InpSessionStartHour||dts.hour<InpSessionEndHour));}
   bool d_gblk=g_LocalGlobalBlock, d_blk=g_LocalBlocked, d_pau=g_BotPaused, d_spr2=(cur_spread>max_spread), d_liq2=IsLowLiquidityWindow(), d_osc2=IsLowOscillationWindow(), d_not2=g_CachedNoticiaBlock, d_cax2=g_LocalConsolidation;
   bool d_mpos = (g_FastNPos>=InpMaxSimultaneousOps || (g_NPosDay>=InpMaxDayTrades && g_NPosSwingFR>=InpMaxFRSwingTrades && g_NPosSwingFibo>=InpMaxFiboTrades));
   bool glb_blocked=(d_gblk||d_blk||d_pau||d_sess||d_mpos||d_spr2||d_liq2||d_osc2||d_not2||d_cax2);
   bool u_r2=InpUseFR, c_c2=g_CachedFrCdOk, c_l2=(g_CachedFRTop>0&&g_CachedFRFundo>0);
   bool dir_s_ok2,dir_b_ok2; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok2,dir_b_ok2);
   double ask_curr_main = SymbolInfoDouble(_Symbol, SYMBOL_ASK), bid_curr_main = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   bool perto_topo_main = (g_CachedFRTop > 0 && MathAbs(g_CachedFRTop - ask_curr_main) < MathAbs(bid_curr_main - g_CachedFRFundo));
   bool confl_mg_main_ok = (g_ModoConfluencia > 0) ? (perto_topo_main ? g_MG_SellAllowed : g_MG_BuyAllowed) : true;
   bool dir_lado_main_ok = perto_topo_main ? dir_s_ok2 : dir_b_ok2;

   bool fr_all_ok=(!glb_blocked && u_r2 && c_c2 && c_l2 && dir_lado_main_ok && confl_mg_main_ok);

   string s_fr_req = ""; color c_fr_req_clr = C'0,230,118';
   if(fr_all_ok) {
      s_fr_req = "Requisitos: ✔ 100% OK (PRONTO)"; c_fr_req_clr = C'0,230,118'; // Verde Neon
   } else {
      c_fr_req_clr = C'255,107,107'; // [OPÇÃO 1: SALMÃO CLARO] Alto contraste e leitura perfeita no fundo dark
      if(!u_r2) s_fr_req = "Requisitos: ✖ Estratégia Desativada";
      else if(d_pau) s_fr_req = "Requisitos: ✖ Robô Pausado";
      else if(d_sess) s_fr_req = "Requisitos: ✖ Fora da Sessão (10-22h)";
      else if(d_spr2) s_fr_req = StringFormat("Requisitos: ✖ Spread Alto (%d/%d pts)", cur_spread, max_spread);
      else if(d_not2) s_fr_req = "Requisitos: ✖ Bloqueio por Notícia";
      else if(d_osc2) s_fr_req = "Requisitos: ✖ Mercado Parado";
      else if(d_liq2) s_fr_req = "Requisitos: ✖ Baixa Liquidez";
      else if(d_cax2) s_fr_req = "Requisitos: ✖ Caixote / Consolidação";
      else if(d_mpos) s_fr_req = "Requisitos: ✖ Limite Vagas Cheio";
      else if(!c_c2)  s_fr_req = "Requisitos: ✖ Cooldown L1 Ativo";
      else if(!c_l2)  s_fr_req = "Requisitos: ✖ Aguardando Mapeamento";
      else if(InpFR_BlockAgainstSuperTrend && g_H4_ADX >= InpFR_SuperTrend_ADX && ((perto_topo_main && ask_curr_main > g_MG_EMA200 && g_MG_EMA200 > 0) || (!perto_topo_main && bid_curr_main < g_MG_EMA200 && g_MG_EMA200 > 0)))
         s_fr_req = StringFormat("Requisitos: ✖ Super-Tendência (%s)", perto_topo_main ? "Alta ADX>30" : "Baixa ADX>30");
      else if(!confl_mg_main_ok) s_fr_req = StringFormat("Requisitos: ✖ MktGlance Bloq. (%s)", perto_topo_main ? "Exige Venda" : "Exige Compra");
      else if(!dir_lado_main_ok) s_fr_req = StringFormat("Requisitos: ✖ Direção %s Bloq.", perto_topo_main ? "Venda" : "Compra");
      else if(d_gblk || d_blk) s_fr_req = "Requisitos: ✖ Trava Global/Moeda";
      else s_fr_req = "Requisitos: ✖ Faltam Requisitos";
   }

   bool show_fibo_card = IsFiboActiveForSymbol();
   if(!show_fibo_card) {
      ObjectDelete(0, PANEL_PREFIX + "fb_card"); ObjectDelete(0, PANEL_PREFIX + "fb_card_bg"); ObjectDelete(0, PANEL_PREFIX + "fb_card_acc");
      ObjectDelete(0, PANEL_PREFIX + "fb_n1"); ObjectDelete(0, PANEL_PREFIX + "fb_st"); ObjectDelete(0, PANEL_PREFIX + "fb_req"); ObjectDelete(0, PANEL_PREFIX + "fb_wr");
   }

   // --- VALIDAÇÃO DE LINHA CONTÍNUA E ARMADO REAL DO FR ---
   bool fr_dir_sell_chk = true, fr_dir_buy_chk = true;
   GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, fr_dir_sell_chk, fr_dir_buy_chk);
   bool fr_sell_confl_chk = (g_ModoConfluencia > 0) ? g_MG_SellAllowed : true;
   bool fr_buy_confl_chk  = (g_ModoConfluencia > 0) ? g_MG_BuyAllowed : true;
   if(!fr_sell_confl_chk) fr_dir_sell_chk = false;
   if(!fr_buy_confl_chk)  fr_dir_buy_chk  = false;

   bool fr_line_solid = (fr_dir_sell_chk && fr_sell_confl_chk && (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask_p)/_Point <= zone_p))) ||
                        (fr_dir_buy_chk  && fr_buy_confl_chk  && (g_ReadyFR_Buy  || (MathAbs(bid_p-g_CachedFRFundo)/_Point <= zone_p)));
   bool is_ready_fr = InpUseFR && fr_all_ok && (fr_dir_sell_chk || fr_dir_buy_chk) && (g_ReadyFR || (in_rd_fr && fr_line_solid));

   int cw_fr = show_fibo_card ? ((pw - (pad * 2) - 4) / 2) : (pw - (pad * 2));
   {
      int ox=px+pad-2;
      
      // Quando ARMADO E COM LINHA CONTÍNUA -> Vermelho (Img 3). Quando PONTILHADO/ESPERA/BLOQ -> 100% Cinza Neutro (Img 1)
      color c_fr_ico = is_ready_fr ? C'245,80,80' : CLR_MUTED;
      color bg_fr    = is_ready_fr ? C'38,14,18'  : CLR_BG_CARD;
      color txt_fr   = is_ready_fr ? CLR_TXT_WHITE : CLR_TXT_LABEL;
      color c_fr_st  = is_ready_fr ? (g_ReadyFR ? C'0,255,136' : C'255,193,7') : CLR_MUTED;
      string s_fr2   = !InpUseFR ? "OFF" : (is_ready_fr ? (g_ReadyFR ? "GATILHO!" : "ARMADO!") : "Prox.Vela");
      
      string tf_fr_card = StringSubstr(EnumToString(g_TF_L1), 7);
      PModuleCardH("fr_card",ox,cur,cw_fr,ch,c_fr_ico,bg_fr);
      PLabel("fr_n1",ox+ico_x,cur+nome_y,show_fibo_card?("F.ROMP ["+tf_fr_card+"]"+m_dir):("FALSO ROMPIMENTO ["+tf_fr_card+"]"+m_dir),txt_fr,InpPanelFontSize,true);
      PLabel("fr_st",ox+ico_x,cur+st_y,s_fr2,c_fr_st,InpPanelFontSize,true);
      PLabel("fr_req",ox+ico_x,cur+req_y,show_fibo_card?(fr_all_ok?"Req: ✔ OK":"Req: ✖ BLOQ"):s_fr_req,is_ready_fr?c_fr_req_clr:CLR_TXT_DIM,InpPanelFontSize-2,true);
      string sr_fr=StringFormat(show_fibo_card?"%dW/%dT":"Assertividade: %dW / %dT",g_FrWins,g_FrTotal);
      if(g_FrTotal>0)sr_fr+=" ("+IntegerToString((int)((g_FrWins*100.0)/g_FrTotal))+"%)";
      PLabel("fr_wr",ox+ico_x,cur+wr_y,sr_fr,(is_ready_fr && g_FrWins>=g_FrTotal/2.0&&g_FrTotal>0)?C'0,230,118':CLR_TXT_LABEL,InpPanelFontSize-2);
   }

   if(show_fibo_card) {
      int cw2 = (pw - (pad * 2) - 4) / 2;
      int ox=px+pad-2+cw2+4;
      
      // --- VALIDAÇÃO DE LINHA CONTÍNUA E ARMADO REAL DA FIBO ---
      double nSell_chk = 0, nBuy_chk = 0;
      if(g_CachedFiboH > 0 && g_CachedFiboLow > 0) {
         double range_chk = g_CachedFiboH - g_CachedFiboLow;
         if(range_chk >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
            nSell_chk = g_CachedFiboH - range_chk * (InpFibLevel1 / 100.0);
            nBuy_chk  = g_CachedFiboLow + range_chk * (InpFibLevel1 / 100.0);
         }
      }
      bool fb_dir_sell_chk = (mkt_lateral || tDir == -1);
      bool fb_dir_buy_chk  = (mkt_lateral || tDir == 1);
      if(g_ModoConfluencia > 0) {
         if(!g_MG_SellAllowed) fb_dir_sell_chk = false;
         if(!g_MG_BuyAllowed)  fb_dir_buy_chk  = false;
      }
      bool fb_line_solid = (fb_dir_sell_chk && (g_ReadyFibo || (MathAbs(nSell_chk-ask_p)/_Point <= zone_p))) ||
                           (fb_dir_buy_chk  && (g_ReadyFibo || (MathAbs(bid_p-nBuy_chk)/_Point <= zone_p)));
      
      // [SINCRONIA TOTAL] Card Fibo só fica ARMADO se 100% dos requisitos (ADX, Tendência, Confluência) estiverem válidos
      bool fb_adx_chk   = p_UsePassaFiltroADXFibo ? (g_H4_ADX >= cfg_ADX_MinLevel) : true;
      int  t_h4_card    = ComputeTrendDir(hShortEMA_H4, hEMA_H4);
      bool fb_trend_chk = (!p_UseTrendDirFibo || t_h4_card == 1 || t_h4_card == -1);
      bool fb_confl_chk = (g_ModoConfluencia > 0) ? (t_h4_card == 1 ? g_MG_BuyAllowed : (t_h4_card == -1 ? g_MG_SellAllowed : (g_MG_BuyAllowed || g_MG_SellAllowed))) : true;
      
      datetime cb_h4_card = iTime(_Symbol, PERIOD_H4, 0);
      int cd_sec_card = InpFR_CooldownMinutes * 60;
      bool fb_cd_time_b = (cd_sec_card <= 0 || (TimeCurrent() - l_fibo_buy_ts >= cd_sec_card));
      bool fb_cd_time_s = (cd_sec_card <= 0 || (TimeCurrent() - l_fibo_sell_ts >= cd_sec_card));
      bool fb_bar_ok    = (tDir == 1) ? (cb_h4_card != f_h4_buy && fb_cd_time_b) : ((tDir == -1) ? (cb_h4_card != f_h4_sell && fb_cd_time_s) : ((cb_h4_card != f_h4_buy && fb_cd_time_b) || (cb_h4_card != f_h4_sell && fb_cd_time_s)));

      bool fb_all_ok = (!glb_blocked && IsFiboActiveForSymbol() && fb_cd && fb_bar_ok && 
                        (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0) &&
                        fb_adx_chk && fb_trend_chk && fb_confl_chk);
      bool is_ready_fb = fb_all_ok && (g_ReadyFibo || (in_rd_fb && fb_line_solid));
      
      // Quando ARMADO E COM LINHA CONTÍNUA -> Amarelo (Img 2). Quando PONTILHADO/ESPERA/BLOQ -> 100% Cinza Neutro (Img 1)
      color c_fb_ico = is_ready_fb ? CLR_AMBER : CLR_MUTED;
      color bg_fb    = is_ready_fb ? CLR_AMBER_DIM : CLR_BG_CARD;
      color txt_fb   = is_ready_fb ? CLR_TXT_WHITE : CLR_TXT_LABEL;
      color c_fb_st  = is_ready_fb ? (g_ReadyFibo ? C'0,255,136' : CLR_AMBER) : CLR_MUTED;
      string s_fb    = !IsFiboActiveForSymbol() ? "OFF" : (is_ready_fb ? (g_ReadyFibo ? "GATILHO!" : "ARMADO!") : "Prox.Vela");
      
      PModuleCardH("fb_card",ox,cur,cw2,ch,c_fb_ico,bg_fb);
      PLabel("fb_n1",ox+ico_x,cur+nome_y,"FIBO [H4]"+m_dir,txt_fb,InpPanelFontSize,true);
      PLabel("fb_st",ox+ico_x,cur+st_y,s_fb,c_fb_st,InpPanelFontSize,true);
      string sr_fb=StringFormat("%dW/%dT",g_FiboWins,g_FiboTotal);
      if(g_FiboTotal>0)sr_fb+=" ("+IntegerToString((int)((g_FiboWins*100.0)/g_FiboTotal))+"%)";
      PLabel("fb_wr",ox+ico_x,cur+wr_y,sr_fb,(is_ready_fb && g_FiboWins>=g_FiboTotal/2.0&&g_FiboTotal>0)?CLR_TEAL:CLR_TXT_LABEL,InpPanelFontSize-2);
   }
   cur+=ch+22;

   if(g_FastNPosSymbol > 0) {
      ObjectDelete(0,PANEL_PREFIX+"btn_pause");
      double c_posOpen=0, c_posSL=0, c_posTP=0, c_posProfit=0; long c_posType=0; double c_lot=0; string c_comm=""; ulong c_ticket=0;
      for(int i=PositionsTotal()-1;i>=0;i--){
         c_ticket=PositionGetTicket(i);
         if(PositionSelectByTicket(c_ticket)&&PositionGetInteger(POSITION_MAGIC)==InpMagic&&PositionGetString(POSITION_SYMBOL)==_Symbol){
            c_posOpen=PositionGetDouble(POSITION_PRICE_OPEN);
            c_posSL=PositionGetDouble(POSITION_SL);
            c_posTP=PositionGetDouble(POSITION_TP);
            c_posProfit=PositionGetDouble(POSITION_PROFIT)+PositionGetDouble(POSITION_SWAP);
            c_posType=PositionGetInteger(POSITION_TYPE);
            c_lot=PositionGetDouble(POSITION_VOLUME);
            c_comm=PositionGetString(POSITION_COMMENT);
            break;
         }
      }
      double c_curr=(c_posType==POSITION_TYPE_BUY)?SymbolInfoDouble(_Symbol,SYMBOL_BID):SymbolInfoDouble(_Symbol,SYMBOL_ASK);
      double actual_sl_pts = (c_posSL > 0) ? (MathAbs(c_posOpen - c_posSL) / _Point) : g_CachedSlPts;
      double trig_pct = (StringFind(c_comm, "Fibo") >= 0) ? InpBE_Trigger_Fibo : InpBE_Trigger_Normal;
      double dist_be = 0;
      if(c_posSL > 0) {
         double trig_price = (c_posType == POSITION_TYPE_BUY) ? (c_posOpen + (actual_sl_pts * trig_pct * _Point)) : (c_posOpen - (actual_sl_pts * trig_pct * _Point));
         dist_be = (c_posType == POSITION_TYPE_BUY) ? (trig_price - c_curr) : (c_curr - trig_price);
      }
      bool be_triggered=(((c_posSL>=c_posOpen)&&(c_posType==POSITION_TYPE_BUY))||((c_posSL<=c_posOpen)&&(c_posType==POSITION_TYPE_SELL)&&c_posSL>0));
      string be_txt=""; color be_clr=CLR_TXT_LABEL; bool be_close=false;
      if(be_triggered){be_txt=" B.E. ATIVO ✓ ";be_clr=CLR_TEAL;}else if(c_posSL>0){double pt_to_be=dist_be/_Point;if(pt_to_be<=50.0&&dist_be>0){be_close=true;be_txt=StringFormat(" B.E. EM %.0f pts! ",pt_to_be);be_clr=CLR_TEAL;}else{be_txt=StringFormat(" B.E. dist: %.0f pts ",pt_to_be);be_clr=CLR_TXT_DIM;}}else{be_txt=" AGUARDANDO SL ";be_clr=CLR_TXT_DIM;}
      PSectionBadge("s_bata",px,cur,pw,"POSIÇÃO",CLR_AMBER); int be_bx=px+pad+76,be_bw=(int)StringLen(be_txt)*6+4;
      PRect("s_bata_be_bg",be_bx,cur+1,be_bw,12,(be_close||be_triggered)?be_clr:CLR_BG_CARD,-1,215);
      PLabel("s_bata_be",be_bx+4,cur+2,be_txt,(be_close||be_triggered)?CLR_BG_BASE:be_clr,InpPanelFontSize-2,true);
      PButton("btn_col_pos",rx-22,cur+1,20,14,g_ColPosicao?"[+]":"[-]",be_close?CLR_AMBER_DIM:CLR_BG_HEADER,g_ColPosicao?(be_close?CLR_AMBER:CLR_TEAL):CLR_TXT_DIM); cur+=16;
      if(!g_ColPosicao){
         string pnl_str = StringFormat("P&L: %s$%.2f USD", (c_posProfit>=0?"+":""), c_posProfit);
         color pnl_clr = (c_posProfit>=0)?CLR_TEAL:CLR_RED;
         PLabel("bta_n",px+pad+4,cur,(c_posType==POSITION_TYPE_BUY?"▼ COMPRA":"▲ VENDA")+" "+DoubleToString(c_lot,2)+" ("+c_comm+")",(c_posType==POSITION_TYPE_BUY)?CLR_TEAL:CLR_RED,InpPanelFontSize,true);
         PLabelR("bta_pnl",rx-6,cur,pnl_str,pnl_clr,InpPanelFontSize,true);cur+=14;
         string sl_s = (c_posSL>0)?DoubleToString(c_posSL,_Digits):"---";
         string tp_s = (c_posTP>0)?DoubleToString(c_posTP,_Digits):"---";
         string d_left  = StringFormat("Ab: %s  •  At: %s", DoubleToString(c_posOpen,_Digits), DoubleToString(c_curr,_Digits));
         string d_right = StringFormat("SL: %s  •  TP: %s", sl_s, tp_s);
         PLabel("bta_det_l",px+pad+4,cur,d_left,CLR_TXT_LABEL,InpPanelFontSize-1);
         PLabelR("bta_det_r",rx-6,cur,d_right,CLR_TXT_PRIMARY,InpPanelFontSize-1);cur+=14;cur+=2;
      } else {
         ObjectDelete(0,PANEL_PREFIX+"bg_bata");ObjectDelete(0,PANEL_PREFIX+"bta_n");ObjectDelete(0,PANEL_PREFIX+"R_bta_pnl");ObjectDelete(0,PANEL_PREFIX+"bta_det_l");ObjectDelete(0,PANEL_PREFIX+"R_bta_det_r");
      }
   } else {
      ObjectDelete(0,PANEL_PREFIX+"s_bata_la");ObjectDelete(0,PANEL_PREFIX+"s_bata_bg");ObjectDelete(0,PANEL_PREFIX+"s_bata_tx");ObjectDelete(0,PANEL_PREFIX+"s_bata_lb");ObjectDelete(0,PANEL_PREFIX+"s_bata_be");ObjectDelete(0,PANEL_PREFIX+"bg_bata");ObjectDelete(0,PANEL_PREFIX+"bta_n");ObjectDelete(0,PANEL_PREFIX+"R_bta_pnl");ObjectDelete(0,PANEL_PREFIX+"bta_det_l");ObjectDelete(0,PANEL_PREFIX+"R_bta_det_r");ObjectDelete(0,PANEL_PREFIX+"btn_col_pos");
   }

   // [PROP] Seção Prop Firm no painel (só visível quando InpPropFirmMode = true)
   if(InpPropFirmMode) {
      PSectionBadge("s_prop",px,cur,pw,"● PROP FIRM MODE",CLR_PURPLE);
      PButton("btn_toggle_prop",rx-52,cur+1,50,14,g_ShowPropFirmHUD?"[▼ HUD]":"[▲ HUD]",g_ShowPropFirmHUD?CLR_PURPLE_DIM:CLR_BG_HEADER,g_ShowPropFirmHUD?CLR_PURPLE:CLR_TXT_DIM); cur+=16;
      double _balcur=AccountInfoDouble(ACCOUNT_BALANCE);
      double _tot_earned=_balcur-g_StartBalance;
      string s_cons=((_tot_earned>0&&g_CachedPlTotReal>0)?StringFormat("%.1f%% / %.1f%%",g_ConsistencyPct,InpPropConsistencyPct):"---");
      color c_cons=(g_ConsistencyPct>InpPropConsistencyPct)?CLR_RED:(g_ConsistencyPct>InpPropConsistencyPct*0.85)?CLR_AMBER:CLR_TEAL;
      PRow("prop_cons",lx,rx,cur,"Consistência Hoje",s_cons,c_cons); cur+=14;
      double _prop_lim=-(_balcur*(InpPropMaxDailyLossPct/100.0));
      double _pl_tot=g_CachedPlTotReal+g_FloatingPlTot;
      string s_dd=DoubleToString(_pl_tot,2)+" / "+DoubleToString(_prop_lim,2)+" "+AccountInfoString(ACCOUNT_CURRENCY);
      color c_dd=(_pl_tot<=_prop_lim*0.75)?CLR_RED:(_pl_tot<=_prop_lim*0.5)?CLR_AMBER:CLR_TEAL;
      PRow("prop_dd",lx,rx,cur,"P&L / Limite Diário",s_dd,c_dd); cur+=16;
   } else {
      ObjectDelete(0, PANEL_PREFIX+"s_prop_la"); ObjectDelete(0, PANEL_PREFIX+"s_prop_bg"); ObjectDelete(0, PANEL_PREFIX+"s_prop_tx"); ObjectDelete(0, PANEL_PREFIX+"s_prop_lb");
      ObjectDelete(0, PANEL_PREFIX+"btn_toggle_prop");
      ObjectDelete(0, PANEL_PREFIX+"prop_cons_l"); ObjectDelete(0, PANEL_PREFIX+"R_prop_cons_v");
      ObjectDelete(0, PANEL_PREFIX+"prop_dd_l");   ObjectDelete(0, PANEL_PREFIX+"R_prop_dd_v");
   }
   PSectionBadge("s_ctrl",px,cur,pw,"CONTROLES",CLR_TXT_DIM); cur+=16;
   int btn_w=(pw-(pad*2)-8)/2;
   // [B07 FIX] btn_pause ocupa metade sempre; btn_zerar sempre visível se há posição
   PButton("btn_pause",px+pad-2,cur,btn_w,22,g_BotPaused?"▶ RETOMAR":"⏸ PAUSAR",g_BotPaused?CLR_TEAL_DIM:CLR_BG_BTN_PAUSE,g_BotPaused?CLR_TEAL:CLR_BLUE);
   if(g_FastNPosSymbol>0) PButton("btn_zerar",px+pad-2+btn_w+8,cur,btn_w,22,"⚠ ZERAR",CLR_BG_BTN_PANIC,CLR_RED);
   else ObjectDelete(0,PANEL_PREFIX+"btn_zerar");
   cur+=26;
   ObjectDelete(0, PANEL_PREFIX + "btn_leg_fl");
   int tw=(pw-(pad*2)-10)/3;
   PButton("btn_leg_fr",px+pad-2,cur,tw,16,g_ViewFR?"● F.R.":"○ F.R.",CLR_BG_CARD,g_ViewFR?CLR_RED:CLR_MUTED);
   PButton("btn_leg_fb",px+pad-2+tw+3,cur,tw,16,g_ViewFibo?"● FIBO":"○ FIBO",CLR_BG_CARD,g_ViewFibo?CLR_AMBER:CLR_MUTED);
   PButton("btn_leg_zn",px+pad-2+tw*2+6,cur,tw+4,16,g_ViewZonas?"👁 ZEN":"👁 ZEN",g_ViewZonas?CLR_PURPLE_DIM:CLR_BG_CARD,g_ViewZonas?CLR_PURPLE:CLR_TXT_DIM); cur+=22;
   PLabel("lbl_linhas",px+pad-2,cur+2,"LINHAS:",CLR_TXT_LABEL,InpPanelFontSize-1,true);
   int btn_w3=(pw-(pad*2)-48)/3;
   PButton("btn_l0",px+pad+48,cur,btn_w3,16,"TODAS",g_LinhasModo==0?CLR_TEAL_DIM:CLR_BG_CARD,g_LinhasModo==0?CLR_TEAL:CLR_TXT_DIM);
   PButton("btn_l1",px+pad+48+btn_w3+2,cur,btn_w3,16,"ACESAS",g_LinhasModo==1?CLR_AMBER_DIM:CLR_BG_CARD,g_LinhasModo==1?CLR_AMBER:CLR_TXT_DIM);
   PButton("btn_l2",px+pad+48+btn_w3*2+4,cur,btn_w3,16,"NENHUM",g_LinhasModo==2?CLR_RED_DIM:CLR_BG_CARD,g_LinhasModo==2?CLR_RED:CLR_TXT_DIM); cur+=22;

   PLabel("lbl_confl",px+pad-2,cur+2,"CONFL.:",CLR_TXT_LABEL,InpPanelFontSize-1,true);
   string c_txt = "OFF (PURO)"; color c_bg = CLR_BG_CARD; color c_fg = CLR_TXT_DIM;
   if(g_ModoConfluencia==1) { c_txt="M15 (AGRESSIVO)"; c_bg=CLR_AMBER_DIM; c_fg=CLR_AMBER; }
   else if(g_ModoConfluencia==2) { c_txt="H1 (MODERADO)"; c_bg=CLR_BLUE_DIM; c_fg=CLR_BLUE; }
   else if(g_ModoConfluencia==3) { c_txt="H2 (CONSERVADOR)"; c_bg=CLR_PURPLE_DIM; c_fg=CLR_PURPLE; }
   else if(g_ModoConfluencia==4) { c_txt="H4 (MACRO)"; c_bg=CLR_TEAL_DIM; c_fg=CLR_TEAL; }
   PButton("btn_confl",px+pad+48,cur,pw-(pad*2)-48,16,c_txt,c_bg,c_fg); cur+=22;

   PSectionBadge("s_log",px,cur,pw,"TERMINAL",CLR_TXT_DIM);
   PButton("btn_col_term",rx-22,cur+1,20,14,g_ColTerminal?"[+]":"[-]",CLR_BG_HEADER,g_ColTerminal?CLR_TEAL:CLR_TXT_DIM); cur+=16;
   if(!g_ColTerminal){PRect("log_bg",px+pad-2,cur,pw-(pad*2)+4,36,CLR_BG_SECTION,CLR_LINE_SOFT,201);for(int i=0;i<2;i++){string ls=g_Log[i];color lc=(i==0)?CLR_AMBER:CLR_TXT_LABEL;if(ls=="---"){ls="—";lc=CLR_TXT_DIM;}else if(StringLen(ls)>42)ls=StringSubstr(ls,0,40)+"..";PLabel("log_"+IntegerToString(i),px+pad+2,cur+3+(i*12),ls,lc,InpPanelFontSize-1);}cur+=36;}
   else{ObjectDelete(0,PANEL_PREFIX+"log_bg");ObjectDelete(0,PANEL_PREFIX+"log_0");ObjectDelete(0,PANEL_PREFIX+"log_1");}

   PRect("footer_bg",px,cur,pw,16,CLR_BG_HEADER,-1,200);
   PLabel("ft_time",px+pad,cur+3,TimeToString(TimeCurrent(),TIME_DATE|TIME_MINUTES),CLR_TXT_DIM,InpPanelFontSize-2);
   PLabelR("ft_ver",rx,cur+3,"Orion Logic ©",CLR_TXT_DIM,InpPanelFontSize-2); cur+=16;

   g_PanelHeight=cur-py; ObjectSetInteger(0,PANEL_PREFIX+"border",OBJPROP_YSIZE,g_PanelHeight+2); ObjectSetInteger(0,PANEL_PREFIX+"bg_main",OBJPROP_YSIZE,g_PanelHeight);
}

void DesenharPainelDiag() {
   if(MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE)) return;

   string DP=PANEL_PREFIX+"D_";
   if(!g_ShowDiag||!InpShowPanel){ int objs=ObjectsTotal(0,0,-1); for(int _i=objs-1;_i>=0;_i--){string _nm=ObjectName(0,_i,0,-1);if(StringFind(_nm,DP)==0)ObjectDelete(0,_nm);} return; }

   string m_dir = " [C/V]"; if(g_ModoConfluencia > 0) { if(g_MG_BuyAllowed && !g_MG_SellAllowed) m_dir = " [ C ]"; else if(!g_MG_BuyAllowed && g_MG_SellAllowed) m_dir = " [ V ]"; }

   int dpx=InpPanelX+PANEL_W+8,dpy=InpPanelY,dpw=260,dpad=8,dlx=dpx+dpad,drx=dpx+dpw-dpad,cur=dpy;
   #define DPRECT(nm_,x_,y_,w_,h_,bg_,brd_,z_) {string _n=DP+nm_;if(ObjectFind(0,_n)<0)ObjectCreate(0,_n,OBJ_RECTANGLE_LABEL,0,0,0);ObjectSetInteger(0,_n,OBJPROP_XDISTANCE,x_);ObjectSetInteger(0,_n,OBJPROP_YDISTANCE,y_);ObjectSetInteger(0,_n,OBJPROP_XSIZE,w_);ObjectSetInteger(0,_n,OBJPROP_YSIZE,h_);ObjectSetInteger(0,_n,OBJPROP_BGCOLOR,bg_);ObjectSetInteger(0,_n,OBJPROP_BORDER_TYPE,BORDER_FLAT);ObjectSetInteger(0,_n,OBJPROP_COLOR,(brd_)>=0?(color)(brd_):bg_);ObjectSetInteger(0,_n,OBJPROP_WIDTH,(brd_)>=0?1:0);ObjectSetInteger(0,_n,OBJPROP_CORNER,CORNER_LEFT_UPPER);ObjectSetInteger(0,_n,OBJPROP_BACK,false);ObjectSetInteger(0,_n,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,_n,OBJPROP_HIDDEN,true);ObjectSetInteger(0,_n,OBJPROP_ZORDER,z_);ObjectSetString(0,_n,OBJPROP_TOOLTIP,"\n");}
   #define DPLBL(nm_,x_,y_,txt_,clr_,sz_,bold_) {string _n=DP+nm_;if(ObjectFind(0,_n)<0)ObjectCreate(0,_n,OBJ_LABEL,0,0,0);ObjectSetInteger(0,_n,OBJPROP_XDISTANCE,x_);ObjectSetInteger(0,_n,OBJPROP_YDISTANCE,y_);ObjectSetString(0,_n,OBJPROP_TEXT,txt_);ObjectSetInteger(0,_n,OBJPROP_COLOR,clr_);ObjectSetString(0,_n,OBJPROP_FONT,bold_?"Arial Bold":"Arial");ObjectSetInteger(0,_n,OBJPROP_FONTSIZE,sz_>0?sz_:InpPanelFontSize);ObjectSetInteger(0,_n,OBJPROP_CORNER,CORNER_LEFT_UPPER);ObjectSetInteger(0,_n,OBJPROP_ANCHOR,ANCHOR_LEFT_UPPER);ObjectSetInteger(0,_n,OBJPROP_BACK,false);ObjectSetInteger(0,_n,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,_n,OBJPROP_HIDDEN,true);ObjectSetInteger(0,_n,OBJPROP_ZORDER,260);ObjectSetString(0,_n,OBJPROP_TOOLTIP,"\n");}
   #define DPLBLR(nm_,x_,y_,txt_,clr_,sz_,bold_) {string _n=DP+nm_;if(ObjectFind(0,_n)<0)ObjectCreate(0,_n,OBJ_LABEL,0,0,0);ObjectSetInteger(0,_n,OBJPROP_XDISTANCE,x_);ObjectSetInteger(0,_n,OBJPROP_YDISTANCE,y_);ObjectSetString(0,_n,OBJPROP_TEXT,txt_);ObjectSetInteger(0,_n,OBJPROP_COLOR,clr_);ObjectSetString(0,_n,OBJPROP_FONT,bold_?"Arial Bold":"Arial");ObjectSetInteger(0,_n,OBJPROP_FONTSIZE,sz_>0?sz_:InpPanelFontSize);ObjectSetInteger(0,_n,OBJPROP_CORNER,CORNER_LEFT_UPPER);ObjectSetInteger(0,_n,OBJPROP_ANCHOR,ANCHOR_RIGHT_UPPER);ObjectSetInteger(0,_n,OBJPROP_BACK,false);ObjectSetInteger(0,_n,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,_n,OBJPROP_HIDDEN,true);ObjectSetInteger(0,_n,OBJPROP_ZORDER,260);ObjectSetString(0,_n,OBJPROP_TOOLTIP,"\n");}
   bool d_session=false;if(InpUseSessionFilter){MqlDateTime dts;TimeCurrent(dts);d_session=!((InpSessionEndHour>InpSessionStartHour)?(dts.hour>=InpSessionStartHour&&dts.hour<InpSessionEndHour):(dts.hour>=InpSessionStartHour||dts.hour<InpSessionEndHour));}
   bool d_gblock=g_LocalGlobalBlock,d_block=g_LocalBlocked,d_pause=g_BotPaused,d_spr=(g_FastSpread>g_CachedMaxSpread),d_liq=IsLowLiquidityWindow(),d_osc=IsLowOscillationWindow(),d_not=g_CachedNoticiaBlock,d_cax=g_LocalConsolidation;
   bool d_maxpos = (g_FastNPos>=InpMaxSimultaneousOps || (g_NPosDay>=InpMaxDayTrades && g_NPosSwingFR>=InpMaxFRSwingTrades && g_NPosSwingFibo>=InpMaxFiboTrades));
   bool any_glb=(d_gblock||d_block||d_pause||d_session||d_maxpos||d_spr||d_liq||d_osc||d_not||d_cax);
   color c_border=any_glb?CLR_RED:CLR_PURPLE; static int s_diag_h=250;
   DPRECT("border",dpx-1,dpy-1,dpw+2,s_diag_h+2,CLR_LINE_HARD,(int)c_border,197);DPRECT("bg",dpx,dpy,dpw,s_diag_h,CLR_BG_BASE,-1,198);DPRECT("hdr_bg",dpx,dpy,dpw,2,CLR_PURPLE,-1,200);DPRECT("hdr_main",dpx,dpy+2,dpw,18,CLR_BG_HEADER,-1,199);DPLBL("hdr_ico",dlx,cur+4,"⚡",CLR_PURPLE,InpPanelFontSize,true);DPLBL("hdr_ttl",dlx+14,cur+4,"DIAGNÓSTICO MTF",CLR_TXT_WHITE,InpPanelFontSize,true);
   {string _bn=DP+"btn_close";if(ObjectFind(0,_bn)<0)ObjectCreate(0,_bn,OBJ_BUTTON,0,0,0);ObjectSetInteger(0,_bn,OBJPROP_XDISTANCE,drx-8);ObjectSetInteger(0,_bn,OBJPROP_YDISTANCE,cur+3);ObjectSetInteger(0,_bn,OBJPROP_XSIZE,16);ObjectSetInteger(0,_bn,OBJPROP_YSIZE,14);ObjectSetString(0,_bn,OBJPROP_TEXT,"✕");ObjectSetInteger(0,_bn,OBJPROP_BGCOLOR,CLR_BG_HEADER);ObjectSetInteger(0,_bn,OBJPROP_COLOR,CLR_TXT_LABEL);ObjectSetInteger(0,_bn,OBJPROP_BORDER_COLOR,CLR_LINE_HARD);ObjectSetString(0,_bn,OBJPROP_FONT,"Arial Bold");ObjectSetInteger(0,_bn,OBJPROP_FONTSIZE,8);ObjectSetInteger(0,_bn,OBJPROP_CORNER,CORNER_LEFT_UPPER);ObjectSetInteger(0,_bn,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,_bn,OBJPROP_HIDDEN,true);ObjectSetInteger(0,_bn,OBJPROP_STATE,false);ObjectSetInteger(0,_bn,OBJPROP_ZORDER,310);}
   ObjectDelete(0, DP+"btn_tab_fl");
   if(g_DiagTab == 0) g_DiagTab = 1;
   DPRECT("tab_bg",dpx,cur,dpw,24,CLR_BG_SECTION,-1,199);int tw=(dpw-16)/2;
   {string _bn=DP+"btn_tab_fr";if(ObjectFind(0,_bn)<0)ObjectCreate(0,_bn,OBJ_BUTTON,0,0,0);ObjectSetInteger(0,_bn,OBJPROP_XDISTANCE,dlx);ObjectSetInteger(0,_bn,OBJPROP_YDISTANCE,cur+2);ObjectSetInteger(0,_bn,OBJPROP_XSIZE,tw);ObjectSetInteger(0,_bn,OBJPROP_YSIZE,20);ObjectSetString(0,_bn,OBJPROP_TEXT,"F.ROMP"+m_dir);ObjectSetInteger(0,_bn,OBJPROP_BGCOLOR,g_DiagTab==1?CLR_RED:CLR_BG_CARD);ObjectSetInteger(0,_bn,OBJPROP_COLOR,g_DiagTab==1?CLR_TXT_WHITE:CLR_TXT_LABEL);ObjectSetInteger(0,_bn,OBJPROP_BORDER_COLOR,CLR_LINE_HARD);ObjectSetString(0,_bn,OBJPROP_FONT,"Arial Bold");ObjectSetInteger(0,_bn,OBJPROP_FONTSIZE,8);ObjectSetInteger(0,_bn,OBJPROP_CORNER,CORNER_LEFT_UPPER);ObjectSetInteger(0,_bn,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,_bn,OBJPROP_HIDDEN,true);ObjectSetInteger(0,_bn,OBJPROP_STATE,false);ObjectSetInteger(0,_bn,OBJPROP_ZORDER,310);}
   {string _bn=DP+"btn_tab_fb";if(ObjectFind(0,_bn)<0)ObjectCreate(0,_bn,OBJ_BUTTON,0,0,0);ObjectSetInteger(0,_bn,OBJPROP_XDISTANCE,dlx+tw+2);ObjectSetInteger(0,_bn,OBJPROP_YDISTANCE,cur+2);ObjectSetInteger(0,_bn,OBJPROP_XSIZE,tw);ObjectSetInteger(0,_bn,OBJPROP_YSIZE,20);ObjectSetString(0,_bn,OBJPROP_TEXT,"FIBO"+m_dir);ObjectSetInteger(0,_bn,OBJPROP_BGCOLOR,g_DiagTab==2?CLR_AMBER:CLR_BG_CARD);ObjectSetInteger(0,_bn,OBJPROP_COLOR,g_DiagTab==2?CLR_TXT_WHITE:CLR_TXT_LABEL);ObjectSetInteger(0,_bn,OBJPROP_BORDER_COLOR,CLR_LINE_HARD);ObjectSetString(0,_bn,OBJPROP_FONT,"Arial Bold");ObjectSetInteger(0,_bn,OBJPROP_FONTSIZE,8);ObjectSetInteger(0,_bn,OBJPROP_CORNER,CORNER_LEFT_UPPER);ObjectSetInteger(0,_bn,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,_bn,OBJPROP_HIDDEN,true);ObjectSetInteger(0,_bn,OBJPROP_STATE,false);ObjectSetInteger(0,_bn,OBJPROP_ZORDER,310);}
   cur+=24;DPRECT("sep_t",dpx,cur,dpw,1,CLR_LINE_SOFT,-1,202);cur+=4;int ridx=0;
   #define DROW_DYN(lbl_,val_,blk_) {string _id="r_"+IntegerToString(ridx);color _ca=blk_?CLR_RED:CLR_TEAL;string _pfx=blk_?"✗  ":"✓  ";DPRECT(_id+"_bg",dpx,cur,dpw,18,blk_?CLR_RED_DIM:CLR_BG_SECTION,blk_?CLR_RED:-1,200);DPLBL(_id+"_l",dlx,cur+3,_pfx+lbl_,_ca,InpPanelFontSize-1,blk_);DPLBLR(_id+"_v",drx,cur+3,val_,_ca,InpPanelFontSize-1,false);cur+=20;ridx++;}
   DPLBL("gl_hdr",dlx,cur+4,"⚠ FILTROS GLOBAIS:",CLR_TXT_LABEL,InpPanelFontSize,true);cur+=20;
   if(any_glb){if(d_gblock)DROW_DYN("Bloqueio Global","ATIVO",true)if(d_block)DROW_DYN("Bloqueio Moeda","ATIVO",true)if(d_pause)DROW_DYN("Robô Pausado","SIM",true)if(d_session)DROW_DYN("Filtro Sessão","FORA",true)if(d_maxpos)DROW_DYN("Max Posições","CHEIO",true)if(d_spr)DROW_DYN("Spread Alto",(string)g_FastSpread,true)if(d_liq)DROW_DYN("Baixa Liquidez","ATIVO",true)if(d_osc)DROW_DYN("Baixa Oscilação","ATIVO",true)if(d_not)DROW_DYN("Notícia Alta","BLOQUEIO",true)if(d_cax)DROW_DYN("Caixote Spike","ATIVO",true)}
   else{DROW_DYN("Todos Filtros Globais","OK",false)}
   // MarketGlance no diagnostico quando ativo como confluencia
   if(g_ModoConfluencia > 0 && g_MG_DiagText != "") {
      bool mg_bloq = (StringFind(g_MG_DiagText,"REPIQUE")>=0 || StringFind(g_MG_DiagText,"CORRE")>=0);
      string mg_tf2=""; if(g_ModoConfluencia==1)mg_tf2="M15"; else if(g_ModoConfluencia==2)mg_tf2="H1"; else if(g_ModoConfluencia==3)mg_tf2="H2"; else mg_tf2="H4";
      DROW_DYN("MktGlance ["+mg_tf2+"]", g_MG_DiagText, mg_bloq)
   }
   cur+=8;DPRECT("sep_s",dpx,cur,dpw,1,CLR_LINE_SOFT,-1,202);cur+=6;

   string s_name=(g_DiagTab==2)?"FIBO"+m_dir:"F.ROMP"+m_dir;
   color c_name=CLR_TXT_PRIMARY;
   DPLBL("st_hdr",dlx,cur+2,"REQUISITOS - "+s_name+":",c_name,InpPanelFontSize,true);cur+=20;
   bool is_lat=IsMercadoLateral(), s_rdy=false; int tD=g_CachedTrendDir;
   if(g_DiagTab==2){
      bool u_b=IsFiboActiveForSymbol(), c_c=g_CachedFiboCdOk; bool c_l=(g_CachedFiboH>0&&g_CachedFiboLow>0&&g_CachedFiboATR>0);
      bool c_a=p_UsePassaFiltroADXFibo?(g_H4_ADX>=cfg_ADX_MinLevel):true;
      int t_h4=ComputeTrendDir(hShortEMA_H4,hEMA_H4); bool c_t=(!p_UseTrendDirFibo || t_h4==1 || t_h4==-1);
      datetime cb_h4_diag = iTime(_Symbol, PERIOD_H4, 0);
      int cd_sec_diag = InpFR_CooldownMinutes * 60;
      bool c_cd_time = (t_h4 == 1) ? (cd_sec_diag <= 0 || (TimeCurrent() - l_fibo_buy_ts >= cd_sec_diag)) : ((t_h4 == -1) ? (cd_sec_diag <= 0 || (TimeCurrent() - l_fibo_sell_ts >= cd_sec_diag)) : true);
      bool c_bar_ok  = (t_h4 == 1) ? (cb_h4_diag != f_h4_buy && c_cd_time) : ((t_h4 == -1) ? (cb_h4_diag != f_h4_sell && c_cd_time) : (cb_h4_diag != f_h4_buy && cb_h4_diag != f_h4_sell && c_cd_time));

      DROW_DYN("Uso Estratégia",u_b?"sim":"OFF",!u_b)
      DROW_DYN("Vela H4 Atual",c_bar_ok?"LIVRE":"JÁ OPERADA",!c_bar_ok)
      DROW_DYN("Cálculo Níveis H4",c_l?"sim":"NÃO",!c_l)
      DROW_DYN("Tendência Macro H4",c_t?"alinhado":"NEUTRO",!c_t)
      DROW_DYN("Força H4 (ADX="+DoubleToString(g_H4_ADX,1)+")",c_a?"ok":"FRACO",!c_a)
      bool confl_mg_ok = true; string confl_val="OFF";
      if(g_ModoConfluencia>0){
         if(t_h4 == 1) { confl_mg_ok = g_MG_BuyAllowed; confl_val = g_MG_BuyAllowed ? "COMPRA (OK)" : (g_MG_SellAllowed ? "BLOQ (SÓ VENDA)" : "BLOQ (EMA)"); }
         else if(t_h4 == -1) { confl_mg_ok = g_MG_SellAllowed; confl_val = g_MG_SellAllowed ? "VENDA (OK)" : (g_MG_BuyAllowed ? "BLOQ (SÓ COMPRA)" : "BLOQ (EMA)"); }
         else {
            if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val="SÓ COMPRA";
            else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val="SÓ VENDA";
            else if(g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val="LIVRE";
            else confl_val="BLOQUEADO";
            confl_mg_ok = (g_MG_BuyAllowed || g_MG_SellAllowed);
         }
      }
      DROW_DYN("Filtro MktGlance",confl_val,!confl_mg_ok);
      string not_val=d_not?"BLOQUEADO":"LIVRE"; if(g_ProximaNoticiaName!=""&&g_ProximaNoticiaTime>TimeCurrent()){int m_l=(int)((g_ProximaNoticiaTime-TimeCurrent())/60); not_val=(d_not?"BLOQ ":"")+g_ProximaNoticiaName+" ("+IntegerToString(m_l)+"m)";} DROW_DYN("Filtro Notícia",not_val,d_not)
      s_rdy=(!any_glb&&u_b&&c_c&&c_l&&c_a&&c_t&&confl_mg_ok&&c_bar_ok);
   } else {
      bool u_r=InpUseFR, c_c=g_CachedFrCdOk, c_l=(g_CachedFRTop>0&&g_CachedFRFundo>0);
       bool dir_s_ok,dir_b_ok; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok,dir_b_ok);
       double ask_c=SymbolInfoDouble(_Symbol,SYMBOL_ASK), bid_c=SymbolInfoDouble(_Symbol,SYMBOL_BID);
       bool perto_topo=(g_CachedFRTop>0 && MathAbs(g_CachedFRTop-ask_c) < MathAbs(bid_c-g_CachedFRFundo));
       bool confl_mg_ok = perto_topo ? g_MG_SellAllowed : g_MG_BuyAllowed;
       bool dir_lado_ok = perto_topo ? dir_s_ok : dir_b_ok;
       bool c_dr=InpFR_Direct_Entries;

       DROW_DYN("Uso Estratégia",u_r?"sim":"OFF",!u_r)
       DROW_DYN("Cooldown L1",c_c?"livre":"AGUARDAR",!c_c)
       DROW_DYN("Mapeamento L1",c_l?"sim":"NÃO",!c_l)
       DROW_DYN("Dir. L1 OK",dir_lado_ok?"sim":(perto_topo?"NEUTRO (TOPO)":"NEUTRO (FUNDO)"),!dir_lado_ok)
       DROW_DYN("FR Direct",c_dr?"ativo":"off",false)
       string confl_val="OFF"; 
       if(g_ModoConfluencia>0){ 
          if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val=perto_topo?"BLOQ (SÓ COMPRA)":"SÓ COMPRA (OK)"; 
          else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val=perto_topo?"SÓ VENDA (OK)":"BLOQ (SÓ VENDA)"; 
          else confl_val="LIVRE"; 
       } 
       DROW_DYN("Filtro MktGlance",confl_val,!confl_mg_ok)
       string not_val=d_not?"BLOQUEADO":"LIVRE"; if(g_ProximaNoticiaName!=""&&g_ProximaNoticiaTime>TimeCurrent()){int m_l=(int)((g_ProximaNoticiaTime-TimeCurrent())/60); not_val=(d_not?"BLOQ ":"")+g_ProximaNoticiaName+" ("+IntegerToString(m_l)+"m)";} DROW_DYN("Filtro Notícia",not_val,d_not)
       s_rdy=(!any_glb&&u_r&&c_c&&c_l&&dir_lado_ok&&confl_mg_ok);
   }
   cur+=4;
   for(int i=ridx;i<20;i++){string _id="r_"+IntegerToString(i);ObjectSetInteger(0,DP+_id+"_bg",OBJPROP_XDISTANCE,-1000);ObjectSetInteger(0,DP+_id+"_bg",OBJPROP_HIDDEN,true);ObjectSetInteger(0,DP+_id+"_l",OBJPROP_XDISTANCE,-1000);ObjectSetInteger(0,DP+_id+"_v",OBJPROP_XDISTANCE,-1000);}
   DPRECT("sep_f",dpx,cur,dpw,1,CLR_LINE_SOFT,-1,202);cur+=2; color cf_bg=s_rdy?CLR_TEAL_DIM:CLR_RED_DIM, cf_tx=s_rdy?CLR_TEAL:CLR_RED; string sf=s_rdy?"● ESTRUTURA PRONTA":"● FALTAM REQUISITOS"; DPRECT("foot_bg",dpx,cur,dpw,20,cf_bg,(int)cf_tx,200);DPLBL("foot_tx",dlx,cur+4,sf,cf_tx,InpPanelFontSize,true);cur+=24;
   #undef DPRECT
   #undef DPLBL
   #undef DPLBLR
   #undef DROW_DYN
   s_diag_h=cur-dpy; ObjectSetInteger(0,DP+"border",OBJPROP_YSIZE,s_diag_h+2); ObjectSetInteger(0,DP+"bg",OBJPROP_YSIZE,s_diag_h);
}

void DesenharPainelConfig() {
   if(MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE)) return;

   string CP = PANEL_PREFIX + "CFG_";
   if(!g_ShowConfigPanel) {
      ObjectDelete(0, CP + "border"); ObjectDelete(0, CP + "bg");
      ObjectDelete(0, CP + "hdr_bg"); ObjectDelete(0, CP + "hdr_ttl"); ObjectDelete(0, CP + "btn_close");
      string btns[] = {
         "tf_m15","tf_m30","tf_h1","tf_h2","tf_h4",
         "pf_cons","pf_mod","pf_agr",
         "confl_0","confl_1","confl_2","confl_3","confl_4",
         "risk_06","risk_10","risk_12"
      };
      for(int i=0; i<ArraySize(btns); i++) ObjectDelete(0, CP + "btn_" + btns[i]);
      for(int i=1; i<=4; i++) ObjectDelete(0, CP + "lbl_" + IntegerToString(i));
      return;
   }

   int cpx = InpPanelX + PANEL_W + 8;
   int cpy = InpPanelY;
   int cpw = 270;
   int ccx = cpx + cpw / 2;
   int crx = cpx + cpw - 8;
   int cur = cpy;
   int panel_h = 205;

   string bdr = CP + "border", bg = CP + "bg";
   if(ObjectFind(0, bdr) < 0) ObjectCreate(0, bdr, OBJ_RECTANGLE_LABEL, 0, 0, 0);
   ObjectSetInteger(0, bdr, OBJPROP_XDISTANCE, cpx - 1); ObjectSetInteger(0, bdr, OBJPROP_YDISTANCE, cpy - 1);
   ObjectSetInteger(0, bdr, OBJPROP_XSIZE, cpw + 2);     ObjectSetInteger(0, bdr, OBJPROP_YSIZE, panel_h + 2);
   ObjectSetInteger(0, bdr, OBJPROP_BGCOLOR, CLR_LINE_HARD); ObjectSetInteger(0, bdr, OBJPROP_COLOR, CLR_BLUE);
   ObjectSetInteger(0, bdr, OBJPROP_BORDER_TYPE, BORDER_FLAT); ObjectSetInteger(0, bdr, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetInteger(0, bdr, OBJPROP_ZORDER, 197);

   if(ObjectFind(0, bg) < 0) ObjectCreate(0, bg, OBJ_RECTANGLE_LABEL, 0, 0, 0);
   ObjectSetInteger(0, bg, OBJPROP_XDISTANCE, cpx); ObjectSetInteger(0, bg, OBJPROP_YDISTANCE, cpy);
   ObjectSetInteger(0, bg, OBJPROP_XSIZE, cpw);      ObjectSetInteger(0, bg, OBJPROP_YSIZE, panel_h);
   ObjectSetInteger(0, bg, OBJPROP_BGCOLOR, CLR_BG_BASE); ObjectSetInteger(0, bg, OBJPROP_COLOR, CLR_BG_BASE);
   ObjectSetInteger(0, bg, OBJPROP_BORDER_TYPE, BORDER_FLAT); ObjectSetInteger(0, bg, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetInteger(0, bg, OBJPROP_ZORDER, 198);

   string hbg = CP + "hdr_bg", httl = CP + "hdr_ttl", hclose = CP + "btn_close";
   if(ObjectFind(0, hbg) < 0) ObjectCreate(0, hbg, OBJ_RECTANGLE_LABEL, 0, 0, 0);
   ObjectSetInteger(0, hbg, OBJPROP_XDISTANCE, cpx); ObjectSetInteger(0, hbg, OBJPROP_YDISTANCE, cpy);
   ObjectSetInteger(0, hbg, OBJPROP_XSIZE, cpw);     ObjectSetInteger(0, hbg, OBJPROP_YSIZE, 22);
   ObjectSetInteger(0, hbg, OBJPROP_BGCOLOR, CLR_BG_HEADER); ObjectSetInteger(0, hbg, OBJPROP_COLOR, CLR_BLUE);
   ObjectSetInteger(0, hbg, OBJPROP_ZORDER, 199);

   if(ObjectFind(0, httl) < 0) ObjectCreate(0, httl, OBJ_LABEL, 0, 0, 0);
   ObjectSetInteger(0, httl, OBJPROP_XDISTANCE, ccx); ObjectSetInteger(0, httl, OBJPROP_YDISTANCE, cur + 3);
   ObjectSetString(0, httl, OBJPROP_TEXT, "⚙ CONTROLE MASTER OPERACIONAL");
   ObjectSetInteger(0, httl, OBJPROP_COLOR, CLR_TXT_WHITE); ObjectSetString(0, httl, OBJPROP_FONT, "Arial Bold");
   ObjectSetInteger(0, httl, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, httl, OBJPROP_ANCHOR, ANCHOR_UPPER);
   ObjectSetInteger(0, httl, OBJPROP_ZORDER, 260);

   if(ObjectFind(0, hclose) < 0) ObjectCreate(0, hclose, OBJ_BUTTON, 0, 0, 0);
   ObjectSetInteger(0, hclose, OBJPROP_XDISTANCE, crx - 14); ObjectSetInteger(0, hclose, OBJPROP_YDISTANCE, cur + 3);
   ObjectSetInteger(0, hclose, OBJPROP_XSIZE, 16);           ObjectSetInteger(0, hclose, OBJPROP_YSIZE, 16);
   ObjectSetString(0, hclose, OBJPROP_TEXT, "✕");            ObjectSetInteger(0, hclose, OBJPROP_BGCOLOR, CLR_BG_HEADER);
   ObjectSetInteger(0, hclose, OBJPROP_COLOR, CLR_TXT_LABEL);ObjectSetInteger(0, hclose, OBJPROP_BORDER_COLOR, CLR_LINE_HARD);
   ObjectSetInteger(0, hclose, OBJPROP_ZORDER, 310);

   cur += 28;

   #define CFG_BTN(id_, x_, y_, w_, h_, txt_, act_, clr_act_) { \
      string _n = CP + "btn_" + id_; \
      if(ObjectFind(0, _n) < 0) ObjectCreate(0, _n, OBJ_BUTTON, 0, 0, 0); \
      ObjectSetInteger(0, _n, OBJPROP_XDISTANCE, x_); ObjectSetInteger(0, _n, OBJPROP_YDISTANCE, y_); \
      ObjectSetInteger(0, _n, OBJPROP_XSIZE, w_);     ObjectSetInteger(0, _n, OBJPROP_YSIZE, h_); \
      ObjectSetString(0, _n, OBJPROP_TEXT, txt_); \
      ObjectSetInteger(0, _n, OBJPROP_BGCOLOR, (act_) ? clr_act_ : CLR_BG_BTN); \
      ObjectSetInteger(0, _n, OBJPROP_COLOR, (act_) ? CLR_TXT_WHITE : CLR_TXT_LABEL); \
      ObjectSetInteger(0, _n, OBJPROP_BORDER_COLOR, (act_) ? clr_act_ : CLR_LINE_HARD); \
      ObjectSetString(0, _n, OBJPROP_FONT, "Arial Bold"); ObjectSetInteger(0, _n, OBJPROP_FONTSIZE, 8); \
      ObjectSetInteger(0, _n, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, _n, OBJPROP_SELECTABLE, false); \
      ObjectSetInteger(0, _n, OBJPROP_HIDDEN, true); ObjectSetInteger(0, _n, OBJPROP_ZORDER, 300); \
   }

   #define CFG_LBLC(id_, y_, txt_, clr_) { \
      string _n = CP + "lbl_" + id_; \
      if(ObjectFind(0, _n) < 0) ObjectCreate(0, _n, OBJ_LABEL, 0, 0, 0); \
      ObjectSetInteger(0, _n, OBJPROP_XDISTANCE, ccx); ObjectSetInteger(0, _n, OBJPROP_YDISTANCE, y_); \
      ObjectSetString(0, _n, OBJPROP_TEXT, txt_); ObjectSetInteger(0, _n, OBJPROP_COLOR, clr_); \
      ObjectSetString(0, _n, OBJPROP_FONT, "Arial Bold"); ObjectSetInteger(0, _n, OBJPROP_FONTSIZE, 8); \
      ObjectSetInteger(0, _n, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, _n, OBJPROP_ANCHOR, ANCHOR_UPPER); \
      ObjectSetInteger(0, _n, OBJPROP_ZORDER, 260); \
   }

   // 1. SEÇÃO TIMEFRAME EXECUÇÃO
   CFG_LBLC("1", cur, "⏱ TIMEFRAME EXECUÇÃO", CLR_TXT_PRIMARY); cur += 15;
   int bw5 = 46, bx5 = cpx + (cpw - (5 * 46 + 4 * 4)) / 2;
   CFG_BTN("tf_m15", bx5,              cur, bw5, 20, "M15", g_TF_L1 == PERIOD_M15, CLR_TEAL);
   CFG_BTN("tf_m30", bx5 + bw5 + 4,     cur, bw5, 20, "M30", g_TF_L1 == PERIOD_M30, CLR_TEAL);
   CFG_BTN("tf_h1",  bx5 + (bw5+4)*2,   cur, bw5, 20, "H1",  g_TF_L1 == PERIOD_H1,  CLR_TEAL);
   CFG_BTN("tf_h2",  bx5 + (bw5+4)*3,   cur, bw5, 20, "H2",  g_TF_L1 == PERIOD_H2,  CLR_TEAL);
   CFG_BTN("tf_h4",  bx5 + (bw5+4)*4,   cur, bw5, 20, "H4",  g_TF_L1 == PERIOD_H4,  CLR_TEAL);
   cur += 25;

   // 2. SEÇÃO PERFIL OPERACIONAL
   CFG_LBLC("2", cur, "🛡 PERFIL OPERACIONAL", CLR_TXT_PRIMARY); cur += 15;
   int bw3 = 80, bx3 = cpx + (cpw - (3 * 80 + 2 * 4)) / 2;
   CFG_BTN("pf_cons", bx3,              cur, bw3, 20, "CONSERV",  g_CurrentPerfil == PERFIL_CONSERVADOR, CLR_BLUE);
   CFG_BTN("pf_mod",  bx3 + bw3 + 4,     cur, bw3, 20, "MODERADO", g_CurrentPerfil == PERFIL_MODERADO,    CLR_BLUE);
   CFG_BTN("pf_agr",  bx3 + (bw3+4)*2,   cur, bw3, 20, "AGRESSIVO",g_CurrentPerfil == PERFIL_AGRESSIVO,   CLR_AMBER);
   cur += 25;

   // 3. SEÇÃO CONFLUÊNCIA MARKETGLANCE
   CFG_LBLC("3", cur, "🔍 FILTRO CONFLUÊNCIA", CLR_TXT_PRIMARY); cur += 15;
   bw5 = 46; bx5 = cpx + (cpw - (5 * 46 + 4 * 4)) / 2;
   CFG_BTN("confl_0", bx5,              cur, bw5, 20, "OFF", g_ModoConfluencia == 0, CLR_RED);
   CFG_BTN("confl_1", bx5 + bw5 + 4,     cur, bw5, 20, "M15", g_ModoConfluencia == 1, CLR_PURPLE);
   CFG_BTN("confl_2", bx5 + (bw5+4)*2,   cur, bw5, 20, "H1",  g_ModoConfluencia == 2, CLR_PURPLE);
   CFG_BTN("confl_3", bx5 + (bw5+4)*3,   cur, bw5, 20, "H2",  g_ModoConfluencia == 3, CLR_PURPLE);
   CFG_BTN("confl_4", bx5 + (bw5+4)*4,   cur, bw5, 20, "H4",  g_ModoConfluencia == 4, CLR_PURPLE);
   cur += 25;

   // 4. SEÇÃO RISCO PROP FIRM
   CFG_LBLC("4", cur, "📐 RISCO PROP FIRM POR TRADE", CLR_TXT_PRIMARY); cur += 15;
   CFG_BTN("risk_06", bx3,              cur, bw3, 20, "0.6%", g_PropMaxRiskPct == 0.6, CLR_AMBER);
   CFG_BTN("risk_10", bx3 + bw3 + 4,     cur, bw3, 20, "1.0%", g_PropMaxRiskPct == 1.0, CLR_AMBER);
   CFG_BTN("risk_12", bx3 + (bw3+4)*2,   cur, bw3, 20, "1.2%", g_PropMaxRiskPct == 1.2, CLR_AMBER);
   cur += 25;

   panel_h = cur - cpy + 6;
   ObjectSetInteger(0, bdr, OBJPROP_YSIZE, panel_h + 2);
   ObjectSetInteger(0, bg,  OBJPROP_YSIZE, panel_h);

   #undef CFG_BTN
   #undef CFG_LBLC
}

 void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam) {
    if(id == CHARTEVENT_OBJECT_CLICK) {
       string btn=sparam;
       if(btn==PANEL_PREFIX+"btn_min")       { g_Minimized=!g_Minimized; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); }
       else if(btn==PANEL_PREFIX+"btn_pause"){ g_BotPaused=!g_BotPaused; ObjectSetInteger(0,btn,OBJPROP_STATE,false); AddLog(g_BotPaused?"PAUSADO.":"RETOMADO."); g_PanelHash=""; DesenharPainel(); }
       else if(btn==PANEL_PREFIX+"btn_zerar"){ ObjectSetInteger(0,btn,OBJPROP_STATE,false); if(MessageBox("Zerar TODAS as posições do robô?","Confirmação",MB_YESNO|MB_ICONWARNING)==IDYES){FecharTodasPosicoesDoRobo();AddLog("PANICO: zeradas!");} g_PanelHash=""; DesenharPainel(); }
       else if(btn==PANEL_PREFIX+"btn_leg_fl"){ g_ViewFluxo=!g_ViewFluxo; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); DesenharLinhasChart(); }
       else if(btn==PANEL_PREFIX+"btn_leg_fr"){ g_ViewFR=!g_ViewFR;    ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); DesenharLinhasChart(); }
       else if(btn==PANEL_PREFIX+"btn_leg_fb"){ g_ViewFibo=!g_ViewFibo; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); DesenharLinhasChart(); }
       else if(btn==PANEL_PREFIX+"btn_leg_zn"){ g_ViewZonas=!g_ViewZonas; g_ModoAnalise=g_ViewZonas; if(!g_ModoAnalise) LimparTudoAnalise(); ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; LimparGrafico(); DesenharPainel(); DesenharLinhasChart(); }
       else if(btn==PANEL_PREFIX+"btn_l0")   { g_LinhasModo=0; ObjectSetInteger(0,btn,OBJPROP_STATE,false); LimparGrafico(); DesenharLinhasChart(); g_PanelHash=""; DesenharPainel(); }
       else if(btn==PANEL_PREFIX+"btn_l1")   { g_LinhasModo=1; ObjectSetInteger(0,btn,OBJPROP_STATE,false); LimparGrafico(); DesenharLinhasChart(); g_PanelHash=""; DesenharPainel(); }
       else if(btn==PANEL_PREFIX+"btn_l2")   { g_LinhasModo=2; ObjectSetInteger(0,btn,OBJPROP_STATE,false); LimparGrafico(); DesenharLinhasChart(); g_PanelHash=""; DesenharPainel(); }
       else if(btn==PANEL_PREFIX+"btn_confl"){ g_ModoConfluencia++; if(g_ModoConfluencia>4) g_ModoConfluencia=0; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"btn_col_pos") { g_ColPosicao=!g_ColPosicao; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); }
       else if(btn==PANEL_PREFIX+"btn_col_term"){ g_ColTerminal=!g_ColTerminal; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); }
       else if(btn==PANEL_PREFIX+"btn_toggle_prop"||btn=="FS_PROP_HUD_BTN_CLOSE"){ g_ShowPropFirmHUD=(btn==PANEL_PREFIX+"btn_toggle_prop")?!g_ShowPropFirmHUD:false; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); DesenharPainelPropFirm(); }
       else if(btn==PANEL_PREFIX+"btn_diag"||btn==PANEL_PREFIX+"D_btn_close"){ g_ShowDiag=(btn==PANEL_PREFIX+"btn_diag")?!g_ShowDiag:false; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); DesenharPainelDiag(); }
       else if(btn==PANEL_PREFIX+"btn_config"||btn==PANEL_PREFIX+"CFG_btn_close"){ g_ShowConfigPanel=(btn==PANEL_PREFIX+"btn_config")?!g_ShowConfigPanel:false; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_tf_m15"){ g_TF_L1=PERIOD_M15; TF_L2=(g_TF_L1<=PERIOD_H2)?PERIOD_H4:PERIOD_D1; g_AutoTF=false; InicializarHandles(); AplicarPerfil(g_CurrentPerfil); g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); DesenharLinhasChart(); }
        else if(btn==PANEL_PREFIX+"CFG_btn_tf_m30"){ g_TF_L1=PERIOD_M30; TF_L2=(g_TF_L1<=PERIOD_H2)?PERIOD_H4:PERIOD_D1; g_AutoTF=false; InicializarHandles(); AplicarPerfil(g_CurrentPerfil); g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); DesenharLinhasChart(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_tf_h1") { g_TF_L1=PERIOD_H1;  TF_L2=(g_TF_L1<=PERIOD_H2)?PERIOD_H4:PERIOD_D1; g_AutoTF=false; InicializarHandles(); AplicarPerfil(g_CurrentPerfil); g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); DesenharLinhasChart(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_tf_h2") { g_TF_L1=PERIOD_H2;  TF_L2=(g_TF_L1<=PERIOD_H2)?PERIOD_H4:PERIOD_D1; g_AutoTF=false; InicializarHandles(); AplicarPerfil(g_CurrentPerfil); g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); DesenharLinhasChart(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_tf_h4") { g_TF_L1=PERIOD_H4;  TF_L2=(g_TF_L1<=PERIOD_H2)?PERIOD_H4:PERIOD_D1; g_AutoTF=false; InicializarHandles(); AplicarPerfil(g_CurrentPerfil); g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); DesenharLinhasChart(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_pf_cons"){ g_CurrentPerfil=PERFIL_CONSERVADOR; AplicarPerfil(PERFIL_CONSERVADOR); g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_pf_mod") { g_CurrentPerfil=PERFIL_MODERADO;    AplicarPerfil(PERFIL_MODERADO);    g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_pf_agr") { g_CurrentPerfil=PERFIL_AGRESSIVO;   AplicarPerfil(PERFIL_AGRESSIVO);   g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_confl_0"){ g_ModoConfluencia=0; g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_confl_1"){ g_ModoConfluencia=1; g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_confl_2"){ g_ModoConfluencia=2; g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_confl_3"){ g_ModoConfluencia=3; g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_confl_4"){ g_ModoConfluencia=4; g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_risk_06"){ g_PropMaxRiskPct=0.6; g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_risk_10"){ g_PropMaxRiskPct=1.0; g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
       else if(btn==PANEL_PREFIX+"CFG_btn_risk_12"){ g_PropMaxRiskPct=1.2; g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); }
      else if(btn==PANEL_PREFIX+"D_btn_tab_fl"){ ObjectDelete(0,btn); }
      else if(btn==PANEL_PREFIX+"D_btn_tab_fr"){ g_DiagTab=1; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainelDiag(); }
      else if(btn==PANEL_PREFIX+"D_btn_tab_fb"){ g_DiagTab=2; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainelDiag(); }
      ChartRedraw(0);
   }
}

//===================================================================
// LINHAS CUSTOMIZADAS DE POSIÇÃO (SL / TP / ENTRADA)
//===================================================================
void DrawOrdLine(string id, double price, color clr, datetime t_lbl, string lbl_txt, int style=STYLE_DASH, int width=1) {
   string nl=ORD_LINE_PFX+"L_"+id, nt=ORD_LINE_PFX+"T_"+id;
   if(price<=0){ObjectDelete(0,nl);ObjectDelete(0,nt);return;}
   if(ObjectFind(0,nl)<0){ObjectCreate(0,nl,OBJ_HLINE,0,0,price);ObjectSetInteger(0,nl,OBJPROP_BACK,true);ObjectSetInteger(0,nl,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,nl,OBJPROP_HIDDEN,true);}
   ObjectSetDouble(0,nl,OBJPROP_PRICE,price);ObjectSetInteger(0,nl,OBJPROP_COLOR,clr);ObjectSetInteger(0,nl,OBJPROP_STYLE,style);ObjectSetInteger(0,nl,OBJPROP_WIDTH,width);
   if(ObjectFind(0,nt)<0){ObjectCreate(0,nt,OBJ_TEXT,0,t_lbl,price);ObjectSetString(0,nt,OBJPROP_FONT,"Arial");ObjectSetInteger(0,nt,OBJPROP_FONTSIZE,8);ObjectSetInteger(0,nt,OBJPROP_ANCHOR,ANCHOR_LEFT_LOWER);ObjectSetInteger(0,nt,OBJPROP_BACK,false);ObjectSetInteger(0,nt,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,nt,OBJPROP_HIDDEN,true);}
   ObjectSetDouble(0,nt,OBJPROP_PRICE,price);ObjectSetInteger(0,nt,OBJPROP_TIME,t_lbl);ObjectSetInteger(0,nt,OBJPROP_COLOR,clr);ObjectSetString(0,nt,OBJPROP_TEXT,lbl_txt);
}

void LimparLinhasOrdens() {
   for(int i=ObjectsTotal(0,0,-1)-1;i>=0;i--){string nm=ObjectName(0,i,0,-1);if(StringFind(nm,ORD_LINE_PFX)==0)ObjectDelete(0,nm);}
}

void DesenharLinhasOrdens() {
   if(MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE)) return;

   if(g_ViewZonas) { LimparLinhasOrdens(); return; } // [MODO ZEN] Oculta linhas de trade
   static int s_last_total = -1;
   double ask=SymbolInfoDouble(_Symbol,SYMBOL_ASK), bid=SymbolInfoDouble(_Symbol,SYMBOL_BID);
   double tv=SymbolInfoDouble(_Symbol,SYMBOL_TRADE_TICK_VALUE), ts=SymbolInfoDouble(_Symbol,SYMBOL_TRADE_TICK_SIZE);
   datetime t_lbl=iTime(_Symbol,g_TF_L1,0)+(datetime)(PeriodSeconds(g_TF_L1)*4);

   // Pré-aloca array pelo total de posições (evita realloc dentro do loop)
   int total_pos=PositionsTotal();
   ulong active[]; ArrayResize(active, total_pos); int n_active=0;

   for(int i=total_pos-1;i>=0;i--) {
      ulong ticket=PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)||PositionGetInteger(POSITION_MAGIC)!=InpMagic||PositionGetString(POSITION_SYMBOL)!=_Symbol) continue;
      active[n_active++]=ticket;
      string tk=IntegerToString(ticket);
      bool is_buy=(PositionGetInteger(POSITION_TYPE)==POSITION_TYPE_BUY);
      double po=PositionGetDouble(POSITION_PRICE_OPEN), sl=PositionGetDouble(POSITION_SL), tp=PositionGetDouble(POSITION_TP);
      double lots=PositionGetDouble(POSITION_VOLUME), pl=PositionGetDouble(POSITION_PROFIT)+PositionGetDouble(POSITION_SWAP);
      // Detecta estratégia pelo comment → define estilo de linha
      string full_comm = PositionGetString(POSITION_COMMENT);
      int pos_style;
      if(StringFind(full_comm,"FR")>=0)         pos_style=STYLE_DOT;         // FR    = pontinhos puros  · · · · ·
      else if(StringFind(full_comm,"Fluxo")>=0) pos_style=STYLE_DASHDOT;    // Fluxo = traço·ponto      ─ · ─ · ─
      else if(StringFind(full_comm,"Fibo")>=0)  pos_style=STYLE_DASHDOTDOT; // Fibo  = traço·ponto·ponto ─ · · ─ · ·
      else                                       pos_style=STYLE_DOT;        // outros = pontinhos
      string comm=StringSubstr(full_comm,0,12);
      double cpx=is_buy?bid:ask;
      color clr_e = is_buy ? C'28,170,112' : C'210,68,68';  // Verde para COMPRA, Vermelho para VENDA (Estilo Orion)
      // Entrada
      string lbl_e = (is_buy ? "▲ COMPRA " : "▼ VENDA ") + DoubleToString(lots,2) + " | [" + comm + "] | P&L: " + (pl>=0 ? "+" : "") + DoubleToString(pl,2) + " USD";
      DrawOrdLine("E_"+tk, po, clr_e, t_lbl, lbl_e, STYLE_SOLID, 1);
      // SL
      if(sl>0){
         double dsl=MathAbs(cpx-sl)/_Point;
         double vsl=(ts>0&&tv>0)?(dsl*_Point/ts)*tv*lots:0;
         DrawOrdLine("S_"+tk, sl, C'210,68,68', t_lbl, "🛑 STOP LOSS | -" + DoubleToString(dsl,0) + " pts | -$" + DoubleToString(vsl,2) + " USD", STYLE_SOLID, 1);
      } else { ObjectDelete(0,ORD_LINE_PFX+"L_S_"+tk); ObjectDelete(0,ORD_LINE_PFX+"T_S_"+tk); }
      // TP
      if(tp>0){
         double dtp=MathAbs(tp-cpx)/_Point;
         double vtp=(ts>0&&tv>0)?(dtp*_Point/ts)*tv*lots:0;
         DrawOrdLine("T_"+tk, tp, C'28,170,112', t_lbl, "🎯 TAKE PROFIT | +" + DoubleToString(dtp,0) + " pts | +$" + DoubleToString(vtp,2) + " USD", STYLE_SOLID, 1);
      } else { ObjectDelete(0,ORD_LINE_PFX+"L_T_"+tk); ObjectDelete(0,ORD_LINE_PFX+"T_T_"+tk); }

      // BREAK EVEN (Linha Visual Azul Escuro Discreto Pontilhada)
      if(InpUseBreakEven && sl > 0) {
         double trigPct = (StringFind(full_comm, "Fibo") >= 0) ? InpBE_Trigger_Fibo : InpBE_Trigger_Normal;
         double trigger = MathAbs(po - sl) * trigPct;
         double be_price = is_buy ? (po + trigger) : (po - trigger);
         bool be_pending = is_buy ? (sl < po) : (sl > po);
         
         if(be_pending && trigger > 0) {
            double d_be = MathAbs(be_price - cpx) / _Point;
            string lbl_be = "🛡️ GATILHO B.E. | +" + DoubleToString(d_be, 0) + " pts";
            DrawOrdLine("BE_"+tk, be_price, C'38,90,165', t_lbl, lbl_be, STYLE_DOT, 1);
         } else {
            ObjectDelete(0, ORD_LINE_PFX + "L_BE_" + tk);
            ObjectDelete(0, ORD_LINE_PFX + "T_BE_" + tk);
         }
      } else {
         ObjectDelete(0, ORD_LINE_PFX + "L_BE_" + tk);
         ObjectDelete(0, ORD_LINE_PFX + "T_BE_" + tk);
      }
   }
   ArrayResize(active, n_active);

   // [BUG FIX] Quando não há posições ativas, limpar TODAS as linhas de uma vez
   if(n_active == 0) {
      LimparLinhasOrdens();
      s_last_total = 0;
      return;
   }

   // Limpeza: varre objetos quando número de posições diminuiu OU igualou
   // (usa <= para cobrir o caso em que n_active == s_last_total mas tickets mudaram)
   if(n_active <= s_last_total) {
      for(int i=ObjectsTotal(0,0,-1)-1;i>=0;i--) {  // subwindow 0 apenas
         string nm=ObjectName(0,i,0,-1); if(StringFind(nm,ORD_LINE_PFX)!=0) continue;
         bool found=false;
         // [B08 FIX] Usar delimitador sufixo para evitar substring numérico
         for(int j=0;j<n_active;j++) {
            string tk_tag = "_" + IntegerToString(active[j]) + "_"; 
            if(StringFind(nm + "_", tk_tag) >= 0) {
                found=true; break;
            }
         }
         if(!found) ObjectDelete(0,nm);
      }
   }
   s_last_total = n_active;
}

//===================================================================
// INIT / DEINIT / TIMER
//===================================================================
int OnInit() {
   LimparGrafico(); LimparPainel(); LimparLixoGUI(); LimparWidgetStatusMercado();
   for(int i = ObjectsTotal(0, 0, -1) - 1; i >= 0; i--) {
      string nm = ObjectName(0, i, 0, -1);
      if(StringFind(nm, "FS_STATUS_WIDGET_") == 0 || StringFind(nm, "FS_") == 0) {
         ObjectDelete(0, nm);
      }
   }
   string old_flt[]={"s_flt_la","s_flt_bg","s_flt_tx","s_flt_lb","f_osc_bg","f_osc_acc","f_osc_dot","f_osc_nm","f_osc_ds","R_f_osc_bv","f_liq_bg","f_liq_acc","f_liq_dot","f_liq_nm","f_liq_ds","R_f_liq_bv","f_cax_bg","f_cax_acc","f_cax_dot","f_cax_nm","f_cax_ds","R_f_cax_bv","f_not_bg","f_not_acc","f_not_dot","f_not_nm","f_not_ds","R_f_not_bv","f_spr_bg","f_spr_acc","f_spr_dot","f_spr_nm","f_spr_ds","R_f_spr_bv","f_cd_bg","f_cd_acc","f_cd_dot","f_cd_nm","f_cd_ds","R_f_cd_bv","flt_bar","flt_bar_tx"};
   for(int i=0;i<ArraySize(old_flt);i++) ObjectDelete(0,PANEL_PREFIX+old_flt[i]);
   ObjectDelete(0, PANEL_PREFIX+"R_hdr_stat");

   g_CurrentPerfil   = InpPerfil;
   g_AutoTF          = InpAutoTF;
   g_PropMaxRiskPct  = InpPropMaxRiskPct;
   
   // Garante sincronia inicial do Confl com o TF de execução (g_TF_L1)
   if(GlobalVariableCheck("FS9_ModoConfl")) g_ModoConfluencia = (int)GlobalVariableGet("FS9_ModoConfl");
   else GlobalVariableSet("FS9_ModoConfl", g_ModoConfluencia);
   
   g_InitTime        = TimeCurrent();
   g_GV_Blocked     = "Sniper_Blocked_" + _Symbol + "_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   g_GV_GlobalBlock = "Sniper_GlobalBlock_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   g_GV_GlobalDay   = "Sniper_GlobalDay_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));

   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(50);
   trade.SetTypeFillingBySymbol(_Symbol);

   // [AUTO-TF] Detecta símbolo e configura g_TF_L1 / TF_L2 automaticamente
   AutoSelecionarTF();

   // Garante sincronia inicial do Confl com o TF de execução (g_TF_L1)
   GlobalVariableSet("FS9_ModoConfl", g_ModoConfluencia);

   RecuperarHistoricoFiboVela();
   if(!InicializarHandles()) { Print("INIT FAILED: Handles base inválidos."); return INIT_FAILED; }
   AplicarPerfil(g_CurrentPerfil);

   if(hEMA_L1 == INVALID_HANDLE || hRSI_L1 == INVALID_HANDLE || hRSI_L2 == INVALID_HANDLE) {
      Print("INIT FAILED: Handles de perfil inválidos."); return INIT_FAILED;
   }

   string gv_start_bal = "FS9_StartBalance_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   if(GlobalVariableCheck(gv_start_bal)) {
      g_StartBalance = GlobalVariableGet(gv_start_bal);
   } else {
      g_StartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
      GlobalVariableSet(gv_start_bal, g_StartBalance);
   }
   AddLog(StringFormat("v28.5 PRO iniciado. Saldo Inicial Persistido: $%.2f. Prop:%s", g_StartBalance, InpPropFirmMode?"ATIVO":"off"));
   ChartSetInteger(0, CHART_SHOW_TRADE_LEVELS, false); // desabilita linhas nativas MT5
   
   // [BUG FIX TIMEFRAME] Redesenha imediatamente todas as linhas ao trocar tempo gráfico
   g_CacheBarTime = 0;
   RefreshBarCache();
   DesenharLinhasChart();
   DesenharLinhasAnalise();
   if(InpShowPanel) DesenharPainel();
   
   EventSetTimer(1);
   return INIT_SUCCEEDED;
}

//===================================================================
// WIDGET STATUS DE MERCADO & CONTAGEM REGRESSIVA (ESTILO ORION HEDGE)
//===================================================================
void LimparWidgetStatusMercado() {
   string PFX = "FS_STATUS_WIDGET_";
   for(int i = ObjectsTotal(0, 0, -1) - 1; i >= 0; i--) {
      string name = ObjectName(0, i, 0, -1);
      if(StringFind(name, PFX) == 0) ObjectDelete(0, name);
   }
}

void DesenharWidgetStatusMercado() {
   if(!InpShowPanel) {
      LimparWidgetStatusMercado();
      return;
   }
   
   string PFX = "FS_STATUS_WIDGET_";
   
   MqlDateTime dt; TimeGMT(dt);
   int h = dt.hour;
   int m = dt.min;
   
   string currMkt = "N.YORK";
   color currClr = C'28,170,112'; // Verde Tecla
   
   string nextName = "SYD";
   int targetH = 22;
   
   if(h >= 22 || h < 7) {
      currMkt = "SYDNEY/TOKYO"; currClr = C'52,140,238'; // Azul
      nextName = "LDN"; targetH = 7;
   } else if(h >= 7 && h < 12) {
      currMkt = "LONDRES"; currClr = C'28,170,112';
      nextName = "N.YORK"; targetH = 12;
   } else if(h >= 12 && h < 16) {
      currMkt = "LONDRES/NY"; currClr = C'28,170,112';
      nextName = "SYD"; targetH = 22;
   } else if(h >= 16 && h < 22) {
      currMkt = "N.YORK"; currClr = C'28,170,112';
      nextName = "SYD"; targetH = 22;
   }
   
   int diffH = targetH - h;
   if(diffH <= 0) diffH += 24;
   int diffM = 60 - m;
   if(diffM < 60) {
      diffH--;
   } else {
      diffM = 0;
   }
   if(diffH < 0) diffH = 0;
   
   string nextStr = StringFormat("%s em %dh %02dm", nextName, diffH, diffM);
   
   int chart_w = (int)ChartGetInteger(0, CHART_WIDTH_IN_PIXELS);
   if(chart_w <= 0) chart_w = 1200;
   int card_w = 210, card_h = 66;
   int card_x = chart_w - card_w - 90; // 90px da borda direita da tela, livre da escala do MT5
   int card_y = 20;
   
   // Fundo do Card (usando CORNER_LEFT_UPPER para sincronização exata de coordenadas)
   string bg = PFX + "BG";
   if(ObjectFind(0, bg) < 0) {
      ObjectCreate(0, bg, OBJ_RECTANGLE_LABEL, 0, 0, 0);
      ObjectSetInteger(0, bg, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, bg, OBJPROP_BORDER_TYPE, BORDER_FLAT);
      ObjectSetInteger(0, bg, OBJPROP_BACK, false);
      ObjectSetInteger(0, bg, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, bg, OBJPROP_ZORDER, 10);
      ObjectSetInteger(0, bg, OBJPROP_BGCOLOR, C'14,18,26');
      ObjectSetInteger(0, bg, OBJPROP_COLOR, C'31,41,61');
      ObjectSetInteger(0, bg, OBJPROP_WIDTH, 1);
   }
   ObjectSetInteger(0, bg, OBJPROP_XDISTANCE, card_x);
   ObjectSetInteger(0, bg, OBJPROP_YDISTANCE, card_y);
   ObjectSetInteger(0, bg, OBJPROP_XSIZE, card_w);
   ObjectSetInteger(0, bg, OBJPROP_YSIZE, card_h);
   
   // Coluna Esquerda de Rótulos (DENTRO do Card)
   // "tick 1s"
   string t1_sub = PFX + "T1_SUB";
   if(ObjectFind(0, t1_sub) < 0) {
      ObjectCreate(0, t1_sub, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, t1_sub, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetString(0, t1_sub, OBJPROP_FONT, "Calibri");
      ObjectSetInteger(0, t1_sub, OBJPROP_FONTSIZE, 9);
      ObjectSetInteger(0, t1_sub, OBJPROP_ZORDER, 11);
      ObjectSetInteger(0, t1_sub, OBJPROP_COLOR, C'120,130,145');
   }
   ObjectSetInteger(0, t1_sub, OBJPROP_XDISTANCE, card_x + 12);
   ObjectSetInteger(0, t1_sub, OBJPROP_YDISTANCE, card_y + 8);
   ObjectSetInteger(0, t1_sub, OBJPROP_ANCHOR, ANCHOR_LEFT_UPPER);
   ObjectSetString(0, t1_sub, OBJPROP_TEXT, "tick 1s");

   // "MERCADO:"
   string t2_lbl = PFX + "T2_LBL";
   if(ObjectFind(0, t2_lbl) < 0) {
      ObjectCreate(0, t2_lbl, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, t2_lbl, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetString(0, t2_lbl, OBJPROP_FONT, "Calibri");
      ObjectSetInteger(0, t2_lbl, OBJPROP_FONTSIZE, 9);
      ObjectSetInteger(0, t2_lbl, OBJPROP_ZORDER, 11);
      ObjectSetInteger(0, t2_lbl, OBJPROP_COLOR, C'120,130,145');
   }
   ObjectSetInteger(0, t2_lbl, OBJPROP_XDISTANCE, card_x + 12);
   ObjectSetInteger(0, t2_lbl, OBJPROP_YDISTANCE, card_y + 26);
   ObjectSetInteger(0, t2_lbl, OBJPROP_ANCHOR, ANCHOR_LEFT_UPPER);
   ObjectSetString(0, t2_lbl, OBJPROP_TEXT, "MERCADO:");

   // "PROXIMO:"
   string t3_lbl = PFX + "T3_LBL";
   if(ObjectFind(0, t3_lbl) < 0) {
      ObjectCreate(0, t3_lbl, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, t3_lbl, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetString(0, t3_lbl, OBJPROP_FONT, "Calibri");
      ObjectSetInteger(0, t3_lbl, OBJPROP_FONTSIZE, 9);
      ObjectSetInteger(0, t3_lbl, OBJPROP_ZORDER, 11);
      ObjectSetInteger(0, t3_lbl, OBJPROP_COLOR, C'120,130,145');
   }
   ObjectSetInteger(0, t3_lbl, OBJPROP_XDISTANCE, card_x + 12);
   ObjectSetInteger(0, t3_lbl, OBJPROP_YDISTANCE, card_y + 44);
   ObjectSetInteger(0, t3_lbl, OBJPROP_ANCHOR, ANCHOR_LEFT_UPPER);
   ObjectSetString(0, t3_lbl, OBJPROP_TEXT, "PROXIMO:");

   // Coluna Direita de Valores (DENTRO do Card, alinhada à direita do card)
   // "▪ EA ONLINE"
   string t1 = PFX + "T1";
   if(ObjectFind(0, t1) < 0) {
      ObjectCreate(0, t1, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, t1, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetString(0, t1, OBJPROP_FONT, "Calibri Bold");
      ObjectSetInteger(0, t1, OBJPROP_FONTSIZE, 9);
      ObjectSetInteger(0, t1, OBJPROP_ZORDER, 11);
   }
   ObjectSetInteger(0, t1, OBJPROP_XDISTANCE, card_x + card_w - 12);
   ObjectSetInteger(0, t1, OBJPROP_YDISTANCE, card_y + 8);
   ObjectSetInteger(0, t1, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER);
   ObjectSetInteger(0, t1, OBJPROP_COLOR, g_BotPaused ? C'210,68,68' : C'28,170,112');
   ObjectSetString(0, t1, OBJPROP_TEXT, g_BotPaused ? "▪ EA PAUSADO" : "▪ EA ONLINE");

   // Valor Mercado ("N.YORK")
   string t2_val = PFX + "T2_VAL";
   if(ObjectFind(0, t2_val) < 0) {
      ObjectCreate(0, t2_val, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, t2_val, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetString(0, t2_val, OBJPROP_FONT, "Calibri Bold");
      ObjectSetInteger(0, t2_val, OBJPROP_FONTSIZE, 9);
      ObjectSetInteger(0, t2_val, OBJPROP_ZORDER, 11);
   }
   ObjectSetInteger(0, t2_val, OBJPROP_XDISTANCE, card_x + card_w - 12);
   ObjectSetInteger(0, t2_val, OBJPROP_YDISTANCE, card_y + 26);
   ObjectSetInteger(0, t2_val, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER);
   ObjectSetInteger(0, t2_val, OBJPROP_COLOR, currClr);
   ObjectSetString(0, t2_val, OBJPROP_TEXT, currMkt);

   // Valor Proximo ("SYD em 1h 25m")
   string t3_val = PFX + "T3_VAL";
   if(ObjectFind(0, t3_val) < 0) {
      ObjectCreate(0, t3_val, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, t3_val, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetString(0, t3_val, OBJPROP_FONT, "Calibri Bold");
      ObjectSetInteger(0, t3_val, OBJPROP_FONTSIZE, 9);
      ObjectSetInteger(0, t3_val, OBJPROP_ZORDER, 11);
      ObjectSetInteger(0, t3_val, OBJPROP_COLOR, C'224,155,0');
   }
   ObjectSetInteger(0, t3_val, OBJPROP_XDISTANCE, card_x + card_w - 12);
   ObjectSetInteger(0, t3_val, OBJPROP_YDISTANCE, card_y + 44);
   ObjectSetInteger(0, t3_val, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER);
   ObjectSetString(0, t3_val, OBJPROP_TEXT, nextStr);
}

//===================================================================
// PAINEL DE MONITORAMENTO BLUE GUARDIAN PROP FIRM (ESTILO ORION HEDGE)
//===================================================================
void LimparPainelPropFirm() {
   string PFX = "FS_PROP_HUD_";
   for(int i = ObjectsTotal(0, 0, -1) - 1; i >= 0; i--) {
      string name = ObjectName(0, i, 0, -1);
      if(StringFind(name, PFX) == 0) ObjectDelete(0, name);
   }
}

void DesenharPainelPropFirm() {
   if(MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE)) return;

   if(!g_ShowPropFirmHUD || !InpPropFirmMode || !InpShowPanel) {
      LimparPainelPropFirm();
      return;
   }
   
   string PFX = "FS_PROP_HUD_";
   
   double bal = AccountInfoDouble(ACCOUNT_BALANCE);
   double eq  = AccountInfoDouble(ACCOUNT_EQUITY);
   double plHoje = g_CachedPlTotReal + g_FloatingPlTot;
   double plHojePct = (bal > 0) ? (plHoje / bal * 100.0) : 0;
   
   double propStopUsd = bal * (InpPropMaxDailyLossPct / 100.0);
   double mesaStopUsd = bal * (InpPropFirmDailyLimitPct / 100.0);
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double freeMarginPct = (bal > 0) ? (freeMargin / bal * 100.0) : 0;
   
   // Watermark & High Peak Tracking (Sincronização 100% com Blue Guardian Dashboard)
   string g_GV_HWM = "Sniper_HWM_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   string g_GV_MXP = "Sniper_MXP_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   
   double hwm = GlobalVariableCheck(g_GV_HWM) ? GlobalVariableGet(g_GV_HWM) : MathMax(g_StartBalance, MathMax(bal, eq));
   if(MathMax(bal, eq) > hwm) {
      hwm = MathMax(bal, eq);
      GlobalVariableSet(g_GV_HWM, hwm);
   }
   
   double maxDDUsd = (g_StartBalance > 0) ? (g_StartBalance - eq) : 0;
   if(maxDDUsd < 0) maxDDUsd = 0;
   double maxDDPct = (bal > 0) ? (maxDDUsd / bal * 100.0) : 0;
   
   double ddFromPeakUsd = hwm - eq;
   if(ddFromPeakUsd < 0) ddFromPeakUsd = 0;
   
   double maxDDPeakUsd = GlobalVariableCheck(g_GV_MXP) ? GlobalVariableGet(g_GV_MXP) : ddFromPeakUsd;
   if(ddFromPeakUsd > maxDDPeakUsd) {
      maxDDPeakUsd = ddFromPeakUsd;
      GlobalVariableSet(g_GV_MXP, maxDDPeakUsd);
   }
   double maxDDPeakPct = (hwm > 0) ? (maxDDPeakUsd / hwm * 100.0) : 0;
   
   double distMaxLossUsd = (g_StartBalance * (InpPropFirmMaxDDLimitPct / 100.0)) - maxDDPeakUsd;
   if(distMaxLossUsd < 0) distMaxLossUsd = 0;
   double distMaxLossPct = (g_StartBalance > 0) ? (distMaxLossUsd / g_StartBalance * 100.0) : 0;
   
   double totalProfitUsd = bal - g_StartBalance;
   double fase1TargetUsd = g_StartBalance * (InpPropFase1TargetPct / 100.0);
   double fase1FaltaUsd = MathMax(0, fase1TargetUsd - MathMax(0, totalProfitUsd));
   double fase1Pct = (fase1TargetUsd > 0) ? MathMin(100.0, (MathMax(0, totalProfitUsd) / fase1TargetUsd) * 100.0) : 0;
   
   double fase2TargetUsd = g_StartBalance * (InpPropFase2TargetPct / 100.0);
   double fase2Pct = (fase2TargetUsd > 0) ? MathMin(100.0, (MathMax(0, totalProfitUsd) / fase2TargetUsd) * 100.0) : 0;
   
   string statusText = "CONFORME";
   color statusColor = C'28,170,112'; // Verde Tecla
   if(g_LocalGlobalBlock || g_BotPaused) {
      statusText = "PAUSADO / RISCO"; statusColor = C'210,68,68';
   }
   
   int card_w = 320, card_h = 280;
   int card_x = InpPanelX + PANEL_W + 10, card_y = InpPanelY; // Lado a lado com o painel principal (dinâmico)
   
   // Fundo do Card
   string bg = PFX + "BG";
   if(ObjectFind(0, bg) < 0) {
      ObjectCreate(0, bg, OBJ_RECTANGLE_LABEL, 0, 0, 0);
      ObjectSetInteger(0, bg, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, bg, OBJPROP_BORDER_TYPE, BORDER_FLAT);
      ObjectSetInteger(0, bg, OBJPROP_BACK, false);
      ObjectSetInteger(0, bg, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, bg, OBJPROP_ZORDER, 10);
      ObjectSetInteger(0, bg, OBJPROP_BGCOLOR, C'14,18,26');
      ObjectSetInteger(0, bg, OBJPROP_COLOR, C'31,41,61');
      ObjectSetInteger(0, bg, OBJPROP_WIDTH, 1);
   }
   ObjectSetInteger(0, bg, OBJPROP_XDISTANCE, card_x);
   ObjectSetInteger(0, bg, OBJPROP_YDISTANCE, card_y);
   ObjectSetInteger(0, bg, OBJPROP_XSIZE, card_w);
   ObjectSetInteger(0, bg, OBJPROP_YSIZE, card_h);
   
   // Botão Fechar [X] no Card
   string btn_close = PFX + "BTN_CLOSE";
   if(ObjectFind(0, btn_close) < 0) {
      ObjectCreate(0, btn_close, OBJ_BUTTON, 0, 0, 0);
      ObjectSetInteger(0, btn_close, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, btn_close, OBJPROP_XSIZE, 16);
      ObjectSetInteger(0, btn_close, OBJPROP_YSIZE, 14);
      ObjectSetString(0, btn_close, OBJPROP_TEXT, "✕");
      ObjectSetInteger(0, btn_close, OBJPROP_BGCOLOR, C'20,26,38');
      ObjectSetInteger(0, btn_close, OBJPROP_COLOR, C'140,150,165');
      ObjectSetInteger(0, btn_close, OBJPROP_BORDER_COLOR, C'40,50,70');
      ObjectSetString(0, btn_close, OBJPROP_FONT, "Arial Bold");
      ObjectSetInteger(0, btn_close, OBJPROP_FONTSIZE, 8);
      ObjectSetInteger(0, btn_close, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, btn_close, OBJPROP_HIDDEN, true);
      ObjectSetInteger(0, btn_close, OBJPROP_ZORDER, 15);
   }
   ObjectSetInteger(0, btn_close, OBJPROP_XDISTANCE, card_x + card_w - 22);
   ObjectSetInteger(0, btn_close, OBJPROP_YDISTANCE, card_y + 8);
   
   // Cabeçalho Principal
   string h_title = PFX + "H_TITLE";
   if(ObjectFind(0, h_title) < 0) {
      ObjectCreate(0, h_title, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, h_title, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetString(0, h_title, OBJPROP_FONT, "Calibri Bold");
      ObjectSetInteger(0, h_title, OBJPROP_FONTSIZE, 10);
      ObjectSetInteger(0, h_title, OBJPROP_ZORDER, 11);
      ObjectSetInteger(0, h_title, OBJPROP_COLOR, C'248,250,255');
   }
   ObjectSetInteger(0, h_title, OBJPROP_XDISTANCE, card_x + 12);
   ObjectSetInteger(0, h_title, OBJPROP_YDISTANCE, card_y + 10);
   ObjectSetString(0, h_title, OBJPROP_TEXT, StringFormat("BLUE GUARDIAN PRO (%.0fK)", g_StartBalance/1000.0));
   
   string h_stat = PFX + "H_STAT";
   if(ObjectFind(0, h_stat) < 0) {
      ObjectCreate(0, h_stat, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, h_stat, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetString(0, h_stat, OBJPROP_FONT, "Calibri Bold");
      ObjectSetInteger(0, h_stat, OBJPROP_FONTSIZE, 9);
      ObjectSetInteger(0, h_stat, OBJPROP_ZORDER, 11);
   }
   ObjectSetInteger(0, h_stat, OBJPROP_XDISTANCE, card_x + 12);
   ObjectSetInteger(0, h_stat, OBJPROP_YDISTANCE, card_y + 26);
   ObjectSetInteger(0, h_stat, OBJPROP_COLOR, statusColor);
   ObjectSetString(0, h_stat, OBJPROP_TEXT, "Status: " + statusText);
   
   // ================= SESSÃO 1: STOP DIÁRIO =================
   string s1_bg = PFX + "S1_BG";
   if(ObjectFind(0, s1_bg) < 0) {
      ObjectCreate(0, s1_bg, OBJ_RECTANGLE_LABEL, 0, 0, 0);
      ObjectSetInteger(0, s1_bg, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, s1_bg, OBJPROP_BORDER_TYPE, BORDER_FLAT);
      ObjectSetInteger(0, s1_bg, OBJPROP_BACK, false);
      ObjectSetInteger(0, s1_bg, OBJPROP_ZORDER, 11);
      ObjectSetInteger(0, s1_bg, OBJPROP_BGCOLOR, C'180,120,0'); // Amber/Gold Header
      ObjectSetInteger(0, s1_bg, OBJPROP_COLOR, C'220,150,0');
   }
   ObjectSetInteger(0, s1_bg, OBJPROP_XDISTANCE, card_x + 10);
   ObjectSetInteger(0, s1_bg, OBJPROP_YDISTANCE, card_y + 46);
   ObjectSetInteger(0, s1_bg, OBJPROP_XSIZE, card_w - 20);
   ObjectSetInteger(0, s1_bg, OBJPROP_YSIZE, 18);
   
   string s1_txt = PFX + "S1_TXT";
   if(ObjectFind(0, s1_txt) < 0) {
      ObjectCreate(0, s1_txt, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, s1_txt, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetString(0, s1_txt, OBJPROP_FONT, "Calibri Bold");
      ObjectSetInteger(0, s1_txt, OBJPROP_FONTSIZE, 8);
      ObjectSetInteger(0, s1_txt, OBJPROP_ZORDER, 12);
      ObjectSetInteger(0, s1_txt, OBJPROP_COLOR, C'255,255,255');
   }
   ObjectSetInteger(0, s1_txt, OBJPROP_XDISTANCE, card_x + 16);
   ObjectSetInteger(0, s1_txt, OBJPROP_YDISTANCE, card_y + 48);
   ObjectSetString(0, s1_txt, OBJPROP_TEXT, StringFormat("STOP DIÁRIO (%.1f%% MESA | %.1f%% FIBBO)", InpPropFirmDailyLimitPct, InpPropMaxDailyLossPct));
   
   int cur_y = card_y + 68;
   
   // Perda Acumulada Hoje
   string l1_a = PFX + "L1_A"; string l1_b = PFX + "L1_B";
   if(ObjectFind(0, l1_a) < 0) { ObjectCreate(0, l1_a, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l1_a, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetString(0, l1_a, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l1_a, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l1_a, OBJPROP_COLOR, C'140,150,165'); ObjectSetInteger(0, l1_a, OBJPROP_ZORDER, 12); ObjectSetString(0, l1_a, OBJPROP_TEXT, "Perda Acumulada Hoje:"); }
   if(ObjectFind(0, l1_b) < 0) { ObjectCreate(0, l1_b, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l1_b, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, l1_b, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER); ObjectSetString(0, l1_b, OBJPROP_FONT, "Calibri Bold"); ObjectSetInteger(0, l1_b, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l1_b, OBJPROP_ZORDER, 12); }
   ObjectSetInteger(0, l1_a, OBJPROP_XDISTANCE, card_x + 16); ObjectSetInteger(0, l1_a, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, l1_b, OBJPROP_XDISTANCE, card_x + card_w - 16); ObjectSetInteger(0, l1_b, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, l1_b, OBJPROP_COLOR, plHoje >= 0 ? C'28,170,112' : C'210,68,68');
   ObjectSetString(0, l1_b, OBJPROP_TEXT, StringFormat("%s%.2f USD (%s%.2f%%)", plHoje>=0?"+":"", plHoje, plHojePct>=0?"+":"", plHojePct));
   
   cur_y += 16;
   // Corte Preventivo Fibbo
   string l2_a = PFX + "L2_A"; string l2_b = PFX + "L2_B";
   if(ObjectFind(0, l2_a) < 0) { ObjectCreate(0, l2_a, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l2_a, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetString(0, l2_a, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l2_a, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l2_a, OBJPROP_COLOR, C'140,150,165'); ObjectSetInteger(0, l2_a, OBJPROP_ZORDER, 12); }
   if(ObjectFind(0, l2_b) < 0) { ObjectCreate(0, l2_b, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l2_b, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, l2_b, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER); ObjectSetString(0, l2_b, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l2_b, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l2_b, OBJPROP_COLOR, C'100,140,180'); ObjectSetInteger(0, l2_b, OBJPROP_ZORDER, 12); }
   ObjectSetString(0, l2_a, OBJPROP_TEXT, StringFormat("Corte Preventivo Fibbo (-%.1f%%):", InpPropMaxDailyLossPct));
   ObjectSetInteger(0, l2_a, OBJPROP_XDISTANCE, card_x + 16); ObjectSetInteger(0, l2_a, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, l2_b, OBJPROP_XDISTANCE, card_x + card_w - 16); ObjectSetInteger(0, l2_b, OBJPROP_YDISTANCE, cur_y);
   ObjectSetString(0, l2_b, OBJPROP_TEXT, StringFormat("-%.2f USD (-%.2f%%)", propStopUsd, InpPropMaxDailyLossPct));
   
   cur_y += 16;
   // Margem Livre Segura
   string l3_a = PFX + "L3_A"; string l3_b = PFX + "L3_B";
   if(ObjectFind(0, l3_a) < 0) { ObjectCreate(0, l3_a, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l3_a, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetString(0, l3_a, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l3_a, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l3_a, OBJPROP_COLOR, C'140,150,165'); ObjectSetInteger(0, l3_a, OBJPROP_ZORDER, 12); ObjectSetString(0, l3_a, OBJPROP_TEXT, "Margem Livre Segura:"); }
   if(ObjectFind(0, l3_b) < 0) { ObjectCreate(0, l3_b, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l3_b, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, l3_b, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER); ObjectSetString(0, l3_b, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l3_b, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l3_b, OBJPROP_COLOR, C'28,170,112'); ObjectSetInteger(0, l3_b, OBJPROP_ZORDER, 12); }
   ObjectSetInteger(0, l3_a, OBJPROP_XDISTANCE, card_x + 16); ObjectSetInteger(0, l3_a, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, l3_b, OBJPROP_XDISTANCE, card_x + card_w - 16); ObjectSetInteger(0, l3_b, OBJPROP_YDISTANCE, cur_y);
   ObjectSetString(0, l3_b, OBJPROP_TEXT, StringFormat("+%.2f USD (+%.2f%%)", freeMargin, freeMarginPct));
   
   cur_y += 16;
   // Teto Limite Mesa (-4% ou configurado)
   string l4_a = PFX + "L4_A"; string l4_b = PFX + "L4_B";
   if(ObjectFind(0, l4_a) < 0) { ObjectCreate(0, l4_a, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l4_a, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetString(0, l4_a, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l4_a, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l4_a, OBJPROP_COLOR, C'140,150,165'); ObjectSetInteger(0, l4_a, OBJPROP_ZORDER, 12); }
   if(ObjectFind(0, l4_b) < 0) { ObjectCreate(0, l4_b, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l4_b, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, l4_b, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER); ObjectSetString(0, l4_b, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l4_b, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l4_b, OBJPROP_COLOR, C'210,68,68'); ObjectSetInteger(0, l4_b, OBJPROP_ZORDER, 12); }
   ObjectSetString(0, l4_a, OBJPROP_TEXT, StringFormat("Teto Limit Mesa (-%.1f%%):", InpPropFirmDailyLimitPct));
   ObjectSetInteger(0, l4_a, OBJPROP_XDISTANCE, card_x + 16); ObjectSetInteger(0, l4_a, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, l4_b, OBJPROP_XDISTANCE, card_x + card_w - 16); ObjectSetInteger(0, l4_b, OBJPROP_YDISTANCE, cur_y);
   ObjectSetString(0, l4_b, OBJPROP_TEXT, StringFormat("-%.2f USD (-%.2f%%)", mesaStopUsd, InpPropFirmDailyLimitPct));
   
   // ================= SESSÃO 2: DRAWDOWN TOTAL =================
   cur_y += 22;
   string s2_bg = PFX + "S2_BG";
   if(ObjectFind(0, s2_bg) < 0) {
      ObjectCreate(0, s2_bg, OBJ_RECTANGLE_LABEL, 0, 0, 0);
      ObjectSetInteger(0, s2_bg, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, s2_bg, OBJPROP_BORDER_TYPE, BORDER_FLAT);
      ObjectSetInteger(0, s2_bg, OBJPROP_BACK, false);
      ObjectSetInteger(0, s2_bg, OBJPROP_ZORDER, 11);
      ObjectSetInteger(0, s2_bg, OBJPROP_BGCOLOR, C'30,90,170'); // Blue Header
      ObjectSetInteger(0, s2_bg, OBJPROP_COLOR, C'40,110,200');
   }
   ObjectSetInteger(0, s2_bg, OBJPROP_XDISTANCE, card_x + 10);
   ObjectSetInteger(0, s2_bg, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, s2_bg, OBJPROP_XSIZE, card_w - 20);
   ObjectSetInteger(0, s2_bg, OBJPROP_YSIZE, 18);
   
   string s2_txt = PFX + "S2_TXT";
   if(ObjectFind(0, s2_txt) < 0) {
      ObjectCreate(0, s2_txt, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, s2_txt, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetString(0, s2_txt, OBJPROP_FONT, "Calibri Bold");
      ObjectSetInteger(0, s2_txt, OBJPROP_FONTSIZE, 8);
      ObjectSetInteger(0, s2_txt, OBJPROP_ZORDER, 12);
      ObjectSetInteger(0, s2_txt, OBJPROP_COLOR, C'255,255,255');
   }
   ObjectSetInteger(0, s2_txt, OBJPROP_XDISTANCE, card_x + 16);
   ObjectSetInteger(0, s2_txt, OBJPROP_YDISTANCE, cur_y + 2);
   ObjectSetString(0, s2_txt, OBJPROP_TEXT, StringFormat("DRAWDOWN TOTAL (%.1f%% MAX MESA)", InpPropFirmMaxDDLimitPct));
   
   cur_y += 22;
   // Drawdown do Pico (High Watermark - Blue Guardian Sincronizado)
   string l5_a = PFX + "L5_A"; string l5_b = PFX + "L5_B";
   if(ObjectFind(0, l5_a) < 0) { ObjectCreate(0, l5_a, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l5_a, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetString(0, l5_a, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l5_a, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l5_a, OBJPROP_COLOR, C'140,150,165'); ObjectSetInteger(0, l5_a, OBJPROP_ZORDER, 12); ObjectSetString(0, l5_a, OBJPROP_TEXT, "Drawdown Pico (Watermark):"); }
   if(ObjectFind(0, l5_b) < 0) { ObjectCreate(0, l5_b, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l5_b, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, l5_b, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER); ObjectSetString(0, l5_b, OBJPROP_FONT, "Calibri Bold"); ObjectSetInteger(0, l5_b, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l5_b, OBJPROP_COLOR, C'210,68,68'); ObjectSetInteger(0, l5_b, OBJPROP_ZORDER, 12); }
   ObjectSetInteger(0, l5_a, OBJPROP_XDISTANCE, card_x + 16); ObjectSetInteger(0, l5_a, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, l5_b, OBJPROP_XDISTANCE, card_x + card_w - 16); ObjectSetInteger(0, l5_b, OBJPROP_YDISTANCE, cur_y);
   ObjectSetString(0, l5_b, OBJPROP_TEXT, StringFormat("-%.2f USD (-%.2f%%)", maxDDPeakUsd, maxDDPeakPct));
   
   cur_y += 16;
   // Distancia p/ Perda Max
   string l6_a = PFX + "L6_A"; string l6_b = PFX + "L6_B";
   if(ObjectFind(0, l6_a) < 0) { ObjectCreate(0, l6_a, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l6_a, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetString(0, l6_a, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l6_a, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l6_a, OBJPROP_COLOR, C'140,150,165'); ObjectSetInteger(0, l6_a, OBJPROP_ZORDER, 12); ObjectSetString(0, l6_a, OBJPROP_TEXT, "Distancia p/ Perda Max:"); }
   if(ObjectFind(0, l6_b) < 0) { ObjectCreate(0, l6_b, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l6_b, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, l6_b, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER); ObjectSetString(0, l6_b, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l6_b, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l6_b, OBJPROP_COLOR, C'28,170,112'); ObjectSetInteger(0, l6_b, OBJPROP_ZORDER, 12); }
   ObjectSetInteger(0, l6_a, OBJPROP_XDISTANCE, card_x + 16); ObjectSetInteger(0, l6_a, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, l6_b, OBJPROP_XDISTANCE, card_x + card_w - 16); ObjectSetInteger(0, l6_b, OBJPROP_YDISTANCE, cur_y);
   ObjectSetString(0, l6_b, OBJPROP_TEXT, StringFormat("+%.2f USD (+%.2f%% livre)", distMaxLossUsd, distMaxLossPct));
   
   // ================= SESSÃO 3: METAS DE LUCRO =================
   cur_y += 22;
   string s3_bg = PFX + "S3_BG";
   if(ObjectFind(0, s3_bg) < 0) {
      ObjectCreate(0, s3_bg, OBJ_RECTANGLE_LABEL, 0, 0, 0);
      ObjectSetInteger(0, s3_bg, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, s3_bg, OBJPROP_BORDER_TYPE, BORDER_FLAT);
      ObjectSetInteger(0, s3_bg, OBJPROP_BACK, false);
      ObjectSetInteger(0, s3_bg, OBJPROP_ZORDER, 11);
      ObjectSetInteger(0, s3_bg, OBJPROP_BGCOLOR, C'20,130,80'); // Green Header
      ObjectSetInteger(0, s3_bg, OBJPROP_COLOR, C'30,150,90');
   }
   ObjectSetInteger(0, s3_bg, OBJPROP_XDISTANCE, card_x + 10);
   ObjectSetInteger(0, s3_bg, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, s3_bg, OBJPROP_XSIZE, card_w - 20);
   ObjectSetInteger(0, s3_bg, OBJPROP_YSIZE, 18);
   
   string s3_txt = PFX + "S3_TXT";
   if(ObjectFind(0, s3_txt) < 0) {
      ObjectCreate(0, s3_txt, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, s3_txt, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetString(0, s3_txt, OBJPROP_FONT, "Calibri Bold");
      ObjectSetInteger(0, s3_txt, OBJPROP_FONTSIZE, 8);
      ObjectSetInteger(0, s3_txt, OBJPROP_ZORDER, 12);
      ObjectSetInteger(0, s3_txt, OBJPROP_COLOR, C'255,255,255');
   }
   ObjectSetInteger(0, s3_txt, OBJPROP_XDISTANCE, card_x + 16);
   ObjectSetInteger(0, s3_txt, OBJPROP_YDISTANCE, cur_y + 2);
   ObjectSetString(0, s3_txt, OBJPROP_TEXT, "METAS DE LUCRO (PROGRESSAO DINAMICA)");
   
   cur_y += 22;
   // Progresso Fase 1 (Configurado)
   string l7_a = PFX + "L7_A"; string l7_b = PFX + "L7_B";
   if(ObjectFind(0, l7_a) < 0) { ObjectCreate(0, l7_a, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l7_a, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetString(0, l7_a, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l7_a, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l7_a, OBJPROP_COLOR, C'140,150,165'); ObjectSetInteger(0, l7_a, OBJPROP_ZORDER, 12); }
   if(ObjectFind(0, l7_b) < 0) { ObjectCreate(0, l7_b, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l7_b, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, l7_b, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER); ObjectSetString(0, l7_b, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l7_b, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l7_b, OBJPROP_COLOR, C'28,170,112'); ObjectSetInteger(0, l7_b, OBJPROP_ZORDER, 12); }
   ObjectSetString(0, l7_a, OBJPROP_TEXT, StringFormat("Progresso Fase 1 (%.1f%%):", InpPropFase1TargetPct));
   ObjectSetInteger(0, l7_a, OBJPROP_XDISTANCE, card_x + 16); ObjectSetInteger(0, l7_a, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, l7_b, OBJPROP_XDISTANCE, card_x + card_w - 16); ObjectSetInteger(0, l7_b, OBJPROP_YDISTANCE, cur_y);
   ObjectSetString(0, l7_b, OBJPROP_TEXT, StringFormat("+%.2f USD (%.1f%% da Meta)", MathMax(0, totalProfitUsd), fase1Pct));
   
   cur_y += 16;
   // Falta p/ Meta Fase 1
   string l8_a = PFX + "L8_A"; string l8_b = PFX + "L8_B";
   if(ObjectFind(0, l8_a) < 0) { ObjectCreate(0, l8_a, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l8_a, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetString(0, l8_a, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l8_a, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l8_a, OBJPROP_COLOR, C'140,150,165'); ObjectSetInteger(0, l8_a, OBJPROP_ZORDER, 12); ObjectSetString(0, l8_a, OBJPROP_TEXT, "Falta p/ Meta Fase 1:"); }
   if(ObjectFind(0, l8_b) < 0) { ObjectCreate(0, l8_b, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l8_b, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, l8_b, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER); ObjectSetString(0, l8_b, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l8_b, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l8_b, OBJPROP_COLOR, C'100,130,160'); ObjectSetInteger(0, l8_b, OBJPROP_ZORDER, 12); }
   ObjectSetInteger(0, l8_a, OBJPROP_XDISTANCE, card_x + 16); ObjectSetInteger(0, l8_a, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, l8_b, OBJPROP_XDISTANCE, card_x + card_w - 16); ObjectSetInteger(0, l8_b, OBJPROP_YDISTANCE, cur_y);
   ObjectSetString(0, l8_b, OBJPROP_TEXT, StringFormat("+%.2f USD restante", fase1FaltaUsd));
   
   cur_y += 16;
   // Progresso Fase 2 (Configurado)
   string l9_a = PFX + "L9_A"; string l9_b = PFX + "L9_B";
   if(ObjectFind(0, l9_a) < 0) { ObjectCreate(0, l9_a, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l9_a, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetString(0, l9_a, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l9_a, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l9_a, OBJPROP_COLOR, C'140,150,165'); ObjectSetInteger(0, l9_a, OBJPROP_ZORDER, 12); }
   if(ObjectFind(0, l9_b) < 0) { ObjectCreate(0, l9_b, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l9_b, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, l9_b, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER); ObjectSetString(0, l9_b, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l9_b, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l9_b, OBJPROP_COLOR, C'28,170,112'); ObjectSetInteger(0, l9_b, OBJPROP_ZORDER, 12); }
   ObjectSetString(0, l9_a, OBJPROP_TEXT, StringFormat("Progresso Fase 2 (%.1f%%):", InpPropFase2TargetPct));
   ObjectSetInteger(0, l9_a, OBJPROP_XDISTANCE, card_x + 16); ObjectSetInteger(0, l9_a, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, l9_b, OBJPROP_XDISTANCE, card_x + card_w - 16); ObjectSetInteger(0, l9_b, OBJPROP_YDISTANCE, cur_y);
   ObjectSetString(0, l9_b, OBJPROP_TEXT, StringFormat("+%.2f USD (%.1f%% da Meta)", MathMax(0, totalProfitUsd), fase2Pct));
}

void OnDeinit(const int reason) {
   GlobalVariableSet("FS9_ModoConfl", g_ModoConfluencia);
   EventKillTimer();
   LiberarTodosHandles();
   LimparLinhasOrdens();                              // remove linhas customizadas
   ChartSetInteger(0, CHART_SHOW_TRADE_LEVELS, true); // restaura linhas nativas
   LimparPainel(); LimparGrafico(); LimparTudoAnalise(); LimparWidgetStatusMercado(); LimparPainelPropFirm();
   for(int i = ObjectsTotal(0, 0, -1) - 1; i >= 0; i--) {
      string nm = ObjectName(0, i, 0, -1);
      if(StringFind(nm, PANEL_PREFIX) == 0 || 
         StringFind(nm, "FS_") == 0 || 
         StringFind(nm, "SniperLine_") == 0 || 
         StringFind(nm, "SniperText_") == 0 || 
         StringFind(nm, ORD_LINE_PFX) == 0 || 
         StringFind(nm, MG_PREFIX) == 0) {
         ObjectDelete(0, nm);
      }
   }
   ChartRedraw(0);
}

void OnTimer() {
   RefreshBarCache(); RefreshFastCache();
   DesenharWidgetStatusMercado();
   
   // [SINCRONIA DINÂMICA]: Atualiza as linhas sempre que confluência, requisitos, prontidão ou preços mudarem
   static string s_chart_hash = "";
   string new_chart_hash = StringFormat("%.5f|%.5f|%.5f|%.5f|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d",
      g_CachedCanalHigh, g_CachedCanalLow, g_CachedFRTop, g_CachedFRFundo,
      g_FastNPosSymbol, (int)g_ViewZonas, (int)g_ViewFR, (int)g_ViewFibo,
      (int)g_LinhasModo, (int)g_MG_BuyAllowed, (int)g_MG_SellAllowed,
      (int)g_ReadyFR_Sell, (int)g_ReadyFR_Buy, (int)g_ReadyFibo,
      (int)f_h4_buy, (int)f_h4_sell);
   if(new_chart_hash != s_chart_hash) {
      s_chart_hash = new_chart_hash;
      DesenharLinhasChart();
   }
   
   bool is_tester_non_visual = (MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE));
   if(!is_tester_non_visual) {
      DesenharLinhasOrdens();
      
      g_ModoAnalise = g_ViewZonas;
      if(g_ModoAnalise || g_ModoConfluencia > 0) {
         // [CORREÇÃO ITEM 1]: O TF de Confluência é SEMPRE determinado por g_ModoConfluencia,
         // independente de o botão visual ZEN estar ligado ou desligado!
         ENUM_TIMEFRAMES tf_mg = g_TF_L1;
         if(g_ModoConfluencia == 1)      tf_mg = PERIOD_M15;
         else if(g_ModoConfluencia == 2) tf_mg = PERIOD_H1;
         else if(g_ModoConfluencia == 3) tf_mg = PERIOD_H2;
         else if(g_ModoConfluencia == 4) tf_mg = PERIOD_H4;
         
         AtualizarSensoresAnalise(tf_mg);
         if(g_ModoAnalise) DesenharLinhasAnalise();
         else LimparObjetosVisuaisMG();

      } else {
         LimparTudoAnalise();
      }

      if(InpShowPanel) {
         string h = ComputePanelHash();
         // [FIX-04] ChartRedraw forçado para eliminar flickering entre ticks
         if(h != g_PanelHash) { g_PanelHash = h; DesenharPainel(); DesenharPainelDiag(); ChartRedraw(0); }
         DesenharPainelPropFirm();
         
         // [C1 FIX] Atualiza MG_DiagText separadamente para nao repintar o painel inteiro
         if(g_ModoConfluencia > 0 || g_ViewZonas) {
            color mg_clr = (g_MG_DiagColor == clrGray) ? CLR_TXT_DIM : (g_MG_DiagColor == clrLimeGreen) ? CLR_TEAL : (g_MG_DiagColor == clrRed) ? CLR_RED : CLR_AMBER;
            string n_lbl = PANEL_PREFIX + "R_mg_stat_v";
            if(ObjectFind(0, n_lbl) >= 0) {
               ObjectSetString(0, n_lbl, OBJPROP_TEXT, (g_MG_DiagText!="")?g_MG_DiagText:"Aguardando...");
               ObjectSetInteger(0, n_lbl, OBJPROP_COLOR, mg_clr);
            }
         }
      }
   }
   if(!InpCloseDaily) return;
   MqlDateTime dt; TimeCurrent(dt); int m=(dt.hour*60)+dt.min;
   bool deve_fechar=((dt.day_of_week>=1&&dt.day_of_week<=4&&m>=(InpDailyCloseHour*60+InpDailyCloseMinute))||(dt.day_of_week==5&&m>=(InpFridayCloseHour*60+InpFridayCloseMinute)));
   // [C3 FIX] Limitar spam de FecharDayTradesLucroDoSymbol
   static datetime s_last_daily_close = 0;
   if(deve_fechar && TimeCurrent() - s_last_daily_close > 60) {
      s_last_daily_close = TimeCurrent();
      FecharDayTradesLucroDoSymbol(); g_PanelHash = "";
   }
}

//===================================================================
// ON TICK — MOTOR PRINCIPAL SATÉLITE v28.4
//===================================================================
void OnTick() {
   VerificarTravasFinanceiras();
   if(g_LocalGlobalBlock || g_LocalBlocked) return;

   RefreshBarCache(); VerificarRegimeDeMercado();

   double sl_pts=g_CachedSlPts, lot=g_CachedLot, trail_dist=g_CachedATR*InpTrail_ATR_Multi;
   int max_spread=g_CachedMaxSpread;

   for(int i=PositionsTotal()-1;i>=0;i--) {
      ulong ticket=PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)) continue;
      if(PositionGetInteger(POSITION_MAGIC)!=InpMagic) continue;
      
      if(PositionGetString(POSITION_SYMBOL)==_Symbol) {
         double posOpen=PositionGetDouble(POSITION_PRICE_OPEN), posSL=PositionGetDouble(POSITION_SL), posTP=PositionGetDouble(POSITION_TP);
         long posType=PositionGetInteger(POSITION_TYPE); string c_comm=PositionGetString(POSITION_COMMENT);
         
         if(posSL==0) continue;
         double curr_bid=SymbolInfoDouble(_Symbol,SYMBOL_BID), curr_ask=SymbolInfoDouble(_Symbol,SYMBOL_ASK);
         double stops_level = (double)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL) * _Point;
         if(stops_level <= 0) stops_level = _Point * 10.0;

         bool be_triggered=false;
         if(InpUseBreakEven) {
            double trigPct=(StringFind(c_comm,"Fibo")>=0)?InpBE_Trigger_Fibo:InpBE_Trigger_Normal;
            double trigger=MathAbs(posOpen-posSL)*trigPct, p_lock=InpBE_LockProfitPts*_Point;
            bool is_p2=(StringFind(c_comm,"_P2")>=0), p1_fechou=false;
            if(is_p2 && StringLen(c_comm)>=3){string bc=StringSubstr(c_comm,0,StringLen(c_comm)-3);p1_fechou=!JaExistePosicaoDaEstrategia(bc+"_P1");}
            bool be_dist=(posType==POSITION_TYPE_BUY&&curr_bid>=(posOpen+trigger))||(posType==POSITION_TYPE_SELL&&curr_ask<=(posOpen-trigger));
            bool be_tp1=(is_p2&&p1_fechou);
            
            // [PILAR 5] BE com Respiro ATR no primeiro toque (50%), Lock Cheio apenas após P1 fechar
            double target_be_sl_buy  = posOpen + p_lock;
            double target_be_sl_sell = posOpen - p_lock;
            if(InpBE_UseATRBreathing && !be_tp1 && g_CachedATR > 0) {
               double breath_dist = g_CachedATR * (InpBE_BreathingATRPct / 100.0);
               target_be_sl_buy   = posOpen - breath_dist;
               target_be_sl_sell  = posOpen + breath_dist;
            }
            
            if(be_dist||be_tp1){
               if(posType==POSITION_TYPE_BUY&&posSL<(target_be_sl_buy)-(_Point*2)&&curr_bid>=(target_be_sl_buy+stops_level)){
                  double nsl = NormalizeDouble(target_be_sl_buy, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Compra SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));be_triggered=true; posSL=nsl;}
               }
               else if(posType==POSITION_TYPE_SELL&&posSL>(target_be_sl_sell)+(_Point*2)&&curr_ask<=(target_be_sl_sell-stops_level)){
                  double nsl = NormalizeDouble(target_be_sl_sell, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Venda SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));be_triggered=true; posSL=nsl;}
               }
            }
         }
         // [BLINDAGEM 3] Trava de Lucro Dinâmico no Meio do Canal (Mid-Channel 50% Lock)
         if(InpFR_UseMidChannelLock && StringFind(c_comm, "FR_") >= 0 && posTP > 0) {
            double total_tp_dist = MathAbs(posTP - posOpen);
            if(total_tp_dist > stops_level * 2.0) {
               if(posType == POSITION_TYPE_BUY && curr_bid >= (posOpen + total_tp_dist * 0.50)) {
                  double lock_sl = posOpen + (total_tp_dist * 0.25);
                  if(posSL < (lock_sl - _Point * 2) && curr_bid >= (lock_sl + stops_level)) {
                     double nsl = NormalizeDouble(lock_sl, _Digits);
                     if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Compra SL travado em +25%% do canal (%.5f).", nsl));
                        posSL = nsl; // [FIX ITEM 3] Atualiza variável local posSL para o trailing não reverter
                     }
                  }
               }
               else if(posType == POSITION_TYPE_SELL && curr_ask <= (posOpen - total_tp_dist * 0.50)) {
                  double lock_sl = posOpen - (total_tp_dist * 0.25);
                  if(posSL > (lock_sl + _Point * 2) && curr_ask <= (lock_sl - stops_level)) {
                     double nsl = NormalizeDouble(lock_sl, _Digits);
                     if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Venda SL travado em +25%% do canal (%.5f).", nsl));
                        posSL = nsl; // [FIX ITEM 3] Atualiza variável local posSL para o trailing não reverter
                     }
                  }
               }
            }
         }

         if(!be_triggered&&InpUseTrailStop&&g_CachedATR>0){
            double pos_atr=(StringFind(c_comm,"Fibo_")>=0)?(g_CachedFiboATR>0?g_CachedFiboATR:g_CachedATR):((StringFind(c_comm,"_L2")>=0||StringFind(c_comm,"_H4")>=0)?(g_L2_ATR>0?g_L2_ATR:g_CachedATR):g_CachedATR);
            double pos_trail_dist=pos_atr*InpTrail_ATR_Multi;
            if(pos_trail_dist < stops_level) pos_trail_dist = stops_level + (_Point * 2.0);
            double step_trail=pos_atr*0.25;
            if(step_trail < _Point) step_trail = _Point;
            if(posType==POSITION_TYPE_BUY){
               double nsl=NormalizeDouble(curr_bid-pos_trail_dist,_Digits);
               if(nsl>posOpen&&nsl>(posSL+step_trail)&&(curr_bid-nsl)>=stops_level) trade.PositionModify(ticket,nsl,posTP);
            }
            else if(posType==POSITION_TYPE_SELL){
               double nsl=NormalizeDouble(curr_ask+pos_trail_dist,_Digits);
               if(nsl<posOpen&&nsl<(posSL-step_trail)&&(nsl-curr_ask)>=stops_level) trade.PositionModify(ticket,nsl,posTP);
            }
         }
      }
   }

   if(g_FastNPos >= InpMaxSimultaneousOps) return;

   bool block_day    = (g_NPosDay     >= InpMaxDayTrades);
   bool block_fr_l2  = (g_NPosSwingFR  >= InpMaxFRSwingTrades);
   bool block_fibo   = (g_NPosSwingFibo >= InpMaxFiboTrades);

   if(TemNoticiaProxima()||IsLowLiquidityWindow()||IsLowOscillationWindow()){g_ReadyFluxo=false;g_ReadyFR=false;g_ReadyFibo=false;return;}
   if(g_BotPaused) return;

   // [PROP] Modo Blue Guardian: limite diário + consistência + max posições
   if(InpPropFirmMode) {
      double _bal = AccountInfoDouble(ACCOUNT_BALANCE);
      if((g_CachedPlTotReal + g_FloatingPlTot) <= -(_bal*(InpPropMaxDailyLossPct/100.0))) {
         if(!g_LocalGlobalBlock) {
            // [H5 FIX] Seta o flag ANTES de fechar para evitar duplo trigger em spikes
            g_LocalGlobalBlock=true; GlobalVariableSet(g_GV_GlobalBlock,1.0);
            FecharTodasPosicoesDoRobo(); 
            AddLog("⛔ PROP: Limite diário atingido!");
         }
         return;
      }
      if(g_FastNPos >= InpPropMaxPos) return;
      double max_daily_consistency_profit = _bal * (InpPropFase1TargetPct / 100.0) * (InpPropConsistencyPct / 100.0); // Ex: $10,000 * 10% * 35% = $350 USD
      double total_earned = _bal - g_StartBalance;
      double pl_total_hoje = g_CachedPlTotReal + g_FloatingPlTot;

      // Cálculo de consistência imune a falsos positivos com lucros irrisórios (< $100 USD)
      g_ConsistencyPct = (total_earned >= 100.0 && pl_total_hoje > 0) ? (pl_total_hoje / total_earned * 100.0) : ((pl_total_hoje > 0 && max_daily_consistency_profit > 0) ? (pl_total_hoje / max_daily_consistency_profit * 100.0) : 0.0);

      // Trava APENAS se o lucro do dia atingir o teto real da mesa ($350 USD em 10k) ou ferir a consistência acumulada
      if(pl_total_hoje >= max_daily_consistency_profit || (total_earned >= 100.0 && g_ConsistencyPct > InpPropConsistencyPct)) {
         if(!g_BotPaused){ g_BotPaused=true; AddLog(StringFormat("⛔ PROP: Teto Diário de Consistência atingido (%.2f USD >= %.2f USD) — pausado para proteger a aprovação!", pl_total_hoje, max_daily_consistency_profit)); }
         return;
      }
   }

   MqlDateTime dt_n; TimeCurrent(dt_n); int m_at=(dt_n.hour*60)+dt_n.min;
   if(InpCloseDaily){if(dt_n.day_of_week>=1&&dt_n.day_of_week<=4&&m_at>=(InpDailyCloseHour*60+InpDailyCloseMinute))return;if(dt_n.day_of_week==5&&m_at>=(InpFridayCloseHour*60+InpFridayCloseMinute))return;}
   if(g_FastSpread>max_spread) return;

   if(InpUseSessionFilter){
      MqlDateTime dts; TimeCurrent(dts);
      bool in_session=(InpSessionEndHour>InpSessionStartHour)?(dts.hour>=InpSessionStartHour&&dts.hour<InpSessionEndHour):(dts.hour>=InpSessionStartHour||dts.hour<InpSessionEndHour);
      if(!in_session){bool tsunami=(InpSession_IgnoreOnSpike&&g_CachedADX>=p_Fluxo_StrongADX);if(!tsunami)return;}
   }

   int trendDir=g_CachedTrendDir, medTrendDir=g_CachedMedDir;
   datetime cb_l1=iTime(_Symbol,g_TF_L1,0), cb_l2=iTime(_Symbol,TF_L2,0);
   datetime cb_h4=iTime(_Symbol,PERIOD_H4,0), cb_d1=iTime(_Symbol,PERIOD_D1,0);
   double ask=SymbolInfoDouble(_Symbol,SYMBOL_ASK), bid=SymbolInfoDouble(_Symbol,SYMBOL_BID);

   double l2_adx=0, l2_rsi=0, l2_atr=0; int l2_trend=0, l2_med=0;
   double d_adx_l2[], d_rsi_l2[], d_atr_l2[]; 
   ArraySetAsSeries(d_adx_l2,true); ArraySetAsSeries(d_rsi_l2,true); ArraySetAsSeries(d_atr_l2,true);
   if(CopyBuffer(hADX_L2,0,1,1,d_adx_l2)>0) l2_adx=d_adx_l2[0];
   if(CopyBuffer(hRSI_L2,0,1,1,d_rsi_l2)>0) l2_rsi=d_rsi_l2[0];
   if(CopyBuffer(hATR_L2,0,1,1,d_atr_l2)>0) l2_atr=SanitizeATR(d_atr_l2[0], TF_L2);
   l2_trend = ComputeTrendDir(hShortEMA_L2, hEMA_L2);
   l2_med   = ComputeTrendDir(hShortEMA_L2, hMedEMA_L2);
   // [FIX-02] Atribui dados L2 às globais — antes ficavam sempre em 0 no painel
   g_L2_ADX = l2_adx; g_L2_RSI = l2_rsi; g_L2_ATR = l2_atr;
   g_L2_TrendDir = l2_trend; g_L2_MedDir = l2_med;

   bool l2_rsi_valido = (l2_rsi > 0);
   double l2_sl  = (l2_atr > 0) ? (l2_atr / _Point) * 1.5 : 0;
   
   // Lote Automático L2 (Baseado no ATR da L2 vs L1)
   double l2_lot = ComputeLot_ByDistance(l2_sl, l2_atr);

   double l2_top=0, l2_bot=0;
   double l2_h[], l2_l[]; ArraySetAsSeries(l2_h,true); ArraySetAsSeries(l2_l,true);
   if(CopyHigh(_Symbol,TF_L2,1,InpCandlesToLook,l2_h)>=InpCandlesToLook &&
      CopyLow (_Symbol,TF_L2,1,InpCandlesToLook,l2_l)>=InpCandlesToLook) {
      l2_top = l2_h[ArrayMaximum(l2_h)]; l2_bot = l2_l[ArrayMinimum(l2_l)];
   }

   //================================================================
   // MOTOR 1: FLUXO L1
   //================================================================
   if(InpUseFluxo && !block_day) {
      if(g_CachedFluxoCdOk) {
         double canal_high=g_CachedCanalHigh, canal_low=g_CachedCanalLow; bool vol_ok=true;
         if(InpUseVolumeFilter&&g_CachedVolMed>0){long vb[1];if(CopyTickVolume(_Symbol,g_TF_L1,0,1,vb)>=1)vol_ok=((double)vb[0]>g_CachedVolMed);}
         bool rsi_buy_ok=true, rsi_sell_ok=true;
         if(InpFluxo_UseExhaustion){if(g_CachedRSI>=p_FluxoRSI_OB)rsi_buy_ok=false;if(g_CachedRSI<=p_FluxoRSI_OS)rsi_sell_ok=false;}
         bool ma_buy=InpUseTrendFilter?(trendDir==1):true, ma_sell=InpUseTrendFilter?(trendDir==-1):true, is_lateral=IsMercadoLateral();
         bool exaustao_alta=false, exaustao_baixa=false;
         if(g_CachedATR>0){double v_range=iHigh(_Symbol,g_TF_L1,0)-iLow(_Symbol,g_TF_L1,0);if(v_range>(g_CachedATR*InpAntiExaustao_ATR_Multi)){if(VelaAltaAtual())exaustao_alta=true;if(VelaBaixaAtual())exaustao_baixa=true;}}
         bool parede_buy_ok=true, parede_sell_ok=true;
         double fluxo_tp1_buy=InpTP_Parcial_Multi, fluxo_tp1_sell=InpTP_Parcial_Multi;
         if(!is_lateral&&InpUseFR&&g_CachedFRTop>0&&g_CachedFRFundo>0){
            bool trend_tsunami=(InpFluxo_IgnoreWallStrong&&g_CachedADX>=p_Fluxo_StrongADX);
            double espaco_minimo=(sl_pts*_Point)*p_FluxoFR_MinDistFactor;
            if(g_CachedFRTop>canal_high){double dist_buy=g_CachedFRTop-canal_high;if(!trend_tsunami&&dist_buy<espaco_minimo)parede_buy_ok=false;else if(!trend_tsunami&&sl_pts>0){double exato=(g_CachedFRTop-ask)/_Point;if(exato>0&&exato<sl_pts*2.0)fluxo_tp1_buy=CalcularTP_Estrutural(exato,sl_pts,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);}}
            if(canal_low>g_CachedFRFundo){double dist_sell=canal_low-g_CachedFRFundo;if(!trend_tsunami&&dist_sell<espaco_minimo)parede_sell_ok=false;else if(!trend_tsunami&&sl_pts>0){double exato=(bid-g_CachedFRFundo)/_Point;if(exato>0&&exato<sl_pts*2.0)fluxo_tp1_sell=CalcularTP_Estrutural(exato,sl_pts,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);}}
         }
         
         // [CONFLUENCIA] Filtro direcional para o Fluxo
         if(g_ModoConfluencia > 0) {
             if(!g_MG_BuyAllowed) ma_buy = false;
             if(!g_MG_SellAllowed) ma_sell = false;
         }

         g_FluxoParedeAtiva=(!parede_buy_ok||!parede_sell_ok);
         if(!is_lateral) g_ReadyFluxo=(canal_high>0&&ma_buy&&rsi_buy_ok&&parede_buy_ok&&!exaustao_alta)||(canal_low>0&&ma_sell&&rsi_sell_ok&&parede_sell_ok&&!exaustao_baixa);
         else{g_FluxoParedeAtiva=false;g_ReadyFluxo=(canal_high>0&&(InpFluxo_UseExhaustion?g_CachedRSI>=p_FluxoRSI_OB:true))||(canal_low>0&&(InpFluxo_UseExhaustion?g_CachedRSI<=p_FluxoRSI_OS:true));}
         if(!is_lateral){
            double c_prev=iClose(_Symbol,g_TF_L1,1);
            if(!exaustao_alta&&parede_buy_ok&&canal_high>0&&c_prev>canal_high&&ma_buy&&ValidarEstruturaVelas(1,g_TF_L1)&&cb_l1!=l1_flx_buy&&vol_ok&&rsi_buy_ok&&!JaExistePosicaoDaEstrategia("Fluxo_C_L1")){if(AbrirBuy(lot,ask,sl_pts,fluxo_tp1_buy,InpTP_Final_Multi,"Fluxo_C_L1")){l1_flx_buy=cb_l1;AddLog("Fluxo COMPRA L1.");}}
            if(!exaustao_baixa&&parede_sell_ok&&canal_low>0&&c_prev<canal_low&&ma_sell&&ValidarEstruturaVelas(-1,g_TF_L1)&&cb_l1!=l1_flx_sell&&vol_ok&&rsi_sell_ok&&!JaExistePosicaoDaEstrategia("Fluxo_V_L1")){if(AbrirSell(lot,bid,sl_pts,fluxo_tp1_sell,InpTP_Final_Multi,"Fluxo_V_L1")){l1_flx_sell=cb_l1;AddLog("Fluxo VENDA L1.");}}
            // [F1] GatilhoPrecoce: entra no candle atual sem esperar a barra fechar
            // Só ativo quando ADX confirma força direcional (evita falsos em lateral)
            if(InpFluxo_GatilhoPrecoce && g_CachedADX >= p_ADX_ConsolidationLevel) {
               double o_cur=iOpen(_Symbol,g_TF_L1,0);
               if(!exaustao_alta&&parede_buy_ok&&canal_high>0&&ask>canal_high&&ask>o_cur&&ma_buy&&vol_ok&&rsi_buy_ok&&cb_l1!=l1_flx_buy&&!JaExistePosicaoDaEstrategia("Fluxo_C_L1")){if(AbrirBuy(lot,ask,sl_pts,fluxo_tp1_buy,InpTP_Final_Multi,"Fluxo_C_L1")){l1_flx_buy=cb_l1;AddLog("Fluxo COMPRA L1 [Prec].");}}
               if(!exaustao_baixa&&parede_sell_ok&&canal_low>0&&bid<canal_low&&bid<o_cur&&ma_sell&&vol_ok&&rsi_sell_ok&&cb_l1!=l1_flx_sell&&!JaExistePosicaoDaEstrategia("Fluxo_V_L1")){if(AbrirSell(lot,bid,sl_pts,fluxo_tp1_sell,InpTP_Final_Multi,"Fluxo_V_L1")){l1_flx_sell=cb_l1;AddLog("Fluxo VENDA L1 [Prec].");}}
            }
         } else {
            bool rev_venda_ok=InpFluxo_UseExhaustion?(g_CachedRSI>=p_FluxoRSI_OB):true, rev_compra_ok=InpFluxo_UseExhaustion?(g_CachedRSI<=p_FluxoRSI_OS):true;
            // [BUG-03 FIX] Verificar comment correto "Fluxo_V_L1"/"Fluxo_C_L1" — antes verificava "Fluxo_Rev_Venda"/"Fluxo_Rev_Compra" que nunca existiam, tornando o filtro antiduplicação inativo no modo lateral
            if(canal_high>0&&iHigh(_Symbol,g_TF_L1,1)>canal_high&&iClose(_Symbol,g_TF_L1,1)<canal_high&&ValidarEstruturaVelas(-1,g_TF_L1)&&cb_l1!=l1_flx_sell&&vol_ok&&rev_venda_ok&&!JaExistePosicaoDaEstrategia("Fluxo_V_L1")){if(AbrirSell(lot,bid,sl_pts,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fluxo_V_L1")) {l1_flx_sell=cb_l1; AddLog("Fluxo Rev VENDA.");}}
            if(canal_low>0&&iLow(_Symbol,g_TF_L1,1)<canal_low&&iClose(_Symbol,g_TF_L1,1)>canal_low&&ValidarEstruturaVelas(1,g_TF_L1)&&cb_l1!=l1_flx_buy&&vol_ok&&rev_compra_ok&&!JaExistePosicaoDaEstrategia("Fluxo_C_L1")){if(AbrirBuy(lot,ask,sl_pts,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fluxo_C_L1")) {l1_flx_buy=cb_l1; AddLog("Fluxo Rev COMPRA.");}}
         }
      } else g_ReadyFluxo=false;
   } else g_ReadyFluxo=false;

   //================================================================
   // MOTOR 2: FALSO ROMPIMENTO L1 + L2
   //================================================================
   if(InpUseFR) {
      // --- CAMADA 1 (Day Trade) ---
      if(!block_day && g_CachedFRTop>0&&g_CachedFRFundo>0&&g_CachedFrCdOk){
         double pH=g_CachedFRTop, pL=g_CachedFRFundo;
         double mag_tol=GetFR_MagTol(g_CachedATR,g_CachedADX);
         double fr_range=(pH-pL)/_Point, tp1_m=InpTP_Parcial_Multi;
         if(sl_pts>0&&fr_range>=sl_pts*0.5) tp1_m=CalcularTP_Estrutural(fr_range,sl_pts,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);
         
         // [PILAR 4] TP2 Estrutural Dinâmico no L1
         double tp2_m_sell_l1 = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(true, bid, pH, pL, sl_pts, g_CachedATR) : InpTP_Final_Multi;
         double tp2_m_buy_l1  = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(false, ask, pH, pL, sl_pts, g_CachedATR) : InpTP_Final_Multi;

         bool m_sell=InpFR_RequireWickRejection?(iHigh(_Symbol,g_TF_L1,1)>pH&&iClose(_Symbol,g_TF_L1,1)<pH&&IsVelaReversaoVenda(1,g_TF_L1)):(iHigh(_Symbol,g_TF_L1,1)>pH&&iClose(_Symbol,g_TF_L1,1)<pH&&iClose(_Symbol,g_TF_L1,1)<iOpen(_Symbol,g_TF_L1,1));
         bool m_buy =InpFR_RequireWickRejection?(iLow (_Symbol,g_TF_L1,1)<pL&&iClose(_Symbol,g_TF_L1,1)>pL&&IsVelaReversaoCompra(1,g_TF_L1)):(iLow(_Symbol,g_TF_L1,1)<pL&&iClose(_Symbol,g_TF_L1,1)>pL&&iClose(_Symbol,g_TF_L1,1)>iOpen(_Symbol,g_TF_L1,1));
         
         // [PILAR 2 & 3] Validação de Volume e Penetração Máxima no L1
         bool vp_s_ok = FR_ValidarVolumePenetracao(true, 1, g_TF_L1, pH, g_CachedATR, g_CachedVolMed);
         bool vp_b_ok = FR_ValidarVolumePenetracao(false, 1, g_TF_L1, pL, g_CachedATR, g_CachedVolMed);
         if(!vp_s_ok) m_sell = false;
         if(!vp_b_ok) m_buy  = false;

         bool is_lat=IsMercadoLateral()||g_LocalConsolidation;
         bool d_s_ok,d_b_ok; GetFR_DirecaoOk(medTrendDir,g_CachedRSI,d_s_ok,d_b_ok);
         double r_th_sell=GetFR_RSI_Threshold(true,g_CachedADX), r_th_buy=GetFR_RSI_Threshold(false,g_CachedADX);
         bool r_s_ok=true,r_b_ok=true;
         if(InpFR_UseRSI){r_s_ok=(g_CachedRSI>=r_th_sell);r_b_ok=(g_CachedRSI<=r_th_buy);if(m_sell)r_s_ok=true;if(m_buy)r_b_ok=true;}
         bool z_v=FR_ZonaLivre("L1",true), z_c=FR_ZonaLivre("L1",false);
         
         // [CONFLUENCIA] Trava espacial e direcional para Falso Rompimento
         bool confl_s_ok = true, confl_b_ok = true;
         if(g_ModoConfluencia > 0) {
             if(!g_MG_SellAllowed) confl_s_ok = false;
             if(!g_MG_BuyAllowed) confl_b_ok = false;
             
             if(g_MG_ATR > 0) {
                 // [BUG-C1 FIX] Variáveis declaradas dentro do bloco — escopo correto
                 double dist_mg = g_MG_ATR * 3.0;
                 bool perto_res = false, perto_sup = false;
                 if(g_MG_FR_H4_Res > 0 && MathAbs(pH - g_MG_FR_H4_Res) <= dist_mg) perto_res = true;
                 if(g_MG_FR_D1_Res > 0 && MathAbs(pH - g_MG_FR_D1_Res) <= dist_mg) perto_res = true;
                 if(g_MG_FR_H4_Sup > 0 && MathAbs(pL - g_MG_FR_H4_Sup) <= dist_mg) perto_sup = true;
                 if(g_MG_FR_D1_Sup > 0 && MathAbs(pL - g_MG_FR_D1_Sup) <= dist_mg) perto_sup = true;
                 
                 if((g_MG_FR_H4_Res > 0 || g_MG_FR_D1_Res > 0) && !perto_res) confl_s_ok = false;
                 if((g_MG_FR_H4_Sup > 0 || g_MG_FR_D1_Sup > 0) && !perto_sup) confl_b_ok = false;
             }
         }


         // [R3] Cooldown por tempo: bloqueia re-entrada no mesmo nível FR por N minutos
         int _fr_cd=InpFR_CooldownMinutes*60;
         bool tc_sell=(_fr_cd<=0||(TimeCurrent()-l1_fr_sell_ts)>=_fr_cd);
         bool tc_buy =(_fr_cd<=0||(TimeCurrent()-l1_fr_buy_ts )>=_fr_cd);
         g_ReadyFR_Sell = (confl_s_ok && tc_sell && (m_sell || (is_lat && d_s_ok && r_s_ok)));
         g_ReadyFR_Buy  = (confl_b_ok && tc_buy  && (m_buy  || (is_lat && d_b_ok && r_b_ok)));
         g_ReadyFR = (g_ReadyFR_Sell || g_ReadyFR_Buy);
         if(confl_s_ok && tc_sell && (m_sell||(is_lat&&d_s_ok&&r_s_ok&&vp_s_ok&&iHigh(_Symbol,g_TF_L1,1)>=(pH-mag_tol)&&iClose(_Symbol,g_TF_L1,1)<pH&&iClose(_Symbol,g_TF_L1,1)<iOpen(_Symbol,g_TF_L1,1)))&&z_v&&cb_l1!=l1_fr_sell){if(AbrirSell(lot,bid,sl_pts,tp1_m,tp2_m_sell_l1,"FR_Venda_L1")){l1_fr_sell=cb_l1;l1_fr_sell_ts=TimeCurrent();}}
         if(confl_b_ok && tc_buy  && (m_buy ||(is_lat&&d_b_ok&&r_b_ok&&vp_b_ok&&iLow (_Symbol,g_TF_L1,1)<=(pL+mag_tol)&&iClose(_Symbol,g_TF_L1,1)>pL&&iClose(_Symbol,g_TF_L1,1)>iOpen(_Symbol,g_TF_L1,1)))&&z_c&&cb_l1!=l1_fr_buy) {if(AbrirBuy (lot,ask,sl_pts,tp1_m,tp2_m_buy_l1,"FR_Compra_L1")){l1_fr_buy=cb_l1;l1_fr_buy_ts=TimeCurrent();}}

         if(InpFR_Direct_Entries && g_CachedATR > 0) {
            bool fr_d_atr_ok=(!InpUseOscillationFilter||(g_CachedATR/_Point)>=InpMinATRPts);
            if(fr_d_atr_ok) {
               double d_zone=g_CachedATR*(InpFR_Direct_ZoneATRPct/100.0);
               bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||g_CachedRSI>=r_th_sell)&&!g_LocalConsolidation&&d_s_ok):true;
               bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||g_CachedRSI<=r_th_buy)&&!g_LocalConsolidation&&d_b_ok):true;
               
               // [PILAR 2] Teto de penetração no FR Direct L1
               double max_pen_d = (InpFR_MaxPenetrationATR > 0) ? (g_CachedATR * InpFR_MaxPenetrationATR) : DBL_MAX;
               bool pen_dir_s = ((iHigh(_Symbol,g_TF_L1,0) - pH) <= max_pen_d);
               bool pen_dir_b = ((pL - iLow(_Symbol,g_TF_L1,0)) <= max_pen_d);
               
               if(confl_s_ok && tc_sell && pen_dir_s && (iHigh(_Symbol,g_TF_L1,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_sell&&z_v&&dr_s_ok){
                  datetime prev_sell=l1_frd_sell; l1_frd_sell=cb_l1;
                  if(!AbrirSell(lot,bid,sl_pts,tp1_m,tp2_m_sell_l1,"FR_Dir_V_L1")) l1_frd_sell=prev_sell; else l1_fr_sell_ts=TimeCurrent();
               }
               if(confl_b_ok && tc_buy && pen_dir_b && (iLow(_Symbol,g_TF_L1,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_buy&&z_c&&dr_b_ok){
                  datetime prev_buy=l1_frd_buy; l1_frd_buy=cb_l1;
                  if(!AbrirBuy(lot,ask,sl_pts,tp1_m,tp2_m_buy_l1,"FR_Dir_C_L1")) l1_frd_buy=prev_buy; else l1_fr_buy_ts=TimeCurrent();
               }
            } // [R1] fim filtro ATR
         }
      } else g_ReadyFR=false;

      if(!block_fr_l2 && l2_rsi_valido && l2_top>0 && l2_bot>0 && l2_sl>0) {
         int cdl_fr2 = GetStrategyLossStatus_ByTag("FR_", "_L2");
         // [BUG-L1 FIX] iBarShift pode retornar -1 se barra não encontrada — usa fallback 999
         int bs_sell=(l2_fr_sell>0)?iBarShift(_Symbol,TF_L2,l2_fr_sell):999;
         int bs_buy =(l2_fr_buy >0)?iBarShift(_Symbol,TF_L2,l2_fr_buy ):999;
         if(bs_sell<0) bs_sell=999; if(bs_buy<0) bs_buy=999;
         bool fr2_cd_sell=(p_CooldownBars==0)?(cdl_fr2<InpMaxConsecLosses):(cdl_fr2<InpMaxConsecLosses&&(bs_sell>=p_CooldownBars||l2_fr_sell==0));
         bool fr2_cd_buy =(p_CooldownBars==0)?(cdl_fr2<InpMaxConsecLosses):(cdl_fr2<InpMaxConsecLosses&&(bs_buy >=p_CooldownBars||l2_fr_buy ==0));
         // [BUG-C4 FIX] Aplica cooldown por tempo (InpFR_CooldownMinutes) também no L2
         int _fr_cd_l2=InpFR_CooldownMinutes*60;
         bool tc_sell_l2=(_fr_cd_l2<=0||(TimeCurrent()-l2_fr_sell_ts)>=_fr_cd_l2);
         bool tc_buy_l2 =(_fr_cd_l2<=0||(TimeCurrent()-l2_fr_buy_ts )>=_fr_cd_l2);
         fr2_cd_sell = fr2_cd_sell && tc_sell_l2;
         fr2_cd_buy  = fr2_cd_buy  && tc_buy_l2;
         
         // [CONFLUENCIA] Filtro direcional para FR L2
         if(g_ModoConfluencia > 0) {
             if(!g_MG_SellAllowed) fr2_cd_sell = false;
             if(!g_MG_BuyAllowed) fr2_cd_buy = false;
         }
         
         double pH=l2_top, pL=l2_bot;
         double mag_tol=GetFR_MagTol(l2_atr,l2_adx,TF_L2);
         double fr_range=(pH-pL)/_Point, tp1_m=InpTP_Parcial_Multi;
         if(l2_sl>0&&fr_range>=l2_sl*0.5) tp1_m=CalcularTP_Estrutural(fr_range,l2_sl,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);
         
         // [PILAR 4] TP2 Estrutural Dinâmico no L2
         double tp2_m_sell_l2 = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(true, bid, pH, pL, l2_sl, l2_atr) : InpTP_Final_Multi;
         double tp2_m_buy_l2  = InpFR_UseStructuralTP2 ? CalcularTP2_EstruturalFR(false, ask, pH, pL, l2_sl, l2_atr) : InpTP_Final_Multi;

         bool m_sell=InpFR_RequireWickRejection?(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&IsVelaReversaoVenda(1,TF_L2)):(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&iClose(_Symbol,TF_L2,1)<iOpen(_Symbol,TF_L2,1));
         bool m_buy =InpFR_RequireWickRejection?(iLow (_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&IsVelaReversaoCompra(1,TF_L2)):(iLow(_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&iClose(_Symbol,TF_L2,1)>iOpen(_Symbol,TF_L2,1));

         // [BLINDAGEM 1] Trava Anti-Super-Tendência L2 (Posicionada após a declaração de m_sell/m_buy e com g_H4_ADX)
         if(InpFR_BlockAgainstSuperTrend && (l2_adx >= InpFR_SuperTrend_ADX || g_H4_ADX >= InpFR_SuperTrend_ADX)) {
             double e200_l2 = (g_MG_EMA200 > 0) ? g_MG_EMA200 : (g_MG_hEMA200 != INVALID_HANDLE ? g_MG_EMA200 : 0);
             if(e200_l2 > 0) {
                if(bid > e200_l2) { fr2_cd_sell = false; m_sell = false; } // Super-Alta: Proibido vender topo
                if(ask < e200_l2) { fr2_cd_buy  = false; m_buy  = false; } // Super-Baixa: Proibido comprar fundo
             }
         }
         
         // [PILAR 2 & 3] Validação de Volume e Penetração Máxima no L2
         bool vp_s_ok_l2 = FR_ValidarVolumePenetracao(true, 1, TF_L2, pH, l2_atr, g_CachedVolMed_L2);
         bool vp_b_ok_l2 = FR_ValidarVolumePenetracao(false, 1, TF_L2, pL, l2_atr, g_CachedVolMed_L2);
         if(!vp_s_ok_l2) m_sell = false;
         if(!vp_b_ok_l2) m_buy  = false;

         bool is_lat=(l2_adx<p_ADX_ConsolidationLevel); // [B11: esta declaracao esta OK — escopo local do bloco FR L2, diferente da is_lateral do Fluxo]
         bool d_s_ok,d_b_ok; GetFR_DirecaoOk(l2_med,l2_rsi,d_s_ok,d_b_ok);
         double r_th_sell=GetFR_RSI_Threshold(true,l2_adx), r_th_buy=GetFR_RSI_Threshold(false,l2_adx);
         bool r_s_ok=true,r_b_ok=true;
         if(InpFR_UseRSI){r_s_ok=(l2_rsi>=r_th_sell);r_b_ok=(l2_rsi<=r_th_buy);if(m_sell)r_s_ok=true;if(m_buy)r_b_ok=true;}
         bool z_v=FR_ZonaLivre("L2",true), z_c=FR_ZonaLivre("L2",false);
         if((m_sell||(is_lat&&d_s_ok&&r_s_ok&&vp_s_ok_l2&&iHigh(_Symbol,TF_L2,1)>=(pH-mag_tol)&&iClose(_Symbol,TF_L2,1)<pH&&iClose(_Symbol,TF_L2,1)<iOpen(_Symbol,TF_L2,1)))&&z_v&&cb_l2!=l2_fr_sell&&fr2_cd_sell){if(AbrirSell(l2_lot,bid,l2_sl,tp1_m,tp2_m_sell_l2,"FR_Venda_L2")){l2_fr_sell=cb_l2; l2_fr_sell_ts=TimeCurrent();}}
         if((m_buy ||(is_lat&&d_b_ok&&r_b_ok&&vp_b_ok_l2&&iLow (_Symbol,TF_L2,1)<=(pL+mag_tol)&&iClose(_Symbol,TF_L2,1)>pL&&iClose(_Symbol,TF_L2,1)>iOpen(_Symbol,TF_L2,1)))&&z_c&&cb_l2!=l2_fr_buy&&fr2_cd_buy) {if(AbrirBuy (l2_lot,ask,l2_sl,tp1_m,tp2_m_buy_l2,"FR_Compra_L2")){l2_fr_buy=cb_l2; l2_fr_buy_ts=TimeCurrent();}}

         if(InpFR_Direct_Entries&&l2_atr>0&&(!InpUseOscillationFilter||(l2_atr/_Point)>=InpMinATRPts)){
            double d_zone=l2_atr*(InpFR_Direct_ZoneATRPct/100.0);
            bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||l2_rsi>=r_th_sell)&&!g_LocalConsolidation&&d_s_ok):true;
            bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros)?((!InpFR_UseRSI||l2_rsi<=r_th_buy)&&!g_LocalConsolidation&&d_b_ok):true;
            // [BUG-04 FIX] FR Direct L2 agora respeita confluência espacial do MarketGlance
            bool confl_l2_s_ok = true, confl_l2_b_ok = true;
            if(g_ModoConfluencia > 0 && g_MG_ATR > 0) {
               double dist_mg_l2 = g_MG_ATR * 3.0;
               bool perto_res_l2 = (g_MG_FR_H4_Res>0 && MathAbs(pH-g_MG_FR_H4_Res)<=dist_mg_l2) ||
                                   (g_MG_FR_D1_Res>0 && MathAbs(pH-g_MG_FR_D1_Res)<=dist_mg_l2);
               bool perto_sup_l2 = (g_MG_FR_H4_Sup>0 && MathAbs(pL-g_MG_FR_H4_Sup)<=dist_mg_l2) ||
                                   (g_MG_FR_D1_Sup>0 && MathAbs(pL-g_MG_FR_D1_Sup)<=dist_mg_l2);
               if((g_MG_FR_H4_Res>0||g_MG_FR_D1_Res>0) && !perto_res_l2) confl_l2_s_ok = false;
               if((g_MG_FR_H4_Sup>0||g_MG_FR_D1_Sup>0) && !perto_sup_l2) confl_l2_b_ok = false;
            }
            
            // [PILAR 2] Teto de penetração no FR Direct L2
            double max_pen_d_l2 = (InpFR_MaxPenetrationATR > 0) ? (l2_atr * InpFR_MaxPenetrationATR) : DBL_MAX;
            bool pen_dir_s_l2 = ((iHigh(_Symbol,TF_L2,0) - pH) <= max_pen_d_l2);
            bool pen_dir_b_l2 = ((pL - iLow(_Symbol,TF_L2,0)) <= max_pen_d_l2);

            if(confl_l2_s_ok&&pen_dir_s_l2&&(iHigh(_Symbol,TF_L2,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_sell&&z_v&&dr_s_ok&&fr2_cd_sell){
               datetime prev_sell=l2_frd_sell; l2_frd_sell=cb_l2;
               if(!AbrirSell(l2_lot,bid,l2_sl,tp1_m,tp2_m_sell_l2,"FR_Dir_V_L2")) l2_frd_sell=prev_sell; else l2_fr_sell_ts=TimeCurrent();
            }
            if(confl_l2_b_ok&&pen_dir_b_l2&&(iLow(_Symbol,TF_L2,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_buy&&z_c&&dr_b_ok&&fr2_cd_buy){
               datetime prev_buy=l2_frd_buy; l2_frd_buy=cb_l2;
               if(!AbrirBuy(l2_lot,ask,l2_sl,tp1_m,tp2_m_buy_l2,"FR_Dir_C_L2")) l2_frd_buy=prev_buy; else l2_fr_buy_ts=TimeCurrent();
            }
         }
      }
   } else g_ReadyFR=false;

   //================================================================
   // MOTOR 3: FIBONACCI 2.0 DE ALTA PRECISÃO (5 PILARES SNIPER)
   //================================================================
   if(IsFiboActiveForSymbol() && !block_fibo) {
      int cooldown_sec = InpFR_CooldownMinutes * 60;
      bool fibo_cd_buy  = (cooldown_sec <= 0 || (TimeCurrent() - l_fibo_buy_ts >= cooldown_sec));
      bool fibo_cd_sell = (cooldown_sec <= 0 || (TimeCurrent() - l_fibo_sell_ts >= cooldown_sec));
      
      // FIBO H4
      if(g_CachedFiboCdOk && g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0) {
         // [PILAR 3] Absorção de Volume Institucional (Valida Vela Fechada [1] ou Vela Atual [0])
         bool v_ok = true;
         if(InpFib_RequireVolumeAbsorption && g_CachedVolMed > 0) {
            long vb[2];
            if(CopyTickVolume(_Symbol, g_TF_L1, 0, 2, vb) >= 2) {
               v_ok = ((double)vb[1] >= (g_CachedVolMed * InpFib_MinVolumeRatio) || (double)vb[0] >= (g_CachedVolMed * InpFib_MinVolumeRatio * 0.5));
            }
         } else if(InpUseVolumeFilter && g_CachedVolMed > 0) {
            long vb[2];
            if(CopyTickVolume(_Symbol, g_TF_L1, 0, 2, vb) >= 2) {
               v_ok = ((double)vb[1] > g_CachedVolMed || (double)vb[0] > (g_CachedVolMed * 0.5));
            }
         }
         
         double range = g_CachedFiboH - g_CachedFiboLow;
         if(range >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
            double sl_f  = (g_CachedFiboATR / _Point) * 1.5;
            double gat_f = g_CachedFiboATR * (InpFib_MagneticZoneATRPct / 100.0);
            
            // Em ALTA: Entradas de Compra no Ponto C (18%, 23.6%, 38.2% a partir do fundo A)
            double nBuy1 = g_CachedFiboLow + range * (InpFibLevel1 / 100.0);
            double nBuy2 = g_CachedFiboLow + range * (InpFibLevel2 / 100.0);
            double nBuy3 = g_CachedFiboLow + range * (InpFibLevel3 / 100.0);

            // Em BAIXA: Entradas de Venda no Ponto C (18%, 23.6%, 38.2% a partir do topo A)
            double nSell1 = g_CachedFiboH - range * (InpFibLevel1 / 100.0);
            double nSell2 = g_CachedFiboH - range * (InpFibLevel2 / 100.0);
            double nSell3 = g_CachedFiboH - range * (InpFibLevel3 / 100.0);
            
            int t_h4 = ComputeTrendDir(hShortEMA_H4, hEMA_H4);
            bool a_ok = p_UsePassaFiltroADXFibo ? (g_H4_ADX >= cfg_ADX_MinLevel) : true;
            bool dso  = p_UseTrendDirFibo ? (t_h4 == -1) : true;
            bool dbo  = p_UseTrendDirFibo ? (t_h4 == 1) : true;
            
            if(g_ModoConfluencia > 0) {
               if(!g_MG_SellAllowed) dso = false;
               if(!g_MG_BuyAllowed)  dbo = false;
            }
            
            double max_pen_fibo = (InpFib_MaxPenetrationATR > 0) ? (g_CachedFiboATR * InpFib_MaxPenetrationATR) : DBL_MAX;
            
            bool fibo_rev_s = true;
            if(InpFib_RequireWickRejection) fibo_rev_s = IsVelaReversaoVenda(1, g_TF_L1) || (iClose(_Symbol, g_TF_L1, 0) < iOpen(_Symbol, g_TF_L1, 0));
            
            bool fibo_rev_b = true;
            if(InpFib_RequireWickRejection) fibo_rev_b = IsVelaReversaoCompra(1, g_TF_L1) || (iClose(_Symbol, g_TF_L1, 0) > iOpen(_Symbol, g_TF_L1, 0));

            // [PILAR 4] TP2 Estrutural: Alvo no Topo B (100.0%) em Alta ou Fundo B (0.0%) em Baixa
            double tp2_fibo_sell = InpTP_Final_Multi;
            double tp2_fibo_buy  = InpTP_Final_Multi;
            if(InpFib_UseStructuralTP2 && sl_f > 0) {
               double dist_tp_sell = MathAbs(bid - g_CachedFiboLow) / _Point;
               double dist_tp_buy  = MathAbs(g_CachedFiboH - ask) / _Point;
               double r_mult_sell = dist_tp_sell / sl_f;
               double r_mult_buy  = dist_tp_buy  / sl_f;
               tp2_fibo_sell = (r_mult_sell >= 1.5) ? MathMin(InpTP_Final_Multi, r_mult_sell) : InpTP_Final_Multi;
               tp2_fibo_buy  = (r_mult_buy  >= 1.5) ? MathMin(InpTP_Final_Multi, r_mult_buy)  : InpTP_Final_Multi;
            }

            double min_l_pen = MathMin(iLow(_Symbol, g_TF_L1, 0), iLow(_Symbol, g_TF_L1, 1));
            double max_h_pen = MathMax(iHigh(_Symbol, g_TF_L1, 0), iHigh(_Symbol, g_TF_L1, 1));
            bool fb_s1_pen = ((max_h_pen - nSell1) <= max_pen_fibo);
            bool fb_b1_pen = ((nBuy1 - min_l_pen) <= max_pen_fibo);
            bool fb_s2_pen = ((max_h_pen - nSell2) <= max_pen_fibo);
            bool fb_b2_pen = ((nBuy2 - min_l_pen) <= max_pen_fibo);
            bool fb_s3_pen = ((max_h_pen - nSell3) <= max_pen_fibo);
            bool fb_b3_pen = ((nBuy3 - min_l_pen) <= max_pen_fibo);

            bool fb_pen_s_any = (InpUseFiboLevel1 && fb_s1_pen) || (InpUseFiboLevel2 && fb_s2_pen) || (InpUseFiboLevel3 && fb_s3_pen);
            bool fb_pen_b_any = (InpUseFiboLevel1 && fb_b1_pen) || (InpUseFiboLevel2 && fb_b2_pen) || (InpUseFiboLevel3 && fb_b3_pen);

            g_ReadyFibo = (a_ok && dso && v_ok && fibo_rev_s && fb_pen_s_any) || 
                          (a_ok && dbo && v_ok && fibo_rev_b && fb_pen_b_any);
            double l_h4 = ComputeLot_ByDistance(sl_f, g_CachedFiboATR);
            
            // [REGRA SNIPER]: Apenas UMA operação de Fibo aberta por vez no par
            bool tem_fibo_aberta = JaExistePosicaoDaEstrategia("Fibo_");

            // [GATILHO DE RETOMADA SNIPER]: Preço furou o nível (vela 0 ou 1) e na volta da tendência dispara!
            double min_l_chk = MathMin(iLow(_Symbol, g_TF_L1, 0), iLow(_Symbol, g_TF_L1, 1));
            double max_h_chk = MathMax(iHigh(_Symbol, g_TF_L1, 0), iHigh(_Symbol, g_TF_L1, 1));

            // Compra: Furou nBuy1 e o preço atual (Ask) está voltando para cima do nível, sem ter escapado longe demais
            bool volta_b1 = (min_l_chk <= nBuy1 + gat_f) && (ask >= nBuy1 - gat_f * 0.5) && (ask <= nBuy1 + gat_f * 2.5) && fibo_rev_b && fb_b1_pen;
            // Venda: Furou nSell1 e o preço atual (Bid) está voltando para baixo do nível, sem ter despencado longe demais
            bool volta_s1 = (max_h_chk >= nSell1 - gat_f) && (bid <= nSell1 + gat_f * 0.5) && (bid >= nSell1 - gat_f * 2.5) && fibo_rev_s && fb_s1_pen;

            // --- EXECUÇÃO NÍVEL 1 (18.0%) ---
            if(InpUseFiboLevel1 && !tem_fibo_aberta) {
               if(a_ok && dso && volta_s1 && v_ok && cb_h4 != f_h4_sell) {
                  if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_1")) { 
                     f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                  }
               }
               if(a_ok && dbo && volta_b1 && v_ok && cb_h4 != f_h4_buy) {
                  if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_1")) { 
                     f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                  }
               }
            }
            
            // --- EXECUÇÃO NÍVEL 2 (28.0%) ---
            tem_fibo_aberta = JaExistePosicaoDaEstrategia("Fibo_");
            bool volta_b2 = (min_l_chk <= nBuy2 + gat_f) && (ask >= nBuy2 - gat_f * 0.5) && (ask <= nBuy2 + gat_f * 2.5) && fibo_rev_b && fb_b2_pen;
            bool volta_s2 = (max_h_chk >= nSell2 - gat_f) && (bid <= nSell2 + gat_f * 0.5) && (bid >= nSell2 - gat_f * 2.5) && fibo_rev_s && fb_s2_pen;

            if(InpUseFiboLevel2 && !tem_fibo_aberta) {
               if(a_ok && dso && volta_s2 && v_ok && cb_h4 != f_h4_sell) {
                  if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_2")) { 
                     f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                  }
               }
               if(a_ok && dbo && volta_b2 && v_ok && cb_h4 != f_h4_buy) {
                  if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_2")) { 
                     f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                  }
               }
            }

            // --- EXECUÇÃO NÍVEL 3 (38.2%) ---
            tem_fibo_aberta = JaExistePosicaoDaEstrategia("Fibo_");
            bool volta_b3 = (min_l_chk <= nBuy3 + gat_f) && (ask >= nBuy3 - gat_f * 0.5) && (ask <= nBuy3 + gat_f * 2.5) && fibo_rev_b && fb_b3_pen;
            bool volta_s3 = (max_h_chk >= nSell3 - gat_f) && (bid <= nSell3 + gat_f * 0.5) && (bid >= nSell3 - gat_f * 2.5) && fibo_rev_s && fb_s3_pen;

            if(InpUseFiboLevel3 && !tem_fibo_aberta) {
               if(a_ok && dso && volta_s3 && v_ok && cb_h4 != f_h4_sell) {
                  if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_3")) { 
                     f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                  }
               }
               if(a_ok && dbo && volta_b3 && v_ok && cb_h4 != f_h4_buy) {
                  if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_3")) { 
                     f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                  }
               }
            }
         } else g_ReadyFibo = false;
      } else g_ReadyFibo = false;
   } else {
      // [BUG-M3 FIX] Reseta g_ReadyFibo quando block_fibo=true OU estratégia desativada
      g_ReadyFibo = false;
   }
}
//+------------------------------------------------------------------+
//  FIM — Fibbo_Sniper_v28.5_H2.mq5
//+------------------------------------------------------------------+


