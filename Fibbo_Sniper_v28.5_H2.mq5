//+------------------------------------------------------------------+
//|  Fibbo_Sniper_v28.5_PRO.mq5                                     |
//|  Estratégia: Falso Rompimento + Pullback Fibo + Rompimento Vol   |
//|  Modo: UNIFICADO — Conservador / Moderado / Agressivo            |
//|                                                                  |
//|  v28.5 PRO — MELHORIAS FLUXO/FR + MODO PROP FIRM:              |
//|  - [F1] GatilhoPrecoce: Fluxo entra no candle sem esperar fechar |
//|  - [F2] Canal de Qualidade: exclui todos os spikes > 1.8×ATR    |
//|  - [R1] FR Direct: filtro ATR mínimo adicionado                  |
//|  - [R2] Zona Magnética FR adaptativa à volatilidade relativa      |
//|  - [R3] Cooldown FR por tempo (minutos) em vez de barra           |
//|  - [PROP] Modo Prop Firm: risco, consistência, limite diário      |
//+------------------------------------------------------------------+
#property copyright "Orion Logic & Sniper Strategy (v28.5 PRO)"
#property version   "28.50"

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
extern bool g_ModoAnalise;

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
   double buf[1];
   
   // EMA 50 (Micro Tendencia)
   if(g_MG_hEMA50 != INVALID_HANDLE && CopyBuffer(g_MG_hEMA50, 0, 0, 1, buf) > 0) g_MG_EMA50 = buf[0];
   
   // EMA 200 (Macro Tendencia)
   if(g_MG_hEMA200 != INVALID_HANDLE && CopyBuffer(g_MG_hEMA200, 0, 0, 1, buf) > 0) g_MG_EMA200 = buf[0];
   
   // ATR (Volatilidade/Distancia de Alvos)
   if(g_MG_hATR != INVALID_HANDLE && CopyBuffer(g_MG_hATR, 0, 0, 1, buf) > 0) g_MG_ATR = buf[0];
   
   // CANAIS DE REGRESSAO (Tempo de inicio e fim)
   g_MG_TimeMacroEnd = iTime(_Symbol, g_MG_CurrentTF, 0);
   g_MG_TimeMacroStart = iTime(_Symbol, g_MG_CurrentTF, 150); // 150 velas para tras
   
   g_MG_TimeMicroEnd = iTime(_Symbol, g_MG_CurrentTF, 0);
   g_MG_TimeMicroStart = iTime(_Symbol, g_MG_CurrentTF, 45); // 45 velas para tras
   
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
void DesenharLinhasAnalise() {
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double atrVal = g_MG_ATR;
   
   // Apenas se o Modo Zen estiver desligado a legenda somerá. Em [ NENHUM ], as linhas do gráfico somem mas a Análise Gráfica continua ativa!
   if(!g_ViewZonas) {
      g_ModoAnalise = false;
      LimparTudoAnalise();
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
   
   // Atualiza permissoes globais de confluencia
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
}


enum ENUM_PERFIL_OPERACIONAL { PERFIL_CONSERVADOR, PERFIL_MODERADO, PERFIL_AGRESSIVO };
enum ENUM_FILTER_MODE { FILTER_ATUAL, FILTER_MEIO_TERMO, FILTER_MAXIMO };
enum ENUM_FR_MODE { FR_AGRESSIVO, FR_CONSERVADOR };

input group "=== PERFIL E RISCO AUTOMATIZADO ==="
input ENUM_PERFIL_OPERACIONAL InpPerfil = PERFIL_MODERADO; // [RECOMENDADO] Melhor equilíbrio lucro/segurança para 9 pares Forex
input bool InpAutoRegimeSwitch = true;
input double InpBaseRisk_L1 = 0.6;  // [SWEET SPOT] Risco base 0.6% por trade ($60 USD em 10k -> lote ~0.03)
input double InpMaxAutoRisk = 3.0;   // Teto máximo de risco automático (%)
input double InpVolPartialPct = 50.0;
input double InpTP_Parcial_Multi = 1.0;
input double InpTP_Final_Multi = 2.0;
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
input bool InpAutoTF = true;            // Seleção Automática de TF por Moeda
input ENUM_TIMEFRAMES InpTF = PERIOD_H2; // TF Manual (usado apenas se AutoTF=false)
input int InpCandlesToLook = 14;
input bool InpUseTrendFilter = true;
input int InpShortEMA_Period = 9;
input bool InpUseFluxo = false, InpFluxo_GatilhoPrecoce = false, InpFluxo_IgnoreWallStrong = true, InpUseVolumeFilter = true, InpFluxo_UseExhaustion = true; // [OTIMIZADO PROP] Fluxo=false elimina violinos em M15

input group "=== FALSO ROMPIMENTO ==="
input bool InpUseFR = true, InpFR_UseRSI = true;
input int InpFR_RSI_Period = 14;
input double InpFR_MagneticZoneATRPct = 15.0;
input bool InpFR_RequireWickRejection = true;
input double InpFR_WickBodyRatio = 0.5;
input double InpFR_WickRangeMinPct = 35.0;
input double InpFR_BodyRangeMinPct = 20.0;
input bool InpFR_AdaptiveRSI = true;
input double InpFR_RSI_LateralRelax = 8.0;
input bool InpFR_NeutralDirByRSI = true;
input double InpFR_NeutralRSI_Sell = 55.0;
input double InpFR_NeutralRSI_Buy = 45.0;
input bool InpFR_ProgressiveZone = true;
input bool InpFR_ZoneCooldown = true;
input int  InpFR_CooldownMinutes = 30; // [R3] Min. entre entradas FR no mesmo nível (0=sem cooldown)

input group "=== FR DIRETO (SMART TRAP NA LINHA) ==="
input bool InpFR_Direct_Entries = true;
input double InpFR_Direct_ZoneATRPct = 20.0;
input bool InpFR_Direct_IgnoreFiltros = true;

input group "=== PROTEÇÃO ==="
input bool InpUseBreakEven = true;
input double InpBE_Trigger_Normal = 0.50, InpBE_Trigger_Fibo = 0.50, InpBE_LockProfitPts = 0.0;
input bool InpUseTrailStop = true;
input double InpTrail_ATR_Multi = 1.0;

input group "=== FILTROS ADICIONAIS ==="
input bool InpUseADX = true;
input int InpADX_Period = 14; 
input bool InpUseFechamentoMoeda = true;
input double InpPerdaMaximaGlobalPct = 2.0, InpPerdaMaximaMoedaPct = 2.0, InpLucroAlvoMoedaPct = 1.5; // [SWEET SPOT] Meta 1.5%/dia (+$150 USD), Trava 2.0%/dia (-$200 USD em 10k)

input group "=== FIBONACCI ==="
input bool InpUseFiboPullback = true;
input double InpFibLevelSell = 61.8, InpFibLevelBuy = 18.0, InpFibMinRange_ATR_Multi = 2.0, InpFib_MagneticZoneATRPct = 20.0;
input bool   InpUseFiboH4_2   = true;  // Ativar segundo nível Fibo H4
input double InpFibLevel2Sell = 38.2;  // Nível 2 Venda H4 (% retração)
input double InpFibLevel2Buy  = 38.2;  // Nível 2 Compra H4 (% retração)

input group "=== HORÁRIOS (SMART SCHEDULE) ==="
input bool InpUseSessionFilter = true;
input int InpSessionStartHour = 10;
input int InpSessionEndHour = 22;
input bool InpSession_IgnoreOnSpike = true;
input bool InpCloseDaily = true;
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
input double InpPropMaxDailyLossPct   = 2.0;   // [SWEET SPOT] Perda Diária Máx. Prop 2.0% da conta (-$200 USD em 10k)
input double InpPropFirmDailyLimitPct = 4.0;   // Teto Limite Diário da Mesa (%) (ex: 4.0% Blue Guardian, 5.0% FTMO)
input double InpPropFirmMaxDDLimitPct = 10.0;  // Drawdown Máximo Total da Mesa (%) (10.0% Blue Guardian Trailing DD)
input double InpPropFase1TargetPct    = 10.0;  // Meta Fase 1 Prop Firm (%) (ex: 10.0% Blue Guardian / FTMO)
input double InpPropFase2TargetPct    = 4.0;   // Meta Fase 2 Prop Firm (%) (ex: 4.0% Blue Guardian, 5.0% FTMO)
input double InpPropMaxRiskPct        = 0.6;   // [SWEET SPOT] Risco Máx. por Trade 0.6% ($60 USD em 10k)
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
int g_ModoConfluencia = 3; // [MOD] Padrao H2 (Market Glance)
bool g_ReadyFluxo = false, g_ReadyFR = false, g_ReadyFibo = false, g_FluxoParedeAtiva = false;
int g_LinhasModo = 0; // [PADRÃO] Modo TODAS as linhas ativado por padrão
bool g_ColPosicao = true, g_ColTerminal = false, g_ShowDiag = false, g_ShowPropFirmHUD = false;
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
datetime f_h4_buy = 0, f_h4_sell = 0, f_h4_buy2 = 0, f_h4_sell2 = 0;

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
double g_CachedVolMed = 0;

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
   double mult = pts_to_target / sl_pts;
   return MathMax(tp_min, MathMin(tp_max, mult));
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
   if(g_CachedATR <= 0 || current_atr <= 0) return vol_min;
   
   // Proporção ATR atual vs ATR L1 determina o scaling de risco
   double ratio = current_atr / g_CachedATR;

   // [PROP] No Modo Prop Firm, substitui limites de risco pelos da mesa
   double base_risk = InpPropFirmMode ? MathMin(InpBaseRisk_L1, InpPropMaxRiskPct) : InpBaseRisk_L1;
   double max_risk  = InpPropFirmMode ? InpPropMaxRiskPct : InpMaxAutoRisk;
   double dynamic_risk = MathMin(max_risk, base_risk * ratio);
   
   double risk_money = AccountInfoDouble(ACCOUNT_BALANCE) * (dynamic_risk / 100.0);
   double tv = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double ts = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(current_sl_pts <= 0 || tv <= 0 || ts <= 0) return vol_min;
   
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
   for(int i = 0; i < ArraySize(handles); i++)
      if(handles[i] != INVALID_HANDLE) IndicatorRelease(handles[i]);
}

