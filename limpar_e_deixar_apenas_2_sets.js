const fs = require('fs');
const path = require('path');

console.log('=== LIMPANDO PASTAS E DEIXANDO APENAS OS 2 .SETS PRINCIPAIS ===\n');

// 1. Template base
function buildSetLines(overrides = {}) {
  const defaults = {
    "InpPerfil": "1",
    "InpAutoRegimeSwitch": "true",
    "InpBaseRisk_L1": "1.5",
    "InpMaxAutoRisk": "3.0",
    "InpVolPartialPct": "50.0",
    "InpTP_Parcial_Multi": "1.0",
    "InpTP_Final_Multi": "3.5",
    "InpMagic": "111",
    "InpMaxSimultaneousOps": "6",
    "InpMaxDayTrades": "2",
    "InpMaxFRSwingTrades": "1",
    "InpMaxFiboTrades": "1",
    "InpMaxConsecLosses": "3",
    "InpTP_Min_Multi": "0.3",
    "InpTP_Max_Multi": "5.0",
    "InpMinViableATR_Multi": "1.0",
    "InpAutoTF": "true",
    "InpTF": "16388", // PERIOD_H2
    "InpCandlesToLook": "14",
    "InpUseTrendFilter": "true",
    "InpShortEMA_Period": "9",
    "InpUseFluxo": "false",
    "InpFluxo_GatilhoPrecoce": "false",
    "InpFluxo_IgnoreWallStrong": "false",
    "InpUseVolumeFilter": "true",
    "InpFluxo_UseExhaustion": "true",
    "InpUseFR": "true",
    "InpFR_UseRSI": "true",
    "InpFR_RSI_Period": "14",
    "InpFR_MagneticZoneATRPct": "15.0",
    "InpFR_RequireWickRejection": "true",
    "InpFR_WickBodyRatio": "0.5",
    "InpFR_WickRangeMinPct": "35.0",
    "InpFR_BodyRangeMinPct": "20.0",
    "InpFR_RequireQuadrantClose": "true",
    "InpFR_CloseQuadrantPct": "35.0",
    "InpFR_MaxPenetrationATR": "0.75",
    "InpFR_RequireVolumeAbsorption": "true",
    "InpFR_MinVolumeRatio": "0.90",
    "InpFR_UseStructuralTP2": "true",
    "InpFR_AdaptiveRSI": "true",
    "InpFR_RSI_LateralRelax": "8.0",
    "InpFR_NeutralDirByRSI": "true",
    "InpFR_NeutralRSI_Sell": "55.0",
    "InpFR_NeutralRSI_Buy": "45.0",
    "InpFR_ProgressiveZone": "true",
    "InpFR_ZoneCooldown": "true",
    "InpFR_CooldownMinutes": "30",
    "InpFR_BlockAgainstSuperTrend": "true",
    "InpFR_SuperTrend_ADX": "30.0",
    "InpFR_RequireMinWick40": "true",
    "InpFR_MinWickRatioPct": "40.0",
    "InpFR_UseMidChannelLock": "true",
    "InpFR_Direct_Entries": "true",
    "InpFR_Direct_ZoneATRPct": "20.0",
    "InpFR_Direct_IgnoreFiltros": "false",
    "InpUseBreakEven": "true",
    "InpBE_Trigger_Normal": "0.50",
    "InpBE_Trigger_Fibo": "0.50",
    "InpBE_LockProfitPts": "0.0",
    "InpBE_UseATRBreathing": "true",
    "InpBE_BreathingATRPct": "20.0",
    "InpUseTrailStop": "true",
    "InpTrail_ATR_Multi": "1.0",
    "InpUseADX": "true",
    "InpADX_Period": "14",
    "InpUseFechamentoMoeda": "true",
    "InpPerdaMaximaGlobalPct": "3.0",
    "InpPerdaMaximaMoedaPct": "3.0",
    "InpLucroAlvoMoedaPct": "4.5",
    "InpUseFiboPullback": "false",
    "InpSmartFiboSymbolFilter": "false",
    "InpFiboBlockedSymbols": "",
    "InpFibLevel1": "18.0",
    "InpFibLevel2": "28.0",
    "InpFibLevel3": "38.2",
    "InpUseFiboLevel1": "true",
    "InpUseFiboLevel2": "true",
    "InpUseFiboLevel3": "true",
    "InpFibMinRange_ATR_Multi": "2.0",
    "InpFib_MagneticZoneATRPct": "20.0",
    "InpFib_RequireWickRejection": "true",
    "InpFib_RequireQuadrantClose": "true",
    "InpFib_MaxPenetrationATR": "0.75",
    "InpFib_RequireVolumeAbsorption": "true",
    "InpFib_MinVolumeRatio": "0.90",
    "InpFib_UseStructuralTP2": "true",
    "InpUseSessionFilter": "true",
    "InpSessionStartHour": "10",
    "InpSessionEndHour": "22",
    "InpSession_IgnoreOnSpike": "true",
    "InpCloseDaily": "false",
    "InpDailyCloseHour": "23",
    "InpDailyCloseMinute": "30",
    "InpFridayCloseHour": "23",
    "InpFridayCloseMinute": "30",
    "InpATR_Period": "14",
    "InpAntiExaustao_ATR_Multi": "2.5",
    "InpShowPanel": "true",
    "InpPanelX": "20",
    "InpPanelY": "20",
    "InpPanelTheme": "0",
    "InpPanelFontSize": "9",
    "InpSendPushNotifications": "false",
    "InpLogCSV": "false",
    "InpUseOscillationFilter": "true",
    "InpMinATRPts": "50.0",
    "InpBlockRollover": "true",
    "InpBlockLowLiquidity": "true",
    "InpUseDynamicLiquidity": "true",
    "InpMinTickVolume": "50",
    "InpUseHighImpactNewsFilter": "true",
    "InpNewsMinsBefore": "30",
    "InpNewsMinsAfter": "30",
    "InpBlockSpikeConsolidation": "true",
    "InpSpikeLookbackBars": "5",
    "InpSpikeRangeMultiplier": "2.0",
    "InpModoConfluencia": "4",
    "InpPropFirmMode": "true",
    "InpPropFirmMaxDDLimitPct": "6.0",
    "InpPropMaxDailyLossPct": "3.0",
    "InpPropConsistencyPct": "35.0",
    "InpPropFase1TargetPct": "8.0",
    "InpPropFase2TargetPct": "5.0",
    "InpPropHighWatermark": "0.0",
    "InpPropBreachLevel": "0.0",
    "InpPropAutoStopLossAdjust": "true",
    "InpPropMaxRiskPct": "1.5",
    "InpPropDaysToComplete": "4"
  };

  const finalParams = { ...defaults, ...overrides };
  const lines = Object.entries(finalParams).map(([k, v]) => `${k}=${v}||0||0||0||N`);
  return '\ufeff' + lines.join('\r\n') + '\r\n';
}

