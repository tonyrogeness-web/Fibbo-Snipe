const fs = require('fs');
const path = require('path');

console.log('🔄 Preparando arquivo de teste exclusivo para EURAUD e EURGBP em H1...');

const testerDir = 'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester';
const localDir = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper';

// Configuração H1 para EURAUD e EURGBP (H1 Enum = 16385)
const h1SetContent = `InpPerfil=1||0||0||2||N
InpAutoRegimeSwitch=true||false||0||true||N
InpBaseRisk_L1=2.0||0.6||0.1||3.0||N
InpMaxAutoRisk=3.0||0.0||0.000000||0.000000||N
InpVolPartialPct=50.0||0.0||0.000000||0.000000||N
InpTP_Parcial_Multi=1.0||0.0||0.000000||0.000000||N
InpTP_Final_Multi=3.5||2.0||0.5||5.0||N
InpMagic=111||0||0||0||N
InpMaxSimultaneousOps=6||0||0||0||N
InpMaxDayTrades=2||0||0||0||N
InpMaxFRSwingTrades=1||0||0||0||N
InpMaxFiboTrades=1||0||0||0||N
InpMaxConsecLosses=3||0||0||0||N
InpTP_Min_Multi=0.3||0.0||0.000000||0.000000||N
InpTP_Max_Multi=5.0||0.0||0.000000||0.000000||N
InpMinViableATR_Multi=1.0||0.0||0.000000||0.000000||N
InpAutoTF=false||false||0||true||N
InpTF=16385||0||0||0||N
InpCandlesToLook=14||0||0||0||N
InpUseTrendFilter=true||false||0||true||N
InpShortEMA_Period=9||0||0||0||N
InpUseFluxo=false||false||0||true||N
InpUseVolumeFilter=true||false||0||true||N
InpUseFR=true||false||0||true||N
InpFR_UseRSI=true||false||0||true||N
InpFR_RSI_Period=14||0||0||0||N
InpFR_MagneticZoneATRPct=15.0||0.0||0.000000||0.000000||N
InpFR_RequireWickRejection=true||false||0||true||N
InpFR_WickBodyRatio=0.5||0.0||0.000000||0.000000||N
InpFR_WickRangeMinPct=35.0||0.0||0.000000||0.000000||N
InpFR_BodyRangeMinPct=20.0||0.0||0.000000||0.000000||N
InpUseBreakEven=true||false||0||true||N
InpBE_Trigger_Normal=0.5||0.0||0.000000||0.000000||N
InpUseTrailStop=true||false||0||true||N
InpTrail_ATR_Multi=1.0||0.0||0.000000||0.000000||N
InpUseADX=true||false||0||true||N
InpADX_Period=14||0||0||0||N
InpPerdaMaximaGlobalPct=2.0||0.0||0.000000||0.000000||N
InpPerdaMaximaMoedaPct=2.0||0.0||0.000000||0.000000||N
InpLucroAlvoMoedaPct=4.0||0.0||0.000000||0.000000||N
InpShowPanel=true||false||0||true||N
`;

function writeUtf16LE(filePath, contentStr) {
  const outBuf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(contentStr, 'utf16le')]);
  fs.writeFileSync(filePath, outBuf);
  console.log(`✅ Salvo com sucesso: ${path.basename(filePath)}`);
}

writeUtf16LE(path.join(testerDir, 'Teste_EURAUD_EURGBP_H1.set'), h1SetContent);
writeUtf16LE(path.join(localDir, 'Teste_EURAUD_EURGBP_H1.set'), h1SetContent);

console.log('🎉 CONFIGURAÇÃO PRONTA PARA O TESTE H1!');