//===================================================================
// [AUTO-TF] DETECCAO AUTOMATICA DE TIMEFRAME POR SIMBOLO
//===================================================================
void AutoSelecionarTF() {
   if(!InpAutoTF) {
      g_TF_L1 = InpTF;
      TF_L2   = (g_TF_L1 <= PERIOD_H2) ? PERIOD_H4 : PERIOD_D1;
      Print("[AUTO-TF] Modo manual: L1=", EnumToString(g_TF_L1), " | L2=", EnumToString(TF_L2));
      return;
   }
   string sym = _Symbol;
   StringToUpper(sym);
   // Remove sufixos de broker (ex: EURUSD.a, XAUUSD_raw)
   StringReplace(sym, ".A",  ""); StringReplace(sym, "_RAW", "");
   StringReplace(sym, "_SB", ""); StringReplace(sym, ".",    "");

   // --- OURO / PRATA (verificado primeiro: XAU/XAG contem letras de moeda) ---
   bool isGold   = (StringFind(sym,"XAU")>=0 || StringFind(sym,"GOLD")>=0);
   bool isSilver = (StringFind(sym,"XAG")>=0 || StringFind(sym,"SILVER")>=0);

   // --- INDICES ---
   bool isIndex = (StringFind(sym,"US30")>=0 || StringFind(sym,"NAS")>=0  ||
                   StringFind(sym,"SPX")>=0  || StringFind(sym,"SP500")>=0 ||
                   StringFind(sym,"DAX")>=0  || StringFind(sym,"FTSE")>=0  ||
                   StringFind(sym,"CAC")>=0  || StringFind(sym,"IBOV")>=0  ||
                   StringFind(sym,"WIN")>=0  || StringFind(sym,"DJI")>=0   ||
                   StringFind(sym,"DJ30")>=0);

   // --- PETROLEO / COMMODITIES ---
   bool isOil  = (StringFind(sym,"OIL")>=0   || StringFind(sym,"BRENT")>=0 ||
                  StringFind(sym,"WTI")>=0    || StringFind(sym,"USOIL")>=0 ||
                  StringFind(sym,"UKOIL")>=0);

   // --- CRIPTO ---
   bool isCrypto = (StringFind(sym,"BTC")>=0 || StringFind(sym,"ETH")>=0 ||
                    StringFind(sym,"LTC")>=0  || StringFind(sym,"XRP")>=0);

   // --- FOREX: pares do usuario + lista generica de 6 letras ---
   // Pares confirmados pelo usuario:
   // EURUSD | GBPUSD | AUDUSD | NZDUSD | USDCAD | USDJPY | USDCHF | EURJPY | EURGBP
   bool isForexExplicito = (sym=="EURUSD" || sym=="GBPUSD" || sym=="AUDUSD" ||
                             sym=="NZDUSD" || sym=="USDCAD" || sym=="USDJPY" ||
                             sym=="USDCHF" || sym=="EURJPY" || sym=="EURGBP" ||
                             sym=="EURCHF" || sym=="GBPJPY" || sym=="GBPAUD" ||
                             sym=="AUDNZD" || sym=="AUDCAD" || sym=="CADCHF" ||
                             sym=="AUDCHF" || sym=="NZDCHF" || sym=="NZDCAD");
   bool isForexGenerico  = (StringLen(sym)==6 &&
                             (StringFind(sym,"USD")>=0 || StringFind(sym,"EUR")>=0 ||
                              StringFind(sym,"GBP")>=0 || StringFind(sym,"JPY")>=0 ||
                              StringFind(sym,"AUD")>=0 || StringFind(sym,"NZD")>=0 ||
                              StringFind(sym,"CAD")>=0 || StringFind(sym,"CHF")>=0));

   if(isGold || isSilver) {
      g_TF_L1 = PERIOD_M30;  // Ouro/Prata: execucao M30
      TF_L2   = PERIOD_H4;   // Confluencia H4
   } else if(isIndex) {
      g_TF_L1 = PERIOD_M15;  // Indices: execucao M15
      TF_L2   = PERIOD_H1;   // Confluencia H1
   } else if(isOil) {
      g_TF_L1 = PERIOD_M30;  // Petroleo: execucao M30
      TF_L2   = PERIOD_H4;   // Confluencia H4
   } else if(isCrypto) {
      g_TF_L1 = PERIOD_H1;   // Cripto: execucao H1
      TF_L2   = PERIOD_H4;   // Confluencia H4
   } else if(isForexExplicito || isForexGenerico) {
      g_TF_L1 = PERIOD_H2;   // Forex: execucao H2
      TF_L2   = PERIOD_H4;   // Confluencia H4 (macro direcional)
   } else {                   // Fallback: simbolo nao reconhecido
      g_TF_L1 = InpTF;
      TF_L2   = PERIOD_H4;
      Print("[AUTO-TF] AVISO: Simbolo nao reconhecido, usando InpTF=", EnumToString(g_TF_L1));
   }
   Print("[AUTO-TF] Simbolo=", _Symbol, " | L1=", EnumToString(g_TF_L1), " | L2=", EnumToString(TF_L2));
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
   g_ActiveFilterMode = mode;
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
   if(hRSI_L1 != INVALID_HANDLE) { IndicatorRelease(hRSI_L1); hRSI_L1 = INVALID_HANDLE; }
   if(hRSI_L2 != INVALID_HANDLE) { IndicatorRelease(hRSI_L2); hRSI_L2 = INVALID_HANDLE; }
   hRSI_L1 = iRSI(_Symbol, g_TF_L1, cfg_RSI_Period, PRICE_CLOSE);
   hRSI_L2 = iRSI(_Symbol, TF_L2,   cfg_RSI_Period, PRICE_CLOSE);
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
   if(IsMercadoLateral()) {
      if(g_ActiveFilterMode != FILTER_MAXIMO) {
         g_ActiveFRMode = FR_CONSERVADOR; AplicarModoFiltro(FILTER_MAXIMO); AddLog(g_LocalConsolidation ? "Regime CAIXOTE ativado." : "Regime LATERAL ativado.");
      }
   } else {
      ENUM_FILTER_MODE pf = (g_CurrentPerfil == PERFIL_CONSERVADOR) ? FILTER_MAXIMO : (g_CurrentPerfil == PERFIL_MODERADO)    ? FILTER_MEIO_TERMO : FILTER_ATUAL;
      if(g_ActiveFilterMode != pf) {
         g_ActiveFRMode = p_ProfileFRMode; AplicarModoFiltro(pf); AddLog("Regime DIRECIONAL retomado.");
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
   for(int _i = PositionsTotal()-1; _i >= 0; _i--) {
      ulong _tk = PositionGetTicket(_i);
      if(!PositionSelectByTicket(_tk)
         || PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      g_FastNPos++;
      double _pl = PositionGetDouble(POSITION_PROFIT)
                 + PositionGetDouble(POSITION_SWAP);
      g_FloatingPlTot += _pl;
      if(PositionGetString(POSITION_SYMBOL) == _Symbol) {
         g_FastNPosSymbol++;
         g_FastPlFloat  += _pl;
         g_FloatingPlSym += _pl;
         string _comm_tmp = PositionGetString(POSITION_COMMENT);
         if(StringFind(_comm_tmp, "_L1") >= 0) {
            g_NPosDay++;
         } else {
            g_NPosSwing++;
            if(StringFind(_comm_tmp, "FR") >= 0)   g_NPosSwingFR++;
            else if(StringFind(_comm_tmp, "Fibo") >= 0) g_NPosSwingFibo++;
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
   for(int i = HistoryDealsTotal()-1; i >= 0; i--) {
      ulong tk = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(tk,DEAL_ENTRY) != DEAL_ENTRY_OUT || HistoryDealGetInteger(tk,DEAL_MAGIC) != InpMagic || HistoryDealGetString(tk,DEAL_SYMBOL) != _Symbol) continue;
      string comm = HistoryDealGetString(tk, DEAL_COMMENT);
      if(StringFind(comm, filter1) < 0) continue;
      if(filter2 != "" && StringFind(comm, filter2) < 0) continue;
      if(excludeFilter != "" && StringFind(comm, excludeFilter) >= 0) continue;
      double p = HistoryDealGetDouble(tk, DEAL_PROFIT) + HistoryDealGetDouble(tk, DEAL_SWAP) + HistoryDealGetDouble(tk, DEAL_COMMISSION);
      if(p < -0.01) losses++; else if(p >= -0.01) break;
   }
   return losses;
}

int ComputeTrendDir(int hShort, int hLong) {
   if(!InpUseTrendFilter) return 0;
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
   if(CopyBuffer(hATR_L1, 0, 1, 1, b_atr) > 0) g_CachedATR = b_atr[0]; else all_copied = false;

   g_CachedTrendDir = ComputeTrendDir(hShortEMA_L1, hEMA_L1);
   g_CachedMedDir   = ComputeTrendDir(hShortEMA_L1, hMedEMA_L1);

   if(g_CachedATR > 0) {
      g_CachedSlPts   = (g_CachedATR / _Point) * 1.5;
      g_CachedGatPts  = g_CachedSlPts * 0.25;
      g_CachedBePts   = g_CachedSlPts * InpBE_Trigger_Normal;
      g_CachedMaxSpread = (int)MathCeil((g_CachedATR / _Point) * cfg_SpreadFactor);
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
   if(CopyBuffer(hATR_H4, 0, 1, 1, atr_f) > 0) g_CachedFiboATR = atr_f[0]; else all_copied = false;

   double adx_h4[]; ArraySetAsSeries(adx_h4, true);
   if(CopyBuffer(hADX_H4, 0, 1, 1, adx_h4) > 0) g_H4_ADX = adx_h4[0];

   if(InpUseVolumeFilter || InpUseDynamicLiquidity) {
      long vol_b[]; ArraySetAsSeries(vol_b, true);
      if(CopyTickVolume(_Symbol, g_TF_L1, 1, 5, vol_b) >= 5) {
         double mv = 0; for(int i = 0; i < 5; i++) mv += (double)vol_b[i]; g_CachedVolMed = mv / 5.0;
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
   string filename = "FibboSniper_Trades_" + _Symbol + "_" + TimeToString(TimeCurrent(), TIME_DATE) + ".csv"; StringReplace(filename, ".", "");
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

double GetFR_MagTol(double atr_val, double adx_val) {
   // [B10 FIX] fallback mínimo sensato se ATR for 0 (evita zona de largura 0)
   if(atr_val <= 0) return SymbolInfoDouble(_Symbol, SYMBOL_POINT) * 50;

   // [R2] Zona magnética adaptativa: ajusta % com base na volatilidade relativa da última vela
   // Se a vela recente foi grande (vol alta), abre a zona; se foi pequena, aperta
   double pct = InpFR_MagneticZoneATRPct;
   double curr_range = iHigh(_Symbol, g_TF_L1, 1) - iLow(_Symbol, g_TF_L1, 1);
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
   return ((wick_top/range*100.0) >= InpFR_WickRangeMinPct && (corpo/range*100.0) >= InpFR_BodyRangeMinPct && (corpo > 0 ? wick_top >= corpo * InpFR_WickBodyRatio : false));
}

bool IsVelaReversaoCompra(int shift, ENUM_TIMEFRAMES tf) {
   double o=iOpen(_Symbol,tf,shift), c=iClose(_Symbol,tf,shift); double h=iHigh(_Symbol,tf,shift), l=iLow(_Symbol,tf,shift);
   double range = h - l; if(range <= 0 || c <= o) return false;
   double corpo = MathAbs(c-o), wick_bot = MathMin(c,o) - l;
   return ((wick_bot/range*100.0) >= InpFR_WickRangeMinPct && (corpo/range*100.0) >= InpFR_BodyRangeMinPct && (corpo > 0 ? wick_bot >= corpo * InpFR_WickBodyRatio : false));
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
      if(name == "FR_TxtT") s_LabelCount = 0;
      
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

void DrawVisualLine(string name, double price, color clr, string sym, string tip, int style=STYLE_DASH, int width=1, bool show=true, bool highlight=false) {
   string oh = "SniperLine_"+name, ot = "SniperText_"+name;
   if(price <= 0 || !show || g_LinhasModo == 2) { ObjectDelete(0,oh); ObjectDelete(0,ot); return; }
   datetime ta = iTime(_Symbol,g_TF_L1,0) + (datetime)(PeriodSeconds(g_TF_L1)*5);
   
   // Tonalidades suavizadas e elegantes para manter o gráfico discreto e sem ofuscar a visão
   color line_clr = clr;
   color txt_clr  = clr;
   if(highlight) {
      if(name == "FR_Topo" || name == "FR_Fundo") {
         line_clr = C'210,65,65';   // Vermelho Suave Elegante
         txt_clr  = C'210,65,65';   
      } else if(name == "Fibo_Venda" || name == "Fibo_Compra") {
         line_clr = C'210,165,30';  // Dourado Suave Elegante
         txt_clr  = C'210,165,30';  
      } else if(StringFind(name, "Canal") >= 0) {
         line_clr = C'40,180,110';   // Verde Suave Elegante
         txt_clr  = C'40,180,110';   
      } else {
         line_clr = C'220,220,220';
         txt_clr  = C'220,220,220';
      }
   }
   int font_sz = 12; // Fonte 12pt discreta e fina

   if(ObjectFind(0,oh) < 0) { ObjectCreate(0,oh,OBJ_HLINE,0,0,price); ObjectSetInteger(0,oh,OBJPROP_BACK,true); ObjectSetInteger(0,oh,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,oh,OBJPROP_HIDDEN,true); }
   ObjectSetDouble(0,oh,OBJPROP_PRICE,price); ObjectSetInteger(0,oh,OBJPROP_COLOR,line_clr); ObjectSetInteger(0,oh,OBJPROP_STYLE,style); ObjectSetInteger(0,oh,OBJPROP_WIDTH,width); ObjectSetString(0,oh,OBJPROP_TOOLTIP,tip);
   
   if(ObjectFind(0,ot) < 0) { ObjectCreate(0,ot,OBJ_TEXT,0,ta,price); ObjectSetString(0,ot,OBJPROP_FONT,"Arial"); ObjectSetInteger(0,ot,OBJPROP_BACK,false); ObjectSetInteger(0,ot,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,ot,OBJPROP_HIDDEN,true); }
   ObjectSetInteger(0,ot,OBJPROP_FONTSIZE,font_sz);
   ObjectSetString(0,ot,OBJPROP_FONT,"Arial");
   ObjectSetDouble(0,ot,OBJPROP_PRICE,price); ObjectSetInteger(0,ot,OBJPROP_TIME,ta); ObjectSetInteger(0,ot,OBJPROP_COLOR,txt_clr); ObjectSetString(0,ot,OBJPROP_TEXT,sym);
}

void DesenharLinhasChart() {
   if(g_LocalGlobalBlock || g_LocalBlocked || g_BotPaused) return;
   bool is_lateral = IsMercadoLateral(); int t_dir = g_CachedTrendDir;
   color cor_h = C'28,85,58', cor_l = C'28,85,58'; string sym_h = is_lateral ? "▼" : "▲", sym_l = is_lateral ? "▲" : "▼";
   double ask = SymbolInfoDouble(_Symbol,SYMBOL_ASK), bid = SymbolInfoDouble(_Symbol,SYMBOL_BID); double zone_pts = (g_CachedATR > 0) ? (g_CachedATR / _Point) * 2.0 : 0;
   
   // Quando o modo ZEN estiver ativado (g_ViewZonas == true), as linhas normais somem para dar lugar exclusivo à análise ZEN (evita poluição e sobreposição)
   bool draw_lines = (!g_ViewZonas && g_LinhasModo != 2);
   
   bool fr_show_top=false, fr_show_bot=false;
   if(draw_lines) {
      if(g_LinhasModo==0 && g_ViewFR) { fr_show_top=true; fr_show_bot=true; } else if(g_LinhasModo==1 && g_ViewFR) { double dist_top=MathAbs(g_CachedFRTop-ask)/_Point, dist_bot=MathAbs(bid-g_CachedFRFundo)/_Point; if(g_ReadyFR||dist_top<=zone_pts) fr_show_top=true; if(g_ReadyFR||dist_bot<=zone_pts) fr_show_bot=true; }
   }
   bool fr_top_hl = (g_ReadyFR || (MathAbs(g_CachedFRTop-ask)/_Point <= zone_pts));
   bool fr_bot_hl = (g_ReadyFR || (MathAbs(bid-g_CachedFRFundo)/_Point <= zone_pts));
   if(InpUseFR && g_CachedFRTop > 0) { DrawVisualLine("FR_Topo",  g_CachedFRTop,   C'100,35,35', "▼", "[FR] Topo",  STYLE_SOLID, 1, fr_show_top, fr_top_hl); DrawVisualLine("FR_Fundo", g_CachedFRFundo, C'100,35,35', "▲", "[FR] Fundo", STYLE_SOLID, 1, fr_show_bot, fr_bot_hl); } else { DrawVisualLine("FR_Topo",  0, clrNONE, "", ""); DrawVisualLine("FR_Fundo", 0, clrNONE, "", ""); }

   bool fb_show_sell=false, fb_show_buy=false; double nSell=0, nBuy=0, nSell2=0, nBuy2=0;
   if(InpUseFiboPullback && g_CachedFiboH > 0) {
      double range = g_CachedFiboH - g_CachedFiboLow; if(range >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) { nSell = g_CachedFiboH - range * (InpFibLevelSell / 100.0); nBuy = g_CachedFiboLow + range * (InpFibLevelBuy / 100.0); nSell2 = g_CachedFiboH - range * (InpFibLevel2Sell / 100.0); nBuy2 = g_CachedFiboLow + range * (InpFibLevel2Buy / 100.0); }
      if(draw_lines) {
         if(g_LinhasModo==0 && g_ViewFibo) { fb_show_sell=true; fb_show_buy=true; } else if(g_LinhasModo==1 && g_ViewFibo) { bool dir_sell=(is_lateral||t_dir==-1), dir_buy=(is_lateral||t_dir==1); double dist_sell=MathAbs(nSell-ask)/_Point, dist_buy=MathAbs(bid-nBuy)/_Point; if(dir_sell&&(g_ReadyFibo||dist_sell<=zone_pts)) fb_show_sell=true; if(dir_buy &&(g_ReadyFibo||dist_buy <=zone_pts)) fb_show_buy=true; }
      }
      bool fb_sell_hl = (g_ReadyFibo || (MathAbs(nSell-ask)/_Point <= zone_pts));
      bool fb_buy_hl  = (g_ReadyFibo || (MathAbs(bid-nBuy)/_Point <= zone_pts));
      DrawVisualLine("Fibo_Venda",  nSell, C'130,95,30', "▼", "[FIBO] Venda",  STYLE_SOLID, 1, fb_show_sell, fb_sell_hl); DrawVisualLine("Fibo_Compra", nBuy,  C'130,95,30', "▲", "[FIBO] Compra", STYLE_SOLID, 1, fb_show_buy, fb_buy_hl);
   } else { DrawVisualLine("Fibo_Venda",  0, clrNONE, "", ""); DrawVisualLine("Fibo_Compra", 0, clrNONE, "", ""); }
   
   // ZONAS VISUAIS (MODO ZEN SINCRO INTELIGENTE)
   if(g_ViewZonas && g_LinhasModo != 2) {
      datetime t1_base = iTime(_Symbol, g_TF_L1, InpCandlesToLook);
      int ps = PeriodSeconds(g_TF_L1);
      datetime t_col_fr  = t1_base;
      datetime t_col_fb1 = t1_base + (datetime)(ps * 10);
      datetime t_col_fb2 = t1_base + (datetime)(ps * 15);
      
      double mag_tol = GetFR_MagTol(g_CachedATR, g_CachedADX);
      
      bool in_rd_fr=(g_CachedFRTop>0&&MathAbs(g_CachedFRTop-ask)/_Point<=zone_pts)||(g_CachedFRFundo>0&&MathAbs(bid-g_CachedFRFundo)/_Point<=zone_pts);
      bool in_rd_fb=false;
      if(InpUseFiboPullback&&g_CachedFiboH>0){
         double r_f=g_CachedFiboH-g_CachedFiboLow;
         if(r_f>=(g_CachedFiboATR*InpFibMinRange_ATR_Multi)){
            double nS=g_CachedFiboH-r_f*(InpFibLevelSell/100.0),nB=g_CachedFiboLow+r_f*(InpFibLevelBuy/100.0);
            if(MathAbs(nS-ask)/_Point<=zone_pts||MathAbs(bid-nB)/_Point<=zone_pts) in_rd_fb=true;
         }
      }
      
      bool fr_zen_show = false;
      if(InpUseFR && g_CachedFRTop > 0 && g_ViewFR) {
         if(g_LinhasModo == 0) fr_zen_show = true;
         else if(g_LinhasModo == 1) fr_zen_show = (g_ReadyFR || in_rd_fr);
      }
      
      if(fr_zen_show) {
         DrawVisualZoneRect("FR_Top", 0, 0, clrNONE, false);
         DrawVisualZoneRect("FR_Bot", 0, 0, clrNONE, false);
         DrawVisualSegment("FR_TxtT", t_col_fr, t_col_fr, g_CachedFRTop - mag_tol, C'190,80,80', "▼ V FR", true, t_col_fr, g_ReadyFR ? C'80,185,120' : C'190,80,80');
         DrawVisualSegment("FR_TxtB", t_col_fr, t_col_fr, g_CachedFRFundo + mag_tol, C'190,80,80', "▲ C FR", true, t_col_fr, g_ReadyFR ? C'80,185,120' : C'190,80,80');
      } else { 
         DrawVisualZoneRect("FR_Top", 0, 0, clrNONE, false); DrawVisualZoneRect("FR_Bot", 0, 0, clrNONE, false); 
         DrawVisualSegment("FR_TxtT",0,0,0,clrNONE,"",false); DrawVisualSegment("FR_TxtB",0,0,0,clrNONE,"",false); 
      }
      
      bool fb_zen_show = false;
      if(InpUseFiboPullback && g_CachedFiboH > 0 && g_ViewFibo) {
         if(g_LinhasModo == 0) fb_zen_show = true;
         else if(g_LinhasModo == 1) fb_zen_show = (g_ReadyFibo || in_rd_fb);
      }
      
      if(fb_zen_show) {
         DrawVisualRegressionChannel("Fibo_Ch", 0, 0, clrNONE, false);
         
         bool _is_lateral = (g_CachedADX < p_ADX_ConsolidationLevel);
         bool fb_v_ok = (_is_lateral || g_CachedTrendDir == -1);
         bool fb_c_ok = (_is_lateral || g_CachedTrendDir == 1);
         
         DrawVisualSegment("Fibo_V1", t_col_fb1, t_col_fb1, nSell, C'55,95,145', "▼ V FB1", fb_v_ok, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'55,95,145');
         DrawVisualSegment("Fibo_C1", t_col_fb1, t_col_fb1, nBuy, C'55,95,145', "▲ C FB1", fb_c_ok, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'55,95,145');
         
         if(InpUseFiboH4_2) {
            DrawVisualSegment("Fibo_V2", t_col_fb2, t_col_fb2, nSell2, C'130,95,30', "▼ V FB2", fb_v_ok, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'130,95,30');
            DrawVisualSegment("Fibo_C2", t_col_fb2, t_col_fb2, nBuy2, C'130,95,30', "▲ C FB2", fb_c_ok, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'130,95,30');
         } else {
            DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
         }
      } else {
         DrawVisualRegressionChannel("Fibo_Ch", 0, 0, clrNONE, false);
         DrawVisualSegment("Fibo_V1", 0, 0, 0, clrNONE, "", false);
         DrawVisualSegment("Fibo_C1", 0, 0, 0, clrNONE, "", false);
         DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
         DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
      }
   } else {
      DrawVisualZoneRect("Fluxo", 0, 0, clrNONE, false);
      DrawVisualZoneRect("FR_Top", 0, 0, clrNONE, false); DrawVisualZoneRect("FR_Bot", 0, 0, clrNONE, false);
      DrawVisualRegressionChannel("Fibo_Ch", 0, 0, clrNONE, false);
      DrawVisualSegment("FR_TxtT", 0, 0, 0, clrNONE, "", false);
      DrawVisualSegment("FR_TxtB", 0, 0, 0, clrNONE, "", false);
      DrawVisualSegment("Fibo_V1", 0, 0, 0, clrNONE, "", false);
      DrawVisualSegment("Fibo_C1", 0, 0, 0, clrNONE, "", false);
      DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
      DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
      DrawVisualSegment("Fluxo_TH",0,0,0,clrNONE,"",false); DrawVisualSegment("Fluxo_TL",0,0,0,clrNONE,"",false);
   }
}

void PRect(string nm, int x, int y, int w, int h, color bg, long border=-1, int zorder=200) { string n=PANEL_PREFIX+nm; if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_RECTANGLE_LABEL,0,0,0); ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x); ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y); ObjectSetInteger(0,n,OBJPROP_XSIZE,w);      ObjectSetInteger(0,n,OBJPROP_YSIZE,h); ObjectSetInteger(0,n,OBJPROP_BGCOLOR,bg);  ObjectSetInteger(0,n,OBJPROP_BORDER_TYPE,BORDER_FLAT); ObjectSetInteger(0,n,OBJPROP_COLOR,border>=0?(color)border:bg); ObjectSetInteger(0,n,OBJPROP_WIDTH,border>=0?1:0); ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER); ObjectSetInteger(0,n,OBJPROP_BACK,false); ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,n,OBJPROP_HIDDEN,true); ObjectSetInteger(0,n,OBJPROP_ZORDER,zorder); ObjectSetString(0,n,OBJPROP_TOOLTIP,"\n"); }
void PLabel(string nm, int x, int y, string txt, color clr, int sz=0, bool bold=false, string tip="") { string n=PANEL_PREFIX+nm; if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_LABEL,0,0,0); ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x); ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y); ObjectSetString(0,n,OBJPROP_TEXT,txt); ObjectSetInteger(0,n,OBJPROP_COLOR,clr); ObjectSetString(0,n,OBJPROP_FONT,bold?"Arial Bold":"Arial"); ObjectSetInteger(0,n,OBJPROP_FONTSIZE,sz>0?sz:InpPanelFontSize); ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER); ObjectSetInteger(0,n,OBJPROP_ANCHOR,ANCHOR_LEFT_UPPER); ObjectSetInteger(0,n,OBJPROP_BACK,false); ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,n,OBJPROP_HIDDEN,true); ObjectSetInteger(0,n,OBJPROP_ZORDER,250); ObjectSetString(0,n,OBJPROP_TOOLTIP,tip!=""?tip:"\n"); }
void PLabelR(string nm, int x, int y, string txt, color clr, int sz=0, bool bold=false, string tip="") { string n=PANEL_PREFIX+"R_"+nm; if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_LABEL,0,0,0); ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x); ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y); ObjectSetString(0,n,OBJPROP_TEXT,txt); ObjectSetInteger(0,n,OBJPROP_COLOR,clr); ObjectSetString(0,n,OBJPROP_FONT,bold?"Arial Bold":"Arial"); ObjectSetInteger(0,n,OBJPROP_FONTSIZE,sz>0?sz:InpPanelFontSize); ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER); ObjectSetInteger(0,n,OBJPROP_ANCHOR,ANCHOR_RIGHT_UPPER); ObjectSetInteger(0,n,OBJPROP_BACK,false); ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,n,OBJPROP_HIDDEN,true); ObjectSetInteger(0,n,OBJPROP_ZORDER,250); ObjectSetString(0,n,OBJPROP_TOOLTIP,tip!=""?tip:"\n"); }
void PButton(string nm, int x, int y, int w, int h, string txt, color bg, color clr, string tip="") { string n=PANEL_PREFIX+nm; if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_BUTTON,0,0,0); ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x); ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y); ObjectSetInteger(0,n,OBJPROP_XSIZE,w); ObjectSetInteger(0,n,OBJPROP_YSIZE,h); ObjectSetString(0,n,OBJPROP_TEXT,txt); ObjectSetInteger(0,n,OBJPROP_BGCOLOR,bg); ObjectSetInteger(0,n,OBJPROP_COLOR,clr); ObjectSetInteger(0,n,OBJPROP_BORDER_COLOR,CLR_LINE_HARD); ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER); ObjectSetString(0,n,OBJPROP_FONT,"Arial Bold"); ObjectSetInteger(0,n,OBJPROP_FONTSIZE,8); ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,n,OBJPROP_HIDDEN,true); ObjectSetInteger(0,n,OBJPROP_STATE,false); ObjectSetInteger(0,n,OBJPROP_ZORDER,300); ObjectSetString(0,n,OBJPROP_TOOLTIP,tip!=""?tip:"\n"); }
void PSectionBadge(string id, int px, int y, int pw, string label, color accent) { int pad=10, lw=(int)StringLen(label)*6+12; PRect(id+"_la",px+pad,y+5,3,1,accent,-1,212); PRect(id+"_bg",px+pad+6,y+1,lw,12,accent,-1,212); PLabel(id+"_tx",px+pad+10,y+2,label,CLR_BG_BASE,InpPanelFontSize-2,true); PRect(id+"_lb",px+pad+6+lw+3,y+5,pw-(pad*2)-lw-20,1,CLR_LINE_SOFT,-1,212); }
void PModuleCardH(string id, int x, int y, int w, int h, color accent, color bg_clr=CLR_BG_CARD) { PRect(id+"_bg",x,y,w,h,bg_clr,CLR_LINE_SOFT,205); PRect(id+"_acc",x,y,2,h,accent,-1,206); }
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
   return StringFormat("%d|%d|%d|%d|%s|%s|%d|%d|%d|%d|%s|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d",
      (int)g_ColPosicao,(int)g_ColTerminal,(int)g_ShowDiag,g_DiagTab,
      g_ProximaNoticiaName,g_Log[0],
      g_NPosDay,g_NPosSwing,g_FastNPosSymbol,
      (int)g_ViewZonas,mg_state,
      (int)g_LocalGlobalBlock,(int)g_LocalBlocked,(int)g_BotPaused,
      (int)g_ViewFluxo,(int)g_ViewFR,(int)g_ViewFibo,
      g_LinhasModo,g_ModoConfluencia,
      pl_sym_dec, pl_tot_dec);
}

