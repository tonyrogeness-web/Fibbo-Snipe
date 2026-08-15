const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
const buf = fs.readFileSync(filePath);
let content = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.toString('utf16le') : buf.toString('utf8');

// 1. Substitui a seção de inputs da Fibo
const targetInput = `input group "=== FIBONACCI 2.0 (ALTA PRECISÃO) ==="
input bool InpUseFiboPullback = false; // [DESATIVADO POR PADRÃO] Fibo desativado para validação do FR puro`;

const replacementInput = `input group "=== FIBONACCI 2.0 (ALTA PRECISÃO) ==="
input bool   InpUseFiboPullback          = true;  // [FIBO 2.0] Ativar Retrações de Fibonacci
input bool   InpSmartFiboSymbolFilter    = true;  // [ROTEAMENTO INTELIGENTE] Filtro Seletivo por Moeda (Núcleo de Ouro)
input string InpFiboBlockedSymbols       = "EURGBP,EURAUD"; // Moedas com Fibo Desativada (Operam Apenas no FR)`;

if (content.includes(targetInput)) {
  content = content.replace(targetInput, replacementInput);
  console.log('✅ Inputs da Fibo atualizados com sucesso!');
} else {
  console.log('⚠️ Target input não encontrado exatamente, verificando padrão alternativo...');
  content = content.replace(/input bool InpUseFiboPullback\s*=\s*(true|false);[^\n]*/, 
    `input bool   InpUseFiboPullback          = true;  // [FIBO 2.0] Ativar Retrações de Fibonacci\ninput bool   InpSmartFiboSymbolFilter    = true;  // [ROTEAMENTO INTELIGENTE] Filtro Seletivo por Moeda (Núcleo de Ouro)\ninput string InpFiboBlockedSymbols       = "EURGBP,EURAUD"; // Moedas com Fibo Desativada (Operam Apenas no FR)`);
}

// 2. Adiciona a função IsFiboActiveForSymbol() logo antes da função DesenharLinhasAnalise ou similar
const helperFn = `
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
`;

if (!content.includes('bool IsFiboActiveForSymbol()')) {
  const insertPos = content.indexOf('void DesenharLinhasAnalise');
  if (insertPos !== -1) {
    content = content.slice(0, insertPos) + helperFn + '\n' + content.slice(insertPos);
    console.log('✅ Função IsFiboActiveForSymbol inserida com sucesso!');
  } else {
    // Insere antes de OnInit
    const onInitPos = content.indexOf('int OnInit(');
    content = content.slice(0, onInitPos) + helperFn + '\n' + content.slice(onInitPos);
    console.log('✅ Função IsFiboActiveForSymbol inserida antes de OnInit!');
  }
}

// 3. Substitui os pontos chave de InpUseFiboPullback por IsFiboActiveForSymbol()
content = content.replace(/if\(InpUseFiboPullback && g_CachedFiboH > 0\)/g, 'if(IsFiboActiveForSymbol() && g_CachedFiboH > 0)');
content = content.replace(/if\(InpUseFiboPullback&&g_CachedFiboH>0\)/g, 'if(IsFiboActiveForSymbol() && g_CachedFiboH > 0)');
content = content.replace(/if\(InpUseFiboPullback && g_CachedFiboH > 0 && g_ViewFibo\)/g, 'if(IsFiboActiveForSymbol() && g_CachedFiboH > 0 && g_ViewFibo)');
content = content.replace(/bool in_rd_fb=false;\s*if\(InpUseFiboPullback&&g_CachedFiboH>0\)/g, 'bool in_rd_fb=false; if(IsFiboActiveForSymbol() && g_CachedFiboH>0)');
content = content.replace(/bool show_fibo_card = InpUseFiboPullback;/g, 'bool show_fibo_card = IsFiboActiveForSymbol();');
content = content.replace(/!InpUseFiboPullback\?CLR_MUTED/g, '!IsFiboActiveForSymbol()?CLR_MUTED');
content = content.replace(/!InpUseFiboPullback\?"OFF"/g, '!IsFiboActiveForSymbol()?"OFF"');
content = content.replace(/bool u_b=InpUseFiboPullback,/g, 'bool u_b=IsFiboActiveForSymbol(),');
content = content.replace(/if\(InpUseFiboPullback && !block_fibo\)/g, 'if(IsFiboActiveForSymbol() && !block_fibo)');

// Grava arquivo em UTF-16LE com BOM
const outBuf = Buffer.from('\ufeff' + content, 'utf16le');
fs.writeFileSync(filePath, outBuf);
console.log('✅ Arquivo Fibbo_Sniper_v28.5_H2.mq5 salvo com sucesso em UTF-16LE!');