// 2. Os ÚNICOS 2 Sets que devem existir
const keepSets = {
  "Fibbo_Sniper_v28.5_H2_Apenas_FR.set": buildSetLines({
    "InpUseFR": "true",
    "InpUseFiboPullback": "false",
    "InpUseFluxo": "false",
    "InpBaseRisk_L1": "1.5",
    "InpPropMaxRiskPct": "1.5",
    "InpTP_Parcial_Multi": "1.0",
    "InpTP_Final_Multi": "3.5"
  }),
  "Fibbo_Sniper_v28.5_H2_Apenas_Fluxo.set": buildSetLines({
    "InpUseFR": "false",
    "InpUseFiboPullback": "false",
    "InpUseFluxo": "true",
    "InpFluxo_GatilhoPrecoce": "false",
    "InpFluxo_IgnoreWallStrong": "false",
    "InpUseVolumeFilter": "true",
    "InpFluxo_UseExhaustion": "true",
    "InpBaseRisk_L1": "0.5",
    "InpPropMaxRiskPct": "0.5",
    "InpTP_Parcial_Multi": "1.0",
    "InpTP_Final_Multi": "2.5"
  })
};

// 3. Diretórios para limpar
const targetDirs = [
  __dirname,
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Presets",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Profiles\\Tester",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Presets"
];

// 4. Limpeza e gravação
targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    // Listar todos os arquivos .set
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.toLowerCase().endsWith('.set')) {
        if (!keepSets[file]) {
          try {
            fs.unlinkSync(path.join(dir, file));
            console.log(`🗑 Removido antigo: ${file} de ${dir}`);
          } catch(e) {}
        }
      }
    });

    // Gravar os 2 sets solicitados
    for (const [filename, content] of Object.entries(keepSets)) {
      fs.writeFileSync(path.join(dir, filename), content, 'utf16le');
      console.log(`✔ Salvo: ${filename} em ${dir}`);
    }
  }
});

console.log('\n=== CONCLUÍDO! APENAS OS 2 ARQUIVOS .SET ESTÃO PRESENTES! ===');