void DesenharPainel() {
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
   color c_pill=blocked?CLR_RED_DIM:(g_BotPaused?CLR_AMBER_DIM:CLR_TEAL_DIM); int pill_x=rx-92, pill_w=88, pill_cx=pill_x+pill_w/2; PRect("hdr_pill",pill_x,cur+5,pill_w,17,c_pill,c_status,202);
   {string n=PANEL_PREFIX+"hdr_stat"; if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_LABEL,0,0,0); ObjectSetInteger(0,n,OBJPROP_XDISTANCE,pill_cx); ObjectSetInteger(0,n,OBJPROP_YDISTANCE,cur+8); ObjectSetString(0,n,OBJPROP_TEXT,"* "+s_status); ObjectSetInteger(0,n,OBJPROP_COLOR,c_status); ObjectSetString(0,n,OBJPROP_FONT,"Arial Bold"); ObjectSetInteger(0,n,OBJPROP_FONTSIZE,InpPanelFontSize-2); ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER); ObjectSetInteger(0,n,OBJPROP_ANCHOR,ANCHOR_UPPER); ObjectSetInteger(0,n,OBJPROP_BACK,false); ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,n,OBJPROP_HIDDEN,true); ObjectSetInteger(0,n,OBJPROP_ZORDER,252); ObjectSetString(0,n,OBJPROP_TOOLTIP,"\n");}
   PButton("btn_diag",rx-136,cur+5,24,17,g_ShowDiag?"X":"[?]",g_ShowDiag?CLR_PURPLE:CLR_PURPLE_DIM,CLR_TXT_WHITE,"DIAGNOSTICO"); PButton("btn_min",rx-110,cur+5,18,17,g_Minimized?"v":"^",CLR_BG_CARD,CLR_TXT_LABEL,"Min/Max"); cur+=50;

   // [H4 FIX] Garantir subjanela 0 explícita para deleção de objetos em modo minimizado
   if(g_Minimized) { for(int i=ObjectsTotal(0,0,0)-1;i>=0;i--) { string nm=ObjectName(0,i,0,0); if(StringFind(nm,PANEL_PREFIX)==0&&nm!=PANEL_PREFIX+"border"&&nm!=PANEL_PREFIX+"bg_main"&&nm!=PANEL_PREFIX+"hdr_bg"&&nm!=PANEL_PREFIX+"hdr_top"&&StringFind(nm,PANEL_PREFIX+"hdr_")<0&&nm!=PANEL_PREFIX+"btn_min") ObjectDelete(0,nm); } g_PanelHeight=cur-py; ObjectSetInteger(0,PANEL_PREFIX+"border",OBJPROP_YSIZE,g_PanelHeight+2); ObjectSetInteger(0,PANEL_PREFIX+"bg_main",OBJPROP_YSIZE,g_PanelHeight); return; }

   PRect("prof_bg",px+pad-2,cur,pw-(pad*2)+4,38,c_pb,c_perfil,201); PRect("prof_acc",px+pad-2,cur,3,38,c_perfil,-1,202);
   PLabel("prof_val",px+pad+6,cur+4,s_perfil,c_perfil,11,true); PLabel("prof_sub",px+pad+6,cur+20,"Filtro:"+s_filter+"  FR:"+s_fr_mode+"  PA:"+(string)p_PA_Criterios,CLR_TXT_LABEL,InpPanelFontSize-2); cur+=44;

   PSectionBadge("s_mkt",px,cur,pw,"MERCADO",c_regime); cur+=16;
   // Regime + ADX fundidos: label esq. com status ADX, valor dir. com Regime
   PRow("reg",lx,rx,cur,"Regime  |  ADX "+DoubleToString(adx_val,1)+" (>="+StringFormat("%.0f",p_ADX_ConsolidationLevel)+")",s_regime,c_regime,"",c_adx,c_adx!=CLR_AMBER); cur+=14;
   ObjectDelete(0,PANEL_PREFIX+"adx_r_l"); ObjectDelete(0,PANEL_PREFIX+"R_adx_r_v"); // remove row antiga
   PRow("rsi_r",lx,rx,cur,"RSI L1  "+DoubleToString(rsi_v,1),StringFormat("(%.0f/%.0f)",cfg_RSI_Oversold,cfg_RSI_Overbought),CLR_MUTED,"",c_rsi,c_rsi!=CLR_TXT_PRIMARY); cur+=14;
   PRow("tma",lx,rx,cur,"Macro L1",s_tdir,c_tdir,"",c_tdir!=CLR_TXT_LABEL?c_tdir:CLR_TXT_LABEL); cur+=14; PRow("tme",lx,rx,cur,"Média L1",s_mdir,c_mdir,"",c_mdir!=CLR_TXT_LABEL?c_mdir:CLR_TXT_LABEL); cur+=14;

   string s_l2_tdir=(g_L2_TrendDir==1)?"^ ALTA":(g_L2_TrendDir==-1)?"v BAIXA":"- NEUTRO"; color c_l2_tdir=(g_L2_TrendDir==1)?CLR_TEAL:(g_L2_TrendDir==-1)?CLR_RED:CLR_TXT_LABEL; color c_l2_adx=(g_L2_ADX>=p_ADX_ConsolidationLevel)?CLR_TEAL:CLR_AMBER;
   PRow("adx_l2",lx,rx,cur,"ADX "+EnumToString(TF_L2)+"  "+DoubleToString(g_L2_ADX,1)," ",c_l2_adx); cur+=14; PRow("tma_l2",lx,rx,cur,"Macro "+EnumToString(TF_L2),s_l2_tdir,c_l2_tdir); cur+=14;

   PRow("osc",lx,rx,cur,"Oscilação",DoubleToString(atr_val/_Point,0)+" pts", (!InpUseOscillationFilter||atr_val==0)?CLR_TXT_LABEL:(f_osc?CLR_RED:CLR_TEAL)); cur+=14;
   PRow("mkt_spr",lx,rx,cur,"Spread",(string)cur_spread+"/"+(string)max_spread+" pts",f_spr?CLR_RED:CLR_TEAL); cur+=14;
   if(InpBlockLowLiquidity){string s_vol=(g_CachedVolMed>0)?(DoubleToString(g_CachedVolMed,0)+" tk"):"—";PRow("vol_tk",lx,rx,cur,"Vol. Tick",s_vol,f_liq?CLR_RED:CLR_TEAL);cur+=14;}else{ObjectDelete(0,PANEL_PREFIX+"vol_tk_l");ObjectDelete(0,PANEL_PREFIX+"R_vol_tk_v");}
   if(InpUseCaixoteFilter){PRow("caixote",lx,rx,cur,"Caixote",f_cax?"ATIVO":"OK",f_cax?CLR_RED:CLR_TEAL);cur+=14;}else{ObjectDelete(0,PANEL_PREFIX+"caixote_l");ObjectDelete(0,PANEL_PREFIX+"R_caixote_v");}
   if(InpUseNewsFilter){string s_not=f_not?"BLOQUEADO":"Livre";PRow("noticia",lx,rx,cur,"Noticia",s_not,f_not?CLR_RED:CLR_TEAL,g_TooltipNoticias);cur+=14;if(g_ProximaNoticiaName!=""&&g_ProximaNoticiaTime>TimeCurrent()){int mins_left=(int)((g_ProximaNoticiaTime-TimeCurrent())/60);string s_ni="  -> "+g_ProximaNoticiaName+" ("+IntegerToString(mins_left)+"m)";PLabel("noticia_sub",lx,cur,s_ni,(mins_left<=InpNewsMinutesBefore)?CLR_RED:CLR_TXT_DIM,InpPanelFontSize-2,false,g_TooltipNoticias);cur+=11;}else ObjectDelete(0,PANEL_PREFIX+"noticia_sub");}else{ObjectDelete(0,PANEL_PREFIX+"noticia_l");ObjectDelete(0,PANEL_PREFIX+"R_noticia_v");ObjectDelete(0,PANEL_PREFIX+"noticia_sub");}

   {string s_cdl="FR:"+IntegerToString(g_CachedFrL)+" FB:"+IntegerToString(g_CachedFiboL);PRow("consec",lx,rx,cur,"Consec.",s_cdl,f_cd?CLR_RED:CLR_TEAL);cur+=14;}

   // Linha MarketGlance — exibida quando ZEN ou Confluencia estiver ativo
   bool mg_ativo = (g_ViewZonas || g_ModoConfluencia > 0);
   if(mg_ativo) {
      string mg_tf=""; if(g_ModoConfluencia==1)mg_tf="M15"; else if(g_ModoConfluencia==2)mg_tf="H1"; else if(g_ModoConfluencia==3)mg_tf="H2"; else if(g_ModoConfluencia==4)mg_tf="H4"; else mg_tf="Tela";
      string mg_val=(g_MG_DiagText!="")?g_MG_DiagText:"Aguardando...";
      color mg_clr=(g_MG_DiagColor==clrGray)?CLR_TXT_DIM:((g_MG_DiagColor==clrLimeGreen)?CLR_TEAL:(g_MG_DiagColor==clrRed)?CLR_RED:CLR_AMBER);
      PRow("mg_stat",lx,rx,cur,"MktGlance ["+mg_tf+"]",mg_val,mg_clr); cur+=14;
   } else { ObjectDelete(0,PANEL_PREFIX+"mg_stat_l"); ObjectDelete(0,PANEL_PREFIX+"R_mg_stat_v"); }

   bool f_mg_confl = (mg_ativo && g_ModoConfluencia > 0 && g_MG_DiagText != "" &&
                      StringFind(g_MG_DiagText,"REPIQUE")<0 && StringFind(g_MG_DiagText,"CORRE")<0);
   // f_mg_confl = true quando MG esta ativo como FILTRO e a direcao esta alinhada (nao e repique/correcao)

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
   PRow("pl_sym",lx,rx,cur,_Symbol+" (Dia)",(plSym>=0?"+":"")+DoubleToString(plSym,2)+" "+AccountInfoString(ACCOUNT_CURRENCY)+s_pls_pct,c_plSym); cur+=14;
   if(lim_lucro_m>0&&InpUseFechamentoMoeda){PLabel("t_meta",lx,cur,"Meta (+"+DoubleToString(InpLucroAlvoMoedaPct,1)+"%)",CLR_TXT_DIM,InpPanelFontSize-1);PLabelR("m_meta",rx,cur,MQLProgressBar(plSym>=0?plSym:0,lim_lucro_m,12),CLR_TEAL,InpPanelFontSize-2);cur+=12;}
   if(lim_perda_m>0&&InpUseFechamentoMoeda){PLabel("t_ddm",lx,cur,"Risco (-"+DoubleToString(InpPerdaMaximaMoedaPct,1)+"%)",CLR_TXT_DIM,InpPanelFontSize-1);PLabelR("m_ddm",rx,cur,MQLProgressBar(plSym<0?plSym:0,lim_perda_m,12),CLR_RED,InpPanelFontSize-2);cur+=14;}
   PRow("pl_tot",lx,rx,cur,"Global (Dia)",(plTot>=0?"+":"")+DoubleToString(plTot,2)+" "+AccountInfoString(ACCOUNT_CURRENCY)+s_plt_pct,c_plTot); cur+=14;

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
   color c_pos = (g_NPosDay>=InpMaxDayTrades && g_NPosSwingFR>=InpMaxFRSwingTrades && g_NPosSwingFibo>=InpMaxFiboTrades) ? CLR_RED : ((g_FastNPosSymbol>0)?CLR_BLUE:CLR_TXT_LABEL); // [B06 FIX]
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
   int cw=50, ch=50, ico_x=6, nome_y=6, st_y=20, wr_y=34;
   double ask_p=SymbolInfoDouble(_Symbol,SYMBOL_ASK), bid_p=SymbolInfoDouble(_Symbol,SYMBOL_BID);
   double zone_p=(atr_val>0)?(atr_val/_Point)*2.0:0;
   bool in_rd_fr=(g_CachedFRTop>0&&MathAbs(g_CachedFRTop-ask_p)/_Point<=zone_p)||(g_CachedFRFundo>0&&MathAbs(bid_p-g_CachedFRFundo)/_Point<=zone_p);
   bool in_rd_fb=false; if(InpUseFiboPullback&&g_CachedFiboH>0){double r_f=g_CachedFiboH-g_CachedFiboLow;if(r_f>=(atr_val*InpFibMinRange_ATR_Multi)){double nS=g_CachedFiboH-r_f*(InpFibLevelSell/100.0),nB=g_CachedFiboLow+r_f*(InpFibLevelBuy/100.0);if(MathAbs(nS-ask_p)/_Point<=zone_p||MathAbs(bid_p-nB)/_Point<=zone_p)in_rd_fb=true;}}
   string m_dir = " [C/V]"; if(g_ModoConfluencia > 0) { if(g_MG_BuyAllowed && !g_MG_SellAllowed) m_dir = " [ C ]"; else if(!g_MG_BuyAllowed && g_MG_SellAllowed) m_dir = " [ V ]"; }
   ObjectDelete(0, PANEL_PREFIX + "fl_card"); ObjectDelete(0, PANEL_PREFIX + "fl_n1"); ObjectDelete(0, PANEL_PREFIX + "fl_st"); ObjectDelete(0, PANEL_PREFIX + "fl_wr");
   int cw2 = (pw - (pad * 2) - 4) / 2;
   {int ox=px+pad-2;color c_fr=(!InpUseFR)?CLR_MUTED:CLR_RED;string s_fr2=!InpUseFR?"OFF":(g_ReadyFR?"GATILHO!":(in_rd_fr?"ARMADO!":"MASTER P.A."));if(c_fr==CLR_RED&&!g_ReadyFR&&!in_rd_fr)c_fr=CLR_LIGHT_GRAY;bool is_ready=(g_ReadyFR||in_rd_fr)&&fr_cd;color c_fr_ico=is_ready?CLR_RED:c_fr;color bg_fr=is_ready?CLR_RED_DIM:CLR_BG_CARD;color txt_fr=is_ready?CLR_TXT_WHITE:CLR_TXT_LABEL;PModuleCardH("fr_card",ox,cur,cw2,ch,c_fr_ico,bg_fr);PLabel("fr_n1",ox+ico_x,cur+nome_y,"F.ROMP"+m_dir,txt_fr,InpPanelFontSize,true);PLabel("fr_st",ox+ico_x,cur+st_y,s_fr2,c_fr_ico,InpPanelFontSize,true);string sr_fr=StringFormat("%dW/%dT",g_FrWins,g_FrTotal);if(g_FrTotal>0)sr_fr+=" ("+IntegerToString((int)((g_FrWins*100.0)/g_FrTotal))+"%)";PLabel("fr_wr",ox+ico_x,cur+wr_y,sr_fr,(g_FrWins>=g_FrTotal/2.0&&g_FrTotal>0)?CLR_TEAL:CLR_TXT_LABEL,InpPanelFontSize-2);}
   {int ox=px+pad-2+cw2+4;color c_fb=!InpUseFiboPullback?CLR_MUTED:(fb_cd?CLR_AMBER:CLR_MUTED);string s_fb=!InpUseFiboPullback?"OFF":(g_ReadyFibo?"GATILHO!":(in_rd_fb?"ARMADO!":"Prox.Vela"));string dir_fb=(adx_val<p_ADX_ConsolidationLevel)?"▲▼":((tDir==1)?"▼":((tDir==-1)?"▲":"──"));if(c_fb==CLR_AMBER&&!g_ReadyFibo&&!in_rd_fb)c_fb=CLR_LIGHT_GRAY;bool is_ready=(g_ReadyFibo||in_rd_fb)&&fb_cd;color c_fb_ico=is_ready?CLR_AMBER:c_fb;color bg_fb=is_ready?CLR_AMBER_DIM:CLR_BG_CARD;color txt_fb=is_ready?CLR_TXT_WHITE:CLR_TXT_LABEL;PModuleCardH("fb_card",ox,cur,cw2,ch,c_fb_ico,bg_fb);PLabel("fb_n1",ox+ico_x,cur+nome_y,"FIBO"+m_dir,txt_fb,InpPanelFontSize,true);PLabel("fb_st",ox+ico_x,cur+st_y,s_fb,c_fb_ico,InpPanelFontSize,true);string sr_fb=StringFormat("%dW/%dT",g_FiboWins,g_FiboTotal);if(g_FiboTotal>0)sr_fb+=" ("+IntegerToString((int)((g_FiboWins*100.0)/g_FiboTotal))+"%)";PLabel("fb_wr",ox+ico_x,cur+wr_y,sr_fb,(g_FiboWins>=g_FiboTotal/2.0&&g_FiboTotal>0)?CLR_TEAL:CLR_TXT_LABEL,InpPanelFontSize-2);}
   cur+=ch+22;

   if(g_FastNPosSymbol > 0) { // [B09 FIX] posicao no simbolo atual
      ObjectDelete(0,PANEL_PREFIX+"btn_pause");
      double c_posOpen=0,c_posSL=0; long c_posType=0; double c_lot=0; string c_comm=""; ulong c_ticket=0;
      for(int i=PositionsTotal()-1;i>=0;i--){c_ticket=PositionGetTicket(i);if(PositionSelectByTicket(c_ticket)&&PositionGetInteger(POSITION_MAGIC)==InpMagic&&PositionGetString(POSITION_SYMBOL)==_Symbol){c_posOpen=PositionGetDouble(POSITION_PRICE_OPEN);c_posSL=PositionGetDouble(POSITION_SL);c_posType=PositionGetInteger(POSITION_TYPE);c_lot=PositionGetDouble(POSITION_VOLUME);c_comm=PositionGetString(POSITION_COMMENT);break;}}
      double c_curr=(c_posType==POSITION_TYPE_BUY)?SymbolInfoDouble(_Symbol,SYMBOL_BID):SymbolInfoDouble(_Symbol,SYMBOL_ASK);
      double dist_be=0; if(c_posSL>0) dist_be=(c_posType==POSITION_TYPE_BUY)?(c_posOpen+(g_CachedSlPts*InpBE_Trigger_Normal*_Point))-c_curr:c_curr-(c_posOpen-(g_CachedSlPts*InpBE_Trigger_Normal*_Point));
      bool be_triggered=(((c_posSL>=c_posOpen)&&(c_posType==POSITION_TYPE_BUY))||((c_posSL<=c_posOpen)&&(c_posType==POSITION_TYPE_SELL)&&c_posSL>0));
      string be_txt=""; color be_clr=CLR_TXT_LABEL; bool be_close=false;
      if(be_triggered){be_txt=" B.E. ATIVO ✓ ";be_clr=CLR_TEAL;}else if(c_posSL>0){double pt_to_be=dist_be/_Point;if(pt_to_be<=50.0&&dist_be>0){be_close=true;be_txt=StringFormat(" B.E. EM %.0f pts! ",pt_to_be);be_clr=CLR_TEAL;}else{be_txt=StringFormat(" B.E. dist: %.0f pts ",pt_to_be);be_clr=CLR_TXT_DIM;}}else{be_txt=" AGUARDANDO SL ";be_clr=CLR_TXT_DIM;}
      PSectionBadge("s_bata",px,cur,pw,"POSIÇÃO",CLR_AMBER); int be_bx=px+pad+76,be_bw=(int)StringLen(be_txt)*6+4;
      PRect("s_bata_be_bg",be_bx,cur+1,be_bw,12,(be_close||be_triggered)?be_clr:CLR_BG_CARD,-1,215);
      PLabel("s_bata_be",be_bx+4,cur+2,be_txt,(be_close||be_triggered)?CLR_BG_BASE:be_clr,InpPanelFontSize-2,true);
      PButton("btn_col_pos",rx-22,cur+1,20,14,g_ColPosicao?"[+]":"[-]",be_close?CLR_AMBER_DIM:CLR_BG_HEADER,g_ColPosicao?(be_close?CLR_AMBER:CLR_TEAL):CLR_TXT_DIM); cur+=16;
      if(!g_ColPosicao){PRect("bg_bata",px+pad-2,cur,pw-(pad*2)+4,68,CLR_BG_CARD,CLR_TEAL_DIM,201);cur+=4;PLabel("bta_n",px+pad+4,cur,(c_posType==POSITION_TYPE_BUY?"▼ COMPRA":"▲ VENDA")+" "+DoubleToString(c_lot,2)+" ("+c_comm+")",(c_posType==POSITION_TYPE_BUY)?CLR_TEAL:CLR_RED,InpPanelFontSize,true);cur+=14;PLabel("bta_po",px+pad+4,cur,"Abertura: "+DoubleToString(c_posOpen,_Digits),CLR_TXT_LABEL,InpPanelFontSize-1);PLabelR("bta_curr",rx-6,cur,"Atual: "+DoubleToString(c_curr,_Digits),CLR_TXT_PRIMARY,InpPanelFontSize-1);cur+=12;string s_be="Pro BreakEven: Faltam "+DoubleToString(dist_be/_Point,0)+" pts";if(be_triggered)s_be="Risco ZERO (B.E. Protegido) ✓";PLabel("bta_be",px+pad+4,cur,s_be,be_clr,InpPanelFontSize-1);cur+=20;cur+=4;}
      else{ObjectDelete(0,PANEL_PREFIX+"bg_bata");ObjectDelete(0,PANEL_PREFIX+"bta_n");ObjectDelete(0,PANEL_PREFIX+"bta_po");ObjectDelete(0,PANEL_PREFIX+"bta_curr");ObjectDelete(0,PANEL_PREFIX+"bta_be");}
   } else {
      ObjectDelete(0,PANEL_PREFIX+"s_bata_la");ObjectDelete(0,PANEL_PREFIX+"s_bata_bg");ObjectDelete(0,PANEL_PREFIX+"s_bata_tx");ObjectDelete(0,PANEL_PREFIX+"s_bata_lb");ObjectDelete(0,PANEL_PREFIX+"s_bata_be");ObjectDelete(0,PANEL_PREFIX+"bg_bata");ObjectDelete(0,PANEL_PREFIX+"bta_n");ObjectDelete(0,PANEL_PREFIX+"bta_po");ObjectDelete(0,PANEL_PREFIX+"bta_curr");ObjectDelete(0,PANEL_PREFIX+"bta_be");ObjectDelete(0,PANEL_PREFIX+"btn_col_pos");
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
      bool u_b=InpUseFiboPullback, c_c=g_CachedFiboCdOk; bool c_l=(g_CachedFiboH>0&&g_CachedFiboLow>0&&g_CachedFiboATR>0);
      bool c_a=p_UsePassaFiltroADXFibo?(g_H4_ADX>=cfg_ADX_MinLevel):true; bool c_t=(tD==1||tD==-1);
      DROW_DYN("Uso Estratégia",u_b?"sim":"OFF",!u_b)DROW_DYN("Cooldown Fibo",c_c?"livre":"AGUARDAR",!c_c)DROW_DYN("Cálculo Níveis H4",c_l?"sim":"NÃO",!c_l)DROW_DYN("Tendência Macro",c_t?"alinhado":"NEUTRO",!c_t)DROW_DYN("Força H4 (ADX="+DoubleToString(g_H4_ADX,1)+")",c_a?"ok":"FRACO",!c_a)
      string confl_val="OFF"; if(g_ModoConfluencia>0){ if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val="SO COMPRA"; else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val="SO VENDA"; else confl_val="LIVRE"; } DROW_DYN("Filtro MktGlance",confl_val,false)
      s_rdy=(!any_glb&&u_b&&c_c&&c_l&&c_a&&c_t);
   } else {
      bool u_r=InpUseFR, c_c=g_CachedFrCdOk, c_l=(g_CachedFRTop>0&&g_CachedFRFundo>0);
      bool dir_s_ok,dir_b_ok; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok,dir_b_ok);
      bool dir_algum=(dir_s_ok||dir_b_ok); bool c_dr=InpFR_Direct_Entries;
      DROW_DYN("Uso Estratégia",u_r?"sim":"OFF",!u_r)DROW_DYN("Cooldown L1",c_c?"livre":"AGUARDAR",!c_c)DROW_DYN("Mapeamento L1",c_l?"sim":"NÃO",!c_l)DROW_DYN("Dir. L1 OK",dir_algum?"sim":"NEUTRO BLOQ.",!dir_algum)DROW_DYN("FR Direct",c_dr?"ativo":"off",false)
      string confl_val="OFF"; if(g_ModoConfluencia>0){ if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val="SO COMPRA"; else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val="SO VENDA"; else confl_val="LIVRE"; } DROW_DYN("Filtro MktGlance",confl_val,false)
      s_rdy=(!any_glb&&u_r&&c_c&&c_l&&dir_algum);
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
      else if(btn==PANEL_PREFIX+"btn_confl"){ g_ModoConfluencia++; if(g_ModoConfluencia>4) g_ModoConfluencia=0; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); }
      else if(btn==PANEL_PREFIX+"btn_col_pos") { g_ColPosicao=!g_ColPosicao; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); }
      else if(btn==PANEL_PREFIX+"btn_col_term"){ g_ColTerminal=!g_ColTerminal; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); }
      else if(btn==PANEL_PREFIX+"btn_toggle_prop"||btn=="FS_PROP_HUD_BTN_CLOSE"){ g_ShowPropFirmHUD=(btn==PANEL_PREFIX+"btn_toggle_prop")?!g_ShowPropFirmHUD:false; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); DesenharPainelPropFirm(); }
      else if(btn==PANEL_PREFIX+"btn_diag"||btn==PANEL_PREFIX+"D_btn_close"){ g_ShowDiag=(btn==PANEL_PREFIX+"btn_diag")?!g_ShowDiag:false; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainel(); DesenharPainelDiag(); }
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

   g_CurrentPerfil = InpPerfil;
   g_InitTime      = TimeCurrent();
   g_GV_Blocked    = "Sniper_Blocked_" + _Symbol;

   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(50);
   trade.SetTypeFillingBySymbol(_Symbol);

   // [AUTO-TF] Detecta símbolo e configura g_TF_L1 / TF_L2 automaticamente
   AutoSelecionarTF();

   if(GlobalVariableCheck("FS9_ModoConfl")) g_ModoConfluencia = (int)GlobalVariableGet("FS9_ModoConfl");

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
   
   double maxDDUsd = (g_StartBalance > 0) ? (g_StartBalance - eq) : 0;
   if(maxDDUsd < 0) maxDDUsd = 0;
   double maxDDPct = (bal > 0) ? (maxDDUsd / bal * 100.0) : 0;
   double distMaxLossUsd = (bal * (InpPropFirmMaxDDLimitPct / 100.0)) - maxDDUsd;
   double distMaxLossPct = (bal > 0) ? (distMaxLossUsd / bal * 100.0) : 0;
   
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
   // Drawdown Atual Fibbo
   string l5_a = PFX + "L5_A"; string l5_b = PFX + "L5_B";
   if(ObjectFind(0, l5_a) < 0) { ObjectCreate(0, l5_a, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l5_a, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetString(0, l5_a, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l5_a, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l5_a, OBJPROP_COLOR, C'140,150,165'); ObjectSetInteger(0, l5_a, OBJPROP_ZORDER, 12); ObjectSetString(0, l5_a, OBJPROP_TEXT, "Drawdown Atual Fibbo:"); }
   if(ObjectFind(0, l5_b) < 0) { ObjectCreate(0, l5_b, OBJ_LABEL, 0, 0, 0); ObjectSetInteger(0, l5_b, OBJPROP_CORNER, CORNER_LEFT_UPPER); ObjectSetInteger(0, l5_b, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER); ObjectSetString(0, l5_b, OBJPROP_FONT, "Calibri"); ObjectSetInteger(0, l5_b, OBJPROP_FONTSIZE, 9); ObjectSetInteger(0, l5_b, OBJPROP_COLOR, C'100,140,220'); ObjectSetInteger(0, l5_b, OBJPROP_ZORDER, 12); }
   ObjectSetInteger(0, l5_a, OBJPROP_XDISTANCE, card_x + 16); ObjectSetInteger(0, l5_a, OBJPROP_YDISTANCE, cur_y);
   ObjectSetInteger(0, l5_b, OBJPROP_XDISTANCE, card_x + card_w - 16); ObjectSetInteger(0, l5_b, OBJPROP_YDISTANCE, cur_y);
   ObjectSetString(0, l5_b, OBJPROP_TEXT, StringFormat("-%.2f USD (-%.2f%%)", maxDDUsd, maxDDPct));
   
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
   
   // [H1 FIX] Atualizar linhas do chart apenas se houve mudanca nos precos ou configuracoes
   static string s_chart_hash = "";
   string new_chart_hash = StringFormat("%.5f|%.5f|%.5f|%.5f|%d|%d",
      g_CachedCanalHigh, g_CachedCanalLow, g_CachedFRTop, g_CachedFRFundo,
      g_FastNPosSymbol, (int)g_ViewZonas);
   if(new_chart_hash != s_chart_hash) {
      s_chart_hash = new_chart_hash;
      DesenharLinhasChart();
   }
   
   DesenharLinhasOrdens();
   
   g_ModoAnalise = g_ViewZonas;
   if(g_ModoAnalise || g_ModoConfluencia > 0) {
      // [ZEN FIX] No modo ZEN, usa sempre o TF do gráfico atual (PERIOD_CURRENT).
      // O TF do MarketGlance (confluência) só se aplica quando ZEN está desligado.
      ENUM_TIMEFRAMES tf_mg = PERIOD_CURRENT;
      if(!g_ViewZonas && g_ModoConfluencia > 0) {
         if(g_ModoConfluencia == 1)      tf_mg = PERIOD_M15;
         else if(g_ModoConfluencia == 2) tf_mg = PERIOD_H1;
         else if(g_ModoConfluencia == 3) tf_mg = PERIOD_H2;
         else if(g_ModoConfluencia == 4) tf_mg = PERIOD_H4;
      }
      AtualizarSensoresAnalise(tf_mg);
      DesenharLinhasAnalise();

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
            if(is_p2){string bc=StringSubstr(c_comm,0,StringLen(c_comm)-3);p1_fechou=!JaExistePosicaoDaEstrategia(bc+"_P1");}
            bool be_dist=(posType==POSITION_TYPE_BUY&&curr_bid>=(posOpen+trigger))||(posType==POSITION_TYPE_SELL&&curr_ask<=(posOpen-trigger));
            bool be_tp1=(is_p2&&p1_fechou);
            if(be_dist||be_tp1){
               if(posType==POSITION_TYPE_BUY&&posSL<(posOpen+p_lock)-(_Point*2)&&curr_bid>=(posOpen+p_lock+stops_level)){
                  double nsl = NormalizeDouble(posOpen+p_lock, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Compra (+%.0f pts).",be_tp1?"TP1":"Dist",InpBE_LockProfitPts));be_triggered=true;}
               }
               else if(posType==POSITION_TYPE_SELL&&posSL>(posOpen-p_lock)+(_Point*2)&&curr_ask<=(posOpen-p_lock-stops_level)){
                  double nsl = NormalizeDouble(posOpen-p_lock, _Digits);
                  if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Venda (+%.0f pts).",be_tp1?"TP1":"Dist",InpBE_LockProfitPts));be_triggered=true;}
               }
            }
         }
         if(!be_triggered&&InpUseTrailStop&&g_CachedATR>0){
            double step_trail=g_CachedATR*0.25;
            if(posType==POSITION_TYPE_BUY){
               double nsl=NormalizeDouble(curr_bid-trail_dist,_Digits);
               if(nsl>posOpen&&nsl>(posSL+step_trail)&&(curr_bid-nsl)>=stops_level) trade.PositionModify(ticket,nsl,posTP);
            }
            else if(posType==POSITION_TYPE_SELL){
               double nsl=NormalizeDouble(curr_ask+trail_dist,_Digits);
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
      double total_earned = _bal - g_StartBalance;
      // [BUG-05 FIX] Incluir P&L flutuante no cálculo de consistência
      // Antes: usava g_CachedPlTotReal (só fechadas) → robô podia ser pausado prematuramente
      // em dias onde há posições abertas no lucro. Agora usa o P&L total real do dia.
      double pl_total_hoje = g_CachedPlTotReal + g_FloatingPlTot;
      g_ConsistencyPct = (total_earned>0 && pl_total_hoje>0) ? (pl_total_hoje/total_earned*100.0) : 0.0;
      if(g_ConsistencyPct > InpPropConsistencyPct) {
         if(!g_BotPaused){ g_BotPaused=true; AddLog(StringFormat("⛔ PROP: Consistência %.1f%% > %.1f%% — pausado!",g_ConsistencyPct,InpPropConsistencyPct)); }
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
   double d_l2[]; ArraySetAsSeries(d_l2,true);
   if(CopyBuffer(hADX_L2,0,1,1,d_l2)>0) l2_adx=d_l2[0];
   if(CopyBuffer(hRSI_L2,0,1,1,d_l2)>0) l2_rsi=d_l2[0];
   if(CopyBuffer(hATR_L2,0,1,1,d_l2)>0) l2_atr=d_l2[0];
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
         bool ma_buy=(trendDir==1), ma_sell=(trendDir==-1), is_lateral=IsMercadoLateral();
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
         bool m_sell=InpFR_RequireWickRejection?(iHigh(_Symbol,g_TF_L1,1)>pH&&iClose(_Symbol,g_TF_L1,1)<pH&&IsVelaReversaoVenda(1,g_TF_L1)):(iHigh(_Symbol,g_TF_L1,1)>pH&&iClose(_Symbol,g_TF_L1,1)<pH&&iClose(_Symbol,g_TF_L1,1)<iOpen(_Symbol,g_TF_L1,1));
         bool m_buy =InpFR_RequireWickRejection?(iLow (_Symbol,g_TF_L1,1)<pL&&iClose(_Symbol,g_TF_L1,1)>pL&&IsVelaReversaoCompra(1,g_TF_L1)):(iLow(_Symbol,g_TF_L1,1)<pL&&iClose(_Symbol,g_TF_L1,1)>pL&&iClose(_Symbol,g_TF_L1,1)>iOpen(_Symbol,g_TF_L1,1));
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


         g_ReadyFR=m_sell||m_buy||(is_lat&&((d_s_ok&&r_s_ok)||(d_b_ok&&r_b_ok)));
         // [R3] Cooldown por tempo: bloqueia re-entrada no mesmo nível FR por N minutos
         int _fr_cd=InpFR_CooldownMinutes*60;
         bool tc_sell=(_fr_cd<=0||(TimeCurrent()-l1_fr_sell_ts)>=_fr_cd);
         bool tc_buy =(_fr_cd<=0||(TimeCurrent()-l1_fr_buy_ts )>=_fr_cd);
         if(confl_s_ok && (m_sell||(is_lat&&d_s_ok&&r_s_ok&&iHigh(_Symbol,g_TF_L1,1)>=(pH-mag_tol)&&iClose(_Symbol,g_TF_L1,1)<pH&&iClose(_Symbol,g_TF_L1,1)<iOpen(_Symbol,g_TF_L1,1)))&&z_v&&cb_l1!=l1_fr_sell&&tc_sell){if(AbrirSell(lot,bid,sl_pts,tp1_m,InpTP_Final_Multi,"FR_Venda_L1")){l1_fr_sell=cb_l1;l1_fr_sell_ts=TimeCurrent();}}
         if(confl_b_ok && (m_buy ||(is_lat&&d_b_ok&&r_b_ok&&iLow (_Symbol,g_TF_L1,1)<=(pL+mag_tol)&&iClose(_Symbol,g_TF_L1,1)>pL&&iClose(_Symbol,g_TF_L1,1)>iOpen(_Symbol,g_TF_L1,1)))&&z_c&&cb_l1!=l1_fr_buy&&tc_buy) {if(AbrirBuy (lot,ask,sl_pts,tp1_m,InpTP_Final_Multi,"FR_Compra_L1")){l1_fr_buy=cb_l1;l1_fr_buy_ts=TimeCurrent();}}

         if(InpFR_Direct_Entries && g_CachedATR > 0) {
            bool fr_d_atr_ok=(!InpUseOscillationFilter||(g_CachedATR/_Point)>=InpMinATRPts);
            if(fr_d_atr_ok) {
               double d_zone=g_CachedATR*(InpFR_Direct_ZoneATRPct/100.0);
               bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros&&InpFR_UseRSI)?(g_CachedRSI>=r_th_sell):true;
               bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros&&InpFR_UseRSI)?(g_CachedRSI<=r_th_buy):true;
               if(confl_s_ok && (iHigh(_Symbol,g_TF_L1,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_sell&&z_v&&dr_s_ok){
                  datetime prev_sell=l1_frd_sell; l1_frd_sell=cb_l1;
                  if(!AbrirSell(lot,bid,sl_pts,tp1_m,InpTP_Final_Multi,"FR_Dir_V_L1")) l1_frd_sell=prev_sell; else l1_fr_sell_ts=TimeCurrent();
               }
               if(confl_b_ok && (iLow(_Symbol,g_TF_L1,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,g_TF_L1,0))&&cb_l1!=l1_frd_buy&&z_c&&dr_b_ok){
                  datetime prev_buy=l1_frd_buy; l1_frd_buy=cb_l1;
                  if(!AbrirBuy(lot,ask,sl_pts,tp1_m,InpTP_Final_Multi,"FR_Dir_C_L1")) l1_frd_buy=prev_buy; else l1_fr_buy_ts=TimeCurrent();
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
         double mag_tol=GetFR_MagTol(l2_atr,l2_adx);
         double fr_range=(pH-pL)/_Point, tp1_m=InpTP_Parcial_Multi;
         if(l2_sl>0&&fr_range>=l2_sl*0.5) tp1_m=CalcularTP_Estrutural(fr_range,l2_sl,InpTP_Min_Multi,InpTP_Max_Multi,InpTP_Parcial_Multi);
         bool m_sell=InpFR_RequireWickRejection?(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&IsVelaReversaoVenda(1,TF_L2)):(iHigh(_Symbol,TF_L2,1)>pH&&iClose(_Symbol,TF_L2,1)<pH&&iClose(_Symbol,TF_L2,1)<iOpen(_Symbol,TF_L2,1));
         bool m_buy =InpFR_RequireWickRejection?(iLow (_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&IsVelaReversaoCompra(1,TF_L2)):(iLow(_Symbol,TF_L2,1)<pL&&iClose(_Symbol,TF_L2,1)>pL&&iClose(_Symbol,TF_L2,1)>iOpen(_Symbol,TF_L2,1));
         bool is_lat=(l2_adx<p_ADX_ConsolidationLevel); // [B11: esta declaracao esta OK — escopo local do bloco FR L2, diferente da is_lateral do Fluxo]
         bool d_s_ok,d_b_ok; GetFR_DirecaoOk(l2_med,l2_rsi,d_s_ok,d_b_ok);
         double r_th_sell=GetFR_RSI_Threshold(true,l2_adx), r_th_buy=GetFR_RSI_Threshold(false,l2_adx);
         bool r_s_ok=true,r_b_ok=true;
         if(InpFR_UseRSI){r_s_ok=(l2_rsi>=r_th_sell);r_b_ok=(l2_rsi<=r_th_buy);if(m_sell)r_s_ok=true;if(m_buy)r_b_ok=true;}
         bool z_v=FR_ZonaLivre("L2",true), z_c=FR_ZonaLivre("L2",false);
         if((m_sell||(is_lat&&d_s_ok&&r_s_ok&&iHigh(_Symbol,TF_L2,1)>=(pH-mag_tol)&&iClose(_Symbol,TF_L2,1)<pH&&iClose(_Symbol,TF_L2,1)<iOpen(_Symbol,TF_L2,1)))&&z_v&&cb_l2!=l2_fr_sell&&fr2_cd_sell){if(AbrirSell(l2_lot,bid,l2_sl,tp1_m,InpTP_Final_Multi,"FR_Venda_L2")){l2_fr_sell=cb_l2; l2_fr_sell_ts=TimeCurrent();}}
         if((m_buy ||(is_lat&&d_b_ok&&r_b_ok&&iLow (_Symbol,TF_L2,1)<=(pL+mag_tol)&&iClose(_Symbol,TF_L2,1)>pL&&iClose(_Symbol,TF_L2,1)>iOpen(_Symbol,TF_L2,1)))&&z_c&&cb_l2!=l2_fr_buy&&fr2_cd_buy) {if(AbrirBuy (l2_lot,ask,l2_sl,tp1_m,InpTP_Final_Multi,"FR_Compra_L2")){l2_fr_buy=cb_l2; l2_fr_buy_ts=TimeCurrent();}}

         if(InpFR_Direct_Entries&&l2_atr>0){
            double d_zone=l2_atr*(InpFR_Direct_ZoneATRPct/100.0);
            bool dr_s_ok=(!InpFR_Direct_IgnoreFiltros&&InpFR_UseRSI)?(l2_rsi>=r_th_sell):true;
            bool dr_b_ok=(!InpFR_Direct_IgnoreFiltros&&InpFR_UseRSI)?(l2_rsi<=r_th_buy):true;
            // [BUG-04 FIX] FR Direct L2 agora respeita confluência espacial do MarketGlance
            // Antes, confl_s_ok/confl_b_ok só eram aplicados no FR Normal L2 (linhas acima),
            // mas o FR Direct L2 entrava ignorando os fractais H4/D1 do MarketGlance.
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
            if(confl_l2_s_ok&&(iHigh(_Symbol,TF_L2,0)>pH&&bid<pH&&bid>=(pH-d_zone))&&(bid<iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_sell&&z_v&&dr_s_ok&&fr2_cd_sell){
               datetime prev_sell=l2_frd_sell; l2_frd_sell=cb_l2;
               if(!AbrirSell(l2_lot,bid,l2_sl,tp1_m,InpTP_Final_Multi,"FR_Dir_V_L2")) l2_frd_sell=prev_sell; else l2_fr_sell_ts=TimeCurrent();
            }
            if(confl_l2_b_ok&&(iLow(_Symbol,TF_L2,0)<pL&&ask>pL&&ask<=(pL+d_zone))&&(ask>iOpen(_Symbol,TF_L2,0))&&cb_l2!=l2_frd_buy&&z_c&&dr_b_ok&&fr2_cd_buy){
               datetime prev_buy=l2_frd_buy; l2_frd_buy=cb_l2;
               if(!AbrirBuy(l2_lot,ask,l2_sl,tp1_m,InpTP_Final_Multi,"FR_Dir_C_L2")) l2_frd_buy=prev_buy; else l2_fr_buy_ts=TimeCurrent();
            }
         }
      }
   } else g_ReadyFR=false;

   //================================================================
   // MOTOR 3: FIBONACCI H4 + D1 SATÉLITE (Auto-Scale)
   //================================================================
   if(InpUseFiboPullback && !block_fibo) {
      // FIBO H4
      if(g_CachedFiboCdOk&&g_CachedFiboH>0&&g_CachedFiboLow>0&&g_CachedFiboATR>0){
         bool v_ok=true; if(InpUseVolumeFilter&&g_CachedVolMed>0){long vb[1];if(CopyTickVolume(_Symbol,g_TF_L1,0,1,vb)>=1)v_ok=((double)vb[0]>g_CachedVolMed);}
         double range=g_CachedFiboH-g_CachedFiboLow;
         if(range>=(g_CachedFiboATR*InpFibMinRange_ATR_Multi)){
            double sl_f=(g_CachedFiboATR/_Point)*1.5, gat_f=g_CachedFiboATR*(InpFib_MagneticZoneATRPct/100.0);
            double nSell=g_CachedFiboH-range*(InpFibLevelSell/100.0), nBuy=g_CachedFiboLow+range*(InpFibLevelBuy/100.0);
            int t_h4=ComputeTrendDir(hShortEMA_H4,hEMA_H4);
            bool a_ok=p_UsePassaFiltroADXFibo?(g_H4_ADX>=cfg_ADX_MinLevel):true;
            bool dso=p_UseTrendDirFibo?(t_h4==-1):true, dbo=p_UseTrendDirFibo?(t_h4==1):true;
            if(g_ModoConfluencia > 0) {
               if(!g_MG_SellAllowed) dso = false;
               if(!g_MG_BuyAllowed) dbo = false;
            }
            g_ReadyFibo=(a_ok&&dso&&v_ok)||(a_ok&&dbo&&v_ok);
            double l_h4 = ComputeLot_ByDistance(sl_f, g_CachedFiboATR);
            if(a_ok&&dso&&bid<=nSell&&bid>=(nSell-gat_f)&&FiltroCurtoPrazo(-1,1,PERIOD_H4,hShortEMA_H4)&&v_ok&&cb_h4!=f_h4_sell&&!JaExistePosicaoDaEstrategia("Fibo_Sell_H4")){if(AbrirSell(l_h4,bid,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Sell_H4"))f_h4_sell=cb_h4;}
            if(a_ok&&dbo&&ask>=nBuy&&ask<=(nBuy+gat_f)&&FiltroCurtoPrazo(1,1,PERIOD_H4,hShortEMA_H4)&&v_ok&&cb_h4!=f_h4_buy&&!JaExistePosicaoDaEstrategia("Fibo_Buy_H4")) {if(AbrirBuy (l_h4,ask,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Buy_H4")) f_h4_buy=cb_h4;}
            // FIBO H4 — NÍVEL 2 (38.2% default, substitui D1)
            if(InpUseFiboH4_2) {
               double nSell2=g_CachedFiboH-range*(InpFibLevel2Sell/100.0), nBuy2=g_CachedFiboLow+range*(InpFibLevel2Buy/100.0);
               double l_h4_2=ComputeLot_ByDistance(sl_f,g_CachedFiboATR);
               if(a_ok&&dso&&bid<=nSell2&&bid>=(nSell2-gat_f)&&FiltroCurtoPrazo(-1,1,PERIOD_H4,hShortEMA_H4)&&v_ok&&cb_h4!=f_h4_sell2&&!JaExistePosicaoDaEstrategia("Fibo_Sell_H4_2")){if(AbrirSell(l_h4_2,bid,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Sell_H4_2"))f_h4_sell2=cb_h4;}
               if(a_ok&&dbo&&ask>=nBuy2&&ask<=(nBuy2+gat_f)&&FiltroCurtoPrazo(1,1,PERIOD_H4,hShortEMA_H4)&&v_ok&&cb_h4!=f_h4_buy2&&!JaExistePosicaoDaEstrategia("Fibo_Buy_H4_2")) {if(AbrirBuy (l_h4_2,ask,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Buy_H4_2")) f_h4_buy2=cb_h4;}
            }
         } else g_ReadyFibo=false;
      } else g_ReadyFibo=false;
   } else {
      // [BUG-M3 FIX] Reseta g_ReadyFibo quando block_fibo=true OU estratégia desativada
      g_ReadyFibo=false;
   }
}
//+------------------------------------------------------------------+
//  FIM — Fibbo_Sniper_v28.4_PRO.mq5
//+------------------------------------------------------------------+


